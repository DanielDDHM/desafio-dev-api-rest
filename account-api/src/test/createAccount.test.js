import { expect, jest } from '@jest/globals';
import prisma from '../config/prisma.js';
import { handler } from '../handlers/createAccount.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';

jest.mock('../config/prisma.js');
jest.mock('../validation/account.validation.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an account when holder exists and has no account', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517' }),
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({ id: 1, cpf: '06486502517' }),
    };
    prisma.account = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ agency: '0001', holderId: 1 }),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.OK);
  });

  it('should return an error if holder does not exist', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517' }),
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue(null),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error if holder already has an account', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517' }),
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({ id: 1, cpf: '06486502517' }),
    };
    prisma.account = {
      findFirst: jest.fn().mockResolvedValue({ id: 2, holderId: 1 }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      body: JSON.stringify({ cpf: 'invalid-cpf' }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
