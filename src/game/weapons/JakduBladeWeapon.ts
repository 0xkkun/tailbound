/**
 * 작두날 무기
 *
 * 타입: 고정형 (Attached)
 * 플레이어 좌우에 고정되어 나타나는 작두
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { WEAPON_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, WEAPON_DATA } from '@game/data/weapons';
import { AttachedEntity } from '@game/entities/AttachedEntity';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import type { Projectile } from '@game/entities/Projectile';
import { audioManager } from '@services/audioManager';
import type { Vector2 } from '@type/game.types';
import type { Container } from 'pixi.js';

import { Weapon } from './Weapon';

export class JakduBladeWeapon extends Weapon {
  protected blades: AttachedEntity[] = [];
  protected bladeCount: number = 1; // 처음엔 왼쪽 1개
  protected offsetDistance: number = WEAPON_BALANCE.jakdu_blade.offsetDistance;
  protected attackRadius: number = WEAPON_BALANCE.jakdu_blade.attackRadius;

  constructor() {
    const stats = calculateWeaponStats('jakdu_blade', 1);
    super('weapon_jakdu', '작두날', stats.damage, stats.cooldown);
  }

  /**
   * 공격 체크 (타이밍에 맞춰 애니메이션 재생)
   * 기본 작두는 투사체를 발사하지 않지만, 진화 시 투사체 발사 가능
   */
  public async fire(
    _playerPos: Vector2,
    _enemies: BaseEnemy[],
    player?: Player
  ): Promise<Projectile[]> {
    if (!this.canFire()) {
      return [];
    }

    const config = WEAPON_BALANCE.jakdu_blade;

    // 모든 작두 애니메이션 재생
    for (let i = 0; i < this.blades.length; i++) {
      const blade = this.blades[i];
      // 효과음 재생 (작두 개수만큼, 간격을 두고)
      setTimeout(() => {
        audioManager.playJakduBladeSound();
      }, i * config.soundInterval); // 설정된 간격
      blade.startAttack(config.attackDuration); // 설정된 지속시간 동안 공격 애니메이션
    }

    this.resetCooldown(player);

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
    const config = WEAPON_BALANCE.jakdu_blade;
    const positions: Array<'left' | 'right' | 'forward'> =
      this.bladeCount >= 2 ? ['right', 'left'] : ['forward'];

    for (const position of positions) {
      const blade = new AttachedEntity({
        position,
        offsetDistance: this.offsetDistance,
        damage: this.damage,
        radiusX: this.attackRadius * config.radiusMultiplierX, // 가로 배율
        radiusY: this.attackRadius * config.radiusMultiplierY, // 세로 배율
        color: 0xff0000,
      });

      // 무기 카테고리 설정 (유물 시스템용)
      blade.weaponCategories = WEAPON_DATA.jakdu_blade.categories;

      // 작두 스프라이트 로드 (3x3 = 9 프레임, 각 프레임 128x128)
      await blade.loadSpriteSheet(`${CDN_BASE_URL}/assets/weapon/jakdu.png`, 128, 128, 9, 3, {
        animationSpeed: 0.2, // 느리게 (0.5 -> 0.2)
        loop: false, // 한 번만 재생
        flipX: position === 'right', // 오른쪽은 좌우 반전
        rotation:
          position === 'right'
            ? Math.PI / 2 // 오른쪽 90도
            : position === 'left'
              ? -Math.PI / 2 // 왼쪽 -90도
              : 0, // forward는 방향에 따라 동적으로 회전 (나중에 업데이트에서 처리)
        scale: 2, // 스프라이트 크기 2배
      });

      this.blades.push(blade);
      gameLayer.addChild(blade);
    }

    console.log(`🔪 작두날 x${this.blades.length} 생성 (범위: ${this.attackRadius})`);
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
    const config = WEAPON_BALANCE.jakdu_blade;
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 범위 증가
    const radiusPerLevel = config.levelScaling.radiusPerLevel || 5;
    this.attackRadius = config.attackRadius + radiusPerLevel * (this.level - 1);

    // 모든 작두의 데미지와 범위 업데이트 (타원형)
    for (const blade of this.blades) {
      blade.damage = this.damage;
      blade.radiusX = this.attackRadius * config.radiusMultiplierX; // 가로 배율
      blade.radiusY = this.attackRadius * config.radiusMultiplierY; // 세로 배율
      blade.radius = Math.max(blade.radiusX, blade.radiusY); // 하위 호환용
    }

    // 레벨업 효과: 레벨 2부터 오른쪽 작두 추가
    if (this.level >= 2 && this.bladeCount < 2) {
      this.bladeCount = 2;
    }

    console.log(
      `🔪 작두날 레벨 ${this.level}! (개수: ${this.bladeCount}, 범위: ${this.attackRadius})`
    );
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

  /**
   * 진화 전 정리 작업 (WeaponLifecycle 인터페이스 구현)
   */
  public onBeforeEvolution(gameLayer: Container): void {
    this.destroyBlades(gameLayer);
  }
}
