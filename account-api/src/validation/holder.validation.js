import { z } from 'zod';
import isValidCpf from '../utils/cpfValid.js';

export const createHolderValidation = z
  .object({
    cpf: z
      .string()
      .refine(isValidCpf, {
        response: 'Invalid CPF',
      })
      .transform((val) => val.replace(/\D/g, '')),
    name: z.string().nonempty(),
  })
  .strict();

export const deleteHolderValidation = z
  .object({
    cpf: z
      .string()
      .refine(isValidCpf, {
        response: 'Invalid CPF',
      })
      .transform((val) => val.replace(/\D/g, '')),
  })
  .strict();
