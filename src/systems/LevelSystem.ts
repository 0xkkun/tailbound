/**
 * 레벨 시스템 - 경험치 획득과 레벨업 관리
 */

import { GAME_CONFIG } from '@/config/game.config';
import i18n from '@/i18n/config';

/**
 * 레벨별 필요 경험치 계산
 */
export function getRequiredXP(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 10; // 첫 레벨업은 매우 빠르게

  // 초반 (2-10): 지수 성장 (빠른 레벨업)
  if (level <= 10) {
    const base = 10;
    const growth = 1.6;
    return Math.floor(base * Math.pow(growth, level - 2));
  }

  // 중반 (11-20): 선형 증가
  if (level <= 20) {
    const baseXP = 320; // 레벨 10→11 필요량
    const increment = 60;
    return baseXP + (level - 11) * increment;
  }

  // 후반 (21-99): 완만한 증가
  const baseXP = 1145; // 레벨 20→21 필요량
  const increment = 110;
  return baseXP + (level - 21) * increment;
}

/**
 * 누적 경험치로 레벨 계산
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  let accumulated = 0;

  while (level < GAME_CONFIG.levelUp.maxLevel) {
    const required = getRequiredXP(level + 1);
    if (accumulated + required > totalXP) break;
    accumulated += required;
    level++;
  }

  return level;
}

/**
 * 레벨업 선택지 타입
 */
export interface LevelUpChoice {
  id: string;
  type: 'weapon' | 'upgrade' | 'passive' | 'heal';
  name: string;
  description: string;
  icon?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/**
 * 레벨 시스템 클래스
 */
export class LevelSystem {
  private level: number = 1;
  private currentXP: number = 0;
  private totalXP: number = 0;
  private isPaused: boolean = false;
  private pendingLevelUps: number = 0; // 대기 중인 레벨업 수

  // 콜백
  public onLevelUp?: (level: number, choices: LevelUpChoice[]) => void;
  public onXPGain?: (amount: number, total: number) => void;

  constructor() {
    this.reset();
  }

  /**
   * 시스템 초기화
   */
  public reset(): void {
    this.level = 1;
    this.currentXP = 0;
    this.totalXP = 0;
    this.isPaused = false;
    this.pendingLevelUps = 0;
  }

  /**
   * 경험치 획득
   */
  public gainXP(amount: number): boolean {
    if (this.isPaused) return false;
    if (this.level >= GAME_CONFIG.levelUp.maxLevel) return false;

    // 경험치 추가
    this.currentXP += amount;
    this.totalXP += amount;

    // 경험치 획득 이벤트
    this.onXPGain?.(amount, this.totalXP);

    // 레벨업 체크
    const requiredXP = getRequiredXP(this.level + 1);
    if (this.currentXP >= requiredXP) {
      this.levelUp();
      return true;
    }

    return false;
  }

  /**
   * 레벨업 처리
   */
  private levelUp(): void {
    const requiredXP = getRequiredXP(this.level + 1);
    this.currentXP -= requiredXP;
    this.level++;

    console.log(i18n.t('level.levelUp', { level: this.level }));

    // 추가 레벨업 체크 (남은 경험치로) - 먼저 모든 레벨업 처리
    let additionalLevelUps = 0;
    while (this.level < GAME_CONFIG.levelUp.maxLevel) {
      const nextRequired = getRequiredXP(this.level + 1);
      if (this.currentXP >= nextRequired) {
        this.currentXP -= nextRequired;
        this.level++;
        additionalLevelUps++;
        console.log(i18n.t('level.levelUp', { level: this.level }));
      } else {
        break;
      }
    }

    // 대기 중인 레벨업이 없으면 첫 번째 레벨업 UI 표시
    if (this.pendingLevelUps === 0) {
      // 레벨업 선택지 생성
      const choices = this.generateLevelUpChoices();

      console.log(i18n.t('level.choicesTitle'));
      choices.forEach((choice, index) => {
        console.log(
          i18n.t('level.choiceFormat', {
            index: index + 1,
            rarity: choice.rarity,
            name: choice.name,
            description: choice.description,
          })
        );
      });
      console.log('====================');

      // 레벨업 콜백 호출
      this.onLevelUp?.(this.level, choices);

      // 추가 레벨업이 있으면 대기열에 추가
      this.pendingLevelUps = additionalLevelUps;
    } else {
      // 이미 UI가 표시 중이면 대기열에 추가
      this.pendingLevelUps += 1 + additionalLevelUps;
    }
  }

  /**
   * 레벨업 선택지 생성 (완전 랜덤)
   */
  private generateLevelUpChoices(): LevelUpChoice[] {
    const allPossibleChoices: LevelUpChoice[] = [];

    // TODO: 실제 플레이어의 무기 보유 상태 확인 필요
    // TODO: 더 많은 무기 추가 필요 (현재 4개 -> 목표 10개+)

    // === 무기 선택지 ===
    const weapons = [
      {
        id: 'weapon_talisman',
        type: 'weapon' as const,
        name: i18n.t('weapons.talisman.name'),
        description: i18n.t('weapons.talisman.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'weapon_dokkaebi_fire',
        type: 'weapon' as const,
        name: i18n.t('weapons.dokkaebi.name'),
        description: i18n.t('weapons.dokkaebi.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'weapon_moktak',
        type: 'weapon' as const,
        name: i18n.t('weapons.moktak.name'),
        description: i18n.t('weapons.moktak.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'weapon_jakdu',
        type: 'weapon' as const,
        name: i18n.t('weapons.jakdu.name'),
        description: i18n.t('weapons.jakdu.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'weapon_fan_wind',
        type: 'weapon' as const,
        name: i18n.t('weapons.fanWind.name'),
        description: i18n.t('weapons.fanWind.description'),
        rarity: 'epic' as const,
      },
    ];

    // === 기존 스탯 업그레이드 (무력, 신속, 시간왜곡, 생명력, 영혼흡인) ===
    const statUpgrades = [
      // Common 등급 (작은 증가)
      {
        id: 'stat_damage_common',
        type: 'passive' as const,
        name: i18n.t('stats.damage.common.name'),
        description: i18n.t('stats.damage.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'stat_speed_common',
        type: 'passive' as const,
        name: i18n.t('stats.speed.common.name'),
        description: i18n.t('stats.speed.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'stat_cooldown_common',
        type: 'passive' as const,
        name: i18n.t('stats.cooldown.common.name'),
        description: i18n.t('stats.cooldown.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'stat_health_common',
        type: 'passive' as const,
        name: i18n.t('stats.health.common.name'),
        description: i18n.t('stats.health.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'stat_pickup_common',
        type: 'passive' as const,
        name: i18n.t('stats.pickup.common.name'),
        description: i18n.t('stats.pickup.common.description'),
        rarity: 'common' as const,
      },

      // Rare 등급 (중간 증가)
      {
        id: 'stat_damage_rare',
        type: 'passive' as const,
        name: i18n.t('stats.damage.rare.name'),
        description: i18n.t('stats.damage.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'stat_speed_rare',
        type: 'passive' as const,
        name: i18n.t('stats.speed.rare.name'),
        description: i18n.t('stats.speed.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'stat_cooldown_rare',
        type: 'passive' as const,
        name: i18n.t('stats.cooldown.rare.name'),
        description: i18n.t('stats.cooldown.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'stat_health_rare',
        type: 'passive' as const,
        name: i18n.t('stats.health.rare.name'),
        description: i18n.t('stats.health.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'stat_pickup_rare',
        type: 'passive' as const,
        name: i18n.t('stats.pickup.rare.name'),
        description: i18n.t('stats.pickup.rare.description'),
        rarity: 'rare' as const,
      },

      // Epic 등급 (큰 증가)
      {
        id: 'stat_damage_epic',
        type: 'passive' as const,
        name: i18n.t('stats.damage.epic.name'),
        description: i18n.t('stats.damage.epic.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'stat_speed_epic',
        type: 'passive' as const,
        name: i18n.t('stats.speed.epic.name'),
        description: i18n.t('stats.speed.epic.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'stat_cooldown_epic',
        type: 'passive' as const,
        name: i18n.t('stats.cooldown.epic.name'),
        description: i18n.t('stats.cooldown.epic.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'stat_health_epic',
        type: 'passive' as const,
        name: i18n.t('stats.health.epic.name'),
        description: i18n.t('stats.health.epic.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'stat_pickup_epic',
        type: 'passive' as const,
        name: i18n.t('stats.pickup.epic.name'),
        description: i18n.t('stats.pickup.epic.description'),
        rarity: 'epic' as const,
      },
    ];

    // === 새로운 파워업 (⚔️ 공격 강화) ===
    const combatPowerups = [
      // 치명타 확률 (필살)
      {
        id: 'powerup_crit_rate_common',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalRate.common.name'),
        description: i18n.t('powerups.combat.criticalRate.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_crit_rate_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalRate.rare.name'),
        description: i18n.t('powerups.combat.criticalRate.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_crit_rate_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalRate.epic.name'),
        description: i18n.t('powerups.combat.criticalRate.epic.description'),
        rarity: 'epic' as const,
      },
      // 치명타 피해량 (극살)
      {
        id: 'powerup_crit_damage_common',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalDamage.common.name'),
        description: i18n.t('powerups.combat.criticalDamage.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_crit_damage_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalDamage.rare.name'),
        description: i18n.t('powerups.combat.criticalDamage.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_crit_damage_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.criticalDamage.epic.name'),
        description: i18n.t('powerups.combat.criticalDamage.epic.description'),
        rarity: 'epic' as const,
      },
      // 공격 범위 (기류확산)
      {
        id: 'powerup_area_common',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.area.common.name'),
        description: i18n.t('powerups.combat.area.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_area_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.area.rare.name'),
        description: i18n.t('powerups.combat.area.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_area_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.combat.area.epic.name'),
        description: i18n.t('powerups.combat.area.epic.description'),
        rarity: 'epic' as const,
      },
    ];

    // === 새로운 파워업 (💪 생존/방어) ===
    const defensePowerups = [
      // 피해 감소 (강체)
      {
        id: 'powerup_damage_reduction_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.damageReduction.common.name'),
        description: i18n.t('powerups.defense.damageReduction.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_damage_reduction_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.damageReduction.rare.name'),
        description: i18n.t('powerups.defense.damageReduction.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_damage_reduction_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.damageReduction.epic.name'),
        description: i18n.t('powerups.defense.damageReduction.epic.description'),
        rarity: 'epic' as const,
      },
      // 체력 재생 (회복)
      {
        id: 'powerup_health_regen_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.healthRegen.common.name'),
        description: i18n.t('powerups.defense.healthRegen.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_health_regen_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.healthRegen.rare.name'),
        description: i18n.t('powerups.defense.healthRegen.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_health_regen_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.healthRegen.epic.name'),
        description: i18n.t('powerups.defense.healthRegen.epic.description'),
        rarity: 'epic' as const,
      },
      // 흡혈 (吸血)
      {
        id: 'powerup_life_steal_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.lifeSteal.common.name'),
        description: i18n.t('powerups.defense.lifeSteal.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_life_steal_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.lifeSteal.rare.name'),
        description: i18n.t('powerups.defense.lifeSteal.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_life_steal_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.lifeSteal.epic.name'),
        description: i18n.t('powerups.defense.lifeSteal.epic.description'),
        rarity: 'epic' as const,
      },
      // 보호막 (호신부)
      {
        id: 'powerup_shield_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.shield.common.name'),
        description: i18n.t('powerups.defense.shield.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_shield_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.shield.rare.name'),
        description: i18n.t('powerups.defense.shield.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_shield_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.shield.epic.name'),
        description: i18n.t('powerups.defense.shield.epic.description'),
        rarity: 'epic' as const,
      },
      // 회피 (回避)
      {
        id: 'powerup_dodge_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.dodgeRate.common.name'),
        description: i18n.t('powerups.defense.dodgeRate.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_dodge_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.dodgeRate.rare.name'),
        description: i18n.t('powerups.defense.dodgeRate.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_dodge_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.dodgeRate.epic.name'),
        description: i18n.t('powerups.defense.dodgeRate.epic.description'),
        rarity: 'epic' as const,
      },
    ];

    // === 새로운 파워업 (⚙️ 유틸리티) ===
    const utilityPowerups = [
      // 경험치 획득량 (수련)
      {
        id: 'powerup_xp_gain_common',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.xpGain.common.name'),
        description: i18n.t('powerups.utility.xpGain.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_xp_gain_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.xpGain.rare.name'),
        description: i18n.t('powerups.utility.xpGain.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_xp_gain_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.xpGain.epic.name'),
        description: i18n.t('powerups.utility.xpGain.epic.description'),
        rarity: 'epic' as const,
      },
      // 아이템 드롭률 (복덕)
      {
        id: 'powerup_drop_rate_common',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.dropRate.common.name'),
        description: i18n.t('powerups.utility.dropRate.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_drop_rate_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.dropRate.rare.name'),
        description: i18n.t('powerups.utility.dropRate.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_drop_rate_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.dropRate.epic.name'),
        description: i18n.t('powerups.utility.dropRate.epic.description'),
        rarity: 'epic' as const,
      },
      // 높은 등급 확률 (인연)
      {
        id: 'powerup_luck_common',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.luck.common.name'),
        description: i18n.t('powerups.utility.luck.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_luck_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.luck.rare.name'),
        description: i18n.t('powerups.utility.luck.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_luck_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.utility.luck.epic.name'),
        description: i18n.t('powerups.utility.luck.epic.description'),
        rarity: 'epic' as const,
      },
    ];

    // === 복합 파워업 (🧿 하이브리드) ===
    const hybridPowerups = [
      {
        id: 'powerup_inner_power',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.innerPower.name'),
        description: i18n.t('powerups.hybrid.innerPower.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_mental_technique',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.mentalTechnique.name'),
        description: i18n.t('powerups.hybrid.mentalTechnique.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_vitality',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.vitality.name'),
        description: i18n.t('powerups.hybrid.vitality.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_fortune',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.fortune.name'),
        description: i18n.t('powerups.hybrid.fortune.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'powerup_breathing',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.breathing.name'),
        description: i18n.t('powerups.hybrid.breathing.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'powerup_meditation',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.meditation.name'),
        description: i18n.t('powerups.hybrid.meditation.description'),
        rarity: 'epic' as const,
      },
      {
        id: 'powerup_revive',
        type: 'passive' as const,
        name: i18n.t('powerups.hybrid.revive.name'),
        description: i18n.t('powerups.hybrid.revive.description'),
        rarity: 'legendary' as const,
      },
    ];

    // 선택지 풀 구성 (가중치 적용)
    // - 무기: 3배 가중치 (빠른 무기 확보 유도)
    // - 기존 스탯: 2배 가중치 (기본 빌드)
    // - 공격/방어/유틸: 1배 (새로운 파워업)
    // - 복합: 선택지에 포함 (희귀하지만 강력한 효과)
    allPossibleChoices.push(...weapons);
    allPossibleChoices.push(...weapons); // 2번째
    allPossibleChoices.push(...weapons); // 3번째
    allPossibleChoices.push(...statUpgrades);
    allPossibleChoices.push(...statUpgrades); // 2번째
    allPossibleChoices.push(...combatPowerups);
    allPossibleChoices.push(...defensePowerups);
    allPossibleChoices.push(...utilityPowerups);
    allPossibleChoices.push(...hybridPowerups); // 복합 파워업 (rare/epic/legendary)

    // Fisher-Yates 셔플 알고리즘으로 완전한 랜덤 보장
    for (let i = allPossibleChoices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPossibleChoices[i], allPossibleChoices[j]] = [
        allPossibleChoices[j],
        allPossibleChoices[i],
      ];
    }

    // 3개의 랜덤 선택지 반환
    return allPossibleChoices.slice(0, 3);
  }

  /**
   * 레벨업 선택 처리
   */
  public selectChoice(choiceId: string): void {
    console.log(i18n.t('level.selected', { choiceId }));

    // TODO: 실제 선택 효과 적용
    // - 무기 추가
    // - 스탯 증가
    // - 체력 회복 등

    // 대기 중인 레벨업이 있으면 다음 레벨업 UI 표시
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps--;

      // 다음 레벨업 선택지 생성
      const choices = this.generateLevelUpChoices();

      console.log(i18n.t('level.choicesTitle'));
      choices.forEach((choice, index) => {
        console.log(
          i18n.t('level.choiceFormat', {
            index: index + 1,
            rarity: choice.rarity,
            name: choice.name,
            description: choice.description,
          })
        );
      });
      console.log('====================');

      // 레벨업 콜백 호출 (다음 레벨업 UI 표시)
      this.onLevelUp?.(this.level, choices);
    } else {
      // 대기 중인 레벨업이 없으면 게임 재개
      this.resume();
    }
  }

  /**
   * 현재 레벨 진행도 (0-1)
   */
  public getProgress(): number {
    if (this.level >= GAME_CONFIG.levelUp.maxLevel) return 1;

    const requiredXP = getRequiredXP(this.level + 1);
    return requiredXP > 0 ? this.currentXP / requiredXP : 0;
  }

  /**
   * 다음 레벨까지 필요한 경험치
   */
  public getRequiredXP(): number {
    if (this.level >= GAME_CONFIG.levelUp.maxLevel) return 0;
    return getRequiredXP(this.level + 1);
  }

  /**
   * 게임 일시정지
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * 게임 재개
   */
  public resume(): void {
    this.isPaused = false;
  }

  // Getters
  public getLevel(): number {
    return this.level;
  }

  public getCurrentXP(): number {
    return this.currentXP;
  }

  public getTotalXP(): number {
    return this.totalXP;
  }

  /**
   * totalXP 설정 (스테이지 전환 시 복원용)
   */
  public setTotalXP(xp: number): void {
    this.totalXP = xp;
    this.level = calculateLevel(xp);

    // currentXP 재계산
    let accumulated = 0;
    for (let lv = 1; lv < this.level; lv++) {
      accumulated += getRequiredXP(lv + 1);
    }
    this.currentXP = xp - accumulated;
  }

  public isPausedForLevelUp(): boolean {
    return this.isPaused;
  }

  /**
   * 디버그 정보
   */
  public getDebugInfo(): string {
    const required = this.getRequiredXP();
    const progress = Math.floor(this.getProgress() * 100);
    return `Lv.${this.level} (${this.currentXP}/${required} - ${progress}%) Total: ${this.totalXP}XP`;
  }
}
