import type { Form } from '@base-ui/react/form';
import * as z from 'zod/mini';

import { ApiError } from './api.ts';

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

export function parseValidationError(error: unknown): Form.Props['errors'] {
  if (ApiError.is(error, 400)) {
    const { success, data } = schema.safeParse(error.body);

    if (success) {
      return flatten(data);
    }
  }
}

function flatten(tree: ErrorTree, path = '', errors: Record<string, string[]> = {}) {
  if (path !== '' && tree.errors.length > 0) {
    errors[path] = tree.errors;
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
  return path === '' ? String(key) : `${path}.${key}`;
}
