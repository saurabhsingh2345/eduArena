import { getLevelFromXP } from '@/lib/xp';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  xp: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LevelBadge({ xp, className, size = 'md' }: LevelBadgeProps) {
  const levelInfo = getLevelFromXP(xp);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-semibold border',
      'bg-gradient-to-r from-indigo-600/20 to-violet-600/20',
      'border-indigo-500/30 text-indigo-300',
      sizeClasses[size],
      className
    )}>
      <span className="opacity-70">Lv.{levelInfo.level}</span>
      <span>{levelInfo.title}</span>
    </span>
  );
}
