import { DynamoDB } from "aws-sdk";
import fetch from "node-fetch";

export const getData = async () => {};

type FireHolFile = {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
};

const dynamodb = new DynamoDB.DocumentClient();

export const updateDynamoDB = async () => {
  try {
    let lists: Array<FireHolFile> = await getFireholLists();
    // NOTE: add let n for length caching, should improve performance some
    for (let i: number = 0, n: number = lists.length; i < n; ++i) {
      let lines: string[] = await readIPset(lists[i]);

      type batchWriteObject = {
        PutRequest: putRequestObject;
      };
      type putRequestObject = {
        Item: itemObject;
      };
      type itemObject = {
        ip_address: string;
        ipset_filename: string;
      };
      let items: batchWriteObject[] = [];
      for (let x: number = 0, y: number = lines.length; x < y; ++i) {
        let item: batchWriteObject = {
          PutRequest: {
            Item: {
              ip_address: lines[i],
              ipset_filename: lists[i].path,
            },
          },
        };
        items.push(item);
      }
      const params = {
        RequestItems: {
          [`${process.env.DYNAMODB_TABLE}`]: items,
        },
      };
      await dynamodb.batchWrite(params);
    }
  } catch (err) {
    console.error(err);
  }
};

/**
 * Return a array of Files ending in .ipset from the git repository master branch
 * 
 * @returns {[FireHolFile]} An array of file:FireHolFile
 */
export const getFireholLists = async () => {
  const response = await fetch(
    `https://api.github.com/repos/firehol/blocklist-ipsets/git/trees/master?recursive=1`,
  );
  const json = await response.json();
  const files: [FireHolFile] = await json.tree.filter((file) => {
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
