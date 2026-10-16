# longlostforgotten v5 — Tech Spec

## Goal

Rebuild longlostforgotten.com from the `longlostforgotten_redesign.html` mockup as a fully static Astro site, carrying over all v4 posts and adding a TinaCMS-managed photo gallery.

## Stack

| Concern    | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Astro 6, `output: 'static'`                                   |
| CMS        | TinaCMS (git-backed), `astro-tina` integration as in v4       |
| Styling    | Scoped `<style>` blocks + CSS custom properties, `normalize.css` |
| Fonts      | Bunny Fonts — Syne (400/600/700/800), Outfit (300/400/500/600) |
| Icons      | Font Awesome Free Bluesky SVG, inlined                        |
| JS         | Vanilla `<script>` only (mobile nav, parallax). No React islands needed |
| Hosting    | Cloudflare Pages                                              |
| Packages   | pnpm                                                          |

No Tailwind. The mockup's Tailwind classes get rewritten as scoped component styles.

### New dependencies (vs. a bare Astro install)

- `normalize.css`
- `@astrojs/rss`
- `@astrojs/markdown-remark` (Astro 7 needs it for the v4 `rehype-alternate-images` plugin)
- `tinacms`, `@tinacms/cli`, `astro-tina` (same as v4)
- `@astrojs/react` + `react`/`react-dom` only if Tina's `astro-tina` integration still requires them

Dropped from v4: `@fontsource/*`, `satori`, `@resvg/resvg-js`.

## Design Tokens

`src/styles/tokens.css`, imported once in the base layout:

```css
:root {
  --color-darkness: #14170E;
  --color-magicmetal: #3E3922;
  --color-goben: #776D4D;
  --color-antlervelvet: #BEAD98;
  --color-martiancolony: #E8780D;

  --font-display: 'Syne', sans-serif;
  --font-body: 'Outfit', sans-serif;

  --shadow-offset: 6px 6px 0 var(--color-goben);
  --shadow-offset-hover: 9px 9px 0 var(--color-martiancolony);
  --border-card: 2px solid var(--color-magicmetal);

  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-xl: 5rem;

  --content-max: 72rem; /* matches max-w-6xl */
}
```

Global (non-scoped) styles in `src/styles/global.css`: body background/color, `::selection`, noise overlay, halftone utility.

Minimum font size is 11px. The mockup's 10px "Welcome" badge moves up to 11px.

## Content Model

### `posts` (migrated from v4, schema unchanged)

Copy `longlost-v4/src/content/posts/*.md` (156 files) as-is. Keep the v4 frontmatter: `title`, `date`, `excerpt`, `tag[]`, `readTime`, `image`, `featured`, `draft`, `blueskyUrl`, `mastodonUrl`, `currentMusic`, `currentMood`, body.

**Card variant comes from existing fields, so no new field is needed:**

| Condition                     | Card                                  |
| ----------------------------- | ------------------------------------- |
| `featured: true`              | `PostCardFeatured`: wide text card, spans 2 cols, arrow badge |
| has `image`, not featured     | `PostCardImage`: image card with gradient + duotone overlay |
| otherwise                     | `PostCard`: standard text card        |

Images referenced in posts (`/images/*`) are copied from `longlost-v4/public/images`.

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

### `home` / `about` (singletons, carried from v4)

`home.json` feeds the hero (`tagline`, `headline`, `desc`) plus a new `heroImage` field. `about.json` stays the same.

## Pages

| Route              | Source                     | Notes |
| ------------------ | -------------------------- | ----- |
| `/`                | `index.astro`              | Hero + latest ~7 posts in the mixed card grid + "Explore Archive" CTA |
| `/archive`         | `archive.astro`            | All non-draft posts, grouped by year |
| `/archive/tag/[tag]` | `archive/tag/[tag].astro` | Tag filter pages, so the term-tags become real links |
| `/posts/[slug]`    | `posts/[slug].astro`       | Single post. Same URL scheme as v4 so links don't break |
| `/gallery`         | `gallery.astro`            | Photo grid (`punk-card-img` style) |
| `/gallery/[slug]`  | `gallery/[slug].astro`     | Single photo + caption |
| `/about`           | `about.astro`              | From `about.json` |
| `/rss.xml`         | `rss.xml.ts`               | Published posts |

## Components

Layouts:
- `layouts/Base.astro`: head, Bunny Fonts link, normalize + tokens + global CSS, background blobs, noise overlay, `<Nav />`, `<slot />`, `<Footer />`

Components (PascalCase, scoped styles, typed `interface Props`):
- `Nav.astro`: logo + links, working mobile menu (`<button aria-expanded>` + vanilla script)
- `Footer.astro`: copyright + Bluesky link (`https://bsky.app/profile/longlostforgotten.com`)
- `BlueskyComments.astro`: carried from v4, shown on posts with `blueskyUrl`
- `BackgroundBlobs.astro`: three blurred blobs + parallax script, disabled under `prefers-reduced-motion`
- `Hero.astro`: image panel + intro card
- `SectionHeading.astro`: "The Archive" title + rule
- `PostCard.astro`, `PostCardFeatured.astro`, `PostCardImage.astro`: all cards wrap a real `<a href>`
- `TagList.astro` / `Tag.astro`: term-tag links to `/archive/tag/[tag]`
- `PhotoCard.astro`
- `DuotoneImage.astro`: wraps Astro `<Image>` with the grayscale + goben `mix-blend-color` + halftone overlay treatment, reused by the hero, image cards, and gallery

Helpers (kebab-case, `src/lib/`):
- `posts.ts`: `getPublishedPosts()`, sort by date, `getCardVariant(post)`
- `format-date.ts`: "Aug 2026" style formatting
- `rehype-alternate-images.mjs`: carried from v4 if still needed

## Assets

- **Placeholders (dev only):** download the Pexels/Unsplash hero + card images into `src/assets/placeholders/` and serve them through `astro:assets` `<Image>`. John replaces them before the production build.
- **Branch silhouette:** the clipground PNG's license is unclear. Use it as a local placeholder for now, then replace it with an owned/licensed asset or an SVG before launch.
- **Noise texture:** stays an inline SVG data URI in CSS.

## Accessibility & Motion

- Cards and tags are real links. Remove the bare `cursor: pointer`
- Visible `:focus-visible` styles that match the hover treatments
- `prefers-reduced-motion`: turns off parallax, card translate, and image scale
- Mobile nav: `aria-expanded`, `aria-controls`, Escape to close

## Cloudflare

- Carry over `public/_headers` and `public/_redirects` from v4
- New Pages project `longlost-v5`. `wrangler.jsonc` with `pages_build_output_dir: "dist"`

## Scripts

```json
"dev": "astro dev",
"build": "astro build",
"preview": "astro preview",
"tina:dev": "tinacms dev -c \"astro dev\"",
"tina:build": "tinacms build && astro build"
```

v4 needed the `tina.mjs` wrapper because the Tina CLI bin failed to load under `"type": "module"`. Try the standard scripts first and only bring the wrapper back if that still breaks.

## Out of Scope

- The Archivist AI chat widget (dropped)
- SSR / Workers / D1

## Build Order

1. Scaffold Astro + pnpm, tokens, global CSS, Base layout, fonts
2. Nav, Footer, BackgroundBlobs
3. Migrate posts + content config. Build the card components and home grid to match the mockup
4. Post page, archive, tag pages
5. Photos collection + gallery pages
6. Tina config (posts, photos, home, about) and verify with `tina:dev`
7. Download placeholder assets, a11y/motion pass, `_headers`/`_redirects`, deploy

## Decisions (2026-10-15)

1. **v4 extras:** carry over `BlueskyComments.astro` only. No OG image generation and no announce script, so `satori`/`resvg` are dropped.
2. **Footer socials:** Bluesky only.
3. **Icons:** inline the Font Awesome Free brand SVG (Bluesky) instead of installing the package.
4. **Inner pages:** post, archive and gallery are designed to match the home mockup's style.
5. **Deploy:** a new Cloudflare Pages project (`longlost-v5`).
6. **RSS:** yes, `/rss.xml` via `@astrojs/rss`.

## Build Notes (2026-10-15)

Where the build differs from the plan above:

- **Images use public paths, not `astro:assets`.** Tina's media manager writes to `public/images`, so every image is a public path string rendered with a plain lazy `<img>`. `DuotoneImage.astro` wraps it with the grayscale, tint and halftone treatment.
- **Placeholders** live in `public/images/placeholders/` (the hero, plus two sample photo entries in `src/content/photos/placeholder-*.md`).
- **Branch silhouette:** the clipground URL returns HTML (it blocks hotlinking), so it's replaced with a hand-drawn `public/images/branches.svg`. That also clears up the license question.
- **Cards:** `PostCard.astro` takes a `featured` prop instead of a separate `PostCardFeatured`. `PostGrid.astro` picks the variant and handles the 2-column span (`grid-auto-flow: dense`).
- **Extra components:** `ArchiveList.astro` (posts grouped by year, sticky year label), `TagCloud.astro` (archive tag filter), and a `404.astro` page.
- **Tina CLI** works with the standard scripts, so the v4 `tina.mjs` wrapper isn't needed.

### Content issues found during migration (from v4, not fixed)

- `Dread-and-Discomfort.md`: `image: /dread-and-discomfort.jpg` doesn't exist, so the card shows a broken image.
- `stuff-to-get-excited-about.md`: `**Klara and the Sun**this` has no space after the closing `**`, so it renders as literal asterisks.
- Only two old posts are `featured: true`, so the wide card doesn't appear in the home page's latest 7.
