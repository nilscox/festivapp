import { format } from 'date-fns';
import { styleText, type InspectColor } from 'node:util';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

export type LoggerOptions = {
  level?: string;
  context?: LogContext;
};

type WritableLevel = Exclude<LogLevel, 'silent'>;

const severities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY,
};

const levelColors: Record<WritableLevel, InspectColor> = {
  debug: 'gray',
  info: 'blue',
  warn: 'yellow',
  error: 'red',
};

export function consoleLogger(options: LoggerOptions = {}): Logger {
  const level = isLogLevel(options.level) ? options.level : 'info';
  const context = options.context ?? {};

  function log(messageLevel: WritableLevel, message: string, extra?: LogContext) {
    if (severities[messageLevel] < severities[level]) {
      return;
    }

    const stream = severities[messageLevel] >= severities.warn ? process.stderr : process.stdout;

    stream.write(formatLine(stream, messageLevel, message, { ...context, ...extra }));
  }

  return {
    debug: (message, extra) => log('debug', message, extra),
    info: (message, extra) => log('info', message, extra),
    warn: (message, extra) => log('warn', message, extra),
    error: (message, extra) => log('error', message, extra),
    child: (extra) => consoleLogger({ level, context: { ...context, ...extra } }),
  };
}

function isLogLevel(value?: string): value is LogLevel {
  return value !== undefined && value in severities;
}

function formatLine(stream: NodeJS.WriteStream, level: WritableLevel, message: string, context: LogContext) {
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
