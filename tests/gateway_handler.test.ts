import { evaluateRequest, validateIp } from "../gateway_handler";
import {
  createMockAPIGatewayEvent,
} from "@homeservenow/serverless-event-mocks";
import { expect } from "chai";

describe("Testing evaluateRequest()", () => {
  it("pass: if the return is an object", async () => {
    const event = createMockAPIGatewayEvent(
      {
        queryStringParameters: {
          ip: "127.0.0.1",
        },
      },
    );
    let evaluation = evaluateRequest(event);
    expect(evaluation).to.be.an("object");
    expect(evaluation).to.have.property("ip");
  });
});

describe("Testing validateIp()", () => {
  it("pass: valid ipv4", () => {
    let ip = "127.0.0.1";
    expect(validateIp(ip)).to.a("boolean");
    expect(validateIp(ip)).to.be.true;
  });

  it("fail: invalid ipv4", () => {
    let ip = "127.0.01";
    expect(validateIp(ip)).to.a("boolean");
    expect(validateIp(ip)).to.be.false;
  });

  it("pass: valid ipv6", () => {
    let ip = "::1";
    expect(validateIp(ip)).to.a("boolean");
    expect(validateIp(ip)).to.be.true;
  });

  it("fail: invalid ipv6", () => {
    let ip = ":1";
    expect(validateIp(ip)).to.a("boolean");
    expect(validateIp(ip)).to.be.false;
  });
});
