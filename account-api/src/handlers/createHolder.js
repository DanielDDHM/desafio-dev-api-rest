import _ from 'lodash';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { createHolderValidation } from '../validation/holder.validation.js';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await createHolderValidation.parseAsync(JSON.parse(event.body));
    const holderExists = await prisma.holders.findUnique({
      where: {
        cpf: body.cpf,
      },
    });
    if (!holderExists) {
      const holder = await prisma.holders.create({
        data: {
          cpf: body.cpf,
          fullName: body.name,
        },
      });

      const key = await prisma.api_key.create({
        data: {
          holderId: holder.id,
          scopes: ['read:account', 'write:account', 'withdraw:account', 'deposit:account'],
        },
      });
      return new PresenterFactory(
        StatusCode.OK,
        {
          ..._.omit(holder, ['id', 'createdAt', 'updatedAt', 'deletedAt']),
          key: key.id,
        },
        'Holder Created With Success',
      );
    } else {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: 'holder already exists',
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: `Error on field: ${error.errors[0].path}, problem: ${error.errors[0].message}`,
      });
    }
    throw error;
  }
}
