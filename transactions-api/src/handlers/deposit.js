import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import { depositValidation } from '../validations/transactions.validations.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import axios, { AxiosError, HttpStatusCode } from 'axios';
import { ZodError } from 'zod';
import { AppError } from '../utils/exception.js';

const dynamoClient = new DynamoDBClient({
  region: 'sa-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
});

const sqsClient = new SQSClient({
  region: 'sa-east-1',
  endpoint: process.env.SQS_ENDPOINT,
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function handler(event) {
  try {
    const body = await depositValidation.parseAsync(JSON.parse(event.body));

    const response = await axios.get(`http://localhost:4001/local/v1/accounts/${body.cpf}`, {
      timeout: 15000,
    });

    if (
      !response.data?.account ||
      !response.data?.account?.isActive ||
      response.data?.account?.isBlocked ||
      !response.data?.account?.number
    ) {
      throw new AppError(HttpStatusCode.BadRequest, {
        message: 'User account is blocked or inactive',
      });
    }

    const transaction = {
      transactionId: uuidv4(),
      accountNumber: String(response.data?.account?.number),
      cpf: body.cpf,
      type: 'deposit',
      amount: body.amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: 'transactions',
        Item: transaction,
      }),
    );

    const sqsMessage = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(transaction),
    };

    await sqsClient.send(new SendMessageCommand(sqsMessage));

    return new PresenterFactory(HttpStatusCode.NoContent, null, null);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new AppError(error.status, error.response?.data);
    }
    if (error instanceof ZodError) {
      throw new AppError(HttpStatusCode.BadGateway, {
        message: `Error on field: ${error.errors[0].path}, problem: ${error.errors[0].message}`,
      });
    }
    throw error;
  }
}
