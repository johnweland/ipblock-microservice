import type { AWS } from "@serverless/typescript";

const SERVICE_NAME: string = "ipblock-microservice";
const DYNAMODB_TABLE: string = `${SERVICE_NAME}-db`;
const S3_BUCKET: string = `${SERVICE_NAME}-seed`;
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
      S3_BUCKET
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
      {
        Effect: "Allow",
        Action: [
          "s3:PutObject",
          "s3:GetObject",
        ],
        Resource: `arn:aws:s3:::${S3_BUCKET}/*`
      }
    ],
  },
  functions: {
    s3: {
      handler: "s3_handler.buildData",
      events: [
        {
          schedule: {
            rate: "rate(1 day)",
          },
        },
      ]
    },
    dynamodb: {
      handler: "dynamo_handler.updateDynamoDB",
      events: [
        {
          schedule: {
            rate: "rate(1 day)",
          },
        },
      ]
    },
    gateway: {
      handler: "gateway_handler.ipcheck",
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
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          TableName: DYNAMODB_TABLE,
        },
      },
      s3: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: S3_BUCKET,
        }
      }
    },
  },
};

module.exports = serverlessConfiguration;
