/**
 * 체력 포션
 *
 * 몬스터 처치 시 10% 확률로 드랍
 * 플레이어가 획득 시 최대 체력의 50% 회복
 */

import { Container, Sprite, Text } from 'pixi.js';

import type { Player } from './Player';

export class HealthPotion extends Container {
  public active: boolean = true;
  public radius: number = 12; // 포션 크기

  private healAmount: number = 0.5; // 50% 회복
  private attractRadius: number = 80; // 플레이어 근처에서 끌려오는 범위
  private attractSpeed: number = 300; // 끌려오는 속도 (픽셀/초)
  private isAttracted: boolean = false;

  // 시각 효과
  private visual: Text | Sprite;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // 임시 이모지 (나중에 Sprite로 교체 가능)
    this.visual = new Text({
      text: '❤️',
      style: {
        fontSize: 24,
      },
    });
    this.visual.anchor.set(0.5);
    this.addChild(this.visual);
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
   * 이미지로 교체 (나중에)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadTexture(_texturePath: string): Promise<void> {
    // TODO: 포션 이미지가 준비되면 Sprite로 교체
    // const texture = await Assets.load(_texturePath);
    // this.removeChild(this.visual);
    // this.visual.destroy();
    // this.visual = new Sprite(texture);
    // this.visual.anchor.set(0.5);
    // this.addChild(this.visual);
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    super.destroy({ children: true });
  }
}
