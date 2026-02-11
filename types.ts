
export type CellStatus = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  status: CellStatus;
  neighborMines: number;
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export interface DifficultySettings {
  rows: number;
  cols: number;
  mines: number;
}

export type GameStatus = 'playing' | 'won' | 'lost' | 'ready';

export interface AIHint {
  x: number;
  y: number;
  type: 'safe' | 'mine';
  explanation: string;
}
