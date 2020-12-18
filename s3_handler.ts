import { S3 } from "aws-sdk";
import fetch from "node-fetch";
import { itemObject, updateDynamoDB} from './dynamo_handler';

/**
 * This is the doc comment for s3_handler.ts
 * @packageDocumentation s3_handler.ts
 * GitHub Repository: {@link https://github.com/johnweland/ipblock-microservice}
 */

const s3 = new S3();

/**
 * FireHol .ipset data from GitHub API
 */
export interface FireHolFile {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size: number;
  url: string;
};

/**
 * Takes in an array of objects [{ip_address, ipset_filename}]
 * Writes to a json file and puts it in an S3 bucket.
 * 
 * @param {array} rows  Array of ip_address & ipset_filename
 * 
 * @returns {Promise}
 */
export const uploadS3 = async (rows) => {
  if (!rows.length) {
    console.error("No rows to reference");
    return;
  }
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: "seedfile.json",
      Body: JSON.stringify(rows),
    };
    return await s3.putObject(params).promise();
  } catch (err) {
    console.error(err);
  }
};

/**
 * Reads file form an S3 bucket.
 * 
 * @returns {Promise}
 */
export const readS3 = async () => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: "seedfile.json",
    };
    return await s3.getObject(params).promise();
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
   * @param   {FireHolFile} file File object from which to grab the path
   * 
   * @returns {array}       A sanitized list of IP Addresses
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

export const buildData = async () => {
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
    let success = await uploadS3(output);
    if (success) {
        updateDynamoDB();
        return;
    }
  } catch (err) {
    console.error(err);
  }
};
