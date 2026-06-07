'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface XPFloaterProps {
  amount: number;
  onDone: () => void;
}

export default function XPFloater({ amount, onDone }: XPFloaterProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute right-80 bottom-1/2 z-50 pointer-events-none select-none"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -80, scale: 1.3 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <span className="text-2xl font-bold text-indigo-400 drop-shadow-lg">
        +{amount} XP
      </span>
    </motion.div>
  );
}
