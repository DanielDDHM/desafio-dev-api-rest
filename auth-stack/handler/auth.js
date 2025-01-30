import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/exception';
import { StatusCode } from '../utils/statusCode';
import { PresenterFactory } from '../utils/presenterFactory';

const prisma = new PrismaClient();

export async function handler(event) {
  try {
    const apiKey = event.headers['x-api-key'];
    const requiredScopes = event.requestContext?.authorizer?.metadata?.requiredScopes || [];

    if (!apiKey) {
      throw new AppError(StatusCode.UNAUTHORIZED, { message: 'API Key is required' });
    }

    const keyRecord = await prisma.api_key.findUnique({
      where: { id: apiKey },
    });

    if (!keyRecord || !keyRecord.isActive) {
      throw new AppError(StatusCode.UNAUTHORIZED, { message: 'Invalid or inactive API Key' });
    }

    const hasRequiredScopes = requiredScopes.every((scope) => keyRecord.scopes.includes(scope));
    if (!hasRequiredScopes) {
      throw new AppError(StatusCode.UNAUTHORIZED, { message: 'Insufficient permissions' });
    }

    return new PresenterFactory(StatusCode.OK, { message: 'Authenticated' });
  } catch (error) {
    throw new AppError(StatusCode.BAD_GATEWAY, { message: 'Internal Server Error' });
  }
}
