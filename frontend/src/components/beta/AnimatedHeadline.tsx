
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const AnimatedHeadline = ({ text, className = "" }: { text: string; className?: string }) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "-50px 0px" });
  
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 12, stiffness: 100 } },
  };

  return (
    <motion.h1
      ref={ref}
      // Colour is supplied by the caller via className (e.g. text-white on the navy hero band).
      className={className}
      variants={container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {words.map((word, index) => (
        <motion.span variants={child} key={index} className="inline-block mr-[0.25em]">
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};
