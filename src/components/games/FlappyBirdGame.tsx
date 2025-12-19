import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

interface Pipe {
  id: number;
  x: number;
  gapY: number;
  passed: boolean;
}

interface FlappyBirdGameProps {
  onBack: () => void;
}

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const BIRD_SIZE = 30;

const DIFFICULTY_SETTINGS = {
  easy: { pipeSpeed: 2, spawnRate: 1500 },
  normal: { pipeSpeed: 3, spawnRate: 1200 },
  hard: { pipeSpeed: 4, spawnRate: 1000 }
};

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onBack }) => {
  const [birdPosition, setBirdPosition] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_SETTINGS>('normal');
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const pipeSpawnRef = useRef<number | null>(null);
  const lastPipeId = useRef(0);

  // Handle jump
  const handleJump = () => {
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
    }
    
    if (gameOver) {
      resetGame();
      return;
    }
    
    setBirdVelocity(JUMP_FORCE);
  };

  // Reset game
  const resetGame = () => {
    setBirdPosition(250);
    setBirdVelocity(0);
    setPipes([]);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    lastPipeId.current = 0;
  };

  // Spawn pipes
  const spawnPipe = () => {
    if (!gameStarted || gameOver) return;
    
    const gameHeight = gameAreaRef.current?.clientHeight || 600;
    const gapY = Math.floor(Math.random() * (gameHeight - PIPE_GAP - 100)) + 50;
    
    const newPipe: Pipe = {
      id: lastPipeId.current++,
      x: gameAreaRef.current?.clientWidth || 800,
      gapY,
      passed: false
    };
    
    setPipes(prev => [...prev, newPipe]);
  };

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const updateGame = () => {
      // Update bird position
      setBirdPosition(prev => {
        const newPosition = prev + birdVelocity;
        const gameHeight = gameAreaRef.current?.clientHeight || 600;
        
        // Ground collision
        if (newPosition >= gameHeight - BIRD_SIZE) {
          setGameOver(true);
          return gameHeight - BIRD_SIZE;
        }
        
        // Ceiling collision
        if (newPosition <= 0) {
          return 0;
        }
        
        return newPosition;
      });
      
      setBirdVelocity(prev => prev + GRAVITY);

      // Update pipes
      setPipes(prev => {
        const updatedPipes = prev.map(pipe => ({
          ...pipe,
          x: pipe.x - DIFFICULTY_SETTINGS[difficulty].pipeSpeed
        })).filter(pipe => pipe.x > -PIPE_WIDTH);
        
        // Check for passed pipes and collisions
        return updatedPipes.map(pipe => {
          // Check if bird passed the pipe
          if (!pipe.passed && pipe.x + PIPE_WIDTH < (gameAreaRef.current?.clientWidth || 800) / 2 - BIRD_SIZE / 2) {
            setScore(prev => prev + 1);
            return { ...pipe, passed: true };
          }
          
          // Check collision
          const birdX = (gameAreaRef.current?.clientWidth || 800) / 2 - BIRD_SIZE / 2;
          const birdY = birdPosition;
          
          if (
            birdX + BIRD_SIZE > pipe.x &&
            birdX < pipe.x + PIPE_WIDTH &&
            (birdY < pipe.gapY || birdY + BIRD_SIZE > pipe.gapY + PIPE_GAP)
          ) {
            setGameOver(true);
          }
          
          return pipe;
        });
      });

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [birdPosition, birdVelocity, gameStarted, gameOver, difficulty]);

  // Pipe spawning interval
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    pipeSpawnRef.current = window.setInterval(
      spawnPipe, 
      DIFFICULTY_SETTINGS[difficulty].spawnRate
    );
    
    return () => {
      if (pipeSpawnRef.current) {
        clearInterval(pipeSpawnRef.current);
      }
    };
  }, [gameStarted, gameOver, difficulty]);

  // Handle click/tap to jump
  useEffect(() => {
    const handleClick = () => handleJump();
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') handleJump();
    });
    
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', (e) => {
        if (e.code === 'Space') handleJump();
      });
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Flappy Bird</h2>
          <Link to="/">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Score: <span className="text-blue-600">{score}</span>
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

        <div 
          ref={gameAreaRef}
          className="relative w-full h-96 bg-gradient-to-b from-sky-300 to-sky-500 dark:from-slate-700 dark:to-slate-900 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600"
          onClick={handleJump}
        >
          {/* Bird */}
          <div 
            className="absolute bg-yellow-400 dark:bg-yellow-500 rounded-full border-2 border-orange-500"
            style={{
              left: '50%',
              top: `${birdPosition}px`,
              width: `${BIRD_SIZE}px`,
              height: `${BIRD_SIZE}px`,
              transform: 'translateX(-50%)',
              transition: 'top 0.1s linear'
            }}
          >
            <div className="absolute w-3 h-3 bg-white rounded-full top-1 left-1">
              <div className="absolute w-1.5 h-1.5 bg-black rounded-full top-0.5 left-0.5"></div>
            </div>
            <div className="absolute w-4 h-2 bg-orange-600 rounded-sm top-3 left-4"></div>
          </div>

          {/* Pipes */}
          {pipes.map(pipe => (
            <React.Fragment key={pipe.id}>
              {/* Top pipe */}
              <div 
                className="absolute bg-green-600 dark:bg-green-700 border-2 border-green-800 dark:border-green-900"
                style={{
                  left: `${pipe.x}px`,
                  top: 0,
                  width: `${PIPE_WIDTH}px`,
                  height: `${pipe.gapY}px`
                }}
              />
              {/* Bottom pipe */}
              <div 
                className="absolute bg-green-600 dark:bg-green-700 border-2 border-green-800 dark:border-green-900"
                style={{
                  left: `${pipe.x}px`,
                  top: `${pipe.gapY + PIPE_GAP}px`,
                  width: `${PIPE_WIDTH}px`,
                  bottom: 0
                }}
              />
            </React.Fragment>
          ))}

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-b from-amber-800 to-amber-900 dark:from-amber-900 dark:to-amber-950"></div>

          {/* Start prompt */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-black bg-opacity-50 p-6 rounded-lg">
                <p className="text-white text-xl mb-4">Click or Press Space to Start</p>
                <Button onClick={handleJump} className="bg-blue-600 hover:bg-blue-700">
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {/* Game over screen */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-black bg-opacity-70 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
                <p className="text-white mb-4">Score: {score}</p>
                <Button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700">
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={resetGame} variant="outline">
            Restart
          </Button>
          <Button onClick={onBack} variant="outline">
            Back to Games
          </Button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-1"><strong>Controls:</strong></p>
          <p>Click, Tap, or Press Space to jump</p>
        </div>
      </div>
    </div>
  );
};