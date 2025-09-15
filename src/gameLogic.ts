import type { Level, Position, Direction, MoveResult, LavaSquares } from './types';

// Level configurations
export const levels: Level[] = [
  { size: 10, minLava: 1, maxLava: 5 },
  { size: 10, minLava: 5, maxLava: 15 },
  { size: 20, minLava: 20, maxLava: 40 },
  { size: 32, minLava: 40, maxLava: 100 },
  { size: 40, minLava: 100, maxLava: 200 },
  { size: 50, minLava: 250, maxLava: 750 },
  { size: 64, minLava: 400, maxLava: 800 },
  { size: 64, minLava: 800, maxLava: 1600 },
  { size: 100, minLava: 1600, maxLava: 2400 },
  { size: 100, minLava: 2000, maxLava: 5000 }
];

// Calculate adjacent lava squares from any lava set
export const calculateHeat = (x: number, y: number, lavaSet: LavaSquares): number => {
  let count = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const checkKey = `${x + dx},${y + dy}`;
      if (lavaSet.has(checkKey)) count++;
    }
  }
  return count;
};

// Generate random lava squares for current level
export const generateLavaSquares = (currentLevel: number): LavaSquares => {
  const level = levels[currentLevel];
  const lavaCount = Math.floor(Math.random() * (level.maxLava - level.minLava + 1)) + level.minLava;
  const newLavaSquares: LavaSquares = new Set();

  // Ensure starting position (bottom-left) and target (top-right) are safe
  const safeSquares = new Set([`0,${level.size - 1}`, `${level.size - 1},0`]);

  while (newLavaSquares.size < lavaCount) {
    const x = Math.floor(Math.random() * level.size);
    const y = Math.floor(Math.random() * level.size);
    const key = `${x},${y}`;

    if (!safeSquares.has(key) && !newLavaSquares.has(key)) {
      newLavaSquares.add(key);
    }
  }

  return newLavaSquares;
};

// Check if a move is valid
export const isValidMove = (currentPos: Position, direction: Direction, gridSize: number): MoveResult => {
  let newX = currentPos.x;
  let newY = currentPos.y;

  switch (direction) {
    case 'up':
      newY = Math.max(0, currentPos.y - 1);
      break;
    case 'down':
      newY = Math.min(gridSize - 1, currentPos.y + 1);
      break;
    case 'left':
      newX = Math.max(0, currentPos.x - 1);
      break;
    case 'right':
      newX = Math.min(gridSize - 1, currentPos.x + 1);
      break;
    default:
      return { valid: false, newPos: currentPos };
  }

  const moved = newX !== currentPos.x || newY !== currentPos.y;
  return {
    valid: moved,
    newPos: { x: newX, y: newY }
  };
};

// Check if position is the target
export const isTargetPosition = (pos: Position, gridSize: number): boolean => {
  return pos.x === gridSize - 1 && pos.y === 0;
};

// Check if position has lava
export const isLavaPosition = (pos: Position, lavaSet: LavaSquares): boolean => {
  const key = `${pos.x},${pos.y}`;
  return lavaSet.has(key);
};

// Get heat color based on adjacent lava count
export const getHeatColor = (adjacentLavaCount: number): string => {
  switch (adjacentLavaCount) {
    case 0: return 'bg-gray-300'; // Light grey
    case 1: return 'bg-yellow-200'; // Light yellow
    case 2: return 'bg-yellow-300'; // Yellow
    case 3: return 'bg-yellow-400'; // Bright yellow
    case 4: return 'bg-yellow-500'; // Light yellow-orange
    case 5: return 'bg-orange-400'; // Deep yellow-orange
    case 6: return 'bg-orange-500'; // Light orange-red
    case 7: return 'bg-red-400'; // Light red
    case 8: return 'bg-pink-400'; // Neon pink
    default: return 'bg-white';
  }
};