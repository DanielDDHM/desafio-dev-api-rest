import isValidCPF from '../utils/cpfValid.js';
import { z } from 'zod';

export const createAccountValidation = z
  .object({
    cpf: z
      .string()
      .refine(isValidCPF, {
        message: 'Invalid CPF',
      })
      .transform((val) => val.replace(/\D/g, '')),
  })
  .strict();

export const getAccountValidation = z
  .object({
    cpf: z
      .string()
      .refine(isValidCPF, {
        message: 'Invalid CPF',
      })
      .transform((val) => val.replace(/\D/g, '')),
    accountNumber: z
      .string()
      .transform((val) => Number(val))
      .optional(),
  })
  .strict();

export const blockAccountValidation = z
  .object({
    accountNumber: z
      .string()
      .transform((val) => Number(val))
      .optional(),
  })
  .strict();

export const closeAccountValidation = z
  .object({
    accountNumber: z
      .string()
      .transform((val) => Number(val))
      .optional(),
  })
  .strict();

export const updateBalanceValidation = z
  .object({
    accountNumber: z
      .string()
      .transform((val) => Number(val))
      .optional(),
    balance: z.number().nonnegative(),
  })
  .strict();
