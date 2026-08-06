import { assert } from '@festivapp/utils';
import { inspect } from 'node:util';

import { isLogLevel, type LogContext, type Logger, type LogLevel } from '../../src/logger.ts';

export type LogLine = {
  level: LogLevel;
  message: string;
  context?: LogContext;
};

export class StubLogger implements Logger {
  public level: LogLevel;
  public lines: LogLine[] = [];

  constructor(level: string) {
    assert(isLogLevel(level));

    this.level = level;
  }

  debug = this.log('debug');
  info = this.log('info');
  warn = this.log('warn');
  error = this.log('error');

  clear() {
    this.lines = [];
  }

  /** Printed only when the test fails, so a failure comes with the log that explains it. */
  dump(diagnostic: (message: string) => void) {
    if (this.lines.length === 0) {
      return;
    }

    diagnostic(`${this.lines.length} log lines recorded during this test:`);

    for (const { level, message, context } of this.lines) {
      const entries = Object.entries(context ?? {}).filter(([, value]) => value !== undefined);
      const extra = entries.map(([key, value]) => ` ${key}=${inspect(value, { breakLength: Infinity })}`).join('');

      diagnostic(`  ${level.padEnd(5)} ${message}${extra}`);
    }
  }

  private log(level: LogLevel) {
    return (message: string, context?: LogContext) => {
      this.lines.push({ level, message, context });
    };
  }
}
