import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { PresenterFactory } from '../utils/presenterFactory.js';
import axios, { HttpStatusCode } from 'axios';
import { AppError } from '../utils/exception.js';

const dynamoClient = new DynamoDBClient({
  region: 'sa-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function handler(event) {
  for (const message of event.Records) {
    let transaction = JSON.parse(message.body);
    try {
      const { data } = await axios.get(
        `http://localhost:4001/local/v1/accounts/${transaction.cpf}`,
        {
          timeout: 15000,
        },
      );

      const balance = Number(data.account?.balance);
      const amount = Number(transaction.amount);

      const newBalance = calculate(amount, balance, transaction.type);
      await axios.patch(`http://localhost:4001/local/v1/accounts/${data.account?.number}/balance`, {
        balance: newBalance,
      });

      transaction = {
        ...transaction,
        status: 'complete',
      };
    } catch (error) {
      console.error(error);
      transaction = {
        ...transaction,
        status: 'failed',
      };
    }

    await docClient.send(
      new PutCommand({
        TableName: 'transactions',
        Item: transaction,
      }),
    );
  }

  return new PresenterFactory(HttpStatusCode.NoContent, null, null);
}

function calculate(amount, balance, operation) {
  let result = balance;
  if (operation === 'withdraw') {
    if (isNaN(balance) || balance <= 0 || amount <= 0 || balance - amount < 0) {
      throw new AppError(HttpStatusCode.BadRequest, { result: 'Insuficient Funds' });
    }
    result = balance - amount;
  }

  if (operation === 'deposit') {
    result = balance + amount;
  }

  return result;
}
