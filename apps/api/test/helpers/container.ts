import { defined } from '@festivapp/utils';

import { envConfig } from '../../src/config.ts';
import { createContainer, type Container } from '../../src/container.ts';

let container: Container | undefined;

export async function startContainer(): Promise<Container> {
  container ??= await createContainer({ config: { ...envConfig(), logLevel: 'silent' } });

  return container;
}

export function testContainer(): Container {
  return defined(container, new Error('The test container has not been started'));
}
