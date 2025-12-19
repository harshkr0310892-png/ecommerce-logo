import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  onBack: () => void;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }];
const INITIAL_FOOD: Position = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const DIFFICULTY_SETTINGS = {
  easy: 150,
  normal: 100,
  hard: 50
};

export const SnakeGame: React.FC<SnakeGameProps> = ({ onBack }) => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_SETTINGS>('normal');
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef<Position>(direction);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // Make sure food doesn't appear on snake
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (isOnSnake) {
      return generateFood();
    }

    return newFood;
  }, [snake]);

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current.y === 0) {
            directionRef.current = { x: 0, y: -1 };
            setDirection({ x: 0, y: -1 });
          }
          break;
        case 'ArrowDown':
          if (directionRef.current.y === 0) {
            directionRef.current = { x: 0, y: 1 };
            setDirection({ x: 0, y: 1 });
          }
          break;
        case 'ArrowLeft':
          if (directionRef.current.x === 0) {
            directionRef.current = { x: -1, y: 0 };
            setDirection({ x: -1, y: 0 });
          }
          break;
        case 'ArrowRight':
          if (directionRef.current.x === 0) {
            directionRef.current = { x: 1, y: 0 };
            setDirection({ x: 1, y: 0 });
          }
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  // Main game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setFood(generateFood());
          setScore(prev => prev + 10);
          return newSnake;
        }

        // Remove tail if no food eaten
        return newSnake.slice(0, -1);
      });
    };

    gameLoopRef.current = window.setTimeout(moveSnake, DIFFICULTY_SETTINGS[difficulty]);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [snake, food, gameOver, isPaused, difficulty, generateFood]);

  // Initialize food
  useEffect(() => {
    setFood(generateFood());
  }, [generateFood]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Snake Game</h2>
          <Link to="/">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Score: <span className="text-green-600">{score}</span>
          </div>
          
          <Select value={difficulty} onValueChange={(value: keyof typeof DIFFICULTY_SETTINGS) => setDifficulty(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <div 
            className="grid bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: '100%',
              aspectRatio: '1/1'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              
              const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
              const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;
              
              let cellClass = 'aspect-square border border-gray-200 dark:border-gray-600';
              
              if (isSnakeHead) {
                cellClass += ' bg-green-700 dark:bg-green-600 rounded-sm';
              } else if (isSnakeBody) {
                cellClass += ' bg-green-500 dark:bg-green-400 rounded-sm';
              } else if (isFood) {
                cellClass += ' bg-red-500 dark:bg-red-400 rounded-full';
              }
              
              return <div key={index} className={cellClass} />;
            })}
          </div>
          
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-lg">
              <h3 className="text-2xl font-bold text-white mb-4">Game Over!</h3>
              <p className="text-white mb-4">Final Score: {score}</p>
              <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700">
                Play Again
              </Button>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <h3 className="text-2xl font-bold text-white">PAUSED</h3>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between gap-2">
            <Button 
              onClick={() => setIsPaused(!isPaused)} 
              variant="secondary"
              className="flex-1"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              onClick={resetGame}
              variant="outline"
              className="flex-1"
            >
              Restart
            </Button>
          </div>
          
          <Button onClick={onBack} variant="outline">
            Back to Games
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-1"><strong>Controls:</strong></p>
          <p>Arrow keys to move, Space to pause</p>
        </div>
      </div>
    </div>
  );
};