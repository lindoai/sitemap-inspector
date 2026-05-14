import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { XMLParser } from 'fast-xml-parser';
import { readTurnstileTokenFromUrl, verifyTurnstileToken } from '../../_shared/turnstile';
import { renderTextToolPage, turnstileSiteKeyFromEnv } from '../../_shared/tool-page';

type Env = { Bindings: { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string } };

const app = new Hono<Env>();
const parser = new XMLParser({ ignoreAttributes: false });
app.use('/api/*', cors());
app.get('/', (c) => c.html(renderTextToolPage({ title: 'Sitemap Inspector', description: 'Inspect sitemap.xml plus robots.txt sitemap declarations.', endpoint: '/api/inspect', sample: '{ "declaredSitemaps": [] }', siteKey: turnstileSiteKeyFromEnv(c.env), buttonLabel: 'Inspect', toolSlug: 'sitemap-inspector' })));
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/inspect', async (c) => {
  const captcha = await verifyTurnstileToken(c.env, readTurnstileTokenFromUrl(c.req.url), c.req.header('CF-Connecting-IP'));
  if (!captcha.ok) return c.json({ error: captcha.error }, 403);
  const normalized = normalizeUrl(c.req.query('url') ?? '');
  if (!normalized) return c.json({ error: 'A valid http(s) URL is required.' }, 400);
  const base = new URL(normalized);
  const robotsUrl = new URL('/robots.txt', base).toString();
  const sitemapUrl = new URL('/sitemap.xml', base).toString();
  const robots = await fetchText(robotsUrl);
  const declared = robots?.split('\n').map((line) => line.trim()).filter((line) => /^sitemap:/i.test(line)).map((line) => line.split(':').slice(1).join(':').trim()) ?? [];
  const targets = Array.from(new Set([sitemapUrl, ...declared]));
  const inspected = [] as Array<{ url: string; type: string; urlCount: number; childSitemaps: number; sampleUrls: string[] }>;
  for (const target of targets) {
    const xml = await fetchText(target);
    if (!xml) continue;
    const parsed: any = parser.parse(xml);
    const urls = arrayify(parsed?.urlset?.url).map((item: any) => item?.loc).filter(Boolean);
    const sitemaps = arrayify(parsed?.sitemapindex?.sitemap).map((item: any) => item?.loc).filter(Boolean);
    inspected.push({ url: target, type: urls.length ? 'urlset' : 'sitemapindex', urlCount: urls.length, childSitemaps: sitemaps.length, sampleUrls: urls.slice(0, 10) });
  }
  return c.json({ url: normalized, robotsUrl, declaredSitemaps: declared, inspected });
});

async function fetchText(url: string) { const r = await fetch(url, { headers: { 'user-agent': 'Lindo Free Tools/1.0 (+https://lindo.ai/tools)' } }).catch(() => null); return r?.ok ? r.text() : null; }
function arrayify<T>(value: T | T[] | undefined): T[] { return value ? (Array.isArray(value) ? value : [value]) : []; }
function normalizeUrl(value: string): string | null { try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString(); } catch { return null; } }
export default app;
