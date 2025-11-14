/**
 * 씬 관련 타입 정의
 */

import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { ArtifactSystem } from '@systems/ArtifactSystem';
import type { Container } from 'pixi.js';

/**
 * 게임 씬 인터페이스 (최소 요구사항)
 */
export interface IGameScene extends Container {
  // 엔티티
  player: Player;
  enemies: BaseEnemy[];

  // 시스템
  artifactSystem?: ArtifactSystem;

  // 화면 효과 (버서커 모드)
  startBerserkScreenEffect?: () => void;
  stopBerserkScreenEffect?: () => void;
}
