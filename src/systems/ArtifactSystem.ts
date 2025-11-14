/**
 * 유물 관리 시스템
 */

import type { IArtifact } from '@game/artifacts/base/IArtifact';
import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { IGameScene } from '@type/scene.types';
import type { Container } from 'pixi.js';

export class ArtifactSystem {
  private artifacts: IArtifact[] = [];
  private readonly maxArtifacts: number = 4;

  constructor(
    private player: Player,
    private scene: IGameScene
  ) {}

  /**
   * 유물 추가
   */
  public add(artifact: IArtifact): boolean {
    // 최대 개수 체크
    if (this.artifacts.length >= this.maxArtifacts) {
      console.warn('[ArtifactSystem] Max artifacts reached (4/4)');
      return false;
    }

    // 중복 체크
    if (this.has(artifact.data.id)) {
      console.warn('[ArtifactSystem] Artifact already active:', artifact.data.id);
      return false;
    }

    // 활성화
    artifact.activate(this.player, this.scene);
    this.artifacts.push(artifact);

    console.log(
      `[ArtifactSystem] Added artifact (${this.artifacts.length}/4):`,
      artifact.data.name
    );

    return true;
  }

  /**
   * 유물 제거
   */
  public remove(artifactId: string): boolean {
    const index = this.artifacts.findIndex((a) => a.data.id === artifactId);
    if (index === -1) return false;

    const artifact = this.artifacts[index];
    artifact.deactivate(this.player, this.scene);
    this.artifacts.splice(index, 1);

    console.log('[ArtifactSystem] Removed artifact:', artifact.data.name);

    return true;
  }

  /**
   * 보유 여부
   */
  public has(artifactId: string): boolean {
    return this.artifacts.some((a) => a.data.id === artifactId);
  }

  /**
   * 활성 유물 목록 반환
   */
  public getActiveArtifacts(): IArtifact[] {
    return [...this.artifacts]; // 복사본 반환 (외부에서 수정 방지)
  }

  /**
   * 업데이트
   */
  public update(delta: number): void {
    for (const artifact of this.artifacts) {
      artifact.update(delta);
    }
  }

  /**
   * 이벤트: 적 처치
   */
  public triggerKill(enemy: BaseEnemy): void {
    for (const artifact of this.artifacts) {
      artifact.onKill?.(enemy);
    }
  }

  /**
   * 이벤트: 적 타격
   */
  public triggerHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
    for (const artifact of this.artifacts) {
      artifact.onHit?.(enemy, damage, weaponCategories);
    }
  }

  /**
   * 이벤트: 피해 받음
   */
  public triggerTakeDamage(damage: number, source: Container): number {
    let finalDamage = damage;

    for (const artifact of this.artifacts) {
      if (artifact.onTakeDamage) {
        finalDamage = artifact.onTakeDamage(finalDamage, source);
      }
    }

    return finalDamage;
  }

  /**
   * 이벤트: 레벨업
   */
  public triggerLevelUp(level: number): void {
    for (const artifact of this.artifacts) {
      artifact.onLevelUp?.(level);
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    for (const artifact of this.artifacts) {
      artifact.deactivate(this.player, this.scene);
    }
    this.artifacts = [];
  }

  /**
   * 현재 보유 중인 유물 목록
   */
  public getAll(): IArtifact[] {
    return [...this.artifacts];
  }

  /**
   * 보유 개수
   */
  public getCount(): number {
    return this.artifacts.length;
  }
}
