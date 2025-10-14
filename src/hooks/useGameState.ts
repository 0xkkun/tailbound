import { useState } from 'react';

export type GamePhase = 'lobby' | 'playing';

export const useGameState = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');

  const startGame = () => {
    setGamePhase('playing');
  };

  return {
    gamePhase,
    startGame,
  };
};
