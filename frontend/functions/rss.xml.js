// Proxy the backend-generated RSS feed (see sitemap.xml.js for why).
// BACKEND_ORIGIN is an installation-specific Pages environment variable.
export async function onRequestGet(context) {
  const backend = String(context.env.BACKEND_ORIGIN || '').replace(/\/$/, '');
  if (!backend) return new Response('BACKEND_ORIGIN is not configured', { status: 503 });
  const res = await fetch(`${backend}/rss.xml`, {
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=1800, s-maxage=3600',
    },
  });
}
