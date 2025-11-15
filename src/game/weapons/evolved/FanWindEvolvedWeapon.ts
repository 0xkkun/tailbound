/**
 * 부채바람 진화 무기 - 천마총 천마도
 *
 * 타입: 투사체 (Projectile)
 * 진화 조건: 부채바람 레벨 7 + 천마총 천마도 유물 보유
 * 강화 효과: 데미지 130%, 투사체 수 2배 증가, 관통 +1, 수명 종료 시 3개 분열
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE, WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, getWeaponData } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import { Projectile } from '@game/entities/Projectile';
import type { Vector2 } from '@type/game.types';

import { FanWindWeapon } from '../FanWindWeapon';

export class FanWindEvolvedWeapon extends FanWindWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.fan_wind;

  // 분열 투사체 저장소 (게임 씬에 추가하기 위함)
  public splitProjectiles: Projectile[] = [];

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '천마총 천마도';

    console.log(
      `✨ [FanWindEvolved] 부채바람 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 개수: ${this.projectileCount})`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('fan_wind', this.level);

    // 데미지
    this.damage = stats.damage * this.balance.damageMultiplier;
    this.cooldown = stats.cooldown * this.balance.cooldownMultiplier;

    // 투사체 개수 계산: 기본 개수 + 진화 보너스 +2
    const baseCount = Math.floor((this.level + 1) / 2) * 2 - 1;
    this.projectileCount = baseCount + 2;
  }

  /**
   * 발사 (진화 에셋 사용 + 관통 +1 + 수명 종료 시 3개 분열)
   * 부모 클래스의 fire를 호출한 후 진화 효과 적용
   */
  public fire(playerPos: Vector2, enemies: BaseEnemy[], player?: Player): Projectile[] {
    // 부모 클래스의 fire 호출
    const projectiles = super.fire(playerPos, enemies, player);

    const weaponData = getWeaponData('fan_wind');

    // 진화 효과 적용: 관통 +1 (damageDecayMin 증가) + 분열 효과
    for (const projectile of projectiles) {
      projectile.damageDecayMin =
        WEAPON_BALANCE.fan_wind.damageDecayMin + this.balance.splitDecayMinIncrease;
      // 진화 에셋으로 교체
      projectile.loadSpriteSheet(CDN_ASSETS.weapon.wind_evolved, 32, 32, 12, 12);
      projectile.scale.set(3);

      // 분열 효과: 수명 종료 시 3개로 분열
      projectile.onExpire = (expiredProjectile: Projectile) => {
        this.createSplitProjectiles(expiredProjectile, weaponData, player);
      };
    }

    return projectiles;
  }

  /**
   * 분열 투사체 생성 (수명 종료 시 120도 간격으로 3개 생성)
   */
  private createSplitProjectiles(
    originalProjectile: Projectile,
    weaponData: ReturnType<typeof getWeaponData>,
    player?: Player
  ): void {
    const splitCount = this.balance.splitCount;
    const angleStep = (Math.PI * 2) / splitCount; // 120도 (2π/3)
    const splitDamageMultiplier = this.balance.splitDamageMultiplier; // 분열 투사체는 30% 데미지

    // 원본 투사체의 진행 방향을 기준으로 회전
    const baseAngle = Math.atan2(originalProjectile.y, originalProjectile.x);

    for (let i = 0; i < splitCount; i++) {
      const angle = baseAngle + angleStep * i;
      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      // 분열 투사체 생성
      const splitProjectile = new Projectile(
        `fanwind_split_${Date.now()}_${i}`,
        originalProjectile.x,
        originalProjectile.y,
        direction,
        0x87ceeb
      );

      // 무기 카테고리 복사
      splitProjectile.weaponCategories = weaponData.categories;

      // 치명타 및 데미지 설정 (70%)
      if (player) {
        const critResult = player.rollCritical();
        splitProjectile.isCritical = critResult.isCritical;
        const splitDamage =
          originalProjectile.damage * splitDamageMultiplier * critResult.damageMultiplier;
        splitProjectile.setDamage(splitDamage);
        splitProjectile.playerRef = player;
      } else {
        const splitDamage = originalProjectile.damage * splitDamageMultiplier;
        splitProjectile.setDamage(splitDamage);
      }

      // 투사체 속성 설정
      splitProjectile.speed = weaponData.projectileSpeed || 350;
      splitProjectile.lifeTime =
        (weaponData.projectileLifetime || 1.2) * this.balance.splitLifetimeMultiplier; // 분열 투사체는 수명 70%
      splitProjectile.piercing = Infinity;

      // 관통 데미지 감소 활성화
      splitProjectile.damageDecayEnabled = true;
      splitProjectile.damageDecayMin =
        WEAPON_BALANCE.fan_wind.damageDecayMin + this.balance.splitDecayMinIncrease;

      // 서브 무기 에셋 사용 (32x32, 17프레임)
      splitProjectile.loadSpriteSheet(CDN_ASSETS.weapon.windSub, 32, 32, 17, 17);

      // 분열 투사체 크기 및 색상 조정
      splitProjectile.scale.set(this.balance.splitScale);

      // 분열 투사체 저장소에 추가 (게임 씬에서 가져갈 수 있도록)
      this.splitProjectiles.push(splitProjectile);
    }

    console.log(
      `🌪️💥 [FanWindEvolved] 투사체 분열! 위치: (${originalProjectile.x.toFixed(0)}, ${originalProjectile.y.toFixed(0)}), 3개 생성`
    );
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    console.log(
      `✨ [FanWindEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 개수: ${this.projectileCount})`
    );
  }
}
