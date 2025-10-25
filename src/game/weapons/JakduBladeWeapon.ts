/**
 * 작두날 무기
 *
 * 타입: 고정형 (Attached)
 * 플레이어 좌우에 고정되어 나타나는 작두
 */

import type { Container } from 'pixi.js';

import { calculateWeaponStats } from '@/game/data/weapons';
import { AttachedEntity } from '@/game/entities/AttachedEntity';
import type { BaseEnemy } from '@/game/entities/enemies';
import type { Player } from '@/game/entities/Player';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class JakduBladeWeapon extends Weapon {
  private blades: AttachedEntity[] = [];
  private bladeCount: number = 1; // 처음엔 왼쪽 1개
  private offsetDistance: number = 60; // 플레이어로부터의 거리

  constructor() {
    const stats = calculateWeaponStats('jakdu_blade', 1);
    super('작두날', stats.damage, stats.cooldown);
  }

  /**
   * 공격 체크 (타이밍에 맞춰 애니메이션 재생)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fire(_playerPos: Vector2, _enemies: BaseEnemy[], _player?: Player): never[] {
    if (!this.canFire()) {
      return [];
    }

    // 모든 작두 애니메이션 재생
    for (const blade of this.blades) {
      blade.startAttack(1.0); // 1.0초 동안 공격 애니메이션 (느리게)
    }

    this.resetCooldown();

    return [];
  }

  /**
   * 작두 생성 (무기 추가 시 또는 레벨업 시 호출)
   */
  public async spawnBlades(gameLayer: Container): Promise<void> {
    // 기존 작두 제거
    for (const blade of this.blades) {
      gameLayer.removeChild(blade);
      blade.destroy();
    }
    this.blades = [];

    // 새 작두 생성
    const positions: Array<'left' | 'right' | 'forward'> =
      this.bladeCount >= 2 ? ['right', 'left'] : ['forward'];

    for (const position of positions) {
      const blade = new AttachedEntity({
        position,
        offsetDistance: this.offsetDistance,
        damage: this.damage,
        radius: 64,
        color: 0xff0000,
      });

      // 작두 스프라이트 로드 (3x3 = 9 프레임, 각 프레임 128x128)
      await blade.loadSpriteSheet('/assets/weapon/jakdu.png', 128, 128, 9, 3, {
        animationSpeed: 0.2, // 느리게 (0.5 -> 0.2)
        loop: false, // 한 번만 재생
        flipX: position === 'right', // 오른쪽은 좌우 반전
        rotation:
          position === 'right'
            ? Math.PI / 2 // 오른쪽 90도
            : position === 'left'
              ? -Math.PI / 2 // 왼쪽 -90도
              : 0, // forward는 방향에 따라 동적으로 회전 (나중에 업데이트에서 처리)
      });

      this.blades.push(blade);
      gameLayer.addChild(blade);
    }

    console.log(`🔪 작두날 x${this.blades.length} 생성`);
  }

  /**
   * 매 프레임 업데이트
   */
  public updateBlades(deltaTime: number, player: Player): void {
    for (const blade of this.blades) {
      blade.update(deltaTime, player);
    }
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('jakdu_blade', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 모든 작두의 데미지 업데이트
    for (const blade of this.blades) {
      blade.damage = this.damage;
    }

    // 레벨업 효과: 레벨 2부터 오른쪽 작두 추가
    if (this.level >= 2 && this.bladeCount < 2) {
      this.bladeCount = 2;
    }

    console.log(`🔪 작두날 레벨 ${this.level}! (개수: ${this.bladeCount})`);
  }

  /**
   * 작두 접근자
   */
  public getBlades(): AttachedEntity[] {
    return this.blades;
  }

  /**
   * 정리
   */
  public destroyBlades(gameLayer: Container): void {
    for (const blade of this.blades) {
      gameLayer.removeChild(blade);
      blade.destroy();
    }
    this.blades = [];
  }
}
