/**
 * 레벨 시스템 - 경험치 획득과 레벨업 관리
 */

import { GAME_CONFIG } from '@config/game.config';
import { WEAPON_IDS } from '@config/levelup.config';
import i18n from '@i18n/config';

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
  currentLevel?: number; // 현재 파워업/무기 레벨 (0이면 새 획득)
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
   * 가중치 기반 랜덤 선택 (중복 없음)
   * Weighted Random Sampling without Replacement
   */
  private weightedRandomSelect(
    items: LevelUpChoice[],
    weights: number[],
    count: number
  ): LevelUpChoice[] {
    const selected: LevelUpChoice[] = [];
    const availableIndices = Array.from({ length: items.length }, (_, i) => i);
    const availableWeights = [...weights];

    for (let i = 0; i < count && availableIndices.length > 0; i++) {
      // 가중치 합계 계산
      const totalWeight = availableWeights.reduce((sum, w) => sum + w, 0);

      // 가중치 기반 랜덤 선택
      let random = Math.random() * totalWeight;
      let selectedIndex = -1;

      for (let j = 0; j < availableIndices.length; j++) {
        random -= availableWeights[j];
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      // 선택된 아이템 추가
      if (selectedIndex >= 0) {
        const itemIndex = availableIndices[selectedIndex];
        selected.push(items[itemIndex]);

        // 선택된 항목 제거 (중복 방지)
        availableIndices.splice(selectedIndex, 1);
        availableWeights.splice(selectedIndex, 1);
      }
    }

    return selected;
  }

  /**
   * 레벨업 선택지 생성 (중복 없음, 최적화됨)
   */
  private generateLevelUpChoices(): LevelUpChoice[] {
    // === 무기 선택지 ===
    // Record 타입으로 모든 무기 ID가 정의되었는지 컴파일 타임에 체크
    // 새로운 무기가 WEAPON_IDS에 추가되면 여기서 타입 에러가 발생해서 누락 방지
    type WeaponId = (typeof WEAPON_IDS)[keyof typeof WEAPON_IDS];

    const weaponChoices: Record<WeaponId, Omit<LevelUpChoice, 'id'>> = {
      [WEAPON_IDS.TALISMAN]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.talisman.name'),
        description: i18n.t('weapons.talisman.description'),
        rarity: 'epic' as const,
      },
      [WEAPON_IDS.DOKKAEBI_FIRE]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.dokkaebi.name'),
        description: i18n.t('weapons.dokkaebi.description'),
        rarity: 'epic' as const,
      },
      [WEAPON_IDS.MOKTAK]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.moktak.name'),
        description: i18n.t('weapons.moktak.description'),
        rarity: 'epic' as const,
      },
      [WEAPON_IDS.JAKDU]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.jakdu.name'),
        description: i18n.t('weapons.jakdu.description'),
        rarity: 'epic' as const,
      },
      [WEAPON_IDS.FAN_WIND]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.fanWind.name'),
        description: i18n.t('weapons.fanWind.description'),
        rarity: 'epic' as const,
      },
      [WEAPON_IDS.PURIFYING_WATER]: {
        type: 'weapon' as const,
        name: i18n.t('weapons.purifyingWater.name'),
        description: i18n.t('weapons.purifyingWater.description'),
        rarity: 'epic' as const,
      },
    };

    // Record를 배열로 변환
    const weapons = Object.entries(weaponChoices).map(([id, choice]) => ({
      id,
      ...choice,
    }));

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
      // 호흡 (呼吸) - 주기적 체력 회복
      {
        id: 'powerup_breathing_common',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.breathing.common.name'),
        description: i18n.t('powerups.defense.breathing.common.description'),
        rarity: 'common' as const,
      },
      {
        id: 'powerup_breathing_rare',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.breathing.rare.name'),
        description: i18n.t('powerups.defense.breathing.rare.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'powerup_breathing_epic',
        type: 'passive' as const,
        name: i18n.t('powerups.defense.breathing.epic.name'),
        description: i18n.t('powerups.defense.breathing.epic.description'),
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
    ];

    // 레벨 4 이하일 때는 3개 전부 무기 (초반 빌드 구성 보장)
    if (this.level <= 4) {
      // 무기는 동일 가중치로 3개 선택 (중복 없음)
      const weaponWeights = Array(weapons.length).fill(1);
      return this.weightedRandomSelect(weapons, weaponWeights, 3);
    }

    // 레벨 5 이상: 가중치 기반 선택 (중복 없음)
    // 모든 선택지를 unique 배열로 구성
    const allChoices: LevelUpChoice[] = [];
    const allWeights: number[] = [];

    // 무기: 3배 가중치
    allChoices.push(...weapons);
    allWeights.push(...Array(weapons.length).fill(3));

    // 기존 스탯: 2배 가중치
    allChoices.push(...statUpgrades);
    allWeights.push(...Array(statUpgrades.length).fill(2));

    // 공격 파워업: 1배 가중치
    allChoices.push(...combatPowerups);
    allWeights.push(...Array(combatPowerups.length).fill(1));

    // 방어 파워업: 1배 가중치
    allChoices.push(...defensePowerups);
    allWeights.push(...Array(defensePowerups.length).fill(1));

    // 유틸 파워업: 1배 가중치
    allChoices.push(...utilityPowerups);
    allWeights.push(...Array(utilityPowerups.length).fill(1));

    // 가중치 기반 랜덤 선택 (중복 없음)
    return this.weightedRandomSelect(allChoices, allWeights, 3);
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
