/**
 * 근접 공격 휘두르기 이펙트
 *
 * 플레이어 주변을 부채꼴로 휘두르는 근접 무기 엔티티
 * 사용: 작두날, 칼, 창 등
 */

import { Container, Graphics } from 'pixi.js';

export class MeleeSwing extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 0;
  public startAngle: number = 0;
  public sweepAngle: number = Math.PI; // 180도 (라디안)
  public isCritical: boolean = false;

  private lifetime: number = 0;
  private maxLifetime: number = 0.3; // 0.3초 동안 휘두르기
  private hasDealtDamage: Set<string> = new Set(); // 적 ID 저장 (중복 피해 방지)

  // 시각 효과
  private blade: Graphics;
  private color: number;

  constructor(
    x: number,
    y: number,
    startAngle: number,
    radius: number,
    damage: number,
    color: number = 0xff0000
  ) {
    super();

    this.x = x;
    this.y = y;
    this.startAngle = startAngle;
    this.radius = radius;
    this.damage = damage;
    this.color = color;

    this.blade = new Graphics();
    this.addChild(this.blade);

    this.render();
  }

  /**
   * 업데이트 (회전 애니메이션 + 페이드아웃)
   */
  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 진행도 (0.0 ~ 1.0)
    const progress = this.lifetime / this.maxLifetime;

    // 회전 애니메이션 (startAngle에서 startAngle + sweepAngle로)
    this.rotation = this.startAngle + this.sweepAngle * progress;

    // 페이드아웃
    this.alpha = 1 - progress;
  }

  /**
   * 부채꼴 시각 효과
   */
  private render(): void {
    this.blade.clear();

    // 반투명 빨간 부채꼴
    this.blade.beginFill(this.color, 0.5);
    this.blade.moveTo(0, 0);
    this.blade.arc(0, 0, this.radius, 0, this.sweepAngle);
    this.blade.lineTo(0, 0);
    this.blade.endFill();

    // 외곽선
    this.blade.lineStyle(2, this.color, 0.8);
    this.blade.moveTo(0, 0);
    this.blade.arc(0, 0, this.radius, 0, this.sweepAngle);
    this.blade.lineTo(0, 0);
  }

  /**
   * 해당 적을 이미 공격했는지 확인
   */
  public hasHitEnemy(enemyId: string): boolean {
    return this.hasDealtDamage.has(enemyId);
  }

  /**
   * 적 공격 표시
   */
  public markEnemyHit(enemyId: string): void {
    this.hasDealtDamage.add(enemyId);
  }

  /**
   * 각도 범위 내에 적이 있는지 확인
   *
   * @param enemyAngle 적의 각도 (라디안, 플레이어 기준)
   * @param enemyDistance 적과의 거리
   * @returns 범위 내에 있으면 true
   */
  public isInRange(enemyAngle: number, enemyDistance: number): boolean {
    // 거리 체크
    if (enemyDistance > this.radius) {
      return false;
    }

    // 각도 체크 (회전 고려)
    const currentAngle = this.rotation;
    const minAngle = currentAngle;
    const maxAngle = currentAngle + this.sweepAngle;

    // 각도 정규화 (-π ~ π)
    const normalizeAngle = (angle: number): number => {
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      return angle;
    };

    const normEnemyAngle = normalizeAngle(enemyAngle);
    const normMinAngle = normalizeAngle(minAngle);
    const normMaxAngle = normalizeAngle(maxAngle);

    // 범위 체크
    if (normMinAngle <= normMaxAngle) {
      return normEnemyAngle >= normMinAngle && normEnemyAngle <= normMaxAngle;
    } else {
      // 각도가 -π ~ π 경계를 넘는 경우
      return normEnemyAngle >= normMinAngle || normEnemyAngle <= normMaxAngle;
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.blade.destroy();
    super.destroy({ children: true });
  }
}
