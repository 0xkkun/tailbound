/**
 * 척살 유물
 * 처치할 때마다 공격력 1%씩 증가 (최대 50%)
 * 피해를 입으면 모든 스택 손실
 */

import { CDN_ASSETS } from '@config/assets.config';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { IGameScene } from '@type/scene.types';
import type { Container } from 'pixi.js';

import { BaseArtifact } from '../base/BaseArtifact';

export class ChuksalArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly DAMAGE_PER_KILL = 0.01; // 처치당 1% 증가
  private readonly MAX_STACKS = 50; // 최대 50 스택 (50% 증가)

  // ====== 상태 ======
  private currentStacks: number = 0;
  private previousBonus: number = 0; // 이전 보너스 값 (내부 관리)

  constructor() {
    super({
      id: 'chuksal',
      name: '척살',
      tier: 3,
      rarity: 'epic',
      category: 'offensive',
      description: '처치할 때마다 공격력 +1% (최대 50%), 피격 시 모든 스택 손실',
      iconPath: CDN_ASSETS.artifact.chuksal,
      color: 0xff4500, // 오렌지 레드
    });
  }

  /**
   * 유물 활성화
   */
  public activate(player: Player, scene: IGameScene): void {
    super.activate(player, scene);
    this.currentStacks = 0;
    this.previousBonus = 0;
    this.updatePlayerDamage();
    // UI는 update에서 lazy 생성
  }

  /**
   * 매 프레임 업데이트
   */
  public update(_delta: number): void {
    void _delta;

    // UI가 준비되면 아이콘+텍스트 생성 (한번만)
    if (!this.centerUI) {
      this.createCenterUI(); // BaseArtifact 헬퍼 사용
      this.updateStatusText();
    }
  }

  /**
   * 상태 UI 업데이트 (아이콘 + 텍스트)
   */
  private updateStatusText(): void {
    // 유물 보유 시 항상 표시 (0%도 표시)
    const bonus = Math.floor(this.currentStacks * this.DAMAGE_PER_KILL * 100);
    this.updateCenterText(`+${bonus}%`); // BaseArtifact 헬퍼 사용
  }

  /**
   * 적 처치 시 호출
   */
  public onKill(_enemy: BaseEnemy): void {
    void _enemy;
    if (!this.active || !this.player) return;

    // 스택 증가 (최대값 제한)
    if (this.currentStacks < this.MAX_STACKS) {
      this.currentStacks++;
      this.updatePlayerDamage();

      const currentBonus = this.currentStacks * this.DAMAGE_PER_KILL * 100;
      console.log(
        `[Chuksal] Kill! Stacks: ${this.currentStacks}/${this.MAX_STACKS} (+${currentBonus.toFixed(0)}% damage)`
      );

      // 상태 텍스트 업데이트
      this.updateStatusText();
    }
  }

  /**
   * 피격 시 호출
   */
  public onTakeDamage(damage: number, _source?: Container): number {
    void _source;
    if (!this.active || !this.player) return damage;

    // 스택이 있으면 모두 손실
    if (this.currentStacks > 0) {
      const lostStacks = this.currentStacks;
      this.currentStacks = 0;
      this.updatePlayerDamage();

      console.log(`[Chuksal] Hit! Lost ALL ${lostStacks} stacks. Reset to 0/${this.MAX_STACKS}`);

      // 상태 텍스트 숨김
      this.updateStatusText();
    }

    return damage; // 데미지는 변경하지 않음
  }

  /**
   * 플레이어 공격력 업데이트
   */
  private updatePlayerDamage(): void {
    if (!this.player) return;

    // 스택당 1% 증가
    const bonusDamage = this.currentStacks * this.DAMAGE_PER_KILL;

    // 기존 보너스 제거 후 새로운 보너스 적용 (언더플로우 방지)
    this.player.damageMultiplier = Math.max(
      0,
      this.player.damageMultiplier - this.previousBonus + bonusDamage
    );

    this.previousBonus = bonusDamage;
  }

  /**
   * 현재 스택 수 가져오기 (UI 표시용)
   */
  public getCurrentStacks(): number {
    return this.currentStacks;
  }

  /**
   * 최대 스택 수 가져오기 (UI 표시용)
   */
  public getMaxStacks(): number {
    return this.MAX_STACKS;
  }

  /**
   * 현재 보너스 퍼센트 가져오기 (UI 표시용)
   */
  public getBonusPercent(): number {
    return this.currentStacks * this.DAMAGE_PER_KILL * 100;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    if (this.player) {
      // 보너스 제거
      this.player.damageMultiplier = Math.max(0, this.player.damageMultiplier - this.previousBonus);
    }

    this.currentStacks = 0;
    this.previousBonus = 0;

    // BaseArtifact cleanup (centerUI 정리 포함)
    super.cleanup();
  }
}
