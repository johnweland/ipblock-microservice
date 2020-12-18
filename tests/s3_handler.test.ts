import { getFireholLists, readIPset, FireHolFile } from "../s3_handler";

import { expect } from "chai";

describe("Testing getFireholLists()", () => {
  it("pass: the return list is not empty", async () => {
    let list = await getFireholLists();
    expect(list).to.a("array");
    expect(list).to.not.be.empty;
  });
});

describe("Testing readIPset()", () => {
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
    expect(list).to.include("127.0.0.1");
  });
});
