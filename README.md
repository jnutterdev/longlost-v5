# longlostforgotten.com (v5)

A place for ramblings, musings, fragmented thoughts, and other odds and ends. Writing since 2002.

Static [Astro](https://astro.build) site with [TinaCMS](https://tina.io) for editing, hosted on Cloudflare Workers. See [`TECH_SPEC.md`](TECH_SPEC.md) for architecture, design tokens, and decisions.

## Getting started

Requires Node 24 (LTS) and pnpm.

```sh
pnpm install
pnpm tina:dev    # site + Tina editor at http://localhost:4321/admin
```

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Site only, no CMS                          |
| `pnpm tina:dev`   | Site + Tina editor                         |
| `pnpm build`      | Static build to `dist/`                    |
| `pnpm tina:build` | Tina admin build + static build (used for deploys) |
| `pnpm preview`    | Serve the built `dist/` locally            |

Production builds of the Tina admin need `TINA_CLIENT_ID` and `TINA_TOKEN` in the environment.

## Project layout

```
src/
  content/
    posts/        blog posts (Markdown, migrated from v4)
    photos/       gallery entries (Markdown)
    home.json     hero copy and image
    about.json    about page
  components/     Astro components (scoped styles)
  layouts/        Base.astro: head, nav, footer
  pages/          routes
  lib/            post helpers, date formatting, rehype plugin
  styles/         tokens.css, global.css, prose.css
public/
  images/         post, photo, and share images (Tina media root)
  _headers, _redirects
design/social/    SVG sources for the share images (not deployed)
tina/             Tina schema (config.ts)
```

## Writing and editing

Use `/admin` (via `pnpm tina:dev` locally) to edit posts, photos, the home hero, and the about page. Everything is saved as files in `src/content/` and committed to git.

Post frontmatter worth knowing:

- `featured: true`: wide card on the home grid
- `image`: shows the post as an image card, and becomes its share image
- `draft: true`: hidden everywhere
- `blueskyUrl`: shows Bluesky replies as comments
- `currentMood` / `currentMusic`: shown at the end of the post

## Design system

Visit **`/pattern-lib`** for every color, type style, ornament, component, and image shape on the site. It's built from the real components, so it stays current. It's unlinked and `noindex`.

Colors live in `src/styles/tokens.css`; the pattern library reads swatches straight from that file. When adding a new component, ornament, or type role, add it to `src/pages/pattern-lib.astro` too.

## Share images

`public/images/social_basecard.png` (the default link preview) and `social_wordmark.png` are exported from the SVGs in `design/social/`. To update them:

1. Make sure Syne and Outfit are installed locally.
2. Edit the SVG (any editor, or Affinity).
3. Export at 1200×630 to `public/images/`, either from Affinity or with QuickLook from the terminal:

   ```sh
   mkdir -p /tmp/social && cd /tmp/social
   for f in social_basecard social_wordmark; do
     sed 's/width="1200" height="630" viewBox/width="768" height="403" viewBox/' \
       ~/github.com/jnutterdev/longlost-v5/design/social/$f.svg > $f.svg
   done
   qlmanage -t -s 1200 -o . *.svg
   for f in social_basecard social_wordmark; do
     sips --cropToHeightWidth 630 1200 --cropOffset 1 0 $f.svg.png \
       --out ~/github.com/jnutterdev/longlost-v5/public/images/$f.png
   done
   ```

   QuickLook renders a padded square, so the SVG is shrunk to fit and then cropped. The offset is `1 0` because `sips` ignores `0 0`. Safari can't preview these with the local fonts (it blocks user-installed fonts); Vivaldi can.

## Deploying

Every push to `main` deploys automatically. GitHub Actions (`.github/workflows/deploy.yml`) builds the site with Tina, then uploads `dist/` to the `longlost-v5` Cloudflare Worker with `wrangler deploy`. Cloudflare doesn't build anything itself. It's the same setup as jnutterdev-v2.

Required GitHub secrets:

| Secret                  | Where to get it                                         |
| ----------------------- | ------------------------------------------------------- |
| `TINA_CLIENT_ID`        | Tina Cloud project settings                             |
| `TINA_TOKEN`            | Tina Cloud project settings (read/write token)          |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens, "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar                            |

To check the config locally without deploying: `pnpm build && pnpm dlx wrangler deploy --dry-run`.

**Not live yet.** The first-deploy checklist, including moving the domain over from v4, is in [`TECH_SPEC.md`](TECH_SPEC.md#cloudflare).
