import { handler } from '../handlers/withdraw.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import axios, { AxiosError, HttpStatusCode } from 'axios';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';
import { expect, jest } from '@jest/globals';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-sqs');
jest.mock('axios');
jest.mock('../validations/transactions.validations.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a withdraw transaction successfully', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', amount: 500 }),
    };

    axios.get = jest.fn().mockResolvedValue({
      data: { account: { number: '123456', isActive: true, isBlocked: false } },
    });
    const docClientSendMock = jest.fn().mockResolvedValue({});
    const sqsSendMock = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.prototype.send = docClientSendMock;
    SQSClient.prototype.send = sqsSendMock;

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(HttpStatusCode.NoContent);
    expect(docClientSendMock).toHaveBeenCalled();
    expect(sqsSendMock).toHaveBeenCalled();
  });

  it('should return an error if user account is blocked or inactive', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', amount: 500 }),
    };

    axios.get = jest
      .fn()
      .mockResolvedValue({ data: { account: { isActive: false, isBlocked: true } } });

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error if withdrawal amount exceeds limit', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', amount: 3000 }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      body: JSON.stringify({ cpf: 'invalid-cpf', amount: -100 }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error if external API fails', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', amount: 500 }),
    };

    axios.get = jest.fn().mockRejectedValue(
      new AxiosError('Request failed', {
        response: { data: { status: 500, data: 'Internal Server Error' } },
      }),
    );

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
