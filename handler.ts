import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";

/**
 * 
 * @param {APIGatewayEvent} event 
 * @param {Context} _context 
 */
export const ipcheck: APIGatewayProxyHandler = async (event, _context) => {
  let { ip, requestOrigin, error } = await evaluateRequest(event);
  if (typeof error.message !== "undefined" && error.message !== null) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          error,
        },
        null,
        2,
      ),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: `We are checking for an IP address  ${ip} ...`,
        ip,
        requestOrigin,
      },
      null,
      2,
    ),
  };
};

/**
 * Evaluate incoming request for querystring AND|OR origin
 * @param {object} request Inbound request
 * 
 * @return {object}  
 */
const evaluateRequest = (request: APIGatewayEvent) => {
  let ip: string = null;
  let requestOrigin: string = null;
  interface error {
    [key: string]: any;
  }
  let error: error = {};
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
      error["message"] =
        "The only query parameter excepted is '?ip=<SOMEVALUE>'.";
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
    error,
  };
};
