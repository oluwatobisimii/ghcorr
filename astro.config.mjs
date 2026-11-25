// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import settings from './src/data/settings.json' with { type: 'json' };

export default defineConfig({
  site: 'https://ghcouterringroad.org',
  trailingSlash: 'always',
  integrations: [react()],
  // Old links from posters and WhatsApp keep working.
  // "anniversaryEvent" is set in src/data/settings.json (editable in /admin → Site settings).
  redirects: {
    '/anniversary': `/events/${settings.anniversaryEvent}/`,
    '/anniversary/dp': `/events/${settings.anniversaryEvent}/dp/`,
  },
});
