import { DynamoDB } from "aws-sdk";
import { readS3 } from "./s3_handler";

/**
 * This is the doc comment for dynamo_handler.ts
 * @packageDocumentation dynamo_handler.ts
 * GitHub Repository: {@link https://github.com/johnweland/ipblock-microservice}
 */

const dynamodb = new DynamoDB.DocumentClient();

/**
 * itemObject interface for DynamoDB
 */
export interface itemObject {
  ip_address: string;
  ipset_filename: string;
};

/**
 * Takes in an IP address and looks for a reference in DynamoDB
 * @param ip_address 
 * 
 * @returns {Promise}
 */
export const queryDynamoDB = async (ip_address: string) => {
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

/**
 * Triggers when a new file is added to the target S3 bucket.
 * Reads contents of target S3 bucket and updates DynamoDB from seed data.
 * 
 * @returns {Promise}
 */
export const updateDynamoDB = async () => {
  try {
    let file = await readS3();
    let items:[] = JSON.parse(file.Body.toString());
    let chunkSize: number = 24;
    let batchCount = 0;
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
      batchCount = i;
    }
    console.info(`Total batchWrite operations ${batchCount}, with ${batchCount * 24} rows inserted.`)
  } catch (err) {
    console.error(err);
  }
};

