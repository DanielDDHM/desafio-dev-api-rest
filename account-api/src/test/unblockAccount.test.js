import { expect, jest } from '@jest/globals';
import prisma from '../config/prisma.js';
import { handler } from '../handlers/unblockAccount.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';

jest.mock('../config/prisma.js');
jest.mock('../validation/account.validation.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unblock an account when it exists', async () => {
    const event = {
      pathParameters: { accountNumber: '123456' },
      queryStringParameters: {},
    };

    prisma.account = {
      findFirst: jest.fn().mockResolvedValue({ id: 1, number: '123456', isBlocked: true }),
      update: jest.fn().mockResolvedValue({}),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.OK);
  });

  it('should return an error if account does not exist', async () => {
    const event = {
      pathParameters: { accountNumber: '123456' },
      queryStringParameters: {},
    };

    prisma.account = {
      findFirst: jest.fn().mockResolvedValue(null),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      pathParameters: { accountNumber: 'invalid-number' },
      queryStringParameters: {},
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
