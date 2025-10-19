/**
 * 작두날 무기
 *
 * 타입: 근접 (Melee)
 * 플레이어 주변을 크게 휘두르는 작두
 */

import { calculateWeaponStats } from '@/game/data/weapons';
import type { BaseEnemy } from '@/game/entities/enemies';
import { MeleeSwing } from '@/game/entities/MeleeSwing';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class JakduBladeWeapon extends Weapon {
  private swingRadius: number = 100;
  private sweepAngle: number = Math.PI; // 180도
  private currentAngle: number = 0; // 다음 휘두를 각도

  constructor() {
    const stats = calculateWeaponStats('jakdu_blade', 1);
    super('작두날', stats.damage, stats.cooldown);
  }

  /**
   * 근접 공격 휘두르기
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fire(playerPos: Vector2, _enemies: BaseEnemy[]): MeleeSwing[] {
    if (!this.canFire()) {
      return [];
    }

    // 휘두르기 생성
    const swing = new MeleeSwing(
      playerPos.x,
      playerPos.y,
      this.currentAngle,
      this.swingRadius,
      this.damage,
      0xff0000 // 빨간색 (작두날)
    );

    // 다음 휘두르기 각도 (반대 방향으로 왔다갔다)
    this.currentAngle += Math.PI; // 180도 회전
    if (this.currentAngle >= Math.PI * 2) {
      this.currentAngle -= Math.PI * 2;
    }

    this.resetCooldown();

    console.log(`🔪 작두날 휘두르기! (범위: ${this.swingRadius}px)`);

    return [swing];
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('jakdu_blade', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 레벨업 효과
    if (this.level % 2 === 0) {
      this.swingRadius += 15; // 짝수 레벨마다 범위 +15
    }

    if (this.level % 3 === 0 && this.sweepAngle < Math.PI * 2) {
      this.sweepAngle += Math.PI / 6; // 3레벨마다 각도 +30도 (최대 360도)
    }

    console.log(`🔪 작두날 레벨 ${this.level}! (범위: ${this.swingRadius}px)`);
  }

  /**
   * 현재 범위 반환
   */
  public getRadius(): number {
    return this.swingRadius;
  }
}
