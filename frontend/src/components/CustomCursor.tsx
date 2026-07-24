import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  // Only enable on devices with a precise pointer + hover (desktop mouse/trackpad),
  // and never when the user prefers reduced motion. Touch/coarse devices keep the
  // native cursor and are unaffected.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(pointer.matches && !reduce.matches);
    update();
    pointer.addEventListener('change', update);
    reduce.addEventListener('change', update);
    return () => {
      pointer.removeEventListener('change', update);
      reduce.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [enabled]);

  // Hide the native cursor only on desktop, and preserve the text I-beam inside
  // form fields so typing still has the expected affordance.
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement('style');
    style.innerHTML = `
      *:not(input):not(textarea):not([contenteditable="true"]) { cursor: none !important; }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [enabled]);

  if (!enabled) return null;

  const variants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      height: 32,
      width: 32,
      backgroundColor: 'transparent',
      border: '2px solid rgba(15, 31, 61, 0.5)',
      mixBlendMode: 'normal' as const,
    },
    hover: {
      x: mousePosition.x - 32,
      y: mousePosition.y - 32,
      height: 64,
      width: 64,
      backgroundColor: 'rgba(15, 31, 61, 1)',
      border: '0px solid rgba(15, 31, 61, 0)',
      mixBlendMode: 'difference' as const,
    }
  };

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        variants={variants}
        animate={isHovering ? "hover" : "default"}
        transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-accent rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />
    </>
  );
};
