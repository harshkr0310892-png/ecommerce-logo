import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

interface TicTacToeGameProps {
  onBack: () => void;
}

type Player = 'X' | 'O' | null;
type BoardState = Player[][];

const DIFFICULTY_LEVELS = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<BoardState>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_LEVELS>('normal');
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  // Check for winner
  const calculateWinner = (boardState: BoardState): Player => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (boardState[i][0] && boardState[i][0] === boardState[i][1] && boardState[i][0] === boardState[i][2]) {
        return boardState[i][0];
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (boardState[0][i] && boardState[0][i] === boardState[1][i] && boardState[0][i] === boardState[2][i]) {
        return boardState[0][i];
      }
    }

    // Check diagonals
    if (boardState[0][0] && boardState[0][0] === boardState[1][1] && boardState[0][0] === boardState[2][2]) {
      return boardState[0][0];
    }
    if (boardState[0][2] && boardState[0][2] === boardState[1][1] && boardState[0][2] === boardState[2][0]) {
      return boardState[0][2];
    }

    return null;
  };

  // Check for draw
  const checkDraw = (boardState: BoardState): boolean => {
    return boardState.every(row => row.every(cell => cell !== null));
  };

  // Handle cell click
  const handleClick = (row: number, col: number) => {
    if (board[row][col] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[row] = [...newBoard[row]];
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setScores(prev => ({
        ...prev,
        [newWinner]: prev[newWinner] + 1
      }));
    } else if (checkDraw(newBoard)) {
      setIsDraw(true);
      setScores(prev => ({
        ...prev,
        draws: prev.draws + 1
      }));
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
  };

  // Reset scores
  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  // Computer move for different difficulty levels
  useEffect(() => {
    if (currentPlayer === 'O' && !winner && !isDraw) {
      const makeComputerMove = () => {
        // Simple delay to simulate thinking
        setTimeout(() => {
          let row, col;
          
          if (difficulty === 'easy') {
            // Easy: Random moves
            const emptyCells = [];
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                if (board[r][c] === null) {
                  emptyCells.push({ row: r, col: c });
                }
              }
            }
            
            if (emptyCells.length > 0) {
              const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
              row = randomCell.row;
              col = randomCell.col;
            }
          } else if (difficulty === 'normal') {
            // Normal: Try to win or block player
            let moveMade = false;
            
            // Check for winning move
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                if (board[r][c] === null) {
                  const testBoard = board.map(row => [...row]);
                  testBoard[r][c] = 'O';
                  if (calculateWinner(testBoard) === 'O') {
                    row = r;
                    col = c;
                    moveMade = true;
                    break;
                  }
                }
              }
              if (moveMade) break;
            }
            
            // Block player if no winning move
            if (!moveMade) {
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  if (board[r][c] === null) {
                    const testBoard = board.map(row => [...row]);
                    testBoard[r][c] = 'X';
                    if (calculateWinner(testBoard) === 'X') {
                      row = r;
                      col = c;
                      moveMade = true;
                      break;
                    }
                  }
                }
                if (moveMade) break;
              }
            }
            
            // Random move if no strategic move
            if (!moveMade) {
              const emptyCells = [];
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  if (board[r][c] === null) {
                    emptyCells.push({ row: r, col: c });
                  }
                }
              }
              
              if (emptyCells.length > 0) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                row = randomCell.row;
                col = randomCell.col;
              }
            }
          } else {
            // Hard: Minimax algorithm (simplified version)
            // Try to win, block, or take center/corner
            let moveMade = false;
            
            // Check for winning move
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                if (board[r][c] === null) {
                  const testBoard = board.map(row => [...row]);
                  testBoard[r][c] = 'O';
                  if (calculateWinner(testBoard) === 'O') {
                    row = r;
                    col = c;
                    moveMade = true;
                    break;
                  }
                }
              }
              if (moveMade) break;
            }
            
            // Block player if no winning move
            if (!moveMade) {
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  if (board[r][c] === null) {
                    const testBoard = board.map(row => [...row]);
                    testBoard[r][c] = 'X';
                    if (calculateWinner(testBoard) === 'X') {
                      row = r;
                      col = c;
                      moveMade = true;
                      break;
                    }
                  }
                }
                if (moveMade) break;
              }
            }
            
            // Take center if available
            if (!moveMade && board[1][1] === null) {
              row = 1;
              col = 1;
              moveMade = true;
            }
            
            // Take corners if available
            if (!moveMade) {
              const corners = [[0,0], [0,2], [2,0], [2,2]];
              const availableCorners = corners.filter(([r, c]) => board[r][c] === null);
              if (availableCorners.length > 0) {
                const [r, c] = availableCorners[Math.floor(Math.random() * availableCorners.length)];
                row = r;
                col = c;
                moveMade = true;
              }
            }
            
            // Random move if no strategic move
            if (!moveMade) {
              const emptyCells = [];
              for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                  if (board[r][c] === null) {
                    emptyCells.push({ row: r, col: c });
                  }
                }
              }
              
              if (emptyCells.length > 0) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                row = randomCell.row;
                col = randomCell.col;
              }
            }
          }
          
          if (row !== undefined && col !== undefined) {
            handleClick(row, col);
          }
        }, 500); // Delay for better UX
      };
      
      makeComputerMove();
    }
  }, [currentPlayer, winner, isDraw, board, difficulty]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tic Tac Toe</h2>
          <Link to="/">
            <Button variant="outline" size="sm">Home</Button>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Current Player: <span className={currentPlayer === 'X' ? 'text-red-600' : 'text-blue-600'}>{currentPlayer}</span>
          </div>
          
          <Select value={difficulty} onValueChange={(value: keyof typeof DIFFICULTY_LEVELS) => setDifficulty(value)}>
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

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">Player X</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{scores.X}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-800 dark:text-gray-200">Draws</div>
            <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{scores.draws}</div>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">Player O</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{scores.O}</div>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-3 aspect-square">
          {board.map((row, rowIndex) => 
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-4xl font-bold transition-all duration-200 ${
                  cell === 'X' 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                    : cell === 'O' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleClick(rowIndex, colIndex)}
                disabled={!!cell || !!winner || isDraw || currentPlayer === 'O'}
              >
                {cell}
              </button>
            ))
          )}
        </div>

        {/* Game Status */}
        {(winner || isDraw) && (
          <div className="text-center py-3 rounded-lg bg-gray-100 dark:bg-gray-700">
            {winner ? (
              <p className="text-xl font-bold">
                Winner: <span className={winner === 'X' ? 'text-red-600' : 'text-blue-600'}>{winner}</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">It's a Draw!</p>
            )}
          </div>
        )}

        {/* Game Controls */}
        <div className="flex flex-col gap-3">
          <Button onClick={resetGame} variant="secondary">
            New Game
          </Button>
          <Button onClick={resetScores} variant="outline">
            Reset Scores
          </Button>
          <Button onClick={onBack} variant="outline">
            Back to Games
          </Button>
        </div>
      </div>
    </div>
  );
};