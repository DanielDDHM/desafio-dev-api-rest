import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { getAccountValidation } from '../validation/account.validation.js';
import _ from 'lodash';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await getAccountValidation.parseAsync({
      ...event.pathParameters,
      ...event.queryStringParameters,
    });

    const holder = await prisma.holders.findUnique({
      where: {
        cpf: body.cpf,
      },
      include: {
        account: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!holder) {
      throw new AppError(StatusCode.NOT_FOUND, {
        message: "holder don't exists",
      });
    }

    if (!holder.account) {
      throw new AppError(StatusCode.NOT_FOUND, {
        message: "User don't have an account",
      });
    }

    return new PresenterFactory(
      StatusCode.OK,
      {
        ..._.omit(holder, ['id', 'account.id', 'api_key']),
      },
      'Account Found',
    );
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error);
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: `Error on field: ${error.errors[0].path}, problem: ${error.errors[0].message}`,
      });
    }
    throw error;
  }
}
