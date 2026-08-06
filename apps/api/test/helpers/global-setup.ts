import { createTemplate, dropTemplate } from './template.ts';

let template: string;

export async function globalSetup() {
  template = await createTemplate();

  process.env.FESTIVAPP_TEST_TEMPLATE = template;
}

export async function globalTeardown() {
  await dropTemplate(template);
}
