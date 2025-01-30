import { handler } from '../handlers/getStatement.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { HttpStatusCode } from 'axios';
import { expect, jest } from '@jest/globals';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('../validations/transactions.validations.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve transaction statements successfully', async () => {
    const event = {
      pathParameters: { accountNumber: '123456' },
      queryStringParameters: { startDate: '2024-01-01', endDate: '2024-01-31' },
    };

    const docClientSendMock = jest
      .fn()
      .mockResolvedValue({ Items: [{ transactionId: 'tx123', amount: 500 }] });
    DynamoDBDocumentClient.prototype.send = docClientSendMock;

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(HttpStatusCode.Ok);
    expect(response.body).toEqual(
      JSON.stringify({
        0: { transactionId: 'tx123', amount: 500 },
        response: 'Transactions Found',
      }),
    );
    expect(docClientSendMock).toHaveBeenCalled();
  });

  it('should return an error for invalid input', async () => {
    const event = {
      pathParameters: { accountNumber: 'invalid-number' },
      queryStringParameters: { startDate: 'invalid-date', endDate: 'invalid-date' },
    };

    await expect(handler(event)).rejects.toBeInstanceOf(RangeError);
  });
});
