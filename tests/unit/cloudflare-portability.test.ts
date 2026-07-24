import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');

describe('portable Cloudflare deployment contract', () => {
  it('keeps the portable Wrangler template account-neutral', () => {
    const template = readFileSync(resolve(root, 'wrangler.portable.toml.example'), 'utf8');

    expect(template).toContain('name = "__WORKER_NAME__"');
    expect(template).toContain('PUBLIC_API_URL = "__PUBLIC_API_URL__"');
    expect(template).toContain('PUBLIC_SITE_URL = "__PUBLIC_SITE_URL__"');
    expect(template).not.toMatch(/account_id\s*=|[0-9a-f]{8}-[0-9a-f-]{27,}|[0-9a-f]{32}|\.workers\.dev/);
  });

  it('routes every Pages Function through the installation-specific backend binding', () => {
    const functions = [
      'frontend/functions/sitemap.xml.js',
      'frontend/functions/rss.xml.js',
      'frontend/functions/podcast.xml.js',
      'frontend/functions/posts/[slug].js',
    ].map(path => readFileSync(resolve(root, path), 'utf8'));

    for (const source of functions) {
      expect(source).toContain('BACKEND_ORIGIN');
      expect(source).not.toContain('.workers.dev');
    }
  });

  it('keeps generated bindings and secrets outside version control', () => {
    const ignore = readFileSync(resolve(root, '.gitignore'), 'utf8');
    expect(ignore).toContain('.cloudflare/');
    expect(ignore).toContain('frontend/.env.production.local');
  });
});
