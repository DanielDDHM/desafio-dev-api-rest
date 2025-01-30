import _ from 'lodash';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { updateBalanceValidation } from '../validation/account.validation.js';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await updateBalanceValidation.parseAsync(JSON.parse(event.body));
    console.log(body);

    const accountExists = await prisma.account.findFirst({
      where: {
        number: body.accountNumber,
      },
    });

    if (!accountExists) {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: 'User Dont have an account',
      });
    }

    await prisma.account.update({
      data: {
        balance: String(body.balance),
      },
      where: {
        id: accountExists.id,
      },
    });

    return new PresenterFactory(StatusCode.OK, null, 'Balance Updated');
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
