'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['🔥', '💡', '🎯', '😮', '👏'];

interface Props {
  onReact: (emoji: string) => void;
}

interface FlyingEmoji {
  id: number;
  emoji: string;
  x: number;
}

export default function ReactionBar({ onReact }: Props) {
  const [flying, setFlying] = useState<FlyingEmoji[]>([]);

  const sendReaction = (emoji: string) => {
    onReact(emoji);
    const id = Date.now();
    const x = Math.random() * 40 - 20;
    setFlying((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => setFlying((prev) => prev.filter((f) => f.id !== id)), 2000);
  };

  return (
    <div className="relative p-3 border-t border-white/10">
      <div className="flex justify-center gap-2">
        {EMOJIS.map((emoji) => (
          <motion.button
            key={emoji}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => sendReaction(emoji)}
            className="text-lg hover:opacity-100 opacity-60 transition-opacity"
          >
            {emoji}
          </motion.button>
        ))}
      </div>

      {/* Flying emojis */}
      <AnimatePresence>
        {flying.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, x: f.x, scale: 1 }}
            animate={{ opacity: 0, y: -60, x: f.x + Math.random() * 20 - 10, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute bottom-10 left-1/2 text-2xl pointer-events-none select-none"
            style={{ transform: `translateX(${f.x}px)` }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
