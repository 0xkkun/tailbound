/**
 * 유물 베이스 클래스
 */

import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { ArtifactData } from '@type/artifact.types';
import type { IGameScene } from '@type/scene.types';
import type { Container } from 'pixi.js';

import type { IArtifact } from './IArtifact';

export abstract class BaseArtifact implements IArtifact {
  public active: boolean = false;
  protected player?: Player;
  protected scene?: IGameScene;

  constructor(public readonly data: ArtifactData) {}

  /**
   * 유물 활성화
   */
  public activate(player: Player, scene: IGameScene): void {
    if (this.active) {
      console.warn(`[Artifact] ${this.data.id} is already active`);
      return;
    }

    this.player = player;
    this.scene = scene;
    this.active = true;

    console.log(`✅ [Artifact] Activated: ${this.data.name}`);
  }

  /**
   * 유물 비활성화
   */
  public deactivate(player: Player, scene: IGameScene): void {
    if (!this.active) return;

    this.cleanup();
    this.active = false;

    console.log(
      `❌ [Artifact] Deactivated: ${this.data.name}, player: ${player.name}, scene: ${scene.name}`
    );
  }

  /**
   * 매 프레임 업데이트 (기본: 아무것도 안함)
   */
  public update(_delta: number): void {
    // 필요한 유물만 오버라이드
    void _delta;
  }

  /**
   * 상태 정리
   */
  public cleanup(): void {
    this.player = undefined;
    this.scene = undefined;
  }

  // 이벤트 훅 (필요한 유물만 구현)
  public onKill?(enemy: BaseEnemy): void;
  public onHit?(enemy: BaseEnemy, damage: number): void;
  public onTakeDamage?(damage: number, source: Container): number;
  public onLevelUp?(level: number): void;
}
