/**
 * 레벨 시스템 - 경험치 획득과 레벨업 관리
 */

import { GAME_CONFIG } from '@/config/game.config';

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

    console.log(`🎉 레벨업! Lv.${this.level}`);

    // 레벨업 선택지 생성
    const choices = this.generateLevelUpChoices();

    // TODO: 레벨업 UI 구현 전까지는 일시정지 비활성화
    // 레벨업 선택지를 콘솔에 출력
    console.log('=== 레벨업 선택지 ===');
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. [${choice.rarity}] ${choice.name} - ${choice.description}`);
    });
    console.log('====================');

    // 게임 일시정지 (선택 UI 표시 중)
    // TODO: 레벨업 UI 구현 시 활성화
    // this.pause();

    // 레벨업 콜백 호출
    this.onLevelUp?.(this.level, choices);

    // 추가 레벨업 체크 (남은 경험치로)
    if (this.level < GAME_CONFIG.levelUp.maxLevel) {
      const nextRequired = getRequiredXP(this.level + 1);
      if (this.currentXP >= nextRequired) {
        this.levelUp();
      }
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
        name: '부적',
        description: '자동으로 가장 가까운 적을 추적하는 부적을 발사합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'weapon_dokkaebi',
        type: 'weapon' as const,
        name: '도깨비불',
        description: '플레이어 주변을 회전하는 푸른 불꽃을 소환합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'weapon_moktak',
        type: 'weapon' as const,
        name: '목탁 소리',
        description: '주변의 모든 적에게 피해를 주는 음파를 발산합니다.',
        rarity: 'rare' as const,
      },
      {
        id: 'weapon_jakdu',
        type: 'weapon' as const,
        name: '작두날',
        description: '강력한 회전 베기로 주변 적을 처치합니다.',
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
        name: '공격력 증가',
        description: '모든 무기의 공격력이 2% 증가합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'stat_speed_common',
        type: 'passive' as const,
        name: '이동 속도 증가',
        description: '이동 속도가 3% 증가합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'stat_cooldown_common',
        type: 'passive' as const,
        name: '쿨타임 감소',
        description: '모든 무기의 쿨타임이 2% 감소합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'stat_health_common',
        type: 'passive' as const,
        name: '최대 체력 증가',
        description: '최대 체력이 5 증가합니다.',
        rarity: 'common' as const,
      },
      {
        id: 'stat_pickup_common',
        type: 'passive' as const,
        name: '획득 범위 증가',
        description: '경험치 젬 획득 범위가 5% 증가합니다.',
        rarity: 'common' as const,
      },

      // Rare 등급 (중간 증가)
      {
        id: 'stat_damage_rare',
        type: 'passive' as const,
        name: '강화된 공격력',
        description: '모든 무기의 공격력이 5% 증가합니다.',
        rarity: 'rare' as const,
      },
      {
        id: 'stat_speed_rare',
        type: 'passive' as const,
        name: '빠른 발걸음',
        description: '이동 속도가 7% 증가합니다.',
        rarity: 'rare' as const,
      },
      {
        id: 'stat_cooldown_rare',
        type: 'passive' as const,
        name: '신속한 재장전',
        description: '모든 무기의 쿨타임이 5% 감소합니다.',
        rarity: 'rare' as const,
      },
      {
        id: 'stat_health_rare',
        type: 'passive' as const,
        name: '강인한 체력',
        description: '최대 체력이 15 증가합니다.',
        rarity: 'rare' as const,
      },
      {
        id: 'stat_pickup_rare',
        type: 'passive' as const,
        name: '자석 효과',
        description: '경험치 젬 획득 범위가 15% 증가합니다.',
        rarity: 'rare' as const,
      },

      // Epic 등급 (큰 증가)
      {
        id: 'stat_damage_epic',
        type: 'passive' as const,
        name: '파괴적인 힘',
        description: '모든 무기의 공격력이 10% 증가합니다.',
        rarity: 'epic' as const,
      },
      {
        id: 'stat_speed_epic',
        type: 'passive' as const,
        name: '질풍같은 속도',
        description: '이동 속도가 15% 증가합니다.',
        rarity: 'epic' as const,
      },
      {
        id: 'stat_cooldown_epic',
        type: 'passive' as const,
        name: '무한 탄창',
        description: '모든 무기의 쿨타임이 10% 감소합니다.',
        rarity: 'epic' as const,
      },
      {
        id: 'stat_health_epic',
        type: 'passive' as const,
        name: '불굴의 의지',
        description: '최대 체력이 30 증가합니다.',
        rarity: 'epic' as const,
      },
      {
        id: 'stat_pickup_epic',
        type: 'passive' as const,
        name: '강력한 자기장',
        description: '경험치 젬 획득 범위가 30% 증가합니다.',
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
    console.log(`선택: ${choiceId}`);

    // TODO: 실제 선택 효과 적용
    // - 무기 추가
    // - 스탯 증가
    // - 체력 회복 등

    // 게임 재개
    this.resume();
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
