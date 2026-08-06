import { format } from 'date-fns';
import { styleText, type InspectColor } from 'node:util';

import { getRequestId } from './middleware/request-context.ts';

import type { Config } from './config.ts';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

export interface Logger {
  readonly level: LogLevel;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

const severities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const levelColors: Record<LogLevel, InspectColor> = {
  debug: 'gray',
  info: 'blue',
  warn: 'yellow',
  error: 'red',
};

export function consoleLogger({ config }: { config: Config }): Logger {
  const level = isLogLevel(config.logLevel) ? config.logLevel : 'info';

  function log(messageLevel: LogLevel, message: string, context?: LogContext) {
    if (severities[messageLevel] < severities[level]) {
      return;
    }

    const requestId = getRequestId();
    const stream = severities[messageLevel] >= severities.warn ? process.stderr : process.stdout;

    stream.write(formatLine(stream, messageLevel, message, { requestId, ...context }));
  }

  return {
    level,
    debug: (message, extra) => log('debug', message, extra),
    info: (message, extra) => log('info', message, extra),
    warn: (message, extra) => log('warn', message, extra),
    error: (message, extra) => log('error', message, extra),
  };
}

export function isLogLevel(value?: string): value is LogLevel {
  return value !== undefined && value in severities;
}

function formatLine(stream: NodeJS.WriteStream, level: LogLevel, message: string, context: LogContext) {
  const parts = [
    paint(stream, 'gray', format(new Date(), 'HH:mm:ss.SSS')),
    paint(stream, levelColors[level], level.padEnd(5)),
    message,
  ];

  const errors: Error[] = [];

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) {
      continue;
    }

    if (value instanceof Error) {
      errors.push(value);
      continue;
    }

    parts.push(`${paint(stream, 'gray', `${key}=`)}${formatValue(value)}`);
  }

  const lines = [parts.join(' '), ...errors.map((error) => error.stack ?? String(error))];

  return `${lines.join('\n')}\n`;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string' && /^[\w.:/@-]*$/.test(value)) {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  return JSON.stringify(value) ?? String(value);
}

function paint(stream: NodeJS.WriteStream, color: InspectColor, text: string): string {
  return styleText(color, text, { stream, validateStream: true });
}
