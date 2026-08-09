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
  const frame = image.parentElement;
  if (!frame) return;
  frame.dataset.editorialImageFailed = 'true';
  if (!frame.querySelector('[data-editorial-image-fallback]')) {
    const fallback = document.createElement('div');
    fallback.dataset.editorialImageFallback = 'true';
    fallback.className = 'absolute inset-0 flex items-end bg-navy p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70';
    fallback.textContent = localStorage.getItem('boa_lang') === 'pt'
      ? 'Imagem da fonte indisponível'
      : 'Source image unavailable';
    frame.prepend(fallback);
  }
  frame.querySelectorAll<HTMLElement>('[data-photo-credit]').forEach(credit => {
    credit.hidden = true;
  });
}
