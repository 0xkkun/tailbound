/**
 * 부적 진화 무기 - 정문경
 *
 * 타입: 투사체 (Projectile)
 * 진화 조건: 부적 레벨 7 + 정문경 유물 보유
 * 강화 효과: 데미지 120%, 투사체 수 증가
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, WEAPON_DATA } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import { Projectile } from '@game/entities/Projectile';
import { getDirection } from '@game/utils/collision';
import { findClosestEnemies } from '@game/utils/targeting';
import { audioManager } from '@services/audioManager';
import type { Vector2 } from '@type/game.types';

import { TalismanWeapon } from '../TalismanWeapon';

export class TalismanEvolvedWeapon extends TalismanWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.talisman;

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '정문경';

    console.log(
      `✨ [TalismanEvolved] 부적 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 개수: ${this.projectileCount})`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('talisman', this.level);
    this.damage = stats.damage * this.balance.damageMultiplier;
    this.cooldown = stats.cooldown * this.balance.cooldownMultiplier;

    // 투사체 개수 계산: 기본 개수 + 진화 보너스 +2
    const baseCount = Math.floor((this.level + 1) / 2) * 2 - 1;
    this.projectileCount = baseCount + 2;
  }

  /**
   * 발사 (진화 에셋 사용)
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<Projectile[]> {
    if (!this.canFire()) {
      return [];
    }

    const projectiles: Projectile[] = [];
    const targets = findClosestEnemies(playerPos, enemies, this.projectileCount, 600);

    if (targets.length === 0) {
      return [];
    }

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target) continue;

      setTimeout(() => {
        audioManager.playTalismanSound();
      }, i * 50);

      const targetPos = { x: target.x, y: target.y };
      const direction = getDirection(playerPos, targetPos);

      const projectile = new Projectile(
        `talisman_evolved_${Date.now()}_${i}`,
        playerPos.x,
        playerPos.y,
        direction,
        0xffff00
      );

      projectile.weaponCategories = WEAPON_DATA.talisman.categories;

      if (player) {
        const critResult = player.rollCritical();
        projectile.isCritical = critResult.isCritical;
        projectile.damage = this.damage * critResult.damageMultiplier;
        projectile.playerRef = player;
      } else {
        projectile.damage = this.damage;
      }

      // 진화 에셋 사용
      await projectile.loadSpriteSheet(CDN_ASSETS.weapon.talisman_evolved, 32, 32, 24, 6);

      projectiles.push(projectile);
    }

    this.resetCooldown(player);
    return projectiles;
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    console.log(
      `✨ [TalismanEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 개수: ${this.projectileCount})`
    );
  }
}
