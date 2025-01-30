import prisma from '../config/prisma.js';
import { handler } from '../handlers/getAccount.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import _ from 'lodash';
import { expect, jest } from '@jest/globals';

jest.mock('../config/prisma.js');
jest.mock('../validation/account.validation.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve an account when holder exists and has an active account', async () => {
    const event = {
      pathParameters: { cpf: '06486502517' },
      queryStringParameters: {},
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({
        cpf: '06486502517',
        account: { number: '123456', isActive: true },
      }),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.OK);
  });

  it('should return an error if holder does not exist', async () => {
    const event = {
      pathParameters: { cpf: '06486502517' },
      queryStringParameters: {},
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue(null),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error if holder does not have an active account', async () => {
    const event = {
      pathParameters: { cpf: '06486502517' },
      queryStringParameters: {},
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({
        cpf: '06486502517',
        account: null,
      }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      pathParameters: { cpf: 'invalid-cpf' },
      queryStringParameters: {},
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
