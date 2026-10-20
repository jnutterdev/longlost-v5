# Astro + TinaCMS → GitHub Actions → Cloudflare Pages

Step-by-step guide for setting up a new site from scratch.

---

## 1. Project setup

Ensure `package.json` has these scripts:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "tina:dev": "node tina.mjs dev -c \"astro dev\"",
  "tina:build": "node tina.mjs build && astro build"
}
```

`astro.config.mjs` should use `output: 'static'` for a static site:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
```

---

## 2. wrangler.jsonc

Keep this minimal for a static Pages deployment — no `main`, no `assets`, no `compatibility_flags`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-project-name",
  "compatibility_date": "2026-06-03",
  "pages_build_output_dir": "dist"
}
```

> **Gotcha:** If you add `"main"` or `"assets"` here, Cloudflare's built-in CI will try to deploy it as a Worker and fail looking for `dist/_worker.js/index.js`.

---

## 3. GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - run: npm ci

      - name: Build
        run: npm run tina:build
        env:
          TINA_CLIENT_ID: ${{ secrets.TINA_CLIENT_ID }}
          TINA_TOKEN: ${{ secrets.TINA_TOKEN }}
          GITHUB_BRANCH: main

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=your-project-name
```

---

## 4. TinaCMS secrets (GitHub)

In your TinaCMS dashboard, get:
- **Client ID** → `TINA_CLIENT_ID`
- **Token** → `TINA_TOKEN`

Add both at: **GitHub repo → Settings → Secrets and variables → Actions**

---

## 5. Cloudflare API token

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token**
2. Use the **"Edit Cloudflare Workers"** template (or Custom Token with `Cloudflare Pages: Edit` permission)
3. Scope to your account
4. Copy the token → add as `CLOUDFLARE_API_TOKEN` in GitHub Secrets

**Account ID:** Cloudflare dashboard → any domain → right sidebar → copy Account ID → add as `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets

---

## 6. Create the Cloudflare Pages project

Run this **once locally** before the first deploy:

```bash
npx wrangler pages project create your-project-name
```

When prompted, enter `main` as the production branch.

> **Gotcha:** GitHub Actions will fail with `Project not found [code: 8000007]` if this step is skipped.

---

## 7. Disable Cloudflare's built-in Git integration

If you connected GitHub in the Cloudflare Pages dashboard (Workers & Pages → your project → Settings → Build), **disconnect it**. Otherwise Cloudflare and GitHub Actions will both try to deploy on every push and Cloudflare's version will fail.

**Workers & Pages → your project → Settings → Build → Disconnect**

---

## 8. Add a custom domain

After a successful first deploy:

1. Cloudflare dashboard → **Workers & Pages → your project → Custom Domains**
2. Add your domain (e.g. `longlostforgotten.com`)
3. If the domain is already on Cloudflare DNS, it auto-configures the CNAME — no manual DNS edits needed

---

## Deploy flow (ongoing)

```
git push origin main
  → GitHub Actions triggers
  → npm ci + tina:build
  → wrangler pages deploy dist
  → live on Cloudflare Pages
```

To manually re-trigger without a new commit: **GitHub → Actions → failed run → Re-run all jobs**
