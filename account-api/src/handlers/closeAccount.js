import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { closeAccountValidation } from '../validation/account.validation.js';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await closeAccountValidation.parseAsync({
      ...event.pathParameters,
      ...event.queryStringParameters,
    });

    const account = await prisma.account.findFirst({
      where: {
        number: body.accountNumber,
      },
    });

    if (!account) {
      throw new AppError(StatusCode.NOT_FOUND, {
        message: "User don't have an account",
      });
    }

    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        isActive: false,
      },
    });

    return new PresenterFactory(StatusCode.OK, null, 'Account Closed');
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: `Error on field: ${error.errors[0].path}, problem: ${error.errors[0].message}`,
      });
    }
    throw error;
  }
}
