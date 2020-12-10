import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'aws-nodejs-typescript',
  useDotenv: true,
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
  },
  functions: {
    ipcheck: {
      handler: 'handler.ipcheck',
      events: [
        {
          http: {
            method: 'get',
            path: 'check',
            cors: true
          }
        },
        {
          http: {
            method: 'get',
            path: 'check/{ip}',
            cors: true,
            request: {
              parameters: {
                querystrings: {
                  ip: false
                }
              }
            }
          }
        }
      ]
    }
  }
}

module.exports = serverlessConfiguration;
