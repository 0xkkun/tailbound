/**
 * 파워업 시스템 설정
 *
 * 레벨업 시 선택할 수 있는 모든 스탯 강화 옵션을 정의합니다.
 * (무기는 별도로 weapons.ts에서 관리)
 *
 * 주의: 실제 밸런스 값은 balance.config.ts의 POWERUP_BALANCE에서 관리됩니다.
 * 이 파일은 메타데이터(아이콘, 카테고리 등)만 정의합니다.
 */

import { PLAYER_BALANCE, POWERUP_BALANCE } from './balance.config';

/**
 * 파워업 카테고리
 */
export type PowerupCategory = 'attack' | 'defense' | 'utility';

/**
 * 파워업 등급
 */
export type PowerupRarity = 'common' | 'rare' | 'epic';

/**
 * 파워업 타입
 */
export type PowerupType =
  // ⚔️ 공격
  | 'damage' // 무력 (武力)
  | 'cooldown' // 신속 (迅速)
  | 'crit_rate' // 필살 (必殺)
  | 'crit_damage' // 극살 (極殺)
  // 💪 방어
  | 'health' // 생명력 (生命力)
  | 'damage_reduction' // 강체 (剛體)
  | 'breathing' // 호흡 (呼吸)
  // ⚙️ 유틸리티
  | 'speed' // 경신 (輕身)
  | 'pickup' // 영혼 흡인 (靈魂 吸引)
  | 'xp_gain'; // 수련 (修鍊)

/**
 * 파워업 메타데이터
 */
export interface PowerupMetadata {
  id: PowerupType;
  name: string; // 개발자용 이름 (실제 표시는 i18n에서)
  category: PowerupCategory;
  icon: string; // 아이콘 경로

  // 등급별 증가량
  increment: Record<PowerupRarity, number>;

  // 등급별 주기 (현재는 호흡만 있음)
  interval?: Record<PowerupRarity, number>;

  // 최대치 (min은 쿨타임 전용)
  max?: number;
  min?: number;
}

/**
 * 모든 파워업 정의
 */
export const POWERUPS_CONFIG: Record<PowerupType, PowerupMetadata> = {
  // ⚔️ 공격 스탯
  damage: {
    id: 'damage',
    name: 'Damage',
    category: 'attack',
    icon: '/assets/power-up/attack-power.png',
    increment: POWERUP_BALANCE.damage,
    max: PLAYER_BALANCE.maxStats.damageMultiplier,
  },

  cooldown: {
    id: 'cooldown',
    name: 'Cooldown',
    category: 'attack',
    icon: '/assets/power-up/attack-speed.png',
    increment: POWERUP_BALANCE.cooldown,
    min: PLAYER_BALANCE.minStats.cooldownMultiplier,
  },

  crit_rate: {
    id: 'crit_rate',
    name: 'Critical Rate',
    category: 'attack',
    icon: '/assets/power-up/kill.png',
    increment: POWERUP_BALANCE.crit_rate,
    max: PLAYER_BALANCE.maxStats.criticalRate,
  },

  crit_damage: {
    id: 'crit_damage',
    name: 'Critical Damage',
    category: 'attack',
    icon: '/assets/power-up/kill.png',
    increment: POWERUP_BALANCE.crit_damage,
    max: PLAYER_BALANCE.maxStats.criticalDamage,
  },

  // 💪 방어 스탯
  health: {
    id: 'health',
    name: 'Health',
    category: 'defense',
    icon: '/assets/power-up/health-plus.png',
    increment: POWERUP_BALANCE.health,
    max: PLAYER_BALANCE.maxStats.maxHealth,
  },

  damage_reduction: {
    id: 'damage_reduction',
    name: 'Damage Reduction',
    category: 'defense',
    icon: '/assets/power-up/health-plus.png',
    increment: POWERUP_BALANCE.damage_reduction,
    max: PLAYER_BALANCE.maxStats.damageReduction,
  },

  breathing: {
    id: 'breathing',
    name: 'Breathing',
    category: 'defense',
    icon: '/assets/power-up/health-generate.png',
    increment: {
      common: POWERUP_BALANCE.breathing.common.healAmount,
      rare: POWERUP_BALANCE.breathing.rare.healAmount,
      epic: POWERUP_BALANCE.breathing.epic.healAmount,
    },
    interval: {
      common: POWERUP_BALANCE.breathing.common.interval,
      rare: POWERUP_BALANCE.breathing.rare.interval,
      epic: POWERUP_BALANCE.breathing.epic.interval,
    },
  },

  // ⚙️ 유틸리티 스탯
  speed: {
    id: 'speed',
    name: 'Speed',
    category: 'utility',
    icon: '/assets/power-up/move-speed.png',
    increment: POWERUP_BALANCE.speed,
    max: PLAYER_BALANCE.maxStats.speedMultiplier,
  },

  pickup: {
    id: 'pickup',
    name: 'Pickup Range',
    category: 'utility',
    icon: '/assets/power-up/magnetic.png',
    increment: POWERUP_BALANCE.pickup,
    max: PLAYER_BALANCE.maxStats.pickupRangeMultiplier,
  },

  xp_gain: {
    id: 'xp_gain',
    name: 'XP Gain',
    category: 'utility',
    icon: '/assets/power-up/attack-speed.png',
    increment: POWERUP_BALANCE.xp_gain,
    max: PLAYER_BALANCE.maxStats.xpMultiplier,
  },
} as const;

/**
 * 파워업 ID 생성 헬퍼
 */
export function getPowerupId(type: PowerupType, rarity: PowerupRarity): string {
  return `powerup_${type}_${rarity}`;
}

/**
 * 파워업 ID 파싱 헬퍼
 *
 * 지원 형식:
 * - powerup_damage_common → { type: 'damage', rarity: 'common' }
 * - powerup_crit_rate_epic → { type: 'crit_rate', rarity: 'epic' }
 * - stat_health_rare → { type: 'health', rarity: 'rare' } (하위 호환)
 */
export function parsePowerupId(id: string): { type: PowerupType; rarity: PowerupRarity } | null {
  const parts = id.split('_');
  if (parts.length < 3) {
    return null;
  }

  const prefix = parts[0]; // 'powerup' or 'stat'
  if (prefix !== 'powerup' && prefix !== 'stat') {
    return null;
  }

  // 마지막 파트는 rarity
  const rarity = parts[parts.length - 1] as PowerupRarity;

  // 중간 모든 파트를 합쳐서 type으로 사용
  // powerup_crit_rate_common → type: 'crit_rate'
  // stat_damage_rare → type: 'damage'
  const type = parts.slice(1, -1).join('_') as PowerupType;

  // 유효한 타입인지 검증
  if (!POWERUPS_CONFIG[type]) {
    return null;
  }

  return { type, rarity };
}

/**
 * 카테고리별 파워업 목록
 */
export function getPowerupsByCategory(category: PowerupCategory): PowerupType[] {
  return Object.values(POWERUPS_CONFIG)
    .filter((p) => p.category === category)
    .map((p) => p.id);
}
