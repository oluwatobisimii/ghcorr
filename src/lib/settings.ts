import { z } from 'astro/zod';
import raw from '../data/settings.json';

const settingsSchema = z.object({
  churchName: z.string(),
  slogan: z.string(),
  address: z.string(),
  mapQuery: z.string(),
  phone: z.string(),
  email: z.string(),
  youtube: z.string(),
  instagram: z.string(),
  facebook: z.string(),
  telegram: z.string(),
  givingUrl: z.string().default(''),
  officeHours: z.string(),
  services: z.array(
    z.object({
      name: z.string(),
      weekday: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      label: z.string(),
    }),
  ),
  anniversaryEvent: z.string(),
  navHighlight: z.object({ label: z.string(), event: z.string() }).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
export const settings: Settings = settingsSchema.parse(raw);
export const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(settings.mapQuery)}`;
export const mapsEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}&output=embed`;
