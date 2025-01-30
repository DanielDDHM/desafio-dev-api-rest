import _ from 'lodash';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { createAccountValidation } from '../validation/account.validation.js';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await createAccountValidation.parseAsync(JSON.parse(event.body));
    const holderExists = await prisma.holders.findUnique({
      where: {
        cpf: body.cpf,
      },
    });
    if (!holderExists) {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: "holder don't exists",
      });
    }

    const accountExists = await prisma.account.findFirst({
      where: {
        holderId: holderExists.id,
      },
    });

    if (accountExists) {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: 'User Already have an account',
      });
    }

    const result = await prisma.account.create({
      data: {
        agency: '0001',
        holderId: holderExists.id,
      },
      include: {
        holder: true,
      },
    });

    return new PresenterFactory(
      StatusCode.OK,
      {
        ..._.omit(result, ['id', 'createdAt', 'updatedAt', 'deletedAt', 'holder.id']),
      },
      'Account Created With Success',
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
