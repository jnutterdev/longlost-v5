# longlostforgotten v5 — Tech Spec

## Goal

Rebuild longlostforgotten.com from the `longlostforgotten_redesign.html` mockup as a fully static Astro site, carrying over all v4 posts and adding a TinaCMS-managed photo gallery.

The visual direction has since moved on from the mockup. See [Design Refresh](#design-refresh-2026-10-20).

## Stack

| Concern    | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Astro 7, `output: 'static'`                                   |
| CMS        | TinaCMS (git-backed), `astro-tina` integration as in v4       |
| Styling    | Scoped `<style>` blocks + CSS custom properties, `normalize.css` |
| Fonts      | Bunny Fonts — Syne (400/600/700/800), Outfit (300/400/500/600) |
| Icons      | Font Awesome Free Bluesky SVG, inlined                        |
| JS         | Vanilla `<script>` only (mobile nav, parallax, Bluesky comments). No React islands |
| Hosting    | Cloudflare Pages                                              |
| Packages   | pnpm, Node 24 LTS                                             |

No Tailwind. The mockup's Tailwind classes were rewritten as scoped component styles.

### Dependencies (vs. a bare Astro install)

- `normalize.css`
- `@astrojs/rss`
- `@astrojs/markdown-remark` (Astro 7 needs it for the v4 `rehype-alternate-images` plugin)
- `tinacms`, `@tinacms/cli`, `astro-tina` (same as v4)
- `@astrojs/react` + `react`/`react-dom`: required by `astro-tina`, not used by site components

Dropped from v4: `@fontsource/*`, `satori`, `@resvg/resvg-js`.

## Design System

The live reference is **`/pattern-lib`** (`src/pages/pattern-lib.astro`): swatches, type specimens, ornaments, every component, and image shapes, all rendered from the real components with mock data. It's deployed but unlinked and `noindex`. Keep it updated when adding colors, type roles, ornaments, or components.

**Direction:** art deco + nature + punk. Dark neutral base, olive and sienna accents, deco ornaments (sunbursts, diamonds, double rules, arches, inset frames) mixed with punk card treatments (hard offset shadows, halftone, grain).

### Tokens

`src/styles/tokens.css`, imported once in the base layout:

| Token            | Value     | Role                                   |
| ---------------- | --------- | -------------------------------------- |
| `--color-ink`    | `#1a1a1a` | Page background                        |
| `--color-char`   | `#262523` | Card surface                           |
| `--color-olive`  | `#767151` | Borders, rules, card shadow            |
| `--color-khaki`  | `#9A9478` | Muted text, dates, meta (5.6:1 on ink) |
| `--color-almond` | `#EFE3D9` | Body text                              |
| `--color-sienna` | `#AB572C` | Accent: links, hovers, tags, ornaments |

Semantic aliases: `--color-text` (almond), `--color-text-muted` (almond at 75%), `--color-accent` (sienna). Sienna is about 3.4:1 on ink, fine for large text and fills but borderline for small text.

The token file also defines a type scale (`--text-xs` 0.6875rem through `--text-5xl` 3.75rem), tracking, a spacing scale (`--space-2xs` through `--space-3xl`), card border/shadow/lift, layout widths (`--content-max` 72rem, `--prose-max` 42rem), and `--ease`.

Global (non-scoped) styles in `src/styles/global.css`: body, headings, `::selection`, focus ring, noise overlay, halftone utility, and the shared card classes below. Prose styles live in `src/styles/prose.css`.

Minimum font size is 11px (`--text-xs`).

### Shared card classes

- `.punk-card`: char surface, olive border, offset shadow; lifts with a sienna shadow and border on hover
- `.punk-card--framed`: deco inset frame (thin line 6px inside the edge, square corner blocks) that turns sienna on hover. Uses `::after` at `z-index: -1`, so components with positioned media (e.g. `PhotoCard`) raise it
- `.punk-card--branches`: leftover from the removed branch silhouette. Its `::before` no longer has a background and can be cleaned up

### Ornaments

| Ornament      | Where                                   | Source |
| ------------- | --------------------------------------- | ------ |
| Sunrise       | Footer horizon (every page)             | `<Fin shape="sun" />` |
| Crescent moon | End of each post                        | `<Fin shape="moon" />` |
| Pines         | End of the about bio                    | `<Fin shape="pines" />` |
| Ziggurat      | Gallery photo pages, 404 (large)        | `<Fin shape="ziggurat" />` |
| Heading rule  | Section headings: double line + sienna diamond | `SectionHeading.astro` |
| Hero sunburst | Rays, sun, and halo behind the hero text | `Hero.astro` `.sunburst` |
| Archive rows  | Double-line year rule, hover diamond, faded row dividers | `ArchiveList.astro` |
| Arches        | Hero image, about avatar                | `border-radius: 999px 999px 0 0` |

## Content Model

### `posts` (migrated from v4, schema unchanged)

156 posts copied from `longlost-v4/src/content/posts/*.md` as-is. v4 frontmatter is kept: `title`, `date`, `excerpt`, `tag[]`, `readTime`, `image`, `featured`, `draft`, `blueskyUrl`, `mastodonUrl`, `currentMusic`, `currentMood`, body.

**Card variant comes from existing fields** (`getCardVariant()` in `src/lib/posts.ts`):

| Condition                     | Card                                  |
| ----------------------------- | ------------------------------------- |
| `featured: true`              | `PostCard featured`: wide text card, spans 2 cols, arrow badge |
| has `image`, not featured     | `PostCardImage`: image card with gradient + duotone overlay |
| otherwise                     | `PostCard`: standard text card        |

Images referenced in posts (`/images/*`) were copied from `longlost-v4/public/images`.

### `photos` (new)

`src/content/photos/*.md`, Tina collection `photos`:

| Field        | Type       | Notes                          |
| ------------ | ---------- | ------------------------------ |
| `title`      | string     | `isTitle: true`                |
| `image`      | image      | required                       |
| `alt`        | string     | required                       |
| `date`       | datetime   | required                       |
| `location`   | string     | optional                       |
| `tags`       | string     | `list: true`                   |
| `draft`      | boolean    |                                |
| `body`       | rich-text  | `isBody: true`, caption/notes  |

Media root: `public/images/photos/`.

### `home` / `about` (singletons)

- `src/content/home.json`: hero `tagline`, `headline`, `desc`, `heroImage`, `heroImageAlt`
- `src/content/about.json`: `avatar`, `avatarAlt`, `name`, `handle`, `location`, `bio`, `links[]`

The hero's "Welcome" badge is hard-coded in `Hero.astro`, not in `home.json`. The tagline copy is pending a rewrite now that the "signal/transmission" theme is being retired.

## Pages

| Route                | Source                       | Notes |
| -------------------- | ---------------------------- | ----- |
| `/`                  | `index.astro`                | Hero + latest 7 posts in the mixed card grid + "Full archive" link |
| `/archive`           | `archive/index.astro`        | Tag cloud + all non-draft posts grouped by year |
| `/archive/tag/[tag]` | `archive/tag/[tag].astro`    | Tag filter pages |
| `/posts/[slug]`      | `posts/[slug].astro`         | Single post; same URL scheme as v4. Ends with the moon mark, mood/music, Bluesky comments, older/newer pager |
| `/gallery`           | `gallery/index.astro`        | Framed photo grid |
| `/gallery/[slug]`    | `gallery/[slug].astro`       | Single photo + caption, ziggurat above the pager |
| `/about`             | `about.astro`                | From `about.json`; profile centered on mobile |
| `/pattern-lib`       | `pattern-lib.astro`          | Design system reference. Unlinked, `noindex` |
| `/rss.xml`           | `rss.xml.ts`                 | Published posts |
| 404                  | `404.astro`                  | "signal lost" card with a large ziggurat |

## Components

Layout:
- `layouts/Base.astro`: head (meta, OG, Bunny Fonts), normalize + tokens + global CSS, `BackgroundBlobs`, `Nav`, `<slot />`, `Footer`. Props: `title`, `description`, `image` (OG image, defaults to `/images/social_basecard.png`), `noindex`

Components (PascalCase, scoped styles, typed `interface Props`):
- `Nav.astro`: logo + links, mobile dropdown (`aria-expanded`, Escape to close). `z-index: 20` so the dropdown sits above `.main` (`z-index: 10`)
- `Footer.astro`: copyright, RSS + Bluesky icons, sunrise `Fin` as its top edge. No background, so the page glow continues behind it
- `Fin.astro`: horizon ornament (`shape`: `sun` | `moon` | `pines` | `ziggurat`), accepts `class`
- `BackgroundBlobs.astro`: three blurred olive/sienna blobs + parallax, disabled under `prefers-reduced-motion`
- `Hero.astro`: arched duotone image + framed intro card with sunburst
- `SectionHeading.astro`: title + deco rule
- `PostGrid.astro`: picks card variants, handles the 2-column featured span (`grid-auto-flow: dense`)
- `PostCard.astro` (`featured` prop), `PostCardImage.astro`: cards wrap a real link
- `PhotoCard.astro`: framed gallery card
- `ArchiveList.astro`: posts grouped by year with sticky year labels
- `TagList.astro`, `TagCloud.astro`: tag links to `/archive/tag/[tag]`
- `DuotoneImage.astro`: grayscale + khaki color blend + halftone, used by the hero, image cards, and gallery
- `BlueskyComments.astro`: carried from v4, shown on posts with `blueskyUrl`

Helpers (kebab-case, `src/lib/`):
- `posts.ts`: collection getters, sorting, card variant, tags, year grouping, excerpts
- `format-date.ts`: month/year, long, and short date formats
- `rehype-alternate-images.mjs`: carried from v4

## Assets

- **Images** are public paths (Tina's media manager writes to `public/images`), rendered with plain `<img>`, not `astro:assets`.
- **Placeholders:** `public/images/placeholders/` (hero + sample photo entries `src/content/photos/placeholder-*.md`).
- **Favicon:** `public/favicon.svg` (sienna "l" on ink). `public/favicon.ico` is still the old v4 icon and isn't linked; regenerate or delete it.
- **Share images:** `public/images/social_basecard.png` (default OG image) and `public/images/social_wordmark.png`, both 1200×630. Sources are SVGs in `design/social/` (not deployed). See the README for how to re-export them.
- **Noise texture:** inline SVG data URI in CSS.
- **Branch silhouette:** removed.

## Accessibility & Motion

- Cards and tags are real links
- Visible `:focus-visible` styles that match the hover treatments
- `prefers-reduced-motion`: turns off parallax, card lift, and image scale
- Mobile nav: `aria-expanded`, `aria-controls`, Escape to close
- Decorative ornaments are `aria-hidden`

## Cloudflare

- `public/_headers` and `public/_redirects` carried over from v4 (`/admin` redirect, security headers, `noindex` on `/admin/*`)
- Pages project `longlost-v5`, `wrangler.jsonc` with `pages_build_output_dir: "dist"`
- **Deploy is not set up yet.** Plan, following `longlost-v4/DEPLOY_GUIDE.md`:
  1. Add `.github/workflows/deploy.yml` using **pnpm** (v4's uses npm) and `--project-name=longlost-v5`
  2. Add repo secrets: `TINA_CLIENT_ID`, `TINA_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  3. Point the Tina Cloud project at the `longlost-v5` repo (or create a new one)
  4. `npx wrangler pages project create longlost-v5` (production branch `main`)
  5. Verify on `longlost-v5.pages.dev`, then move `longlostforgotten.com` from the v4 project's Custom Domains to v5. Keep v4 around as a rollback

## Scripts

```json
"dev": "astro dev",
"build": "astro build",
"preview": "astro preview",
"tina:dev": "tinacms dev -c \"astro dev\"",
"tina:build": "tinacms build && astro build"
```

The v4 `tina.mjs` wrapper isn't needed; the Tina CLI works with the standard scripts.

## Out of Scope

- The Archivist AI chat widget (dropped)
- SSR / Workers / D1
- OG image generation and the v4 announce script

## Decisions (2026-10-15)

1. **v4 extras:** carry over `BlueskyComments.astro` only. No OG image generation and no announce script, so `satori`/`resvg` are dropped.
2. **Footer socials:** Bluesky only (plus RSS).
3. **Icons:** inline the Font Awesome Free brand SVG (Bluesky) instead of installing the package.
4. **Inner pages:** post, archive and gallery match the home page's style.
5. **Deploy:** a new Cloudflare Pages project (`longlost-v5`).
6. **RSS:** yes, `/rss.xml` via `@astrojs/rss`.

## Build Notes (2026-10-15)

Where the first build differed from the original plan:

- **Images use public paths, not `astro:assets`**, because Tina's media manager writes to `public/images`.
- **Branch silhouette:** the clipground URL blocked hotlinking, so it was replaced with a hand-drawn SVG. It was later removed entirely.
- **Cards:** `PostCard.astro` takes a `featured` prop instead of a separate `PostCardFeatured`. `PostGrid.astro` picks the variant.
- **Extra components:** `ArchiveList.astro`, `TagCloud.astro`, and a `404.astro` page.

## Design Refresh (2026-10-20)

- **Palette:** replaced the original earthy-orange tokens (`darkness`, `magicmetal`, `goben`, `antlervelvet`, `martiancolony`) with ink/char/olive/khaki/almond/sienna, after trying blue/orange, green/rust, and all-green palettes.
- **Ornaments:** added the deco ornament set (see [Ornaments](#ornaments)) and the `.punk-card--framed` inset frame on post cards, the hero, photo cards, the about bio, and the 404.
- **Archive:** year labels lightened (khaki with a dark offset shadow), year rules became double lines, row dividers faded to 35% olive, hover diamond added.
- **Pattern library:** added `/pattern-lib` and a `noindex` prop on `Base.astro`.
- **Fixes:** mobile nav dropdown hidden behind content (z-index), about profile centered on mobile.
- **Share images and favicon** redone in the new palette.

### Content issues from the v4 migration

- ~~`Dread-and-Discomfort.md` broken image path~~: fixed (`/images/dread-and-discomfort.jpg`).
- `stuff-to-get-excited-about.md` line 31: `\*\*Klara and the Sun\*\*` has escaped asterisks, so they render literally instead of bold, and the image and "this" run straight into it. Still needs a fix.
- Only two posts are `featured: true`, so the wide featured card doesn't appear in the home page's latest 7.
