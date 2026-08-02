// Cloudflare Pages Function: per-article OpenGraph/Twitter meta injection +
// prerendered article fold.
//
// The site is a client-rendered SPA, so social scrapers (which don't run JS)
// only ever saw the generic shell meta — every shared article looked identical.
// This runs only for /posts/:slug, fetches the article, and rewrites the <head>
// meta so shares show the real headline, summary and hero image.
//
// It also injects the article's above-the-fold content (hero image, kicker,
// headline, standfirst) as static HTML inside #root, mirroring the landing
// prerender in index.html: the LCP image starts downloading at HTML parse and
// paints seconds before React mounts. React replaces #root's children on mount
// (a full replacement — no layout-shift scoring), reusing the cached hero.
// Any failure falls back to the unmodified shell, so article pages never break.

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const strip = (s) =>
  String(s || '')
    .replace(/[*#_`>]/g, '')
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function setMeta(html, attr, key, value) {
  const v = esc(value);
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${v}$2`);
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${v}" />\n</head>`);
}

// Local category fallback, mirroring BetaArticle's no-hero branch.
function fallbackHero(sectorName) {
  const s = String(sectorName || '').toLowerCase();
  if (s.includes('tech')) return '/images/fallback_tech.webp';
  if (s.includes('culture')) return '/images/fallback_culture.webp';
  return '/images/fallback_business.webp';
}

// Static article fold, styled to mirror BetaArticle's header (hero band with
// navy gradient, gold kicker, serif headline, italic standfirst). Inline
// styles + one tiny <style> block only — the app CSS hasn't loaded yet.
function buildFold({ heroUrl, mobileHeroUrl, kicker, title, summary }) {
  const summaryHtml = summary
    ? `<p style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:1.25rem;line-height:1.4;color:rgba(15,31,61,.7);border-left:2px solid #C9A84C;padding:.5rem 0 .5rem 1.25rem;margin:0 0 2rem;">${esc(summary)}</p>`
    : '';
  return `
<style>#boa-article-hero{height:300px}@media(min-width:768px){#boa-article-hero{height:400px}}</style>
<div id="boa-article-fold" style="background:#fff;min-height:100vh;">
  <div id="boa-article-hero" style="width:100%;position:relative;overflow:hidden;margin-top:1rem;">
    <picture style="display:block;width:100%;height:100%;">
      <source media="(max-width: 768px)" srcset="${esc(mobileHeroUrl)}">
      <img src="${esc(heroUrl)}" alt="${esc(title)}" fetchpriority="high" style="width:100%;height:100%;object-fit:cover;">
    </picture>
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(to top,#0F1F3D,rgba(15,31,61,.3) 40%,transparent);"></div>
  </div>
  <div style="max-width:48rem;margin:0 auto;padding:3rem 1.5rem 0;">
    ${kicker ? `<div style="color:#C9A84C;font-weight:700;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-family:Inter,system-ui,sans-serif;margin-bottom:1.5rem;">${esc(kicker)}</div>` : ''}
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.5rem,6vw,5.5rem);line-height:.95;letter-spacing:-.03em;color:#0F1F3D;margin:0 0 2rem;">${esc(title)}</h1>
    ${summaryHtml}
  </div>
</div>`;
}

export async function onRequest(context) {
  const { params, env, request } = context;
  const backend = String(env.BACKEND_ORIGIN || '').replace(/\/$/, '');

  // Always start from the real SPA shell.
  let html;
  try {
    const assetResp = await env.ASSETS.fetch(new URL('/index.html', request.url));
    html = await assetResp.text();
  } catch {
    return env.ASSETS.fetch(request);
  }

  // The SPA remains available even if a new Pages installation has not yet
  // attached its backend. Only server-rendered article metadata is skipped.
  if (!backend) return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  const apiBase = `${backend}/api/v1`;

  try {
    const origin = new URL(request.url).origin;
    const slug = params.slug;
    const r = await fetch(`${apiBase}/articles/${encodeURIComponent(slug)}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (r.ok) {
      const data = await r.json();
      const a = data.article || data.data || data;
      if (a && a.title) {
        const title = `${strip(a.title)} | BOA-Story`;
        const desc = strip(a.summary || a.subtitle || 'Real, grounded stories about African lives, cities, and ideas.').slice(0, 200);
        const url = `${origin}/posts/${slug}`;

        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`);
        html = setMeta(html, 'property', 'og:type', 'article');
        html = setMeta(html, 'property', 'og:title', title);
        html = setMeta(html, 'property', 'og:description', desc);
        html = setMeta(html, 'property', 'og:url', url);
        html = setMeta(html, 'name', 'twitter:title', title);
        html = setMeta(html, 'name', 'twitter:description', desc);
        html = setMeta(html, 'name', 'twitter:url', url);
        html = setMeta(html, 'name', 'description', desc);

        if (a.hero_image_url) {
          html = setMeta(html, 'property', 'og:image', a.hero_image_url);
          html = setMeta(html, 'name', 'twitter:image', a.hero_image_url);
        }

        // Prerendered fold: preload the hero from <head> (the scanner issues
        // the request at parse time, well before React), and inject the static
        // fold as #root's first child. The landing prerender (#boa-hero) is
        // removed on non-"/" paths by the shell's own inline script.
        // Mobile gets the pre-resized 768w variant (?w=768 falls back to the
        // original server-side when no variant exists yet) — breakpoint must
        // match BetaArticle's <picture>.
        const heroUrl = a.hero_image_url || fallbackHero(data.sector && data.sector.name);
        const mobileHeroUrl = heroUrl.includes('/assets/') ? `${heroUrl}?w=768` : heroUrl;
        const kicker = [data.sector && data.sector.name, data.country && data.country.name]
          .filter(Boolean).join(' • ');
        html = html.replace(
          '</head>',
          `  <link rel="preload" as="image" href="${esc(mobileHeroUrl)}" media="(max-width: 768px)" fetchpriority="high" />\n` +
          `  <link rel="preload" as="image" href="${esc(heroUrl)}" media="(min-width: 769px)" fetchpriority="high" />\n</head>`
        );
        html = html.replace(
          '<div id="root">',
          '<div id="root">' + buildFold({
            heroUrl,
            mobileHeroUrl,
            kicker,
            title: strip(a.title),
            summary: strip(a.summary || a.subtitle || '').slice(0, 300),
          })
        );
      }
    }
  } catch {
    // fall through with the unmodified shell
  }

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  });
}
