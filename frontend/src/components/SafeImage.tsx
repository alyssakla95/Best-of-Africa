import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional caption shown on the branded fallback (e.g. the article/photo title). */
  caption?: string;
  /** Optional location/sub-label shown under the caption on the fallback. */
  location?: string;
}

/**
 * Drop-in <img> replacement that renders a branded "B BOA." navy placeholder
 * instead of a broken-image box when the source fails to load (spec §2.4/§3.6).
 * Pass the same className you'd give the <img>, it's applied to both the image
 * and the fallback so layout/positioning is preserved.
 */
export const SafeImage: React.FC<SafeImageProps> = ({ caption, location, className, alt, ...props }) => {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className={cn('flex flex-col items-center justify-center bg-navy-card text-center px-4', className)}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-serif font-black text-accent text-xl">
          B
        </span>
        {caption && <span className="mt-3 font-serif text-sm text-white/90 line-clamp-2">{caption}</span>}
        {location && <span className="mt-1 text-xs italic text-accent">{location}</span>}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
};
