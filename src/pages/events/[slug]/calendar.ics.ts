import type { APIRoute, GetStaticPaths } from 'astro';
import { getEvents, type ChurchEvent } from '../../../lib/content';
import { lagosToDate, endOf, icsStamp } from '../../../lib/time';
import { settings } from '../../../lib/settings';

export const getStaticPaths = (async () => {
  const events = (await getEvents()).filter((e) => e.data.page);
  return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

const fold = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

/** "Add to calendar" file, generated from the event's dates. */
export const GET: APIRoute = ({ props, site }) => {
  const { event } = props as { event: ChurchEvent };
  const d = event.data;
  const start = lagosToDate(d.start.length === 10 ? `${d.start}T09:00` : d.start);
  const end = d.end ? endOf(d) : new Date(start.getTime() + 3 * 3600000);
  const url = new URL(`/events/${event.id}/`, site).toString();
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GHC Outer Ring Road//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@ghcouterringroad.org`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${fold(d.title)}`,
    `DESCRIPTION:${fold(`${d.when}. ${d.venue}. ${url}`)}`,
    `LOCATION:${fold(`Global Harvest Church, ${settings.address}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${fold(d.title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
