import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Scroll-LINKED reveal used for paywall / members-only blocks. Unlike a one-shot
 * `whileInView`, the animation is tied to scroll position: the element rises,
 * fades and scales in as the reader scrolls down toward it, and smoothly reverses
 * as they scroll back up. Honours prefers-reduced-motion (renders static).
 *
 * `intensity` scales the travel/scale so large cards can move a little more than
 * small inline overlays.
 */
export function ScrollReveal({
  children,
  className,
  intensity = 1,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // 0 when the element's top reaches the viewport bottom → 1 when its centre
  // reaches the viewport centre. Reversible on scroll-up.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  // Motion comes from translate/scale only. The old opacity ramp (0.25 → 1)
  // left the PAYWALL CARD — the revenue prompt — sitting at quarter opacity
  // whenever the reader paused with it in the lower viewport, and failed
  // WCAG contrast for every string on it during the reveal.
  const y = useTransform(scrollYProgress, [0, 1], [70 * intensity, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1 - 0.05 * intensity, 1]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} className={className} style={{ y, scale }}>
      {children}
    </motion.div>
  );
}
