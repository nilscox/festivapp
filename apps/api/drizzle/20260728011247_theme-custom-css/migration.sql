UPDATE "tenants" SET "theme" = jsonb_set("theme", '{customCss}', 'null'::jsonb) WHERE NOT "theme" ? 'customCss';
