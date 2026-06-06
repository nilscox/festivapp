import type { FormatDistanceFn } from 'date-fns';
import { customAlphabet } from 'nanoid';

export type Extend<A, B> = Omit<A, keyof B> & B;

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; data?: T; error?: string; fields?: Record<string, string> };

export function assert<T>(value: T | null | undefined, error = new Error('Assertion failed')): asserts value {
  if (value == null) {
    throw error;
  }
}

export function defined<T>(value: T | null | undefined, error = new Error('Assertion failed')): T {
  assert(value, error);
  return value;
}

export const createId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export const formatDistanceAbbreviated: FormatDistanceFn = (token, count, options) => {
  const template = {
    lessThanXSeconds: '{{count}}s',
    xSeconds: '{{count}}s',
    halfAMinute: '30s',
    lessThanXMinutes: '{{count}}m',
    xMinutes: '{{count}}m',
    aboutXHours: '{{count}}h',
    xHours: '{{count}}h',
    xDays: '{{count}}d',
    aboutXWeeks: '{{count}}w',
    xWeeks: '{{count}}w',
    aboutXMonths: '{{count}}mo',
    xMonths: '{{count}}mo',
    aboutXYears: '{{count}}y',
    xYears: '{{count}}y',
    overXYears: '{{count}}y',
    almostXYears: '{{count}}y',
  }[token];

  const result = template.replace('{{count}}', String(count));

  if (options?.addSuffix) {
    return options.comparison && options.comparison > 0 ? `in ${result}` : `${result} ago`;
  }

  return result;
};
