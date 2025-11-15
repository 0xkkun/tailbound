/**
 * 목탁소리 진화 무기 - 금동미륵보살반가사유상
 *
 * 타입: 범위형 (Area)
 * 진화 조건: 목탁소리 레벨 7 + 금동미륵보살반가사유상 유물 보유
 * 강화 효과: 데미지 향상, 범위 증가
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, WEAPON_DATA } from '@game/data/weapons';
import { AoEEffect } from '@game/entities/AoEEffect';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import { audioManager } from '@services/audioManager';
import type { Vector2 } from '@type/game.types';

import { MoktakSoundWeapon } from '../MoktakSoundWeapon';

export class MoktakSoundEvolvedWeapon extends MoktakSoundWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.moktak_sound;
  private attackCounter: number = 0; // 공격 횟수 카운터
  private readonly SPECIAL_ATTACK_INTERVAL = 10; // 10번째마다 특수 공격

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '금동미륵보살반가사유상';

    console.log(
      `✨ [MoktakEvolved] 목탁 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 범위: ${this.aoeRadius})`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('moktak_sound', this.level);
    this.damage = stats.damage * this.balance.damageMultiplier;
    this.cooldown = stats.cooldown * this.balance.cooldownMultiplier;

    // 범위 계산
    // 기본: 150px 시작, 2레벨당 +20px
    // 진화: 배율 적용
    const BASE_RADIUS = 150;
    const RADIUS_PER_2_LEVELS = 20;
    const baseRadius = BASE_RADIUS + Math.floor(this.level / 2) * RADIUS_PER_2_LEVELS;
    this.aoeRadius = baseRadius * this.balance.rangeMultiplier;
  }

  /**
   * 광역 공격 발동 (진화 에셋 사용)
   * 10번째 공격마다 모든 적 아래에서 목탁 발동
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<AoEEffect[]> {
    if (!this.canFire()) {
      return [];
    }

    this.attackCounter++;
    const isSpecialAttack = this.attackCounter % this.SPECIAL_ATTACK_INTERVAL === 0;

    audioManager.playMoktakSound();

    let finalDamage = this.damage;
    let finalRadius = this.aoeRadius;
    let isCritical = false;

    if (player) {
      const critResult = player.rollCritical();
      finalDamage = this.damage * critResult.damageMultiplier;
      isCritical = critResult.isCritical;
      finalRadius = this.aoeRadius;
    }

    const effects: AoEEffect[] = [];

    if (isSpecialAttack) {
      // 10번째 공격: 모든 적 아래에서 목탁 발동
      const aliveEnemies = enemies.filter((enemy) => enemy.active && enemy.isAlive());

      console.log(
        `🔔💥 [MoktakEvolved] 특수 공격! 모든 적 아래 목탁 발동 (${aliveEnemies.length}마리)`
      );

      for (const enemy of aliveEnemies) {
        const effect = new AoEEffect(enemy.x, enemy.y, finalRadius, finalDamage, 0xffa500);
        effect.isCritical = isCritical;
        effect.weaponCategories = WEAPON_DATA.moktak_sound.categories;

        // 특수 공격: 적 위치에 고정 (플레이어를 따라다니지 않음)
        effect.shouldFollowPlayer = false;

        // 진화 에셋 사용
        await effect.loadSpriteSheet(CDN_ASSETS.weapon.mocktak_evolved, 120, 120, 30, 6);

        effect.setTickInterval(0.5);
        effect.setLifetime(0.8); // 짧은 지속시간 (1회 타격용)

        effects.push(effect);
      }
    } else {
      // 일반 공격: 플레이어 위치에서 발동
      const effect = new AoEEffect(playerPos.x, playerPos.y, finalRadius, finalDamage, 0xffa500);
      effect.isCritical = isCritical;
      effect.weaponCategories = WEAPON_DATA.moktak_sound.categories;

      // 진화 에셋 사용
      await effect.loadSpriteSheet(CDN_ASSETS.weapon.mocktak_evolved, 120, 120, 30, 6);

      effect.setTickInterval(0.5);

      // 일반 공격: 플레이어를 따라다님 (게임 씬에서 설정)

      effects.push(effect);
    }

    this.resetCooldown(player);

    console.log(
      `🔔 [MoktakEvolved] 발동! (카운터: ${this.attackCounter}, 범위: ${finalRadius.toFixed(0)}px, 효과: ${effects.length}개)`
    );

    return effects;
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    console.log(
      `✨ [MoktakEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 범위: ${this.aoeRadius})`
    );
  }
}
