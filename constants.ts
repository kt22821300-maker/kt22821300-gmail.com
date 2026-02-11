
import { Difficulty, DifficultySettings } from './types';

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  [Difficulty.BEGINNER]: { rows: 9, cols: 9, mines: 10 },
  [Difficulty.INTERMEDIATE]: { rows: 16, cols: 16, mines: 40 },
  [Difficulty.EXPERT]: { rows: 16, cols: 30, mines: 99 },
};

export const NUMBER_COLORS = [
  '', 
  'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',    // 1
  'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]', // 2
  'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]',   // 3
  'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]', // 4
  'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',   // 5
  'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',   // 6
  'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]',    // 7
  'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'      // 8
];
