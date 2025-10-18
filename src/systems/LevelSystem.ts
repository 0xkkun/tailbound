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
        rarity: 'common' as const,
      },
      {
        id: 'weapon_dokkaebi',
        type: 'weapon' as const,
        name: i18n.t('weapons.dokkaebi.name'),
        description: i18n.t('weapons.dokkaebi.description'),
        rarity: 'common' as const,
      },
      {
        id: 'weapon_moktak',
        type: 'weapon' as const,
        name: i18n.t('weapons.moktak.name'),
        description: i18n.t('weapons.moktak.description'),
        rarity: 'rare' as const,
      },
      {
        id: 'weapon_jakdu',
        type: 'weapon' as const,
        name: i18n.t('weapons.jakdu.name'),
        description: i18n.t('weapons.jakdu.description'),
        rarity: 'rare' as const,
      },
    ];

    // TODO: 더 많은 스탯 업그레이드 추가 필요 (현재 15개 -> 목표 30개+)
    // === 스탯 업그레이드 선택지 (등급별 증가폭) ===
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

    // 무기와 스탯 업그레이드를 합침
    allPossibleChoices.push(...weapons);
    allPossibleChoices.push(...statUpgrades);

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
