import { createReadStream, type ReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { config } from './config.ts';
import { assert } from './utils.ts';

export interface Storage {
  put(key: string, data: Buffer): Promise<void>;
  read(key: string): ReadStream;
  delete(key: string): Promise<void>;
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
  }
}

export const storage = new DiskStorage(config.storageDir);
