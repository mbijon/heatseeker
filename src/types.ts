// Core game types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Level {
  size: number;
  minLava: number;
  maxLava: number;
}

export type GameState = 'playing' | 'won' | 'lost';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MoveResult {
  valid: boolean;
  newPos: Position;
}

// Type for visited squares map - key is "x,y" string, value is heat level (-1 for lava)
export type VisitedSquares = Map<string, number>;

// Type for lava squares set - contains "x,y" strings
export type LavaSquares = Set<string>;