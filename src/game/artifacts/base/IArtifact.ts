/**
 * 유물 인터페이스
 */

import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { ArtifactData } from '@type/artifact.types';
import type { IGameScene } from '@type/scene.types';
import type { Container } from 'pixi.js';

export interface IArtifact {
  /** 유물 메타데이터 */
  readonly data: ArtifactData;

  /** 활성화 여부 */
  active: boolean;

  /** 유물 활성화 (플레이어 획득 시) */
  activate(player: Player, scene: IGameScene): void;

  /** 유물 비활성화 (제거 시) */
  deactivate(player: Player, scene: IGameScene): void;

  /** 매 프레임 업데이트 */
  update(delta: number): void;

  /** 이벤트 훅 (선택적) */
  onKill?(enemy: BaseEnemy): void;
  onHit?(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void;
  onTakeDamage?(damage: number, source: Container): number;
  onLevelUp?(level: number): void;

  /** 상태 정리 */
  cleanup(): void;
}
