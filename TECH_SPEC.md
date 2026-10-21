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
| Hosting    | Cloudflare Workers (static assets), deployed by GitHub Actions |
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

Colors are role tokens defined per palette in `src/styles/themes.css` (see [Theming](#theming-2026-10-21--draft) for the full table). Rust, the original ink/char/olive/khaki/almond/sienna set, is the default and the `:root` fallback; Dusk is slate/mauve/rose. Components only reference role tokens (`--color-bg`, `--color-meta`, `--color-accent`, …), never hue names. `--color-text-muted` (text at 75%) is derived in `tokens.css`. Rust's sienna is about 3.4:1 on ink, fine for large text and fills but borderline for small text.

`src/styles/tokens.css` (imported after `themes.css` in the base layout) defines a type scale (`--text-xs` 0.6875rem through `--text-5xl` 3.75rem), tracking, a spacing scale (`--space-2xs` through `--space-3xl`), card border/shadow/lift, layout widths (`--content-max` 72rem, `--prose-max` 42rem), and `--ease`.

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
- **Favicon:** `public/favicon.svg` (sienna "l" on ink), the only favicon. The old v4 `favicon.ico` was deleted.
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

Deployed as a **static-assets-only Worker**, the same setup as `jnutterdev-v2` (v4 used Pages).

- `wrangler.jsonc`: Worker `longlost-v5`, `assets.directory: "./dist"`, `not_found_handling: "404-page"` so unknown routes get `dist/404.html` with a 404 status (Workers doesn't infer this the way Pages did). No `main`, no Worker script
- `public/_headers` and `public/_redirects` carried over from v4 (`/admin` redirect, security headers, `noindex` on `/admin/*`); Workers static assets honors both
- `.github/workflows/deploy.yml`: on push to `main`: pnpm install → `pnpm run tina:build` (with `NODE_OPTIONS=--max-old-space-size=4096` for the Tina build) → `pnpm dlx wrangler deploy`. Cloudflare doesn't build anything itself
- `pnpm dlx wrangler deploy --dry-run` validates the config locally without a Cloudflare login

**First deploy checklist (not done yet):**

1. Add repo secrets: `TINA_CLIENT_ID`, `TINA_TOKEN`, `CLOUDFLARE_API_TOKEN` ("Edit Cloudflare Workers" template), `CLOUDFLARE_ACCOUNT_ID`
2. Point the Tina Cloud project at the `longlost-v5` repo (or create a new one; the client ID and token then change)
3. Push to `main`. The first deploy creates the Worker; no `project create` step is needed
4. Check the site on its `longlost-v5.<subdomain>.workers.dev` URL
5. Move the domain: remove `longlostforgotten.com` from the v4 Pages project's Custom Domains, then add it under the v5 Worker's **Settings → Domains & Routes → Custom Domain**. Keep v4 around as a rollback

## Announcing posts

Ported from v4: `scripts/announce.mjs` + `scripts/announce.config.json`, run by `.github/workflows/announce.yml` after each successful Deploy on `main` (skipped when the push came from `github-actions[bot]`).

- Looks at posts **added or modified** in the triggering commit. Skips `draft: true` and `announced: true`
- Posts `title`, `excerpt`, and the post URL to Bluesky (link card, image thumb ≤ 1MB) and Mastodon (image attachment). Image falls back to `social_basecard.png`
- Writes `blueskyUrl`, `mastodonUrl`, and `announced: true` back into the post's frontmatter and pushes a bot commit. `blueskyUrl` powers the comments on the post page
- Frontmatter is parsed with the `yaml` package. v4 used a regex that left Tina's YAML escaping in place (`'Here''s'` came out as `Here''s`, which looks like a double quote)
- Secrets: `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `MASTODON_INSTANCE`, `MASTODON_ACCESS_TOKEN`
- All published posts are marked `announced: true` (2026-10-20). The 103 drafts (mostly 2001–2006 LiveJournal entries) aren't marked, so each one is announced when it's published
- Don't run the script locally; it commits and pushes

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
- OG image generation

## Decisions (2026-10-15)

1. **v4 extras:** carry over `BlueskyComments.astro` only. No OG image generation and no announce script, so `satori`/`resvg` are dropped. The announce script was brought back on 2026-10-20 (see [Announcing posts](#announcing-posts)).
2. **Footer socials:** Bluesky only (plus RSS).
3. **Icons:** inline the Font Awesome Free brand SVG (Bluesky) instead of installing the package.
4. **Inner pages:** post, archive and gallery match the home page's style.
5. **Deploy:** a new Cloudflare Pages project (`longlost-v5`). Superseded 2026-10-20: switched to a Workers static-assets deploy to match `jnutterdev-v2`.
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
- **Deploy target:** moved from Pages to Workers static assets, with a pnpm GitHub Actions workflow modeled on `jnutterdev-v2`.
- **Announcing:** ported the v4 Bluesky/Mastodon announce workflow, with real YAML parsing to fix doubled apostrophes.

### Content issues from the v4 migration

- ~~`Dread-and-Discomfort.md` broken image path~~: fixed (`/images/dread-and-discomfort.jpg`).
- ~~`stuff-to-get-excited-about.md` escaped `\*\*Klara and the Sun\*\*`~~: fixed.
- Only two posts are `featured: true`, so the wide featured card doesn't appear in the home page's latest 7.

## Theming (2026-10-21) — draft

Let readers switch between two palettes and between dark and light modes. The `alternate-colors` branch currently hard-swaps the palette to slate/mauve. This work turns that swap into a choice.

### Goals

- Two palettes: **Rust** (the original olive/sienna, default) and **Dusk** (slate/mauve/rose). Names confirmed.
- Two modes, independent of palette: **dark** and **light**, plus **auto** (follow the OS, the default).
- Color tokens named by **role**, not hue, so palettes are just value sets.
- A settings button in the nav on desktop. On mobile, the same controls sit inside the hamburger menu.
- No flash of the wrong theme on load, and no new dependencies.

### Semantic tokens

Components only reference these. Hue names move into the palette definitions.

| Token                 | Role                                                  | Rust (dark) | Dusk (dark) |
| --------------------- | ----------------------------------------------------- | ----------- | ----------- |
| `--color-bg`          | Page background                                       | `#1a1a1a`   | `#1a1a1a`   |
| `--color-surface`     | Card surface                                          | `#262523`   | `#242424`   |
| `--color-border`      | Borders, rules, separators, card shadow               | `#767151`   | `#4a4a4a`   |
| `--color-meta`        | Muted text, dates, nav links, tag borders, duotone    | `#9A9478`   | `#8fa3a8`   |
| `--color-glow`        | Background blobs, faint highlights, row rules         | `#767151`   | `#8fa3a8`   |
| `--color-text`        | Body text                                             | `#EFE3D9`   | `#c8bfb4`   |
| `--color-heading`     | Headings                                              | `#EFE3D9`   | `#e8e0d4`   |
| `--color-accent`      | Links, hovers, tags, sunburst                         | `#AB572C`   | `#c4a0a8`   |
| `--color-accent-hot`  | Rare hit: section bars, Fin ornament, hover shadow    | `#AB572C`   | `#e2b1b1`   |
| `--color-on-accent`   | Text/icons placed on accent or meta fills             | `#1a1a1a`   | `#1a1a1a`   |

Derived (not set per palette): `--color-text-muted` = `color-mix(in srgb, var(--color-text) 75%, transparent)`. Translucent tints keep using `color-mix()` against a role token.

`--color-ink` usages split by intent: page/menu background → `--color-bg`, text on a fill → `--color-on-accent`. The card-fade gradient in `PostCardImage` also uses `--color-bg`.

Left as-is: the `Fin` SVG mask (`#fff`/`#000`), the `#fff` caption text and the `rgb(0 0 0 / 0.6)` text shadows over photos.

### Where values live

- `src/styles/themes.css` (new): one block per palette × mode.
  - `:root, [data-palette="rust"]` holds Rust dark, the no-JS fallback.
  - `[data-palette="dusk"]` holds Dusk dark.
  - `[data-palette="rust"][data-mode="light"]` and `[data-palette="dusk"][data-mode="light"]` hold the light variants (phase 3).
- `src/styles/tokens.css` keeps type, spacing, layout, and the border/shadow tokens, which now reference role tokens.

### Applying the theme

- `<html>` carries `data-palette` and `data-mode`. The mode attribute is always resolved to `dark` or `light`; JS turns `auto` into one of them, so the CSS never needs a `prefers-color-scheme` branch.
- An inline `<script is:inline>` at the top of `<head>` in `Base.astro` reads localStorage, resolves `auto` with `matchMedia('(prefers-color-scheme: light)')`, and sets both attributes before first paint. That prevents the flash.
- Stored keys are `llf-palette` (`rust`|`dusk`) and `llf-mode` (`auto`|`dark`|`light`). Every read and write is wrapped in `try/catch`, and the defaults are `rust` + `auto`.
- In `auto`, a `matchMedia` change listener re-resolves the mode live.
- `<meta name="color-scheme">` and `<meta name="theme-color">` are updated to match the mode, which fixes scrollbars and form controls.

### Settings UI

- `ThemeControls.astro` holds two radio groups: Palette (swatch + name) and Mode (Dark / Light / Auto). It takes an `idPrefix` prop so it can render twice without duplicate IDs.
- **Desktop:** a gear button at the end of the nav links opens a panel using the native `popover` attribute, which gives light-dismiss and Esc handling for free. The panel uses the punk card treatment (border + offset shadow).
- **Mobile (< 48rem):** the gear is hidden, and `ThemeControls` renders as the last item inside the hamburger dropdown, below a border rule.
- One script handles all control instances. On change it sets the attributes, saves the choice, and syncs the checked state across both instances.
- Accessibility: real `<fieldset>`/`<legend>` + radios, a visible focus ring, an `aria-label` on the gear, and the panel is reachable by keyboard.
- Icons: a Font Awesome free gear/sliders icon, inlined as SVG to match the existing hamburger.

### Pattern library

- Swatches show each palette side by side, per mode, labeled by role. They're parsed from `themes.css` instead of `tokens.css`.
- Add a demo of `ThemeControls`.

### Phases

1. **Tokens:** rename every color usage to role tokens, add `themes.css` with Rust + Dusk dark, and keep Rust as the default. The site should look exactly like `main` with Rust, and exactly like the current branch with Dusk.
2. **Switcher:** the inline head script, `ThemeControls`, the desktop popover, and the mobile menu placement.
3. **Light mode:** design light values for both palettes, then check contrast (body text ≥ 4.5:1, meta ≥ 4.5:1, accent fills/large text ≥ 3:1). Review the duotone tint, halftone dots, noise overlay, and blobs, which may need lower opacity or a separate blend mode on light backgrounds.

### Open questions

- Should the pattern-lib swatches follow the live theme, or always show all four sets?
- In light mode, should the duotone profile photo keep its tint or go plain grayscale?
