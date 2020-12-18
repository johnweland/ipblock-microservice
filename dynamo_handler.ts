import { DynamoDB, S3 } from "aws-sdk";
import fetch from "node-fetch";
import * as csv from "fast-csv";
import * as fs from "fs";

const dynamodb = new DynamoDB.DocumentClient();
const s3 = new S3();

type FireHolFile = {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
};


type putRequestObject = {
  Item: itemObject;
  TableName: string;
};

type itemObject = {
  ip_address: string;
  ipset_filename: string;
};

export const getData = async (ip_address: string) => {
  let queryParams = {
    TableName: `${process.env.DYNAMODB_TABLE}`,
    KeyConditionExpression: "#ip_address = :ip_address",
    ExpressionAttributeNames: {
      "#ip_address": "ip_address",
    },
    ExpressionAttributeValues: {
      ":ip_address": ip_address,
    },
  };
  return await dynamodb.query(queryParams).promise();
};

export const parseData = async () => {
  try {
    let lists: Array<FireHolFile> = await getFireholLists();
    let items: itemObject[] = [];
    // NOTE: add let n for length caching, should improve performance some
    for (let i: number = 0, n: number = lists.length; i < n; ++i) {
      let lines: string[] = await readIPset(lists[i]);
      for (let x: number = 0, y: number = lines.length; x < y; ++x) {
        let item: itemObject = {
          ip_address: lines[x],
          ipset_filename: lists[i].path,
        };
        items.push(item);
      }
    }
    // removing duplicate IP's that live in other files. 1/2 the file size
    let output = Object.values(
      items.reduce((c, e) => {
        if (!c[e.ip_address]) c[e.ip_address] = e;
        return c;
      }, {}),
    );
    await updateDynamoDB(output);
  } catch (err) {
    console.error(err);
  }
};

export const updateDynamoDB = async (items) => {
  try {
    let chunkSize: number = 24;
    let tempArray: itemObject[] = [];
    for (let i: number = 0, n: number = items.length; i < n; i += chunkSize) {
      tempArray = items.slice(i, i + chunkSize);
      let rows = [];
      tempArray.forEach(row => {
        rows.push({
          PutRequest: {
            Item: {
              ip_address: row.ip_address,
              ipset_filename: row.ipset_filename
            }
          }
        });
      });
      let params = {
        RequestItems: {
          'ipblock-microservice-db': rows 
        }
      }
      await dynamodb.batchWrite(params).promise();
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

export const createSeedFile = async (rows) => {
  const ws = fs.createWriteStream("seedfile.csv");
  return await csv.write(rows, { headers: true }).pipe(ws);
};

export const uploadSeedFileToS3 = async (rows) => {
  if (!rows.length) {
    console.error("No rows to reference");
    return;
  }
  console.log("row count", rows.length);
  try {
    let buffer = Buffer.from(JSON.stringify(rows));
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: "seedfile.csv",
      Body: buffer,
    };
    return await s3.putObject(params).promise();
  } catch (err) {
    console.error(err);
  }
};

export const readSeedFileFromS3 = async () => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: "seedfile.csv",
    };
    return await s3.getObject(params).promise();
  } catch (err) {
    console.error(err);
  }
};
