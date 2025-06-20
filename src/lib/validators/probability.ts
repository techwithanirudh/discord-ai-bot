import { z } from 'zod/v4';

export const probabilitySchema = z.object({
  probability: z
    .number()
    .describe(
      'Likelihood that the message is relevant (greater than 0.5 means related, less than 0.5 means not related)'
    ),
  reason: z
    .string()
    .min(1)
    .describe(
      'Explanation for why the message is considered relevant / not relevant'
    ),
});

export type Probability = z.infer<typeof probabilitySchema>;
