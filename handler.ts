import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';

export const ipcheck: APIGatewayProxyHandler = async (event, _context) => {
  let ip:string = event.pathParameters.ip || event.requestContext.identity.sourceIp;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `We are checking for an IP address of ${ip}...`,
      input: event,
    }, null, 2),
  };
}
