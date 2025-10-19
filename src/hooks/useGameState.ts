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
  const [gameKey, setGameKey] = useState(0); // 게임 재시작용 키

  const startGame = () => {
    setGamePhase('playing');
    setGameKey((prev) => prev + 1); // 게임 시작 시 키 증가
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

  const returnToLobby = () => {
    // 로비로 돌아가기 (플레이어 데이터 초기화)
    setPlayerSnapshot(null);
    setGamePhase('lobby');
  };

  const restartGame = () => {
    // 게임 다시하기 (로비를 거치지 않고 바로 게임 재시작)
    setPlayerSnapshot(null);
    setGameKey((prev) => prev + 1); // 게임 키 증가로 강제 리렌더링
  };

  return {
    gamePhase,
    playerSnapshot,
    gameKey,
    startGame,
    enterBoundary,
    continueToStage2,
    returnToLobby,
    restartGame,
  };
};
