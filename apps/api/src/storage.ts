import { assert } from '@festivapp/utils';
import { createReadStream } from 'node:fs';
import { mkdir, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';

import type { Config } from './config.ts';

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  read(key: string): Readable;
  delete(key: string): Promise<void>;
}

export function createStorage({ config }: { config: Config }): Storage {
  return config.storageDir ? new DiskStorage(config.storageDir) : new MemoryStorage();
}

class DiskStorage implements Storage {
  private root: string;

  constructor(directory: string) {
    this.root = resolve(directory);
  }

  private pathOf(key: string) {
    const path = join(this.root, key);

    assert(path.startsWith(`${this.root}/`), new Error(`Storage key escapes the storage directory: ${key}`));

    return path;
  }

  async put(key: string, data: Buffer) {
    const path = this.pathOf(key);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  read(key: string) {
    return createReadStream(this.pathOf(key));
  }

  async delete(key: string) {
    await rm(this.pathOf(key), { force: true });
    await rmdir(dirname(this.pathOf(key))).catch(() => {});
  }
}

class MemoryStorage implements Storage {
  private files = new Map<string, Buffer>();

  async put(key: string, data: Buffer) {
    this.files.set(key, data);
  }

  read(key: string) {
    const data = this.files.get(key);

    assert(data, new Error(`No such file in the storage: ${key}`));

    return Readable.from(data);
  }

  async delete(key: string) {
    this.files.delete(key);
  }
}
