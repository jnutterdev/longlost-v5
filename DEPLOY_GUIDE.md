# Astro + TinaCMS → GitHub Actions → Cloudflare Workers

Step-by-step guide for setting up a new site from scratch. The site is deployed as static assets on Workers (no Worker script).

---

## 1. Project setup

Ensure `package.json` has these scripts:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "tina:dev": "tinacms dev -c \"astro dev\"",
  "tina:build": "tinacms build && astro build"
}
```

`astro.config.mjs` should use `output: 'static'` for a static site:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://your-domain.com',
  output: 'static',
});
```

---

## 2. wrangler.jsonc

Static assets only. No `main`, so no Worker script is deployed:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-project-name",
  "compatibility_date": "2026-10-15",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

> **Gotcha:** Don't add `"main"` unless you actually need a Worker script. Without it, Wrangler deploys just the contents of `dist`.

---

## 3. GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run tina:build
        env:
          TINA_CLIENT_ID: ${{ secrets.TINA_CLIENT_ID }}
          TINA_TOKEN: ${{ secrets.TINA_TOKEN }}
          NODE_OPTIONS: --max-old-space-size=4096

      - name: Deploy to Cloudflare Workers
        run: pnpm dlx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`tina/config.ts` reads the branch from `GITHUB_BRANCH` and falls back to `main`, so you don't need to set it in the workflow.

---

## 4. TinaCMS secrets (GitHub)

In your TinaCMS dashboard, get:
- **Client ID** → `TINA_CLIENT_ID`
- **Token** → `TINA_TOKEN`

Add both at: **GitHub repo → Settings → Secrets and variables → Actions**

For local builds, add the same two values to a gitignored `.env` in the project root. GitHub secrets aren't available on your machine.

---

## 5. Cloudflare API token

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token**
2. Use the **"Edit Cloudflare Workers"** template
3. Scope to your account
4. Copy the token → add as `CLOUDFLARE_API_TOKEN` in GitHub Secrets

**Account ID:** Cloudflare dashboard → any domain → right sidebar → copy Account ID → add as `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets

---

## 6. First deploy

You don't need to create the project beforehand. On its first run, `wrangler deploy` creates the Worker, using the `name` from `wrangler.jsonc`. Push to `main` and the workflow handles it.

---

## 7. Disable Cloudflare's built-in Git integration

If you connected the GitHub repo in the Cloudflare dashboard (Workers Builds), **disconnect it**. Otherwise Cloudflare and GitHub Actions will both build on every push, and Cloudflare's build won't have the Tina secrets.

**Workers & Pages → your project → Settings → Build → Disconnect**

---

## 8. Add a custom domain

After a successful first deploy:

1. Cloudflare dashboard → **Workers & Pages → your project → Settings → Domains & Routes**
2. Add a Custom Domain (e.g. `longlostforgotten.com`)
3. If the domain is already on Cloudflare DNS, the record is set up automatically, so there's nothing to edit in DNS

---

## 9. Add the domain to TinaCloud Site URLs

TinaCloud only accepts requests from allowed origins. Without this, `/admin` on the live site errors out even though the build succeeds.

1. [app.tina.io](https://app.tina.io) → your project → **Configuration → Site URLs**
2. Add the production domain (e.g. `https://longlostforgotten.com`) and any `*.workers.dev` URL you use

---

## 10. Announce workflow (optional)

`.github/workflows/announce.yml` runs after each successful Deploy on `main`. It posts new posts to Bluesky and Mastodon, then commits the results back.

**How it works** (`scripts/announce.mjs`):

1. Finds posts added or modified in the commit that triggered the deploy. The directories to check are set in `scripts/announce.config.json`.
2. Skips any post with `draft: true` or `announced: true`.
3. Posts the title, excerpt, and link to each platform, along with the post's `image`. If the post has no image, it uses `/images/social_basecard.png`.
4. Writes `blueskyUrl`, `mastodonUrl`, and `announced: true` into the post's frontmatter, then commits and pushes as `github-actions[bot]`. That push doesn't trigger another Deploy, and the workflow also skips runs started by the bot.

**Secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `BLUESKY_HANDLE` | e.g. `yourname.bsky.social` |
| `BLUESKY_APP_PASSWORD` | Bluesky → Settings → Privacy and security → App passwords |
| `MASTODON_INSTANCE` | Instance URL, e.g. `https://mastodon.social` |
| `MASTODON_ACCESS_TOKEN` | Mastodon → Preferences → Development → New application (needs `write:statuses` and `write:media`) |

If a platform's secrets are missing, the script skips that platform rather than failing.

**Permissions:** the workflow needs `contents: write` to push the frontmatter commit. This is already set in `announce.yml`.

> **Gotcha:** Keep `announced`, `blueskyUrl`, and `mastodonUrl` in the Tina schema for any content type the script announces. If Tina doesn't know about a field, it can drop it the next time the post is saved. Without `announced`, any edit to an old post would count as a modified post and it would get posted again.

---

## Deploy flow (ongoing)

```
git push origin main
  → GitHub Actions triggers
  → pnpm install + tina:build
  → wrangler deploy
  → live on Cloudflare Workers
  → Announce workflow posts new posts to Bluesky / Mastodon
```

To manually re-trigger without a new commit: **GitHub → Actions → failed run → Re-run all jobs**
