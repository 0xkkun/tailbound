import { useState } from 'react';

import type { Player } from '@/game/entities/Player';

export type GamePhase = 'lobby' | 'playing' | 'boundary';

export interface PlayerSnapshot {
  health: number;
  maxHealth: number;
  totalXP: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  speedMultiplier: number;
  pickupRangeMultiplier: number;
}

export const useGameState = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [playerSnapshot, setPlayerSnapshot] = useState<PlayerSnapshot | null>(null);

  const startGame = () => {
    setGamePhase('playing');
  };

  const enterBoundary = (player?: Player) => {
    if (player) {
      // Player 상태 스냅샷 저장
      setPlayerSnapshot({
        health: player.health,
        maxHealth: player.maxHealth,
        totalXP: player.getLevelSystem().getTotalXP(),
        damageMultiplier: player.damageMultiplier,
        cooldownMultiplier: player.cooldownMultiplier,
        speedMultiplier: player.speedMultiplier,
        pickupRangeMultiplier: player.pickupRangeMultiplier,
      });
    }
    setGamePhase('boundary');
  };

  const continueToStage2 = () => {
    // playerSnapshot은 이미 저장되어 있음
    setGamePhase('playing');
  };

  return {
    gamePhase,
    playerSnapshot,
    startGame,
    enterBoundary,
    continueToStage2,
  };
};
