import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { contentTypes: CONTENT_TYPES } = JSON.parse(
  readFileSync(join(__dirname, 'announce.config.json'), 'utf8')
);

const SITE_URL = process.env.SITE_URL || 'https://longlostforgotten.com';
const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;
const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE;
const MASTODON_ACCESS_TOKEN = process.env.MASTODON_ACCESS_TOKEN;
const TRIGGER_SHA = process.env.TRIGGER_SHA;

function getNewFiles(dir, ext) {
  const range = TRIGGER_SHA ? `${TRIGGER_SHA}^ ${TRIGGER_SHA}` : 'HEAD~1 HEAD';
  const output = execSync(
    `git diff --name-only --diff-filter=AM ${range} -- ${dir}`,
    { encoding: 'utf8' }
  );
  return output.trim().split('\n').filter(f => f.endsWith(ext));
}

// Real YAML parsing, so Tina's quoting ('Here''s', "a \"quote\"", colons) comes out as written.
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return parseYaml(match[1]) ?? {};
}

function updateFrontmatterField(filePath, key, value) {
  let content = readFileSync(filePath, 'utf8');
  const closingIdx = content.indexOf('\n---', 4);
  if (closingIdx === -1) return;
  const before = content.slice(0, closingIdx);
  const after = content.slice(closingIdx);
  const updated = before.includes(`${key}:`)
    ? before.replace(new RegExp(`^${key}:.*$`, 'm'), `${key}: ${value}`)
    : before + `\n${key}: ${value}`;
  writeFileSync(filePath, updated + after);
}

async function fetchImage(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  } catch {
    return null;
  }
}

async function postToBluesky(text, linkUrl, image) {
  const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD }),
  });
  if (!sessionRes.ok) throw new Error(`Bluesky auth failed: ${await sessionRes.text()}`);
  const { accessJwt, did } = await sessionRes.json();

  const encoder = new TextEncoder();
  const byteStart = encoder.encode(text.slice(0, text.lastIndexOf(linkUrl))).length;
  const byteEnd = byteStart + encoder.encode(linkUrl).length;

  const record = {
    $type: 'app.bsky.feed.post',
    text,
    facets: [{
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: linkUrl }],
    }],
    createdAt: new Date().toISOString(),
  };

  const BLUESKY_MAX_IMAGE_BYTES = 1_000_000;
  let thumb = null;
  if (image && image.buffer.byteLength <= BLUESKY_MAX_IMAGE_BYTES) {
    const blobRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
      method: 'POST',
      headers: { 'Content-Type': image.contentType, Authorization: `Bearer ${accessJwt}` },
      body: image.buffer,
    });
    if (blobRes.ok) {
      const { blob } = await blobRes.json();
      thumb = blob;
    } else {
      console.warn('Bluesky image upload failed, posting without image.');
    }
  } else if (image) {
    console.warn(`Image too large for Bluesky thumb (${(image.buffer.byteLength / 1_000_000).toFixed(1)}MB, max 1MB), posting without image.`);
  }

  record.embed = {
    $type: 'app.bsky.embed.external',
    external: {
      uri: linkUrl,
      title: text.split('\n')[0],
      description: text.split('\n\n')[1] || '',
      ...(thumb ? { thumb } : {}),
    },
  };

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessJwt}` },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record }),
  });
  if (!postRes.ok) throw new Error(`Bluesky post failed: ${await postRes.text()}`);
  const { uri } = await postRes.json();
  const recordKey = uri.split('/').pop();
  return `https://bsky.app/profile/${BLUESKY_HANDLE}/post/${recordKey}`;
}

async function postToMastodon(text, image, imageAlt = '') {
  let mediaIds = [];

  if (image) {
    const formData = new FormData();
    formData.append('file', new Blob([image.buffer], { type: image.contentType }), 'image.jpg');
    formData.append('description', imageAlt);

    const uploadRes = await fetch(`https://${MASTODON_INSTANCE}/api/v1/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${MASTODON_ACCESS_TOKEN}` },
      body: formData,
    });
    if (uploadRes.ok) {
      const { id } = await uploadRes.json();
      mediaIds = [id];
    } else {
      console.warn('Mastodon image upload failed, posting without image.');
    }
  }

  const body = { status: text, visibility: 'public' };
  if (mediaIds.length) body.media_ids = mediaIds;

  const res = await fetch(`https://${MASTODON_INSTANCE}/api/v1/statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MASTODON_ACCESS_TOKEN}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Mastodon post failed: ${await res.text()}`);
  const { url } = await res.json();
  return url;
}

async function main() {
  const allNewFiles = CONTENT_TYPES.flatMap(({ dir, urlPath, excerptField, imageField, ext = '.md' }) =>
    getNewFiles(dir, ext).map(filePath => ({ filePath, urlPath, excerptField, imageField, dir }))
  );

  if (allNewFiles.length === 0) { console.log('No new posts.'); return; }

  for (const { filePath, urlPath, excerptField, imageField, dir } of allNewFiles) {
    const fm = parseFrontmatter(readFileSync(filePath, 'utf8'));
    if (fm.draft === true) { console.log(`Skipping draft: ${filePath}`); continue; }
    if (fm.announced === true) { console.log(`Already announced: ${filePath}`); continue; }

    const slug = filePath.replace(dir, '').replace(/\.(md|mdx)$/, '').toLowerCase();
    const postUrl = `${SITE_URL}/${urlPath}/${slug}`;
    const text = `${fm.title}\n\n${fm[excerptField]}\n\n${postUrl}`;

    const rawImage = fm[imageField];
    const imageSrc = rawImage?.src ?? (typeof rawImage === 'string' ? rawImage : null);
    const imageAlt = rawImage?.alt || fm.title;
    const imageUrl = `${SITE_URL}${imageSrc ?? '/images/social_basecard.png'}`;
    const image = await fetchImage(imageUrl);
    if (!image) console.warn('Could not fetch post image, posting without it.');

    console.log(`Announcing: ${fm.title}`);
    let blueskyUrl = null;
    let mastodonUrl = null;

    if (BLUESKY_HANDLE && BLUESKY_APP_PASSWORD) {
      try {
        blueskyUrl = await postToBluesky(text, postUrl, image);
        console.log(`Bluesky: ${blueskyUrl}`);
      } catch (err) { console.error('Bluesky error:', err.message); }
    }

    if (MASTODON_INSTANCE && MASTODON_ACCESS_TOKEN) {
      try {
        mastodonUrl = await postToMastodon(text, image, imageAlt);
        console.log(`Mastodon: ${mastodonUrl}`);
      } catch (err) { console.error('Mastodon error:', err.message); }
    }

    if (blueskyUrl) updateFrontmatterField(filePath, 'blueskyUrl', blueskyUrl);
    if (mastodonUrl) updateFrontmatterField(filePath, 'mastodonUrl', mastodonUrl);
    updateFrontmatterField(filePath, 'announced', 'true');
  }

  execSync('git config user.name "github-actions[bot]"');
  execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
  const contentDirs = CONTENT_TYPES.map(c => c.dir).join(' ');
  execSync(`git add ${contentDirs}`);
  try {
    execSync('git diff --staged --quiet');
    console.log('Nothing to commit.');
  } catch {
    execSync('git commit -m "chore: add discussion URLs"');
    execSync('git push');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
