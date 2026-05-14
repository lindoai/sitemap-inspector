# Sitemap Inspector

Inspect `robots.txt` sitemap declarations and `sitemap.xml` contents.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lindoai/sitemap-inspector)

## Features

- fetches `robots.txt`
- reads declared sitemap URLs
- inspects sitemap index or URL set files
- returns sample URLs and counts

## Local development

```bash
npm install
npm run dev
npm run typecheck
```

## Deploy

```bash
npm run deploy
```

## Production env

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## API

### GET `/api/inspect?url=https://example.com`

Returns JSON with sitemap declarations and inspected sitemap data.
