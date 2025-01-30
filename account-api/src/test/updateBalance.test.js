import { expect, jest } from '@jest/globals';
import prisma from '../config/prisma.js';
import { handler } from '../handlers/updateBalance.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';

jest.mock('../config/prisma.js');
jest.mock('../validation/account.validation.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update balance when account exists', async () => {
    const event = {
      body: JSON.stringify({ accountNumber: '123456', balance: 1000 }),
    };

    prisma.account = {
      findFirst: jest.fn().mockResolvedValue({ id: 1, number: '123456', balance: '500' }),
      update: jest.fn().mockResolvedValue({}),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.OK);
  });

  it('should return an error if account does not exist', async () => {
    const event = {
      body: JSON.stringify({ accountNumber: '123456', balance: '1000' }),
    };

    prisma.account = {
      findFirst: jest.fn().mockResolvedValue(null),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      body: JSON.stringify({ accountNumber: 'invalid-number', balance: 'abc' }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
