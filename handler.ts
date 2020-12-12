import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";

/**
 * 
 * @param {APIGatewayEvent} event 
 * @param {Context} _context
 * 
 * @returns {json} JSON object with success or error data
 */
export const ipcheck: APIGatewayProxyHandler = async (event, _context) => {
	try {
		let { ip, requestOrigin } = await evaluateRequest(event);
		await validateIp(ip);

		return {
			statusCode: 200,
			body: JSON.stringify({
					message: `We are checking for an IP address  ${ip} ...`,
					ip,
					requestOrigin,
				},
			null,
			2),
		};
	} catch (err) {
		return {
			statusCode: 400,
			body: JSON.stringify({
					error: err.message
				},
			null,
			2),
		};
	}
};

/**
 * Evaluate incoming request for querystring AND|OR origin
 * @param {object} request Inbound request
 * 
 * @throws {InValidArgumentException} Invalid IP Address
 * @return {object}  
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
			throw new Error("The only query parameter excepted is '?ip=<SOMEVALUE>'.");
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
 * @param {string} ip a v4 IP address
 * 
 * @throws {InValidArgumentException} Invalid IP Address
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

// const searchIp = async (ip) => {
// 	return new Promise<:boolean>((resolve, reject) => {
// 		if (ip)
// 		found ? resolve : reject
// 	})
// }