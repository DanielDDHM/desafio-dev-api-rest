import { z } from 'zod';
import isValidCPF from '../../../account-api/src/utils/cpfValid.js';

export const depositValidation = z.object({
  cpf: z
    .string()
    .refine(isValidCPF, {
      message: 'Invalid CPF',
    })
    .transform((val) => val.replace(/\D/g, '')),
  amount: z.number().nonnegative().gte(0.01),
});

export const withdrawValidation = z.object({
  cpf: z
    .string()
    .refine(isValidCPF, {
      message: 'Invalid CPF',
    })
    .transform((val) => val.replace(/\D/g, '')),
  amount: z.number().nonnegative().gte(0.01),
});

export const getStatementValidation = z.object({
  startDate: z.string().nonempty(),
  endDate: z.string().nonempty(),
  accountNumber: z.string().nonempty(),
});
