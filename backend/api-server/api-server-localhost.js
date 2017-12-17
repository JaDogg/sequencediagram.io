/**
 * A backend server that e.g. test cases can start and stop.
 * Depends on a AWS DynamoDB server. You can run one locally
 * with:
 *
 * node backend/dynamodb/dynamodb-localhost.js
 */

/* Useful commands:

id=$( curl -v -H "Content-Type: application/json" -d '{"objects":[],"messages":[]}' localhost:4000/sequencediagrams | sed 's/.*"id":"\([^"]\+\)".*}/\1/g')
curl -v -H "Content-Type: application/json" -d '{"objects":[],"messages":[]}' localhost:4000/sequencediagrams/${id}
curl -v localhost:4000/sequencediagrams/${id}

*/

'use strict';

const http = require('http');
const dynamodbUtils = require('./dynamodb-utils');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const morganBody = require('morgan-body');
const AWS = require('aws-sdk');
const awsLambda = require('./aws-lambda-handler');
const swaggerFile = require('./swagger.json');
// In a pure localhost environment, this performs JSON schema validation
// against the swagger API. In a production environemnt, it is done by
// setting up AWS API Gateway appropriately for it
const swaggerValidator = require('swagger-express-validator');

const dynamoDbPort = 8000;
const dynamoDbLocalUrl = `http://localhost:${dynamoDbPort}`;
const dynamoDbTableName = 'io.sequencediagram.dynamodb.test';

const apiServerPort = 4000;

AWS.config.update({
  accessKeyId: 'AKID',
  secretAccessKey: 'SECRET',
  region: 'eu-west-1',
  endpoint: dynamoDbLocalUrl,
});

function ensureDynamoDbLocalRuns(req, res, next) {
  const clientReq = http.get(dynamoDbLocalUrl);
  clientReq.on('error', e => {
    res.status(500);
    res.setHeader('Content-Type', 'application/json');
    res.send({
      error: {
        code: e.code,
        message:
          'dynamodb-local is not running. ' +
          'request will timeout. failing early',
        innererror: e,
      },
    });
  });
  clientReq.on('response', _ => next());
}

function ApiServerLocal(delay) {
  this.app = express();
  this.app.use(cors());
  this.app.use(ensureDynamoDbLocalRuns);
  this.app.use(bodyParser.json());
  this.app.use(
    swaggerValidator({
      schema: swaggerFile,
      validateRequest: true,
      validateResponse: false, // Done by e.g. backend.test.js
    })
  );
  this.delay = delay || 0;

  const logging = 0;
  if (logging) {
    this.app.use(morgan('combined'));
    morganBody(this.app);
  }
  if (this.delay) {
    const theDelay = this.delay;
    this.app.use(function(req, res, next) {
      setTimeout(next, theDelay);
    });
  }

  function awsLambdaWrapper(req, res, resource) {
    const event = {
      resource: resource,
      body: JSON.stringify(req.body),
      httpMethod: req.method,
      pathParameters: req.params,
      stageVariables: { tableName: dynamoDbTableName },
    };
    awsLambda.handler(event, null, (err, data) => {
      if (err) {
        throw err;
      }
      res.status(parseInt(data.statusCode, 10));
      for (var header in res.headers) {
        if (res.headers.hasOwnProperty(header)) {
          res.setHeader(header, res.headers[header]);
        }
      }
      res.send(data.body);
    });
  }

  this.app.all('/sequencediagrams', (req, res) => {
    awsLambdaWrapper(req, res, req.url);
  });

  this.app.all('/sequencediagrams/:sequenceDiagramId', (req, res) => {
    awsLambdaWrapper(req, res, '/sequencediagrams/{sequenceDiagramId}');
  });

  this.app.all('/sequencediagrams/:sequenceDiagramId/:revision', (req, res) => {
    awsLambdaWrapper(
      req,
      res,
      '/sequencediagrams/{sequenceDiagramId}/{revision}'
    );
  });
}

ApiServerLocal.prototype = {
  listen() {
    return Promise.all([
      dynamodbUtils.startDynamoDbLocal(dynamoDbPort, dynamoDbTableName),
      new Promise((resolve, reject) => {
        this.server = this.app.listen(apiServerPort, resolve);

        // For quick .close()
        // See https://github.com/nodejs/node-v0.x-archive/issues/9066
        const timeoutInMs = 2000;
        this.server.setTimeout(timeoutInMs + this.delay);

        this.server.on('error', e => {
          this.server = null;
          reject(e);
        });
      }),
    ]);
  },

  close() {
    return Promise.all([
      new Promise((resolve, reject) => {
        // Deliberately don't take down dynamoddb-local, because it does not matter
        // if it runs or not from a web app perspective, and if we kill it we lost
        // state we want to keep during tests since we use -inMemory
        if (this.server) {
          this.server.on('error', reject);
          this.server.on('close', resolve);
          this.server.close();
        } else {
          resolve();
        }
        this.server = null;
      }),
      dynamodbUtils.stopDynamoDbLocal(dynamoDbPort),
    ]);
  },
};

if (require.main === module) {
  const server = new ApiServerLocal();
  server
    .listen()
    .then(
      _ => console.log('API server listening on port ' + apiServerPort),
      console.error
    );
} else {
  module.exports = ApiServerLocal;
}
