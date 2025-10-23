/**
 * 체력 포션
 *
 * 몬스터 처치 시 10% 확률로 드랍
 * 플레이어가 획득 시 최대 체력의 50% 회복
 */

import { Assets, Container, Sprite, Text } from 'pixi.js';

import { POTION_BALANCE } from '@/config/balance.config';

import type { Player } from './Player';

export class HealthPotion extends Container {
  public active: boolean = true;
  public radius: number = POTION_BALANCE.radius;

  private healAmount: number = POTION_BALANCE.healAmount;
  private attractRadius: number = POTION_BALANCE.attractRadius;
  private attractSpeed: number = POTION_BALANCE.attractSpeed;
  private isAttracted: boolean = false;

  // 시각 효과
  private visual: Text | Sprite;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // 임시 이모지 폴백 (스프라이트 로드 전)
    this.visual = new Text({
      text: '❤️',
      style: {
        fontSize: 32,
      },
    });
    this.visual.anchor.set(0.5);
    this.addChild(this.visual);

    // health-plus 스프라이트 로드
    this.loadSprite();
  }

  /**
   * health-plus 스프라이트 로드
   */
  private async loadSprite(): Promise<void> {
    try {
      const texture = await Assets.load('/assets/power-up/health-plus.png');

      // 기존 이모지 제거
      this.removeChild(this.visual);
      if (this.visual instanceof Text) {
        this.visual.destroy();
      }

      // 스프라이트로 교체
      this.visual = new Sprite(texture);
      this.visual.anchor.set(0.5);
      this.visual.scale.set(0.5); // 크기 조정 (48x48 아이콘)
      this.addChild(this.visual);
    } catch (error) {
      console.warn('Failed to load health-plus sprite, using emoji fallback:', error);
    }
  }

  /**
   * 업데이트 (플레이어 추적)
   */
  public update(deltaTime: number, player: Player): void {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 플레이어가 획득 범위에 들어오면 수집
    if (distance < player.radius + this.radius) {
      this.collect(player);
      return;
    }

    // 플레이어가 끌어당기는 범위에 들어오면 추적
    const effectiveAttractRadius = this.attractRadius * player.pickupRangeMultiplier;
    if (distance < effectiveAttractRadius) {
      this.isAttracted = true;
    }

    // 끌려오기
    if (this.isAttracted) {
      const moveSpeed = this.attractSpeed * deltaTime;
      const moveDistance = Math.min(moveSpeed, distance);

      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
    }
  }

  /**
   * 포션 수집
   */
  private collect(player: Player): void {
    // 체력 회복 (최대 체력의 50%)
    const healAmount = player.maxHealth * this.healAmount;
    const oldHealth = player.health;
    player.health = Math.min(player.health + healAmount, player.maxHealth);
    const actualHeal = player.health - oldHealth;

    console.log(
      `❤️ 체력 포션 획득! +${Math.floor(actualHeal)} HP (${Math.floor(player.health)}/${player.maxHealth})`
    );

    this.active = false;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    super.destroy({ children: true });
  }
}
