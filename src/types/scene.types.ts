/**
 * 씬 관련 타입 정의
 */

import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { ArtifactManager } from '@systems/ArtifactManager';
import type { Container } from 'pixi.js';

/**
 * 게임 씬 인터페이스 (최소 요구사항)
 */
export interface IGameScene extends Container {
  // 엔티티
  player: Player;
  enemies: BaseEnemy[];

  // 시스템
  artifactManager?: ArtifactManager;
}
