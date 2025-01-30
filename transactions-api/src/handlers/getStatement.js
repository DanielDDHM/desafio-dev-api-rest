import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { ZodError } from 'zod';
import { getStatementValidation } from '../validations/transactions.validations.js';
import { AxiosError, HttpStatusCode } from 'axios';
import { AppError } from '../utils/exception.js';

const dynamoClient = new DynamoDBClient({
  region: 'sa-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function handler(event) {
  try {
    const body = await getStatementValidation.parseAsync({
      ...event.pathParameters,
      ...event.queryStringParameters,
    });

    const params = {
      TableName: 'transactions',
      IndexName: 'AccountCreatedAtIndex',
      FilterExpression: 'accountNumber = :account AND createdAt BETWEEN :start AND :end',
      ExpressionAttributeValues: {
        ':account': String(body.accountNumber),
        ':start': new Date(body.startDate).toISOString(),
        ':end': new Date(body.endDate).toISOString(),
      },
    };

    const { Items } = await docClient.send(new ScanCommand(params));

    return new PresenterFactory(HttpStatusCode.Ok, Items, 'Transactions Found');
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new AppError(error.status, error.response.data);
    }
    if (error instanceof ZodError) {
      throw new AppError(HttpStatusCode.BadGateway, {
        message: `Error on field: ${error.errors[0].path}, problem: ${error.errors[0].message}`,
      });
    }

    throw error;
  }
}
