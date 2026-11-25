import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { lagosDate, mediaPath, link, clean } from './lib/schema';

/** Validate a collection after removing blank fields saved by /admin. */
const cleaned = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((v) => clean(v) ?? {}, schema);

/* ------------------------------------------------------------------
   SERMONS: one file per message in src/content/sermons/
   ------------------------------------------------------------------ */
const sermons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sermons' }),
  schema: cleaned(z.object({
    title: z.string(),
    date: lagosDate,
    preacher: z.string().optional(),
    series: z.string().optional(),
    /** Bible passage, e.g. "Daniel 6:26" */
    passage: z.string().optional(),
    /** One or two sentences: the big idea */
    summary: z.string().optional(),
    /** Full YouTube link. The thumbnail and player come from YouTube automatically. */
    youtube: z.string().optional(),
    /** Optional audio link (Telegram post, mp3 link) */
    audio: z.string().optional(),
    /** Optional photo, used when there's no YouTube link */
    image: mediaPath.optional(),
    draft: z.boolean().default(false),
  })),
});

/* ------------------------------------------------------------------
   EVENTS: dated programmes. Simple ones only appear in the homepage
   slider and /events/. Big ones (page: true) also get a full page
   built from the optional sections below, and switch to "recap" mode
   automatically once the end date has passed.
   ------------------------------------------------------------------ */
const titleLine = z.object({
  text: z.string(),
  style: z.enum(['plain', 'orange', 'blue']).default('plain'),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: cleaned(z.object({
    title: z.string(),
    start: lagosDate,
    /** When it's over. Left blank = end of the start day. */
    end: lagosDate.optional(),
    /** Date text people see, e.g. "Sun 6 Dec · 10:00am" */
    when: z.string(),
    venue: z.string().default('Church Auditorium, GHC Outer Ring Road'),
    summary: z.string().optional(),
    /** 2400×1000 banner for the slider and event list */
    banner: mediaPath.optional(),
    /** Pin as the first slide on the homepage */
    featured: z.boolean().default(false),
    showInSlider: z.boolean().default(true),
    /** Button on the slider. Without a link it goes to the event page (if any). */
    cta: z.string().optional(),
    link: z.string().optional(),
    /** Give this event its own page at /events/<file-name>/ */
    page: z.boolean().default(false),
    draft: z.boolean().default(false),

    /* ---- Full event page sections (all optional) ---- */
    hero: z
      .object({
        tagline: z.string().optional(),
        titleLines: z.array(titleLine).default([]),
        details: z.string().optional(),
        video: mediaPath.optional(),
        image: mediaPath.optional(),
        countdown: z.boolean().default(true),
        buttons: z.array(link).default([]),
      })
      .optional(),
    shareImage: mediaPath.optional(),
    hashtag: z.string().optional(),
    quote: z
      .object({
        eyebrow: z.string().default('The word'),
        /** Wrap words in *stars* to highlight them */
        text: z.string(),
        cite: z.string().optional(),
      })
      .optional(),
    schedule: z
      .object({
        heading: z.string(),
        intro: z.string().optional(),
        items: z.array(
          z.object({
            day: z.string(),
            label: z.string(),
            title: z.string(),
            text: z.string().optional(),
            bullets: z.array(z.string()).default([]),
            highlight: z.boolean().default(false),
            pill: z.string().optional(),
          }),
        ),
      })
      .optional(),
    ministers: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
          photo: mediaPath,
          photoPosition: z.string().default('50% 20%'),
          text: z.string().optional(),
        }),
      )
      .default([]),
    involve: z
      .array(
        z.object({
          kind: z.enum(['yellow', 'gradient', 'navy', 'light']).default('light'),
          eyebrow: z.string().optional(),
          title: z.string(),
          text: z.string().optional(),
          image: mediaPath.optional(),
          account: z.object({ number: z.string(), bank: z.string() }).optional(),
          buttons: z.array(link).default([]),
        }),
      )
      .default([]),
    posters: z
      .object({
        intro: z.string().optional(),
        video: mediaPath.optional(),
        videoPoster: mediaPath.optional(),
        /** Folder with 1.jpg, 2.jpg … and today.jpg. The right one shows each day. */
        countdownFolder: z.string().optional(),
        countdownMax: z.number().default(13),
        items: z
          .array(
            z.object({
              title: z.string(),
              image: mediaPath,
              wide: z.boolean().default(false),
              link: z.string().optional(),
              linkLabel: z.string().optional(),
            }),
          )
          .default([]),
      })
      .optional(),
    gallery: z
      .object({
        eyebrow: z.string().optional(),
        heading: z.string(),
        intro: z.string().optional(),
        images: z.array(mediaPath).default([]),
      })
      .optional(),
    showVenue: z.boolean().default(true),
    /** Personalised DP maker at /events/<file-name>/dp/ */
    dp: z
      .object({
        background: mediaPath,
        /** Photo window on the 1080×1350 design */
        window: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number(), r: z.number().default(0) }),
        filename: z.string(),
        shareText: z.string(),
        headingLines: z.array(titleLine).default([]),
        intro: z.string().optional(),
      })
      .optional(),
    /** Shown instead of the countdown, buttons and "get involved" once it's over */
    recap: z
      .object({
        heading: z.string().optional(),
        text: z.string().optional(),
        youtube: z.string().optional(),
        images: z.array(mediaPath).default([]),
      })
      .optional(),
  })),
});

/* ------------------------------------------------------------------
   WEEKLY: recurring programmes that always show after dated ones
   ------------------------------------------------------------------ */
const weekly = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/weekly' }),
  schema: cleaned(z.object({
    title: z.string(),
    when: z.string(),
    venue: z.string(),
    banner: mediaPath.optional(),
    link: z.string().optional(),
    cta: z.string().optional(),
    order: z.number().default(0),
  })),
});

export const collections = { sermons, events, weekly };
