# GHC Outer Ring Road website

Astro 7 + TypeScript static site with React for interactive pieces. Content is edited through Pages CMS (`/.pages.yml`), stored as Markdown/JSON in this repo, and deployed as static files on Cloudflare Pages (`public/_headers`, `.node-version`).

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-checks, then builds to dist/
```

## Where things live

| Path | What |
|---|---|
| `src/content/sermons/*.md` | Sermons (one file each). The newest one shows on the homepage. |
| `src/content/events/*.md` | Dated events. `page: true` adds a full page at `/events/<file>/`, plus `/dp/` and `calendar.ics`. |
| `src/content/weekly/*.md` | Recurring programmes in the homepage slider |
| `src/data/settings.json` | Contact details, service times, highlighted nav event, `/anniversary` target |
| `src/content.config.ts` | Typed schemas for all content. A bad field fails the build with a clear message. |
| `src/pages/` | Routes: `/`, `/sermons/`, `/sermons/[slug]/`, `/events/`, `/events/[slug]/`, `/events/[slug]/dp/` |
| `src/components/react/DpMaker.tsx` | Client-side DP generator (canvas, drag/pinch/zoom, Web Share) |
| `src/scripts/site.ts` | Nav, countdowns, next-service bar, programmes slider, event phases, YouTube embeds |
| `src/scripts/motion.ts` | Scroll reveals, parallax, count-ups (off for reduced motion) |
| `src/styles/` | `site.css` (global), `pages.css` (sermons, events), `event.css`, `dp.css` |
| `public/media/` | Uploads from the CMS (`/media/...`) |
| `public/assets/` | Logos, fonts and fixed site photos |

## How events archive themselves

- `endOf(event)` is `end`, or 23:59 on the start day (Lagos time).
- **At build time:** past events move to *Past events*, and event pages render in recap mode.
- **In the browser:** anything with `data-hide-after` / `data-show-after` (ISO instant) flips the moment the event ends, so the page is right even before the next build.
- `.github/workflows/nightly-rebuild.yml` triggers a rebuild every night (it needs the `BUILD_HOOK_URL` repository secret).

## Going live checklist

1. Put this folder in a GitHub repo, ideally under a church organisation.
2. Cloudflare Pages: Workers & Pages → Create → Pages → Connect to Git → pick the repo. Framework preset **Astro**, build command `npm run build`, output directory `dist`.
3. Create a Pages deploy hook (Settings → Builds → Deploy hooks) and save it as the `BUILD_HOOK_URL` secret on GitHub.
4. Sign in to https://app.pagescms.org with GitHub, open the repo, and invite editors by email.
5. Add ghcouterringroad.org under the project's Custom domains once everything has been checked.
