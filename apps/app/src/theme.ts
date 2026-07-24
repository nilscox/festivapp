import type { TenantConfig } from '@festivapp/contracts';

export function applyTenant(tenant: TenantConfig): void {
  document.documentElement.style.setProperty('--color-accent', tenant.theme.primaryColor);
  document.title = tenant.name;

  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (themeColor !== null) {
    themeColor.setAttribute('content', tenant.theme.primaryColor);
  }
}
