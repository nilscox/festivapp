import type { FormatDistanceFn } from 'date-fns';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; data?: T; error?: string; fields?: Record<string, string> };

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
