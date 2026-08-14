import { describe, expect, it } from 'vitest';
import { extractOriginalArticleUrl, extractPublisherImage, normalizeEditorialImageUrl } from '../../src/lib/editorial-images';
import { generateArticleImage } from '../../src/lib/ai';
import { publisherCredit } from '../../src/workers/source-images';
import type { Env } from '../../src/types';

describe('editorial image provenance', () => {
  it('accepts a publisher image and resolves relative URLs', () => {
    expect(normalizeEditorialImageUrl('/media/story.jpg', 'https://news.example.com/a/1'))
      .toBe('https://news.example.com/media/story.jpg');
  });

  it('rejects generated, local archive and executable image sources', () => {
    expect(normalizeEditorialImageUrl('https://boa.example/assets/articles/123/hero.png')).toBeNull();
    expect(normalizeEditorialImageUrl('https://replicate.delivery/generated-image.png')).toBeNull();
    expect(normalizeEditorialImageUrl('data:image/png;base64,abc')).toBeNull();
    expect(normalizeEditorialImageUrl('https://publisher.example/assets/site-logo.png')).toBeNull();
  });

  it('extracts a source image and explicit photo credit from publisher metadata', () => {
    const html = `
      <meta property="og:image" content="https://cdn.example.com/reporting/port.jpg">
      <meta name="image:credit" content="Amina Diallo / Example News">
    `;
    expect(extractPublisherImage(html, 'https://example.com/story')).toEqual({
      imageUrl: 'https://cdn.example.com/reporting/port.jpg',
      imageCredit: 'Amina Diallo / Example News',
    });
  });

  it('rejects generic publisher logos and placeholders as story photography', () => {
    const html = '<meta property="og:image" content="https://news.example.com/assets/default-image.jpg">';
    expect(extractPublisherImage(html, 'https://news.example.com/story').imageUrl).toBeNull();
  });

  it('rejects publisher-hosted artwork explicitly labelled as generated', () => {
    const html = `
      <meta property="og:image" content="https://publisher.example/media/feature.png">
      <p>Credit: AI-generated illustration.</p>
    `;
    expect(extractPublisherImage(html, 'https://publisher.example/story')).toEqual({
      imageUrl: null,
      imageCredit: null,
    });
  });

  it('retains an explicit photographer credit and otherwise acknowledges the publisher host', () => {
    expect(publisherCredit('https://www.reuters.com/world/africa/story', '  Amina Diallo / Reuters  '))
      .toBe('Amina Diallo / Reuters');
    expect(publisherCredit('https://www.reuters.com/world/africa/story'))
      .toBe('Publisher image via reuters.com');
  });

  it('follows only an explicitly labelled original publisher article', () => {
    const html = '<a class="source-url" href="https://publisher.example/report">original article</a>';
    expect(extractOriginalArticleUrl(html, 'https://aggregator.example/story'))
      .toBe('https://publisher.example/report');
    expect(extractOriginalArticleUrl('<a href="https://random.example/">related</a>', 'https://aggregator.example/story'))
      .toBeNull();
    expect(extractOriginalArticleUrl('<a class="source-url" href="/same-story">source</a>', 'https://aggregator.example/story'))
      .toBeNull();
  });

  it('does not create credits for unsafe or non-public source locations', () => {
    expect(publisherCredit('http://127.0.0.1/private')).toBeNull();
    expect(publisherCredit('javascript:alert(1)')).toBeNull();
  });

  it('keeps the legacy image generator hard-disabled without calling an AI binding', async () => {
    await expect(generateArticleImage({} as Env, 'any prompt')).resolves.toBeNull();
  });
});
