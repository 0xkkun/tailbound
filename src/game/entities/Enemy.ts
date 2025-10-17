/**
 * 적 엔티티
 */

import { Container, Graphics } from 'pixi.js';

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';
import { getDirection } from '@/game/utils/collision';
import type { Vector2 } from '@/types/game.types';

export class Enemy extends Container {
  public id: string;
  public active: boolean = true;
  public tier: EnemyTier;
  public radius: number;

  // 스텟
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public xpDrop: number;

  // 그래픽스
  private graphics: Graphics;
  private color: number;

  // AI
  private targetPosition: Vector2 | null = null;

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super();

    this.id = id;
    this.x = x;
    this.y = y;
    this.tier = tier;

    // 티어에 따른 스탯 설정
    const stats = ENEMY_BALANCE[tier];
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;

    // 티어별 색상
    switch (tier) {
      case 'elite':
        this.color = 0xff8855;
        break;
      case 'boss':
        this.color = 0xff5555;
        break;
      default:
        this.color = 0x55ff55;
    }

    // 그래픽 생성
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    this.render();
  }

  /**
   * 타겟 설정 (플레이어 위치)
   */
  public setTarget(target: Vector2): void {
    this.targetPosition = target;
  }

  /**
   * 데미지 받기
   */
  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    // 피격 효과 (빨간색으로 잠깐 변경)
    this.flashRed();
  }

  /**
   * 생존 여부
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) {
      return;
    }

    // 플레이어를 향해 이동
    const currentPos = { x: this.x, y: this.y };
    const direction = getDirection(currentPos, this.targetPosition);

    this.x += direction.x * this.speed * deltaTime;
    this.y += direction.y * this.speed * deltaTime;

    this.render();
  }

  /**
   * 피격 효과 (빨간색 깜빡임)
   */
  private flashRed(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    this.graphics.clear();
    this.graphics.beginFill(0xff0000);
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();

    // 0.1초 후 원래 색으로
    setTimeout(() => {
      // destroyed 체크
      if (!this.destroyed && this.graphics) {
        this.render();
      }
    }, 100);
  }

  /**
   * 렌더링
   */
  private render(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    this.graphics.clear();

    // 티어별 색상 원
    this.graphics.beginFill(this.color);
    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();

    // 테두리
    this.graphics.lineStyle(2, 0xffffff);
    this.graphics.drawCircle(0, 0, this.radius);

    // 체력바 (적 위에 표시)
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const barY = -this.radius - 10;

    // 배경 (빨간색)
    this.graphics.beginFill(0xff0000);
    this.graphics.drawRect(-barWidth / 2, barY, barWidth, barHeight);
    this.graphics.endFill();

    // 현재 체력 (녹색)
    const healthRatio = this.health / this.maxHealth;
    this.graphics.beginFill(0x00ff00);
    this.graphics.drawRect(-barWidth / 2, barY, barWidth * healthRatio, barHeight);
    this.graphics.endFill();
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.graphics.destroy();
    super.destroy({ children: true });
  }
}
