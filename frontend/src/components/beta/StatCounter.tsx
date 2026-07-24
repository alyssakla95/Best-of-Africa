import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const StatCounter = ({ 
  value, 
  label, 
  prefix = "", 
  suffix = "" 
}: { 
  value: number; 
  label: string; 
  prefix?: string; 
  suffix?: string; 
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "-50px 0px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const hasDecimal = value % 1 !== 0;
    return hasDecimal ? latest.toFixed(1) : Math.round(latest).toString();
  });

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" });
    }
  }, [inView, count, value]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center text-center">
      <div className="text-accent font-serif" style={{ fontSize: "clamp(1.75rem, 4vw, 4rem)", lineHeight: 1 }}>
        {prefix}<motion.span>{rounded}</motion.span>{suffix}
      </div>
      <div className="text-[0.875rem] font-sans font-medium mt-2 opacity-60">
        {label}
      </div>
    </div>
  );
};
