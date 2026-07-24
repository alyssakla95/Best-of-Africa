import { useState } from 'react';

interface CountryFlagProps {
  /** ISO 3166-1 alpha-2 country code, e.g. "ZA", "NG". Case-insensitive. */
  code?: string | null;
  /** Rendered width in px (height follows the 4:3 flag ratio). */
  size?: number;
  className?: string;
  /** Optional title/alt for accessibility. */
  title?: string;
}

/**
 * Renders a real country flag image instead of the flag emoji, which Windows
 * (and some other platforms) draw as bare letter codes like "ZA". Falls back
 * to a globe glyph when the code is missing or the image fails to load.
 */
export const CountryFlag = ({ code, size = 28, className = '', title }: CountryFlagProps) => {
  const [errored, setErrored] = useState(false);
  const c = (code || '').trim().toLowerCase();
  // ISO 3166-1 alpha-2 (e.g. "ng"), plus flagcdn subdivision codes for the UK
  // home nations (e.g. "gb-eng", "gb-sct", "gb-wls", "gb-nir").
  const valid = /^[a-z]{2}(-[a-z]{2,3})?$/.test(c);

  if (!valid || errored) {
    return (
      <span
        className={`inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: size * 0.8 }}
        aria-label={title || 'Country'}
      >
        🌍
      </span>
    );
  }

  const h = Math.round((size * 3) / 4);
  return (
    <img
      src={`https://flagcdn.com/w80/${c}.png`}
      srcSet={`https://flagcdn.com/w160/${c}.png 2x`}
      width={size}
      height={h}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      alt={title || `${code} flag`}
      title={title}
      className={`inline-block shrink-0 object-cover rounded-[3px] ring-1 ring-black/5 shadow-sm ${className}`}
      style={{ width: size, height: h }}
    />
  );
};
