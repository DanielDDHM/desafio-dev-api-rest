import prisma from '../config/prisma.js';
import { handler } from '../handlers/createHolder.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { expect, jest } from '@jest/globals';

jest.mock('../config/prisma.js');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new holder when it does not exist', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', name: 'John Doe' }),
    };
    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, cpf: '12345678900', fullName: 'John Doe' }),
    };
    prisma.api_key = {
      create: jest.fn().mockResolvedValue({ id: 'api-key-123' }),
    };

    const response = await handler(event);
    expect(response).toBeInstanceOf(PresenterFactory);
    expect(response.statusCode).toBe(StatusCode.OK);
  });

  it('should return an error if holder already exists', async () => {
    const event = {
      body: JSON.stringify({ cpf: '06486502517', name: 'John Doe' }),
    };

    prisma.holders = {
      findUnique: jest.fn().mockResolvedValue({ id: 1, cpf: '06486502517', fullName: 'John Doe' }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });

  it('should return an error for invalid input', async () => {
    const event = {
      body: JSON.stringify({ cpf: 'invalidcpf', name: '' }),
    };

    await expect(handler(event)).rejects.toBeInstanceOf(AppError);
  });
});
