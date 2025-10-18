/**
 * 광역 공격 이펙트
 *
 * 일정 범위에 피해를 주는 AoE (Area of Effect) 엔티티
 * 사용: 목탁 소리, 폭발, 마법진 등
 */

import { Container, Graphics } from 'pixi.js';

export class AoEEffect extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 100;

  private lifetime: number = 0;
  private maxLifetime: number = 0.5; // 0.5초 동안 표시
  private hasDealtDamage: boolean = false; // 피해를 한 번만 주기 위해

  // 시각 효과
  private circle: Graphics;
  private color: number;

  constructor(x: number, y: number, radius: number, damage: number, color: number = 0xffa500) {
    super();

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.color = color;

    // 시각 효과 (확장되는 원)
    this.circle = new Graphics();
    this.addChild(this.circle);

    this.render();
  }

  /**
   * 업데이트 (확장 애니메이션 + 페이드아웃)
   */
  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 진행도 (0.0 ~ 1.0)
    const progress = this.lifetime / this.maxLifetime;

    // 페이드아웃 효과
    this.alpha = 1 - progress;

    // 확장 애니메이션 (50% → 100%)
    const scale = 0.5 + progress * 0.5;
    this.scale.set(scale);
  }

  /**
   * 시각 효과 렌더링
   */
  private render(): void {
    this.circle.clear();

    // 외곽선만 그리기 (채우기 없음)
    this.circle.lineStyle(4, this.color, 0.8);
    this.circle.drawCircle(0, 0, this.radius);

    // 또는 반투명 채우기
    // this.circle.beginFill(this.color, 0.3);
    // this.circle.drawCircle(0, 0, this.radius);
    // this.circle.endFill();
  }

  /**
   * 이미 피해를 줬는지 확인 (중복 피해 방지)
   */
  public hasHitEnemy(): boolean {
    return this.hasDealtDamage;
  }

  /**
   * 피해를 줬다고 표시
   */
  public markAsHit(): void {
    this.hasDealtDamage = true;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.circle.destroy();
    super.destroy({ children: true });
  }
}
