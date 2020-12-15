import {
  evaluateRequest,
  getFireholLists,
  readIPset,
  validateIp,
} from "../handler";
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

describe("Testing getFireholLists()", () => {
  it("pass: the return list is not empty", async () => {
    let list = await getFireholLists();
    expect(list).to.a("array");
    expect(list).to.not.be.empty;
  });
});

describe("Testing readIPset()", () => {
  interface FireHolFile {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
  }
  it("pass: the return list is not empty", async () => {
    let file: FireHolFile = {
      "path": "botscout_30d.ipset",
      "mode": "100644",
      "type": "blob",
      "sha": "376861426331e5d6cae3323a2f2d269cc44f9593",
      "size": 565495,
      "url":
        "https://api.github.com/repos/firehol/blocklist-ipsets/git/blobs/376861426331e5d6cae3323a2f2d269cc44f9593",
    };
    let list = await readIPset(file);
    expect(list).to.be.a("array");
    expect(list).to.include("127.0.0.1");;
  });
});
