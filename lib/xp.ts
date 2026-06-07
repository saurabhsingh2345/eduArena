export const XP_REWARDS: Record<string, number> = {
  mcq_correct: 50,
  mcq_correct_fast: 75,
  code_correct: 100,
  code_correct_first_try: 150,
  fill_blank_correct: 30,
  concept_match_correct: 40,
  course_completed: 200,
  batch_top_3: 100,
  perfect_batch: 250,
  streak_bonus: 25,
};

export const LEVELS = [
  { level: 1, title: 'Curious Mind',  xpRequired: 0 },
  { level: 2, title: 'Explorer',      xpRequired: 200 },
  { level: 3, title: 'Scholar',       xpRequired: 500 },
  { level: 4, title: 'Practitioner',  xpRequired: 1000 },
  { level: 5, title: 'Expert',        xpRequired: 2000 },
  { level: 6, title: 'Master',        xpRequired: 4000 },
  { level: 7, title: 'Grandmaster',   xpRequired: 8000 },
  { level: 8, title: 'Legend',        xpRequired: 15000 },
];

export function getLevelFromXP(xp: number) {
  return [...LEVELS].reverse().find((l) => xp >= l.xpRequired) ?? LEVELS[0];
}

export function getNextLevel(xp: number) {
  const current = getLevelFromXP(xp);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

export function getProgressToNextLevel(xp: number): number {
  const current = getLevelFromXP(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const rangeStart = current.xpRequired;
  const rangeEnd = next.xpRequired;
  return Math.round(((xp - rangeStart) / (rangeEnd - rangeStart)) * 100);
}

export function calculateXP(type: string, timeTaken: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;

  if (type === 'mcq') {
    return timeTaken < 10000 ? XP_REWARDS.mcq_correct_fast : XP_REWARDS.mcq_correct;
  }
  if (type === 'code') {
    return timeTaken < 30000 ? XP_REWARDS.code_correct_first_try : XP_REWARDS.code_correct;
  }
  if (type === 'fill_blank') return XP_REWARDS.fill_blank_correct;
  if (type === 'concept_match') return XP_REWARDS.concept_match_correct;

  return XP_REWARDS[type] ?? 50;
}
