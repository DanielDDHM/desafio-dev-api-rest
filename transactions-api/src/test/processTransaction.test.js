import { handler } from '../handlers/processTransaction.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import axios, { HttpStatusCode } from 'axios';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { expect, jest } from '@jest/globals';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('axios');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a transaction successfully', async () => {
    const event = {
      Records: [{ body: JSON.stringify({ cpf: '12345678900', amount: 500, type: 'deposit' }) }],
    };

    axios.get = jest
      .fn()
      .mockResolvedValue({ data: { account: { number: '123456', balance: 1000 } } });
    axios.patch = jest.fn().mockResolvedValue({});
    const docClientSendMock = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.prototype.send = docClientSendMock;

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(HttpStatusCode.NoContent);
    expect(docClientSendMock).toHaveBeenCalled();
  });

  it('should return an error if insufficient funds on withdraw', async () => {
    const event = {
      Records: [{ body: JSON.stringify({ cpf: '12345678900', amount: 2000, type: 'withdraw' }) }],
    };

    axios.get = jest
      .fn()
      .mockResolvedValue({ data: { account: { number: '123456', balance: 100 } } });

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(HttpStatusCode.NoContent);
  });

  it('should return an error if external API fails', async () => {
    const event = {
      Records: [{ body: JSON.stringify({ cpf: '12345678900', amount: 500, type: 'deposit' }) }],
    };

    axios.get = jest
      .fn()
      .mockRejectedValue(
        new AppError(HttpStatusCode.InternalServerError, { message: 'API Failure' }),
      );

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(HttpStatusCode.NoContent);
  });
});
