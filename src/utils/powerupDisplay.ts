/**
 * 파워업 표시 유틸리티
 * 무기와 파워업의 레벨/수치 표시 로직을 중앙화
 */

import { POWERUPS_CONFIG } from '@config/powerups.config';

/**
 * 파워업 또는 무기의 표시 텍스트를 생성
 *
 * @param powerupType - 파워업 타입 (예: 'damage', 'weapon_talisman')
 * @param level - 현재 레벨 (무기 전용, 파워업은 무시됨)
 * @param totalValue - 누적 수치 (파워업 전용, 무기는 무시됨)
 * @returns 표시할 텍스트 (예: "Lv.3", "+15%", "+50")
 */
export function getPowerupDisplayText(
  powerupType: string,
  level: number = 0,
  totalValue: number = 0
): string {
  // 무기: 레벨 표시
  if (powerupType.startsWith('weapon_')) {
    return `Lv.${level}`;
  }

  // 파워업: 누적 수치 표시
  const powerupConfig = POWERUPS_CONFIG[powerupType as keyof typeof POWERUPS_CONFIG];

  if (powerupConfig && powerupConfig.valueType === 'flat') {
    // 절대값 (예: health)
    return `+${Math.round(totalValue)}`;
  } else {
    // 비율값 (예: damage, crit_rate 등)
    const percentage = Math.round(totalValue * 100);
    return `+${percentage}%`;
  }
}

/**
 * 파워업이 새로운지(레벨 0) 확인
 *
 * @param level - 현재 레벨
 * @returns 새 파워업 여부
 */
export function isPowerupNew(level: number): boolean {
  return level === 0;
}

/**
 * 다음 레벨 표시 텍스트 생성 (레벨업 선택지용 - 무기 전용)
 *
 * @param currentLevel - 현재 레벨
 * @returns "NEW!" 또는 "Lv.N" 형태의 텍스트
 */
export function getNextLevelDisplayText(currentLevel: number = 0): string {
  return isPowerupNew(currentLevel) ? 'NEW!' : `Lv.${currentLevel + 1}`;
}

/**
 * 파워업 ID에서 등급 추출
 *
 * @param choiceId - 파워업 선택지 ID (예: 'powerup_damage_common', 'stat_health_rare')
 * @returns 등급 ('common' | 'rare' | 'epic')
 *
 * @example
 * extractPowerupRarity('powerup_damage_common') // 'common'
 * extractPowerupRarity('stat_health_rare') // 'rare'
 * extractPowerupRarity('powerup_crit_rate_epic') // 'epic'
 */
export function extractPowerupRarity(choiceId: string): 'common' | 'rare' | 'epic' | null {
  const parts = choiceId.split('_');
  const lastPart = parts[parts.length - 1];

  if (lastPart === 'common' || lastPart === 'rare' || lastPart === 'epic') {
    return lastPart;
  }

  return null;
}

/**
 * 파워업 선택지 표시 텍스트 생성 (레벨업 UI용)
 *
 * @param choiceId - 파워업 선택지 ID (예: 'powerup_damage_common')
 * @param currentLevel - 현재 레벨
 * @returns "NEW!", "+5%", "+10" 등의 텍스트
 */
export function getPowerupChoiceDisplayText(choiceId: string, currentLevel: number = 0): string {
  // 무기는 레벨 표시
  if (choiceId.startsWith('weapon_')) {
    return getNextLevelDisplayText(currentLevel);
  }

  // 새 파워업은 "NEW!" 표시
  if (isPowerupNew(currentLevel)) {
    return 'NEW!';
  }

  // 기존 파워업은 증가량 표시
  const powerupType = extractPowerupType(choiceId);
  const rarity = extractPowerupRarity(choiceId);

  if (!powerupType || !rarity) {
    return 'NEW!'; // fallback
  }

  const powerupConfig = POWERUPS_CONFIG[powerupType as keyof typeof POWERUPS_CONFIG];
  if (!powerupConfig) {
    return 'NEW!'; // fallback
  }

  const incrementValue = powerupConfig.increment[rarity];

  if (powerupConfig.valueType === 'flat') {
    // 절대값 (예: health)
    return `+${Math.round(incrementValue)}`;
  } else {
    // 비율값 (예: damage, crit_rate 등)
    const percentage = Math.round(incrementValue * 100);
    return `+${percentage}%`;
  }
}

/**
 * 파워업 ID에서 타입 추출
 *
 * @param choiceId - 파워업 선택지 ID (예: 'powerup_damage_common', 'stat_health_rare')
 * @returns 파워업 타입 (예: 'damage', 'health', 'crit_rate')
 *
 * @example
 * extractPowerupType('powerup_damage_common') // 'damage'
 * extractPowerupType('stat_health_rare') // 'health'
 * extractPowerupType('powerup_crit_rate_epic') // 'crit_rate'
 */
export function extractPowerupType(choiceId: string): string | null {
  // 'powerup_' 또는 'stat_' 접두사 제거
  const withoutPrefix = choiceId.replace(/^(powerup_|stat_)/, '');

  // 마지막 '_등급' 부분 제거 (common, rare, epic)
  const parts = withoutPrefix.split('_');
  if (parts.length < 2) return null;

  // 마지막 파트(등급) 제거하고 나머지를 타입으로 사용
  // 예: 'damage_common' -> 'damage'
  //     'crit_rate_rare' -> 'crit_rate'
  const type = parts.slice(0, -1).join('_');
  return type;
}
