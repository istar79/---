export type GameState = 'menu' | 'playing' | 'gameover' | 'paused';

export type PoopType = 'normal' | 'fast' | 'giant' | 'golden' | 'zig-zag';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  targetX: number; // For mouse/touch slide follow
  direction: 'left' | 'right' | 'idle';
  isHit: boolean;
  hitProgress: number; // animation progress for getting hit
  animFrame: number;
}

export interface Poop {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: PoopType;
  color: string;
  angle: number;
  vx: number; // for zig-zag or diagonal poops
}

export interface Splat {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface ScoreRecord {
  score: number;
  date: string;
  playerName: string;
  mode: string;
}

export type GameTheme = 'retro-pc' | 'cyberpunk' | 'classic-chalk' | 'modern';
