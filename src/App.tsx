import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  levels,
  calculateHeat,
  generateLavaSquares as generateLavaSquaresUtil,
  getHeatColor
} from './gameLogic';
import type {
  Position,
  GameState,
  Direction,
  VisitedSquares,
  LavaSquares
} from './types';
import useLeaderboard from './hooks/useLeaderboard';
import LeaderboardTable from './components/LeaderboardTable';
import LeaderboardModal from './components/LeaderboardModal';

const FINAL_LEVEL_INDEX = levels.length - 1;

type LevelOutcome = {
  levelIndex: number;
  status: 'won' | 'lost';
};

type ModalContext = 'level' | 'final';

type PendingOutcome = (LevelOutcome & { timestamp: number }) | null;

function Heatseeker() {
  // Core game state
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [lavaSquares, setLavaSquares] = useState<LavaSquares>(new Set());
  const [visitedSquares, setVisitedSquares] = useState<VisitedSquares>(new Map());
  const [gameState, setGameState] = useState<GameState>('playing');
  const [moves, setMoves] = useState<number>(0);
  const [totalMoves, setTotalMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [highestLevelAchieved, setHighestLevelAchieved] = useState<number>(0);

  // Leaderboard coordination
  const {
    isConfigured: isLeaderboardConfigured,
    isLoading: isLeaderboardLoading,
    error: leaderboardError,
    leaderboard,
    sessionId,
    playerEntry,
    playerRank,
    hasSubmittedName: hasLeaderboardName,
    isHuman: storedIsHuman,
    startNewSession,
    recordProgress,
    submitIdentity,
    refreshLeaderboard
  } = useLeaderboard();

  const [startingGame, setStartingGame] = useState(false);
  const [pendingOutcome, setPendingOutcome] = useState<PendingOutcome>(null);
  const [isEvaluatingLeaderboard, setIsEvaluatingLeaderboard] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modalContext, setModalContext] = useState<ModalContext>('level');
  const [isSavingName, setIsSavingName] = useState(false);
  const [namePromptAcknowledged, setNamePromptAcknowledged] = useState(false);

  const lastKnownRankRef = useRef<number | null>(null);

  const defaultIsHuman = storedIsHuman ?? false;

  const isFinalLevel = currentLevel === FINAL_LEVEL_INDEX;
  const showFinalCelebration = isFinalLevel && (gameState === 'won' || gameState === 'lost');

  // Color mapping for heat signatures
  const getSquareColor = useCallback((x: number, y: number, size: number): string => {
    const key = `${x},${y}`;
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const isTarget = x === size - 1 && y === 0;
    const isVisited = visitedSquares.has(key);
    const isLava = lavaSquares.has(key);

    if (isTarget) return 'bg-green-500';
    if (isLava && isVisited) return 'bg-black';

    if (isVisited) {
      const heatLevel = visitedSquares.get(key);
      return getHeatColor(heatLevel ?? 0);
    }

    return 'bg-gray-400';
  }, [lavaSquares, playerPos.x, playerPos.y, visitedSquares]);

  // Calculate adjacent lava squares using current state
  const countAdjacentLava = useCallback((x: number, y: number): number => {
    return calculateHeat(x, y, lavaSquares);
  }, [lavaSquares]);

  // Generate random lava squares for current level
  const generateLavaSquares = useCallback((): LavaSquares => {
    return generateLavaSquaresUtil(currentLevel);
  }, [currentLevel]);

  // Initialize level
  const initializeLevel = useCallback((): void => {
    const level = levels[currentLevel];
    const startX = 0;
    const startY = level.size - 1;

    const newLavaSquares = generateLavaSquares();
    setLavaSquares(newLavaSquares);

    const startingHeat = calculateHeat(startX, startY, newLavaSquares);

    setPlayerPos({ x: startX, y: startY });
    setVisitedSquares(new Map([[`${startX},${startY}`, startingHeat]]));
    setGameState('playing');
    setMoves(0);
  }, [currentLevel, generateLavaSquares]);

  // Handle player movement
  const movePlayer = useCallback((direction: Direction): void => {
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

    if (newX === playerPos.x && newY === playerPos.y) return;

    setPlayerPos({ x: newX, y: newY });
    setMoves(m => m + 1);
    setTotalMoves(t => t + 1);

    const newKey = `${newX},${newY}`;

    if (lavaSquares.has(newKey)) {
      setVisitedSquares(prev => new Map(prev).set(newKey, -1));
      setGameState('lost');
      if (currentLevel === FINAL_LEVEL_INDEX) {
        setHighestLevelAchieved(levels.length);
        setPendingOutcome({ levelIndex: currentLevel, status: 'lost', timestamp: Date.now() });
      }
      return;
    }

    if (newX === level.size - 1 && newY === 0) {
      setGameState('won');
      setHighestLevelAchieved(prev => Math.max(prev, currentLevel + 1));
      setPendingOutcome({ levelIndex: currentLevel, status: 'won', timestamp: Date.now() });
      return;
    }

    const adjacentLavaCount = countAdjacentLava(newX, newY);
    setVisitedSquares(prev => new Map(prev).set(newKey, adjacentLavaCount));
  }, [countAdjacentLava, currentLevel, gameState, lavaSquares, playerPos.x, playerPos.y]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
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
  }, [gameStarted, movePlayer]);

  // Initialize first level when the game starts
  useEffect(() => {
    if (gameStarted) {
      initializeLevel();
    }
  }, [initializeLevel, gameStarted]);

  const handleStartGame = useCallback(async () => {
    if (startingGame) return;
    setStartingGame(true);
    try {
      if (isLeaderboardConfigured) {
        await startNewSession();
        await refreshLeaderboard();
      }

      setCurrentLevel(0);
      setHighestLevelAchieved(0);
      setTotalMoves(0);
      setMoves(0);
      setVisitedSquares(new Map());
      setLavaSquares(new Set());
      setGameState('playing');
      setNamePromptAcknowledged(false);
      setPendingOutcome(null);
      setShowNameModal(false);
      lastKnownRankRef.current = null;
      setGameStarted(true);
    } finally {
      setStartingGame(false);
    }
  }, [isLeaderboardConfigured, refreshLeaderboard, startNewSession, startingGame]);

  const nextLevel = useCallback(() => {
    if (currentLevel < FINAL_LEVEL_INDEX) {
      setCurrentLevel(prev => prev + 1);
    }
  }, [currentLevel]);

  const restartLevel = useCallback(() => {
    initializeLevel();
  }, [initializeLevel]);

  const resetGame = useCallback(() => {
    setCurrentLevel(0);
    setTotalMoves(0);
    setMoves(0);
    setHighestLevelAchieved(0);
    setGameState('playing');
    setVisitedSquares(new Map());
    setLavaSquares(new Set());
    setGameStarted(false);
    setPendingOutcome(null);
    setShowNameModal(false);
    setIsSavingName(false);
    setNamePromptAcknowledged(false);
    lastKnownRankRef.current = null;
  }, []);

  useEffect(() => {
    if (!pendingOutcome) return;
    if (!isLeaderboardConfigured || !sessionId) {
      setPendingOutcome(null);
      return;
    }

    const evaluateOutcome = async () => {
      if (pendingOutcome.status === 'lost' && pendingOutcome.levelIndex !== FINAL_LEVEL_INDEX) {
        setPendingOutcome(null);
        return;
      }

      setIsEvaluatingLeaderboard(true);

      try {
        const isFinal = pendingOutcome.levelIndex === FINAL_LEVEL_INDEX;
        const levelReached = pendingOutcome.status === 'won'
          ? pendingOutcome.levelIndex + 1
          : isFinal
            ? levels.length
            : highestLevelAchieved;

        const outcome = await recordProgress({
          levelReached,
          totalMoves
        });

        if (outcome?.rank && outcome.rank > 0) {
          lastKnownRankRef.current = outcome.rank;
        }

        const qualifiesForPrompt = outcome?.shouldPromptName && !namePromptAcknowledged;
        const finalNeedsPrompt = isFinal
          && (lastKnownRankRef.current !== null && lastKnownRankRef.current <= 10)
          && !hasLeaderboardName;

        if ((qualifiesForPrompt || finalNeedsPrompt) && !showNameModal) {
          setModalContext(finalNeedsPrompt ? 'final' : 'level');
          setShowNameModal(true);
        }
      } finally {
        setIsEvaluatingLeaderboard(false);
        setPendingOutcome(null);
      }
    };

    void evaluateOutcome();
  }, [hasLeaderboardName, highestLevelAchieved, isLeaderboardConfigured, namePromptAcknowledged, pendingOutcome, recordProgress, sessionId, showNameModal, totalMoves]);

  const handleNameSubmit = useCallback(async ({ name, isHuman }: { name: string; isHuman: boolean }) => {
    setIsSavingName(true);
    try {
      await submitIdentity({ playerName: name.trim(), isHuman });
    } finally {
      setIsSavingName(false);
      setShowNameModal(false);
      setNamePromptAcknowledged(true);
    }
  }, [submitIdentity]);

  const handleNameSkip = useCallback(() => {
    setShowNameModal(false);
    setNamePromptAcknowledged(true);
  }, []);

  const handleBailout = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const leaderboardHighlightSessionId = useMemo(() => {
    return playerEntry?.playerName ? playerEntry.sessionId : null;
  }, [playerEntry]);

  const level = levels[currentLevel];
  const gridSize = Math.min(600, Math.max(300, 800 / level.size));
  const cellSize = Math.max(4, gridSize / level.size);

  if (!gameStarted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8 text-white">
        <h1 className="mb-8 text-center text-4xl font-bold">🔥 HEATSEEKER 🔥</h1>
        <div className="w-full max-w-3xl rounded-lg bg-gray-800 p-6">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Don't step in lava!</h2>
            <p className="text-sm text-gray-300">
              Designed as an ARC-AGI-3 Challenge game to test AI/ML model reasoning skills: "Easy for Humans, Hard for AI." Game rules are a puzzle on purpose. For humans... the game is fun once you figure out the rules.
            </p>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleStartGame}
              disabled={startingGame}
              className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {startingGame ? 'Preparing…' : 'Start Game'}
            </button>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">Leaderboard</h2>
            {isLeaderboardConfigured ? (
              <LeaderboardTable
                entries={leaderboard}
                isLoading={isLeaderboardLoading}
                error={leaderboardError}
                highlightSessionId={leaderboardHighlightSessionId}
              />
            ) : (
              <div className="rounded border border-gray-700 bg-gray-900/60 p-4 text-sm text-gray-400">
                Configure Supabase credentials to enable the global leaderboard.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <h1 className="mb-2 text-center text-3xl font-bold">🔥 HEATSEEKER 🔥</h1>
      <div className="text-center text-sm">
        <div className="space-x-4">
          <span>Level: {currentLevel + 1} of {levels.length}</span>
          <span>Grid: {level.size}x{level.size}</span>
        </div>
        <div className="mt-1 space-x-4">
          <span>Level Moves: {moves}</span>
          <span>Total Moves: {totalMoves}</span>
        </div>
      </div>

      <div
        className="mt-4 grid gap-0 rounded-lg border-2 border-gray-600 bg-gray-800 p-2"
        style={{
          gridTemplateColumns: `repeat(${level.size}, ${cellSize}px)`,
          width: 'fit-content'
        }}
      >
        {Array.from({ length: level.size }, (_, y) => (
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
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center">
        {gameState === 'playing' && (
          <div className="mb-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center">
              <div className="grid w-48 grid-cols-3 gap-2">
                <div />
                <button
                  onClick={() => movePlayer('up')}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-xl font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"
                  disabled={gameState !== 'playing'}
                >
                  ↑
                </button>
                <div />

                <button
                  onClick={() => movePlayer('left')}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-xl font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"
                  disabled={gameState !== 'playing'}
                >
                  ←
                </button>
                <div className="flex items-center justify-center text-sm text-gray-400">Move</div>
                <button
                  onClick={() => movePlayer('right')}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-xl font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"
                  disabled={gameState !== 'playing'}
                >
                  →
                </button>

                <div />
                <button
                  onClick={() => movePlayer('down')}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-xl font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"
                  disabled={gameState !== 'playing'}
                >
                  ↓
                </button>
                <div />
              </div>
              <p className="mt-2 text-xs text-gray-400">Tap buttons or use keyboard arrow keys</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="mb-2 text-sm text-gray-200">Getting too hot?</p>
              <button
                onClick={handleBailout}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
                disabled={isEvaluatingLeaderboard || showNameModal}
              >
                Bailout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 w-full max-w-3xl text-center">
        {showFinalCelebration ? (
          <div className="rounded-lg bg-purple-900/40 p-6">
            <h2 className="text-xl font-bold text-purple-200">🎉 You have completed all levels! Congratulations!!! 🎉</h2>
            {playerRank && playerRank > 0 && hasLeaderboardName && (
              <p className="mt-2 text-sm text-purple-100">You are currently ranked #{playerRank} on the global leaderboard.</p>
            )}
            <div className="mt-6">
              <LeaderboardTable
                entries={leaderboard}
                isLoading={isLeaderboardLoading || isEvaluatingLeaderboard}
                error={leaderboardError}
                highlightSessionId={leaderboardHighlightSessionId}
              />
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={resetGame}
                disabled={isEvaluatingLeaderboard || showNameModal}
                className="rounded bg-yellow-600 px-5 py-2 font-semibold text-white transition hover:bg-yellow-700 disabled:opacity-60"
              >
                Play Again
              </button>
            </div>
          </div>
        ) : gameState === 'won' ? (
          <div className="rounded-lg bg-green-800 p-4">
            <h2 className="mb-2 text-xl font-bold text-green-200">🎉 Level Complete! 🎉</h2>
            <p className="mb-3">Level completed in {moves} moves! Total: {totalMoves} moves</p>
            <button
              onClick={nextLevel}
              disabled={isEvaluatingLeaderboard || showNameModal}
              className="rounded bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              Next Level
            </button>
          </div>
        ) : gameState === 'lost' ? (
          <div className="rounded-lg bg-red-800 p-4">
            <h2 className="mb-2 text-xl font-bold text-red-200">💀 Game Over! 💀</h2>
            <p className="mb-3">You stepped on lava after {moves} moves! Total: {totalMoves} moves</p>
            <div className="space-x-2">
              <button
                onClick={restartLevel}
                className="rounded bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700"
              >
                Retry Level
              </button>
              <button
                onClick={resetGame}
                className="rounded bg-gray-600 px-4 py-2 font-bold text-white transition hover:bg-gray-700"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 max-w-lg text-center text-xs text-gray-400">
        <p>Navigate safely through the lava field using heat signatures to detect danger!</p>
      </div>

      <LeaderboardModal
        isOpen={showNameModal}
        isSaving={isSavingName}
        defaultName={playerEntry?.playerName ?? ''}
        defaultIsHuman={defaultIsHuman}
        onSubmit={async ({ name, isHuman }) => {
          await handleNameSubmit({ name, isHuman });
        }}
        onSkip={handleNameSkip}
      />
    </div>
  );
}

export default Heatseeker;
