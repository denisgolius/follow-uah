import AWS from 'aws-sdk';
import config from 'config';
import logger from '../utils/logger.js';
import moment from 'moment-timezone';
import { getRateKey } from './utils.js';

class RatesHistory {
  constructor() {
    AWS.config.update({ region: config.get('aws.region') });

    this.dynamo = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
  }

  async getLatestRate(type, currency) {
    var params = {
      TableName: 'RBUpdateHistory',
      KeyConditionExpression: 'currencyType = :key',
      ExpressionAttributeValues: {
        ':key': getRateKey(currency, type)
      },
      Limit: 1,
      ScanIndexForward: false,
      ReturnConsumedCapacity: 'TOTAL'
    };

    try {
      const result = await this.dynamo.query(params).promise();

      logger.info(
        `UpdateHistory table query consumed ${result.ConsumedCapacity.CapacityUnits} units.`
      );

      if (result.Items.length < 1) {
        return null;
      }

      return result.Items.map(this.normalize)[0];
    } catch (e) {
      logger.error(e);
    }
  }

  record(data) {
    return this.dynamo
      .put({
        TableName: 'RBUpdateHistory',
        Item: {
          currencyType: getRateKey(data.currency, data.type),
          ...data
        },
        ReturnConsumedCapacity: 'TOTAL'
      })
      .promise()
      .then((result) => {
        logger.info(
          `UpdateHistory table write consumed ${result.ConsumedCapacity.CapacityUnits} units.`
        );
        return result;
      });
  }

  normalize(rate) {
    const { date, currencyType, ...rest } = rate;

    return {
      date: new moment(date),
      ...rest
    };
  }
}

const ratesHistory = new RatesHistory();

export default ratesHistory;
