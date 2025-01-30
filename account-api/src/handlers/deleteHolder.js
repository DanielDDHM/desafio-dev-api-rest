import _ from 'lodash';
import prisma from '../config/prisma.js';
import { AppError } from '../utils/exception.js';
import { PresenterFactory } from '../utils/presenterFactory.js';
import { StatusCode } from '../utils/statusCode.js';
import { deleteHolderValidation } from '../validation/holder.validation.js';
import { ZodError } from 'zod';

export async function handler(event) {
  try {
    const body = await deleteHolderValidation.parseAsync({
      ...event.pathParameters,
      ...event.queryStringParameters,
    });
    const holderExists = await prisma.holders.findUnique({
      where: {
        cpf: body.cpf,
      },
    });
    if (holderExists) {
      await Promise.all([
        await prisma.holders.delete({
          where: {
            id: holderExists.id,
          },
        }),
        await prisma.api_key.deleteMany({
          where: {
            holderId: holderExists.id,
          },
        }),
      ]);
      return new PresenterFactory(StatusCode.NO_CONTENT, null, null);
    } else {
      throw new AppError(StatusCode.BAD_REQUEST, {
        message: 'holder not exists',
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
