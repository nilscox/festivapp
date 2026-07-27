import * as z from 'zod/mini';

import { ApiError } from './api.ts';

const schema = z.object({
  properties: z.record(z.string(), z.object({ errors: z.array(z.string()) })),
});

export function parseValidationError(error: unknown) {
  if (ApiError.is(error, 400)) {
    const { success, data } = schema.safeParse(error.body);

    if (success) {
      return data.properties;
    }
  }
}
