import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SnakeGame } from "@/components/games/SnakeGame";
import { FlappyBirdGame } from "@/components/games/FlappyBirdGame";
import { TicTacToeGame } from "@/components/games/TicTacToeGame";

const NotFound = () => {
  const location = useLocation();
  const [currentGame, setCurrentGame] = useState<string | null>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const renderGame = () => {
    switch (currentGame) {
      case 'snake':
        return <SnakeGame onBack={() => setCurrentGame(null)} />;
      case 'flappy':
        return <FlappyBirdGame onBack={() => setCurrentGame(null)} />;
      case 'tictactoe':
        return <TicTacToeGame onBack={() => setCurrentGame(null)} />;
      default:
        return (
          <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">404 - Page Not Found</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Oops! The page you're looking for doesn't exist.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Play Some Games While You're Here!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Since you're here, why not enjoy some fun games?
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    onClick={() => setCurrentGame('snake')} 
                    className="h-16 text-lg bg-green-600 hover:bg-green-700"
                  >
                    Play Snake
                  </Button>
                  <Button 
                    onClick={() => setCurrentGame('flappy')} 
                    className="h-16 text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    Play Flappy Bird
                  </Button>
                  <Button 
                    onClick={() => setCurrentGame('tictactoe')} 
                    className="h-16 text-lg bg-purple-600 hover:bg-purple-700"
                  >
                    Play Tic Tac Toe
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href="/" 
                    className="block w-full py-3 text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200"
                  >
                    Return to Home
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return renderGame();
};

export default NotFound;
