import React, { useState, useEffect, useCallback } from 'react';
import {
  levels,
  calculateHeat,
  generateLavaSquares as generateLavaSquaresUtil,
  getHeatColor
} from './gameLogic.js';

const Heatseeker = () => {

  // Game state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [lavaSquares, setLavaSquares] = useState(new Set());
  const [visitedSquares, setVisitedSquares] = useState(new Map());
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Color mapping for heat signatures
  const getSquareColor = (x, y, size) => {
    const key = `${x},${y}`;
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const isTarget = x === size - 1 && y === 0; // top-right
    const isVisited = visitedSquares.has(key);
    const isLava = lavaSquares.has(key);

    // Target square (top-right)
    if (isTarget) return 'bg-green-500';

    // Lava square (only shows black when stepped on)
    if (isLava && isVisited) return 'bg-black';

    // Visited safe squares
    if (isVisited) {
      const heatLevel = visitedSquares.get(key);
      return getHeatColor(heatLevel);
    }

    // Unexplored squares
    return 'bg-gray-400';
  };



  // Calculate adjacent lava squares using current state
  const countAdjacentLava = useCallback((x, y) => {
    return calculateHeat(x, y, lavaSquares);
  }, [lavaSquares]);

  // Generate random lava squares for current level
  const generateLavaSquares = useCallback(() => {
    return generateLavaSquaresUtil(currentLevel);
  }, [currentLevel]);

  // Initialize level
  const initializeLevel = useCallback(() => {
    const level = levels[currentLevel];
    const startX = 0;
    const startY = level.size - 1;

    // Generate lava squares first
    const newLavaSquares = generateLavaSquares();
    setLavaSquares(newLavaSquares);

    // Calculate starting square heat using the same logic as movement
    const startingHeat = calculateHeat(startX, startY, newLavaSquares);

    // Set initial state with starting square already visited
    setPlayerPos({ x: startX, y: startY });
    setVisitedSquares(new Map([[`${startX},${startY}`, startingHeat]]));
    setGameState('playing');
    setMoves(0);
  }, [currentLevel, generateLavaSquares]);

  // Handle player movement
  const movePlayer = useCallback((direction) => {
    if (gameState !== 'playing') return;

    const level = levels[currentLevel];
    let newX = playerPos.x;
    let newY = playerPos.y;

    switch (direction) {
      case 'up':
        newY = Math.max(0, playerPos.y - 1);
        break;
      case 'down':
        newY = Math.min(level.size - 1, playerPos.y + 1);
        break;
      case 'left':
        newX = Math.max(0, playerPos.x - 1);
        break;
      case 'right':
        newX = Math.min(level.size - 1, playerPos.x + 1);
        break;
    }

    // Only move if position actually changed
    if (newX === playerPos.x && newY === playerPos.y) return;

    setPlayerPos({ x: newX, y: newY });
    setMoves(m => m + 1);
    setTotalMoves(t => t + 1);

    const newKey = `${newX},${newY}`;

    // Check if stepped on lava
    if (lavaSquares.has(newKey)) {
      setVisitedSquares(prev => new Map(prev).set(newKey, -1)); // -1 indicates lava
      setGameState('lost');
      return;
    }

    // Check if reached target
    if (newX === level.size - 1 && newY === 0) {
      setGameState('won');
      return;
    }

    // Calculate heat signature
    const adjacentLavaCount = countAdjacentLava(newX, newY);
    setVisitedSquares(prev => new Map(prev).set(newKey, adjacentLavaCount));
  }, [gameState, playerPos, currentLevel, lavaSquares, countAdjacentLava]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!gameStarted) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          movePlayer('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePlayer('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          movePlayer('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePlayer('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer, gameStarted]);

  // Initialize first level
  useEffect(() => {
    if (gameStarted) {
      initializeLevel();
    }
  }, [initializeLevel, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
  };

  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel(prev => prev + 1);
    }
  };

  const restartLevel = () => {
    initializeLevel();
  };

  const resetGame = () => {
    setCurrentLevel(0);
    setTotalMoves(0);
    setGameStarted(false);
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-4xl font-bold mb-8 text-center">🔥 HEATSEEKER 🔥</h1>
        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Leaderboard:</h2>
          <ul>
            <li>...coming soon</li>
            <li>&nbsp;</li>
          </ul>
          <button
            onClick={startGame}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  const level = levels[currentLevel];
  const gridSize = Math.min(600, Math.max(300, 800 / level.size));
  const cellSize = Math.max(4, gridSize / level.size);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-center mb-2">🔥 HEATSEEKER 🔥</h1>
        <div className="text-center text-sm">
          <div className="space-x-4">
            <span>Level: {currentLevel + 1} of {levels.length}</span>
            <span>Grid: {level.size}x{level.size}</span>
          </div>
          <div className="space-x-4 mt-1">
            <span>Level Moves: {moves}</span>
            <span>Total Moves: {totalMoves}</span>
          </div>
        </div>
      </div>

      <div
        className="grid gap-0 border-2 border-gray-600 bg-gray-800 p-2 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${level.size}, ${cellSize}px)`,
          width: 'fit-content'
        }}
      >
        {Array.from({ length: level.size }, (_, y) =>
          Array.from({ length: level.size }, (_, x) => {
            const isPlayer = playerPos.x === x && playerPos.y === y;
            const squareColor = getSquareColor(x, y, level.size);

            return (
              <div
                key={`${x}-${y}`}
                className={`${squareColor} ${isPlayer ? 'ring-2 ring-blue-400 ring-inset' : ''} border border-gray-700`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  minWidth: '4px',
                  minHeight: '4px'
                }}
              />
            );
          })
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 flex flex-col items-center">
        {gameState === 'playing' && (
          <div className="mb-4">
            <p className="text-lg mb-3">Move to the green target!</p>
            {/* D-pad style controls */}
            <div className="grid grid-cols-3 gap-2 w-48">
              <div></div>
              <button
                onClick={() => movePlayer('up')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition duration-150 text-xl"
                disabled={gameState !== 'playing'}
              >
                ↑
              </button>
              <div></div>

              <button
                onClick={() => movePlayer('left')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition duration-150 text-xl"
                disabled={gameState !== 'playing'}
              >
                ←
              </button>
              <div className="flex items-center justify-center text-gray-400 text-sm">
                Move
              </div>
              <button
                onClick={() => movePlayer('right')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition duration-150 text-xl"
                disabled={gameState !== 'playing'}
              >
                →
              </button>

              <div></div>
              <button
                onClick={() => movePlayer('down')}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition duration-150 text-xl"
                disabled={gameState !== 'playing'}
              >
                ↓
              </button>
              <div></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tap buttons or use keyboard arrow keys</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        {gameState === 'won' && (
          <div className="bg-green-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-green-200 mb-2">🎉 Level Complete! 🎉</h2>
            <p className="mb-3">Level completed in {moves} moves! Total: {totalMoves} moves</p>
            {currentLevel < levels.length - 1 ? (
              <button
                onClick={nextLevel}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Next Level
              </button>
            ) : (
              <div>
                <p className="text-xl font-bold text-yellow-300 mb-3">🏆 GAME COMPLETE! 🏆</p>
                <p className="mb-3">Final score: {totalMoves} total moves!</p>
                <button
                  onClick={resetGame}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}

        {gameState === 'lost' && (
          <div className="bg-red-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-red-200 mb-2">💀 Game Over! 💀</h2>
            <p className="mb-3">You stepped on lava after {moves} moves! Total: {totalMoves} moves</p>
            <div className="space-x-2">
              <button
                onClick={restartLevel}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Retry Level
              </button>
              <button
                onClick={resetGame}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400 text-center max-w-lg">
        <p>Navigate safely through the lava field using heat signatures to detect danger!</p>
      </div>
    </div>
  );
};

export default Heatseeker;