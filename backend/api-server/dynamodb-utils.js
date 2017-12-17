const AWS = require('aws-sdk');
const path = require('path');
const DynamoDbLocal = require('dynamodb-local');

DynamoDbLocal.configureInstaller({
  installPath: path.join(process.env.HOME || '/tmp', 'dynamodb-local'),
});

module.exports = {
  startDynamoDbLocal: (port, tableName) => {
    return new Promise((resolve, reject) => {
      DynamoDbLocal.launch(port, '/tmp')
        .then(_ => {
          const dynamodb = new AWS.DynamoDB();

          dynamodb.createTable(
            {
              TableName: tableName,
              KeySchema: [
                { AttributeName: 'id', KeyType: 'HASH' },
                { AttributeName: 'revision', KeyType: 'RANGE' },
              ],
              AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' },
                { AttributeName: 'revision', AttributeType: 'N' },
              ],
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
            (err, data) => {
              // If the table already exists; fine. Otherwise reject()
              if (
                err &&
                err.code !== 'ResourceInUseException' &&
                err.message !== 'Cannot create preexisting table'
              ) {
                reject(err);
              } else {
                resolve(port);
              }
            }
          );
        })
        .catch(reject);
    });
  },
  stopDynamoDbLocal(port) {
    return new Promise((resolve, reject) => {
      DynamoDbLocal.stop(port);
      // We could poll for port to go down, but we're lazy
      setTimeout(resolve, 2000);
    });
  },
};