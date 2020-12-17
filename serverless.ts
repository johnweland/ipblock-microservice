import type { AWS } from "@serverless/typescript";

const SERVICE_NAME: string = "ipblock-microservice";
const DYNAMODB_TABLE: string = `${SERVICE_NAME}-db`;
const serverlessConfiguration: AWS = {
  service: SERVICE_NAME,
  useDotenv: true,
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
  },
  plugins: ["serverless-webpack"],
  provider: {
    name: "aws",
    runtime: "nodejs12.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      DYNAMODB_TABLE,
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        Resource: "*",
      },
    ],
  },
  functions: {
    dynamo: {
      handler: "dynamo_handler.parseData",
      events: [
        {
          schedule: {
            rate: "rate(120 minutes)",
          },
        },
      ],
    },
    ipcheck: {
      handler: "ip_handler.ipcheck",
      events: [
        {
          http: {
            method: "get",
            path: "/",
            cors: true,
            request: {
              parameters: {
                querystrings: {
                  ip: false,
                },
              },
            },
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      ipTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "ip_address",
              AttributeType: "S",
            },
            {
              AttributeName: "ipset_filename",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "ip_address",
              KeyType: "HASH",
            },
            {
              AttributeName: "ipset_filename",
              KeyType: "RANGE",
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: DYNAMODB_TABLE,
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
