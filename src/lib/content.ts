import { getCollection, type CollectionEntry } from 'astro:content';
import { lagosToDate, isOver } from './time';
import { youtubeId, youtubeThumb } from './youtube';
import type { Programme } from '../scripts/site';

export type Sermon = CollectionEntry<'sermons'>;
export type ChurchEvent = CollectionEntry<'events'>;

export async function getSermons(): Promise<Sermon[]> {
  const all = await getCollection('sermons', (s) => !s.data.draft);
  return all.sort((a, b) => lagosToDate(b.data.date).getTime() - lagosToDate(a.data.date).getTime());
}

/** Picture for a sermon card: YouTube thumbnail, else its photo, else a default. */
export function sermonImage(s: Sermon): string {
  const id = youtubeId(s.data.youtube);
  return id ? youtubeThumb(id) : s.data.image ?? '/assets/img/preach.jpg';
}

export async function getEvents(): Promise<ChurchEvent[]> {
  const all = await getCollection('events', (e) => !e.data.draft);
  return all.sort((a, b) => lagosToDate(a.data.start).getTime() - lagosToDate(b.data.start).getTime());
}

export const eventUrl = (e: ChurchEvent) => (e.data.page ? `/events/${e.id}/` : e.data.link);

export function splitEvents(events: ChurchEvent[], now = new Date()) {
  return {
    upcoming: events.filter((e) => !isOver(e.data, now)),
    past: events.filter((e) => isOver(e.data, now)).reverse(),
  };
}

/** Everything the homepage slider needs. Expired ones are filtered again in the browser. */
export async function getProgrammes(): Promise<Programme[]> {
  const events = (await getEvents()).filter((e) => e.data.showInSlider);
  const weekly = (await getCollection('weekly')).sort((a, b) => a.data.order - b.data.order);
  return [
    ...events.map((e) => ({
      title: e.data.title,
      start: e.data.start,
      end: e.data.end,
      when: e.data.when,
      venue: e.data.venue,
      banner: e.data.banner,
      link: e.data.link ?? (e.data.page ? `/events/${e.id}/` : undefined),
      cta: e.data.cta,
      featured: e.data.featured,
    })),
    ...weekly.map((w) => ({ ...w.data, recurring: true })),
  ];
}
