/**
 * 보스 투사체 - 번개 탄막
 *
 * 백호 보스가 발사하는 번개 속성 투사체
 */

import { Container, Graphics } from 'pixi.js';

import type { Player } from './Player';

export class BossProjectile extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number;

  // 투사체 속성
  public damage: number;
  public speed: number;
  public lifeTime: number;
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: { x: number; y: number };

  // 시각 효과
  private visual: Graphics;
  private glowEffect: Graphics; // 발광 효과

  // 발광 애니메이션
  private pulseTimer: number = 0;

  constructor(
    id: string,
    x: number,
    y: number,
    direction: { x: number; y: number },
    damage: number,
    speed: number,
    radius: number = 12,
    lifeTime: number = 4
  ) {
    super();

    this.id = id;
    this.direction = direction;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = speed;
    this.radius = radius;
    this.lifeTime = lifeTime;

    // 발광 효과 (뒤에 배치)
    this.glowEffect = new Graphics();
    this.addChild(this.glowEffect);

    // 메인 비주얼
    this.visual = new Graphics();
    this.addChild(this.visual);

    this.render();
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    // 이동
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;

    // 생명 시간 체크
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.lifeTime) {
      this.active = false;
    }

    // 발광 애니메이션
    this.pulseTimer += deltaTime;
    this.updateGlow();
  }

  /**
   * 플레이어와 충돌 체크
   */
  public checkPlayerCollision(player: Player): boolean {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.radius + player.radius;
  }

  /**
   * 화면 밖 체크 (월드 좌표 기준으로 넓은 범위 체크)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isOutOfBounds(_width: number, _height: number): boolean {
    if (!this.active || this.destroyed) {
      return true;
    }

    // 월드 좌표에서 더 넓은 범위 허용 (카메라가 움직이므로)
    const worldBoundary = 3000; // 월드 경계를 3000으로 설정
    return (
      this.x < -worldBoundary ||
      this.x > worldBoundary ||
      this.y < -worldBoundary ||
      this.y > worldBoundary
    );
  }

  /**
   * 렌더링
   */
  private render(): void {
    if (this.destroyed) {
      return;
    }

    // 메인 번개 구체 (파란색)
    this.visual.clear();
    this.visual.circle(0, 0, this.radius);
    this.visual.fill({ color: 0x00ffff, alpha: 1.0 }); // 밝은 청록색

    // 테두리 (밝게)
    this.visual.circle(0, 0, this.radius);
    this.visual.stroke({ width: 2, color: 0xffffff });
  }

  /**
   * 발광 효과 업데이트
   */
  private updateGlow(): void {
    if (this.destroyed) {
      return;
    }

    // 펄스 효과 (0.5초 주기)
    const pulse = Math.sin(this.pulseTimer * Math.PI * 4) * 0.3 + 0.7; // 0.4~1.0

    this.glowEffect.clear();
    this.glowEffect.circle(0, 0, this.radius * 1.5);
    this.glowEffect.fill({ color: 0x00ffff, alpha: 0.3 * pulse });

    // 외곽 발광
    this.glowEffect.circle(0, 0, this.radius * 2);
    this.glowEffect.fill({ color: 0x00ffff, alpha: 0.1 * pulse });
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    this.glowEffect.destroy();
    super.destroy({ children: true });
  }
}
