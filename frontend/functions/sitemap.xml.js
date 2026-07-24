// Proxy the backend-generated sitemap so crawlers get real XML at the site
// origin instead of the SPA shell (the /* -> index.html rewrite otherwise
// serves HTML for every unknown path, sitemap.xml included).
export async function onRequestGet(context) {
  const backend = String(context.env.BACKEND_ORIGIN || '').replace(/\/$/, '');
  if (!backend) return new Response('BACKEND_ORIGIN is not configured', { status: 503 });
  const res = await fetch(`${backend}/sitemap.xml`, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
