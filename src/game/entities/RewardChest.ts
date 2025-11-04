/**
 * 보스 보상 상자
 *
 * 보스 처치 시 드롭되는 금색 상자
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { Assets, Container, Graphics, Sprite } from 'pixi.js';

import type { Player } from './Player';

// 보상 상자 상수
const REWARD_CHEST_CONSTANTS = {
  RADIUS: 40,
  PICKUP_RANGE: 100,
  ROTATION_SPEED: 1.0, // 라디안/초
  SPRITE: {
    PATH: `${CDN_BASE_URL}/assets/power-up/giftbox.png`,
    SCALE: 2.5,
  },
  GLOW: {
    COLOR: 0xffd700,
    INNER_RADIUS: 50,
    OUTER_RADIUS: 70,
    INNER_ALPHA: 0.3,
    OUTER_ALPHA: 0.1,
  },
  PULSE: {
    AMPLITUDE: 0.3, // 펄스 진폭
    BASE: 0.7, // 기본값 (0.4~1.0 범위)
  },
} as const;

export class RewardChest extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number = REWARD_CHEST_CONSTANTS.RADIUS;
  public pickupRange: number = REWARD_CHEST_CONSTANTS.PICKUP_RANGE;

  private chestSprite: Sprite | null = null;
  private glow: Graphics;

  // 애니메이션
  private pulseTimer: number = 0;
  private rotationSpeed: number = REWARD_CHEST_CONSTANTS.ROTATION_SPEED;

  constructor(id: string, x: number, y: number) {
    super();

    this.id = id;
    this.x = x;
    this.y = y;

    // 발광 효과 (뒤)
    this.glow = new Graphics();
    this.addChild(this.glow);

    // 상자 스프라이트 로드
    this.loadSprite();
  }

  /**
   * 스프라이트 로드
   */
  private async loadSprite(): Promise<void> {
    try {
      const texture = await Assets.load(REWARD_CHEST_CONSTANTS.SPRITE.PATH);

      // 픽셀 아트 렌더링 설정
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      this.chestSprite = new Sprite(texture);
      this.chestSprite.anchor.set(0.5);
      this.chestSprite.scale.set(REWARD_CHEST_CONSTANTS.SPRITE.SCALE);
      this.addChild(this.chestSprite);
    } catch (error) {
      console.error('보상 상자 스프라이트 로드 실패:', error);
    }
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    // 회전 애니메이션
    if (this.chestSprite) {
      this.chestSprite.rotation += this.rotationSpeed * deltaTime;
    }

    // 펄스 애니메이션
    this.pulseTimer += deltaTime;
    this.updateGlow();
  }

  /**
   * 플레이어와의 거리 체크
   */
  public checkPlayerProximity(player: Player): boolean {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.pickupRange;
  }

  /**
   * 발광 효과 업데이트
   */
  private updateGlow(): void {
    const { AMPLITUDE, BASE } = REWARD_CHEST_CONSTANTS.PULSE;
    const { COLOR, INNER_RADIUS, OUTER_RADIUS, INNER_ALPHA, OUTER_ALPHA } =
      REWARD_CHEST_CONSTANTS.GLOW;

    // 펄스 효과 (1초 주기)
    const pulse = Math.sin(this.pulseTimer * Math.PI * 2) * AMPLITUDE + BASE;

    this.glow.clear();

    // 내부 발광
    this.glow.circle(0, 0, INNER_RADIUS * pulse);
    this.glow.fill({ color: COLOR, alpha: INNER_ALPHA * pulse });

    // 외부 발광
    this.glow.circle(0, 0, OUTER_RADIUS * pulse);
    this.glow.fill({ color: COLOR, alpha: OUTER_ALPHA * pulse });
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.chestSprite) {
      this.chestSprite.destroy();
    }
    this.glow.destroy();
    super.destroy({ children: true });
  }
}
