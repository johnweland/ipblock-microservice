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
interface File {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
}

/**
 * Primary function for comparing input/request IP to a list of blocked IPSets from Firehol
 * @param  {APIGatewayEvent}   event 
 * @param  {Context}   _context
 * 
 * @returns {json} JSON object with success or error data
 */
export const ipcheck: APIGatewayProxyHandler = async (event, _context) => {
  try {
    let { ip, requestOrigin } = await evaluateRequest(event);
    await validateIp(ip);
    let lists: Array<File> = await getFireholLists();
    let flagged: boolean = false;
    for (let i = 0; i < lists.length; i++) {
      let lines: string[] = await readIPset(lists[i]);
      if (lines.includes(ip)) {
        flagged = true;
        break;
      }
    }
    let message = "";
    flagged
      ? message = `IP Address ${ip} is blocked`
      : message = `IP Address ${ip} is safe`;
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: message,
          ip,
          requestOrigin,
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
 * @param   {object}  request     Inbound request
 * 
 * @throws  {InValidArgumentException}    Invalid IP Address
 * @return {object}  IP and RequestOrigin
 */
const evaluateRequest = (request: APIGatewayEvent) => {
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
    requestOrigin,
  };
};

/**
 * Validate IP Address as either ipV4 or ipV6
 * @param   {string}  ip     a v4 IP address
 * 
 * @throws  {InValidArgumentException}    Invalid IP Address
 */
const validateIp = (ip) => {
  let ipV4: boolean = new RegExp(
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ).test(ip);
  let ipV6: boolean = new RegExp(/^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/).test(
    ip,
  );
  if (!ipV4 && !ipV6) {
    throw new Error(`invalid IP address ${ip}`);
  }
};

/**
 * Return a array of Files ending in .ipset from the git repository master branch
 * 
 * @returns   {[File]}    files array
 */
const getFireholLists = async () => {
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
 * @param   {File}  file    File object from which to grab the path
 * 
 * @returns {array}     stanitied ASanitized list of IP Addresses
 */
const readIPset = async (file: File) => {
  const response = await fetch(
    `https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/${file.path}`,
  );
  const text = await response.text();
  const sanitized: [] = await text.split("\n").filter((line) => {
    return line.indexOf("#") !== 0;
  });
  return sanitized;
};
