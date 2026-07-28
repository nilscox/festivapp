UPDATE "tenants" SET "theme" = jsonb_build_object(
	'backgroundColor', '#ffffff',
	'accentColor', CASE
		WHEN lower("theme" ->> 'primaryColor') ~ '^#[0-9a-f]{6}$' THEN lower("theme" ->> 'primaryColor')
		ELSE '#18181b'
	END,
	'fonts', jsonb_build_object(
		'display', '''Space Grotesk Variable'', system-ui, sans-serif',
		'body', '''Space Grotesk Variable'', system-ui, sans-serif',
		'mono', '''IBM Plex Mono'', ui-monospace, monospace'
	),
	'logo', jsonb_build_object(
		'wordmarkUrl', COALESCE("theme" -> 'logoUrl', 'null'::jsonb),
		'iconUrl', 'null'::jsonb
	),
	'backgroundImage', 'null'::jsonb,
	'pwa', jsonb_build_object('name', 'null'::jsonb, 'shortName', 'null'::jsonb)
);
