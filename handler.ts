import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import fetch from "node-fetch";
import "source-map-support/register";

/**
 * This is the doc comment for handler.ts
 * @namespace handler.ts
 * GitHub Repository: {@link https://github.com/johnweland/ipblock-microservice}
 */

 /**
  * FileType Interface for custome typing
  * @interface
  */
interface FireHolFile {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
}

/**
 * Primary function for comparing input/request IP to a list of blocked IPSets from Firehol
 * @param   {APIGatewayEvent}   event 
 * @param   {Context}   _context
 * 
 * @returns {json} JSON object with success or error data
 */
export const ipcheck: APIGatewayProxyHandler = async (event, _context) => {
  try {
    let { ip, origin } = await evaluateRequest(event);
    let valid = await validateIp(ip);
    if (!valid) {
      throw new Error(`invalid IP address ${ip}`);
    }
    let lists: Array<FireHolFile> = await getFireholLists();
    let flagged: boolean = false;
    let count: number = 0;
    let foundIn: string = "";
    for (let i = 0; i < lists.length; i++) {
      let lines: string[] = await readIPset(lists[i]);
      count = count + lines.length; 
      if (lines.includes(ip)) {
        flagged = true;
        foundIn = lists[i].path;
        break;
      }
    }
    let message = `The IP address ${ip}`;
    flagged
      ? message += ` was found in ${foundIn}.`
      : message += ` is safe.`;
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: message,
          reference_ip: ip,
          addresses_searched: count,
          files_searched: lists.length,
          foundIn,
          origin
        },
        null,
        2,
      ),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error: err.message,
        },
        null,
        2,
      ),
    };
  }
};

/**
 * Evaluate incoming request for querystring AND|OR origin
 * @param   {object}  request          Inbound request
 * 
 * @throws  {InValidArgumentException} Invalid IP Address
 * @return  {object}  IP and origin
 */
export const evaluateRequest = (request:APIGatewayEvent) => {
  let ip: string = null;
  let requestOrigin: string = null;
  if (
    typeof request.queryStringParameters !== "undefined" &&
    request.queryStringParameters !== null
  ) {
    if (
      typeof request.queryStringParameters.ip !== "undefined" &&
      request.queryStringParameters.ip.length &&
      request.queryStringParameters.ip !== null
    ) {
      ip = request.queryStringParameters.ip;
    } else {
      throw new Error(
        "The only query parameter excepted is '?ip=<SOMEVALUE>'.",
      );
    }
  }

  if (
    typeof request.requestContext !== "undefined" &&
    typeof request.requestContext.identity !== "undefined" &&
    typeof request.requestContext.identity.sourceIp !== "undefined"
  ) {
    requestOrigin = request.requestContext.identity.sourceIp;
  }
  if (requestOrigin !== null && ip == null) {
    ip = requestOrigin;
  }

  return {
    ip,
    origin: {
      ip: requestOrigin,
      country: request.headers['CloudFront-Viewer-Country'],
      userAgent: request.headers['User-Agent']
    },
  };
};

/**
 * Validate IP Address as either ipV4 or ipV6
 * @param   {string}  ip v4 or v6 IP address
 * 
 * @returns {boolean} Valid IP address?
 */
export const validateIp = (ip) => {
  let ipV4: boolean = new RegExp(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ).test(ip);
  let ipV6: boolean = new RegExp(/^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/).test(
    ip,
  );
  if (!ipV4 && !ipV6) {
    return false;
  }
  return true;
};

/**
 * Return a array of Files ending in .ipset from the git repository master branch
 * 
 * @returns {[File]} An array of file:File
 */
export const getFireholLists = async () => {
  const response = await fetch(
    `https://api.github.com/repos/firehol/blocklist-ipsets/git/trees/master?recursive=1`,
  );
  const json = await response.json();
  const files: [] = await json.tree.filter((file) => {
    if (file.path.endsWith(".ipset")) {
      return file.path;
    }
  });
  return files;
};

/**
 * Strips out comment lines and converts the IP address lines to an array of IP addresses
 * @param   {FireHolFile}  file File object from which to grab the path
 * 
 * @returns {array}      A sanitized list of IP Addresses
 */
export const readIPset = async (file: FireHolFile) => {
  const response = await fetch(
    `https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/${file.path}`,
  );
  const text = await response.text();
  const sanitized: [] = await text.split("\n").filter((line) => {
    return line.indexOf("#") !== 0;
  });
  return sanitized;
};
