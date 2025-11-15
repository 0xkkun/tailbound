/**
 * 정화수 물병 투사체
 *
 * 적 위치로 날아가서 착탄 시 WaterSplash 생성
 */

import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE } from '@config/balance.config';
import type { Vector2 } from '@type/game.types';
import { AnimatedSprite, Assets, Container } from 'pixi.js';

export class WaterBottle extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 16; // 32x32의 히트박스
  public isCritical: boolean = false;

  private startPos: Vector2;
  private velocity: Vector2;
  private lifetime: number = 0;
  private flightTime: number; // 비행 시간 (포물선 계산용)
  private visual?: AnimatedSprite;
  private hasReachedTarget: boolean = false;

  // 포물선 파라미터
  private arcHeight: number; // 포물선 높이

  // 착탄 정보
  public targetPos: Vector2;
  public aoeRadius: number;

  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    speed: number,
    aoeRadius: number,
    arcHeight: number
  ) {
    super();

    this.x = startX;
    this.y = startY;
    this.startPos = { x: startX, y: startY };
    this.targetPos = { x: targetX, y: targetY };
    this.aoeRadius = aoeRadius;
    this.arcHeight = arcHeight;

    // 타겟까지의 거리 계산
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // 비행 시간 계산 (거리 / 속도)
      this.flightTime = distance / speed;

      // 수평 속도
      this.velocity = {
        x: dx / this.flightTime,
        y: dy / this.flightTime,
      };
    } else {
      this.velocity = { x: 0, y: 0 };
      this.flightTime = 0;
      this.active = false;
    }
  }

  /**
   * 스프라이트 로드 (32x32 물병)
   */
  public async loadSprite(customAssetPath?: string): Promise<void> {
    try {
      const assetPath = customAssetPath || CDN_ASSETS.weapon.purifyingWater;
      const texture = await Assets.load(assetPath);

      this.visual = new AnimatedSprite([texture]);
      this.visual.anchor.set(0.5);
      this.visual.width = 32;
      this.visual.height = 32;

      this.addChild(this.visual);
    } catch (error) {
      console.warn('정화수 물병 스프라이트 로드 실패:', error);
    }
  }

  /**
   * 업데이트 (포물선 궤적)
   */
  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    // 비행 시간 초과 시 착탄
    if (this.lifetime >= this.flightTime) {
      this.x = this.targetPos.x;
      this.y = this.targetPos.y;
      this.hasReachedTarget = true;
      this.active = false;
      return;
    }

    // 진행률 (0 ~ 1)
    const progress = this.lifetime / this.flightTime;

    // 수평 이동 (선형)
    this.x = this.startPos.x + this.velocity.x * this.lifetime;
    this.y = this.startPos.y + this.velocity.y * this.lifetime;

    // 수직 오프셋 (포물선: -4h * t * (t - 1))
    // t=0일 때 0, t=0.5일 때 h(최고점), t=1일 때 0
    const verticalOffset = -this.arcHeight * 4 * progress * (progress - 1);
    this.y -= verticalOffset;

    // 회전 애니메이션 (날아가는 느낌)
    if (this.visual) {
      this.visual.rotation += 10 * deltaTime;
    }

    // 조기 도착 체크 (혹시 모를 경우)
    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    const config = WEAPON_BALANCE.purifying_water;
    if (distanceToTarget < config.bottleArrivalThreshold) {
      this.hasReachedTarget = true;
      this.active = false;
    }
  }

  /**
   * 타겟 도달 여부
   */
  public hasReached(): boolean {
    return this.hasReachedTarget;
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.visual) {
      this.visual.destroy();
    }
    super.destroy({ children: true });
  }
}
