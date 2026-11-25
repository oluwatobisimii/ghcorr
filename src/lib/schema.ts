import { z } from 'astro/zod';

/**
 * Dates are written in Lagos time as "2026-12-06" (all day) or "2026-12-06T10:00".
 * YAML sometimes turns them into real Date objects, so both are accepted and
 * normalised back to that plain text form.
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;
export const lagosDate = z
  .union([z.string(), z.date()])
  .transform((v) => {
    if (v instanceof Date) {
      const iso = v.toISOString();
      const hasTime = iso.slice(11, 16) !== '00:00';
      return hasTime ? iso.slice(0, 16) : iso.slice(0, 10);
    }
    return v.trim().replace(' ', 'T').slice(0, 16);
  })
  .refine((v) => DATE_RE.test(v), {
    message: 'Use a date like 2026-12-06 or 2026-12-06T10:00 (Lagos time)',
  });

/** Paths to images uploaded in /admin look like "/media/…"; full https links also work. */
export const mediaPath = z
  .string()
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), {
    message: 'Image paths must start with / (e.g. /media/events/banner.jpg) or https://',
  });

export const link = z.object({
  label: z.string(),
  url: z.string(),
  style: z.enum(['yellow', 'navy', 'outline']).default('yellow'),
  /** Hide this button once the event is over (e.g. "Buy T-shirt"). */
  hideAfterEvent: z.boolean().default(false),
});
export type Link = z.infer<typeof link>;

/**
 * The /admin editor saves untouched optional fields as "" or null, and untouched
 * sections as empty objects. Strip those before validating so a blank field
 * never breaks the build.
 */
export function clean(v: unknown): unknown {
  if (v === '' || v === null) return undefined;
  if (Array.isArray(v)) return v.map(clean).filter((x) => x !== undefined);
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const c = clean(val);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v;
}
