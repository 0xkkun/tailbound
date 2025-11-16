/**
 * 척살 유물
 * 처치할 때마다 공격력 1%씩 증가 (최대 50%)
 * 피해를 입으면 모든 스택 손실
 */

import { CDN_ASSETS } from '@config/assets.config';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { IGameScene } from '@type/scene.types';
import { Assets, Container, Sprite, Text } from 'pixi.js';

import { BaseArtifact } from '../base/BaseArtifact';

export class ChuksalArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly DAMAGE_PER_KILL = 0.01; // 처치당 1% 증가
  private readonly MAX_STACKS = 50; // 최대 50 스택 (50% 증가)
  private readonly ICON_SIZE = 20; // 아이콘 크기 (중앙 유물 표시용)
  private readonly TEXT_OFFSET_Y = 26; // 텍스트 Y 오프셋 (아이콘 아래)

  // ====== 상태 ======
  private currentStacks: number = 0;
  private previousBonus: number = 0; // 이전 보너스 값 (내부 관리)
  private statusUI?: Container; // UI 컨테이너 (아이콘 + 텍스트)
  private statusText?: Text; // 퍼센트 텍스트
  private statusIcon?: Sprite; // 척살 아이콘

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
    if (!this.statusUI) {
      this.tryCreateStatusUI();
    }
  }

  /**
   * 중앙 유물 컨테이너에 아이콘+텍스트 생성 (UI 준비 확인)
   */
  private async tryCreateStatusUI(): Promise<void> {
    if (!this.scene) return;

    // artifactIconsContainer 확인
    if (!this.scene.artifactIconsContainer) {
      // 컨테이너가 아직 준비 안됨, 다음 프레임에 재시도
      return;
    }

    try {
      // 척살 아이콘 로드
      const iconTexture = await Assets.load(this.data.iconPath);

      // UI 컨테이너 생성 (아이콘 + 텍스트)
      this.statusUI = new Container();

      // 아이콘 생성 (상단 중앙)
      this.statusIcon = new Sprite(iconTexture);
      this.statusIcon.anchor.set(0.5, 0); // 중앙 정렬
      this.statusIcon.width = this.ICON_SIZE;
      this.statusIcon.height = this.ICON_SIZE;
      this.statusIcon.x = 0;
      this.statusIcon.y = 0;

      // 텍스트 생성 (아이콘 아래)
      this.statusText = new Text('', {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 12,
        fill: 0xffffff,
      });
      this.statusText.resolution = 2;
      this.statusText.anchor.set(0.5, 0); // 중앙 정렬
      this.statusText.x = 0;
      this.statusText.y = this.TEXT_OFFSET_Y;

      this.statusUI.addChild(this.statusIcon);
      this.statusUI.addChild(this.statusText);

      // artifactIconsContainer에 추가
      this.scene.artifactIconsContainer.addChild(this.statusUI);

      // 초기 텍스트 설정
      this.updateStatusText();

      console.log('[Chuksal] Status UI created in artifact container');
    } catch (error) {
      console.error('[Chuksal] Failed to load icon:', error);
    }
  }

  /**
   * 상태 UI 업데이트 (아이콘 + 텍스트)
   */
  private updateStatusText(): void {
    if (!this.statusText || !this.statusIcon) return;

    // 유물 보유 시 항상 표시 (0%도 표시)
    const bonus = Math.floor(this.currentStacks * this.DAMAGE_PER_KILL * 100);
    this.statusText.text = `+${bonus}%`;
    this.statusText.alpha = 1;
    this.statusIcon.alpha = 1;
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
    // UI 컨테이너 제거 (아이콘, 텍스트 포함)
    if (this.statusUI) {
      if (!this.statusUI.destroyed) {
        this.statusUI.destroy({ children: true });
      }
      this.statusUI = undefined;
    }

    this.statusIcon = undefined;
    this.statusText = undefined;

    if (this.player) {
      // 보너스 제거
      this.player.damageMultiplier = Math.max(0, this.player.damageMultiplier - this.previousBonus);
    }

    this.currentStacks = 0;
    this.previousBonus = 0;
    super.cleanup();
  }
}
