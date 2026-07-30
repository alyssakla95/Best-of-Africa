export type ImageProvenance = {
  id?: string | null;
  hero_image_url?: string | null;
  image_credit?: string | null;
  image_source_url?: string | null;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

const GENERATED_MARKERS = [
  '/assets/articles/',
  '/images/v2_',
  '/images/fallback_',
  'dall-e',
  'dalle',
  'midjourney',
  'stability.ai',
  'replicate.delivery',
  'black-forest-labs',
  'generated-image',
  'ai_image',
];

export function sourcedEditorialImage(item: ImageProvenance): string | null {
  const url = item.hero_image_url?.trim();
  if (!url || !item.image_credit?.trim() || !item.image_source_url?.trim()) return null;
  const lower = url.toLowerCase();
  if (GENERATED_MARKERS.some(marker => lower.includes(marker))) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return item.id
    ? `${API_BASE_URL}/articles/${encodeURIComponent(item.id)}/image`
    : url;
}

export function hideFailedEditorialImage(image: HTMLImageElement): void {
  image.hidden = true;
}
