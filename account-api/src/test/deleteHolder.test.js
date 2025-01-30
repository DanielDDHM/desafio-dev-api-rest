import { expect, jest } from '@jest/globals';
import prisma from '../config/prisma.js';
import { handler } from '../handlers/deleteHolder.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';

jest.mock('../config/prisma.js');
jest.mock('../validation/holder.validation.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a holder when it exists', async () => {
    const event = {
      pathParameters: { cpf: '06486502517' },
      queryStringParameters: {},
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({ id: 1, cpf: '06486502517' }),
      delete: jest.fn().mockResolvedValue({}),
    };
    prisma.api_key = {
      deleteMany: jest.fn().mockResolvedValue({}),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.NO_CONTENT);
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

  it('should return an error for invalid input', async () => {
    const event = {
      pathParameters: { cpf: 'invalid-cpf' },
      queryStringParameters: {},
    };
    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
