import type { AnyFormApi } from '@tanstack/react-form';
import * as z from 'zod/mini';

import { ApiError } from './api.ts';

export async function submitToApi(
  form: AnyFormApi,
  submit: () => Promise<unknown>,
  mapError?: (error: unknown) => Record<string, string> | undefined,
) {
  form.setErrorMap({ onServer: undefined });

  try {
    await submit();
    return true;
  } catch (error) {
    const fields = mapError?.(error) ?? parseValidationError(error);

    if (fields) {
      form.setErrorMap({ onServer: { fields } });
    }

    return false;
  }
}

type ErrorTree = {
  errors: string[];
  properties?: Record<string, ErrorTree>;
  items?: Array<ErrorTree | null>;
};

const schema: z.ZodMiniType<ErrorTree> = z.object({
  errors: z.array(z.string()),
  get properties() {
    return z.optional(z.record(z.string(), schema));
  },
  get items() {
    return z.optional(z.array(z.nullable(schema)));
  },
});

export function parseValidationError(error: unknown) {
  if (ApiError.is(error, 400)) {
    const { success, data } = schema.safeParse(error.body);

    if (success) {
      return flatten(data);
    }
  }
}

function flatten(tree: ErrorTree, path = '', errors: Record<string, string> = {}) {
  if (path !== '' && tree.errors[0] !== undefined) {
    errors[path] = tree.errors[0];
  }

  for (const [key, child] of Object.entries(tree.properties ?? {})) {
    flatten(child, join(path, key), errors);
  }

  tree.items?.forEach((child, index) => {
    if (child) {
      flatten(child, join(path, index), errors);
    }
  });

  return errors;
}

function join(path: string, key: string | number) {
  if (typeof key === 'number') {
    return `${path}[${key}]`;
  }

  return path === '' ? key : `${path}.${key}`;
}
