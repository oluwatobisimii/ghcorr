/* Shared behaviour for every page: nav, mobile menu, toast, copy buttons,
   countdowns, next service, programmes slider, event phases and motion. */
import { initMotion } from './motion';

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

/* ---------- Lagos time helpers ----------
   lagosNow() returns a Date whose *local* fields read Lagos wall-clock time,
   so it can be compared with parseLocal("2026-12-06T10:00"). */
export function lagosNow(): Date {
  const n = new Date();
  return new Date(n.getTime() + (60 + n.getTimezoneOffset()) * 60000);
}
export function parseLocal(s: string | null | undefined): Date | null {
  const m = String(s ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
}
const pad = (v: number) => String(v).padStart(2, '0');

/* ---------- Event phases: hide/show things around an event's end ----------
   Pages are built ahead of time; this corrects them to the exact minute. */
function applyPhases() {
  const now = Date.now();
  $$('[data-hide-after]').forEach((el) => {
    const t = Date.parse(el.dataset.hideAfter ?? '');
    if (!Number.isNaN(t)) el.hidden = now > t;
  });
  $$('[data-show-after]').forEach((el) => {
    const t = Date.parse(el.dataset.showAfter ?? '');
    if (!Number.isNaN(t)) el.hidden = now <= t;
  });
}

/* ---------- Nav + mobile menu ---------- */
function initNav() {
  const nav = $('#nav');
  if (nav && !document.body.classList.contains('sub')) {
    const onScroll = () => nav.classList.toggle('solid', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  const menu = $('#mobileMenu');
  $$('.burger').forEach((b) => b.addEventListener('click', () => menu?.classList.add('open')));
  menu?.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('a') || t.closest('.close')) menu.classList.remove('open');
  });
}

/* ---------- Toast + copy buttons ---------- */
export function toast(msg: string) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  const el = t as HTMLElement & { _h?: number };
  clearTimeout(el._h);
  el._h = window.setTimeout(() => el.classList.remove('show'), 2400);
}
function initCopy() {
  $$('[data-copy]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = b.dataset.copy ?? '';
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
        .then(() => toast(`Copied ${v}`))
        .catch(() => window.prompt('Copy this:', v));
    }),
  );
}

/* ---------- Countdowns: <div data-countdown="2026-12-06T10:00"> ---------- */
function tickCountdowns() {
  $$('[data-countdown]').forEach((el) => {
    const t = parseLocal(el.dataset.countdown);
    if (!t) return;
    const s = Math.max(0, (t.getTime() - lagosNow().getTime()) / 1000);
    const set = (k: string, v: number) => {
      const n = $(`[data-${k}]`, el);
      if (n) n.textContent = pad(v);
    };
    set('d', Math.floor(s / 86400));
    set('h', Math.floor((s % 86400) / 3600));
    set('m', Math.floor((s % 3600) / 60));
    set('s', Math.floor(s % 60));
  });
}

/* ---------- Daily countdown poster ----------
   <div data-countdown-poster="2026-12-06" data-folder="/media/…/countdown" data-max="13">
   shows <folder>/<days>.jpg, today.jpg on the day, and hides after the event. */
function initCountdownPosters() {
  $$('[data-countdown-poster]').forEach((card) => {
    const ev = parseLocal(card.dataset.countdownPoster);
    if (!ev) return;
    const n = lagosNow();
    const today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const days = Math.round((ev.getTime() - today.getTime()) / 86400000);
    if (days < 0) { card.hidden = true; return; }
    const max = parseInt(card.dataset.max ?? '13', 10);
    const file = days === 0 ? 'today' : String(Math.min(days, max));
    const src = `${card.dataset.folder}/${file}.jpg`;
    const label = days === 0 ? 'Happening today' : days > max ? 'Countdown' : `${file} day${file === '1' ? '' : 's'} to go`;
    $$<HTMLImageElement>('img', card).forEach((i) => { i.src = src; i.alt = `${label} poster`; });
    $$<HTMLAnchorElement>('a', card).forEach((a) => { a.href = src; });
    const lbl = $('[data-cd-label]', card);
    if (lbl) lbl.textContent = label;
  });
}

/* ---------- Next service bar (homepage) ---------- */
interface Service { name: string; weekday: string; time: string; label: string }
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function initNextService() {
  const label = $('#nextLabel');
  const data = $('#services-data');
  if (!label || !data) return;
  const services = JSON.parse(data.textContent || '[]') as Service[];
  const update = () => {
    const now = lagosNow();
    const upcoming: [Date, string][] = [];
    for (let d = 0; d < 8; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      for (const s of services) {
        if (WEEKDAYS.indexOf(s.weekday) !== day.getDay()) continue;
        const [h, m] = s.time.split(':').map(Number);
        const t = new Date(day);
        t.setHours(h, m, 0, 0);
        upcoming.push([t, `${s.name}, ${s.label}`]);
      }
    }
    const next = upcoming.filter(([t]) => t > now).sort((a, b) => a[0].getTime() - b[0].getTime())[0];
    if (!next) return;
    const s = (next[0].getTime() - now.getTime()) / 1000;
    label.textContent = next[1];
    const set = (id: string, v: number) => { const el = $(`#${id}`); if (el) el.textContent = String(v); };
    set('cd', Math.floor(s / 86400));
    set('ch', Math.floor((s % 86400) / 3600));
    set('cm', Math.floor((s % 3600) / 60));
  };
  update();
  setInterval(update, 30000);
}

/* ---------- Programmes slider (homepage) ---------- */
export interface Programme {
  title: string;
  start?: string;
  end?: string;
  when: string;
  venue: string;
  banner?: string;
  link?: string;
  cta?: string;
  featured?: boolean;
  recurring?: boolean;
}
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

function initProgrammes() {
  const track = $('#progTrack');
  const data = $('#programmes-data');
  if (!track || !data) return;
  const all = JSON.parse(data.textContent || '[]') as Programme[];
  const now = lagosNow();
  const endOf = (p: Programme) => {
    if (p.end) return parseLocal(p.end.length === 10 ? `${p.end}T23:59` : p.end);
    const d = parseLocal(p.start);
    d?.setHours(23, 59, 0, 0);
    return d;
  };
  const live = all.filter((p) => p.recurring || (endOf(p) ?? now) >= now);
  const dated = live
    .filter((p) => !p.recurring)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (parseLocal(a.start)?.getTime() ?? 0) - (parseLocal(b.start)?.getTime() ?? 0));
  const list = [...dated, ...live.filter((p) => p.recurring)];

  track.innerHTML = list
    .map((p, i) => {
      const ext = p.link && /^https?:/.test(p.link) ? ' target="_blank" rel="noopener"' : '';
      const tag = p.link ? 'a' : 'div';
      const href = p.link ? ` href="${esc(p.link)}"${ext}` : '';
      const banner = p.banner
        ? `<${tag} class="banner" data-banner${href}><img loading="${i ? 'lazy' : 'eager'}" src="${esc(p.banner)}" alt="${esc(p.title)} banner"></${tag}>`
        : `<${tag} class="banner text"${href}><span class="k">${esc(p.when)}</span><h3>${esc(p.title)}</h3><span class="d">${esc(p.venue)}</span><div class="stripes"><i></i><i></i><i></i><i></i></div></${tag}>`;
      const btn = p.link ? `<a class="btn btn-n" href="${esc(p.link)}"${ext}>${esc(p.cta || 'Learn more')}</a>` : '';
      return `<article class="prog" id="prog-${i}">${banner}<div class="prog-meta"><div><span class="when">${p.recurring ? 'Weekly · ' : ''}${esc(p.when)}</span><h3>${esc(p.title)}</h3><p>${esc(p.venue)}</p></div>${btn}</div></article>`;
    })
    .join('');

  // Banners that aren't 2400×1000 are shown whole over a blurred copy
  $$<HTMLImageElement>('[data-banner] img', track).forEach((img) => {
    const fix = () => {
      if (Math.abs(img.naturalWidth / img.naturalHeight - 2.4) <= 0.08) return;
      const box = img.parentElement!;
      const bg = img.cloneNode() as HTMLImageElement;
      bg.className = 'bg';
      bg.alt = '';
      img.className = 'fg';
      box.classList.add('fit');
      box.insertBefore(bg, img);
    };
    if (img.complete && img.naturalWidth) fix();
    else img.addEventListener('load', fix);
  });

  const cards = $$('.prog', track);
  const padLeft = () => parseFloat(getComputedStyle(track).paddingLeft);
  const leftOf = (el: HTMLElement) => el.offsetLeft - track.offsetLeft - padLeft();
  const chips = $('#progChips');
  if (chips) {
    chips.innerHTML = list
      .map((p, i) => `<button type="button" data-i="${i}"><small>${p.recurring ? 'WEEKLY' : esc(p.when.split('·')[0].trim().toUpperCase())}</small>${esc(p.title.split(':')[0])}</button>`)
      .join('');
    chips.addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLButtonElement>('button');
      if (b) track.scrollTo({ left: leftOf(cards[Number(b.dataset.i)]), behavior: 'smooth' });
    });
  }
  const current = () => {
    let best = 0;
    let bd = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(leftOf(c) - track.scrollLeft);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  const mark = () => {
    const i = current();
    chips && $$('button', chips).forEach((b, j) => b.classList.toggle('on', i === j));
  };
  let t: number | undefined;
  track.addEventListener('scroll', () => { clearTimeout(t); t = window.setTimeout(mark, 60); });
  mark();
  const go = (dir: number) => {
    const i = Math.min(cards.length - 1, Math.max(0, current() + dir));
    track.scrollTo({ left: leftOf(cards[i]), behavior: 'smooth' });
  };
  $('#progPrev')?.addEventListener('click', () => go(-1));
  $('#progNext')?.addEventListener('click', () => go(1));
}

/* ---------- Click-to-play YouTube (sermons) ---------- */
function initYouTube() {
  $$('[data-yt]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.dataset.yt;
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = el.getAttribute('aria-label') ?? 'YouTube video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.allowFullscreen = true;
      el.replaceChildren(frame);
      el.classList.add('playing');
    }),
  );
}

/* ---------- Sermon filters ---------- */
function initFilters() {
  const bar = $('[data-filters]');
  if (!bar) return;
  bar.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button');
    if (!b) return;
    const f = b.dataset.f ?? '';
    $$('button', bar).forEach((x) => x.classList.toggle('on', x === b));
    $$('[data-tags]').forEach((card) => {
      card.hidden = !!f && !(card.dataset.tags ?? '').split('|').includes(f);
    });
  });
}

applyPhases();
setInterval(applyPhases, 60000);
initNav();
initCopy();
tickCountdowns();
setInterval(tickCountdowns, 1000);
initCountdownPosters();
initNextService();
initProgrammes();
initYouTube();
initFilters();
initMotion();
