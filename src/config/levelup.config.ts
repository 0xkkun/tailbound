/**
 * 레벨업 시스템 설정
 * - 무기, 스탯, 파워업 ID와 아이콘 매핑을 중앙에서 관리
 */

// 무기 ID 정의
export const WEAPON_IDS = {
  TALISMAN: 'weapon_talisman',
  FAN_WIND: 'weapon_fan_wind',
  MOKTAK: 'weapon_moktak',
  JAKDU: 'weapon_jakdu',
  DOKKAEBI_FIRE: 'weapon_dokkaebi_fire',
} as const;

// 스탯 ID 접두사
export const STAT_ID_PREFIXES = {
  DAMAGE: 'stat_damage',
  COOLDOWN: 'stat_cooldown',
  HEALTH: 'stat_health',
  SPEED: 'stat_speed',
  PICKUP: 'stat_pickup',
} as const;

// 파워업 ID 접두사 (카테고리별)
export const POWERUP_ID_PREFIXES = {
  // 공격 파워업
  CRIT_RATE: 'powerup_crit_rate',
  CRIT_DAMAGE: 'powerup_crit_damage',

  // 방어 파워업
  DAMAGE_REDUCTION: 'powerup_damage_reduction',
  BREATHING: 'powerup_breathing', // 호흡 (복합에서 이동)

  // 유틸리티 파워업
  XP_GAIN: 'powerup_xp_gain',
} as const;

// 특수 드롭 아이템 ID
export const SPECIAL_DROP_IDS = {
  REVIVE: 'drop_revive', // 혼백 (보스 드롭)
} as const;

// 무기 스프라이트 시트 정보
export const WEAPON_SPRITE_INFO = {
  [WEAPON_IDS.TALISMAN]: {
    path: '/assets/weapon/talisman.png',
    frameWidth: 32,
    frameHeight: 32,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.FAN_WIND]: {
    path: '/assets/weapon/wind.png',
    frameWidth: 96,
    frameHeight: 96,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.MOKTAK]: {
    path: '/assets/weapon/mocktak.png',
    frameWidth: 120,
    frameHeight: 120,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.JAKDU]: {
    path: '/assets/weapon/jakdu.png',
    frameWidth: 128,
    frameHeight: 128,
    frameCol: 0,
    frameRow: 2,
  },
  [WEAPON_IDS.DOKKAEBI_FIRE]: {
    path: '/assets/weapon/dokkabi-fire.png',
    frameWidth: 48,
    frameHeight: 48,
    frameCol: 0,
    frameRow: 0,
  },
} as const;

// 스탯 아이콘 매핑
export const STAT_ICON_MAP = {
  [STAT_ID_PREFIXES.DAMAGE]: '/assets/power-up/attack-power.png',
  [STAT_ID_PREFIXES.COOLDOWN]: '/assets/power-up/attack-speed.png',
  [STAT_ID_PREFIXES.HEALTH]: '/assets/power-up/health-plus.png',
  [STAT_ID_PREFIXES.SPEED]: '/assets/power-up/move-speed.png',
  [STAT_ID_PREFIXES.PICKUP]: '/assets/power-up/magnetic.png',
} as const;

// 파워업 아이콘 매핑
export const POWERUP_ICON_MAP = {
  // 공격 파워업
  [POWERUP_ID_PREFIXES.CRIT_RATE]: '/assets/power-up/critical-chance.png',
  [POWERUP_ID_PREFIXES.CRIT_DAMAGE]: '/assets/power-up/critical-damage.png',

  // 방어 파워업
  [POWERUP_ID_PREFIXES.DAMAGE_REDUCTION]: '/assets/power-up/damage-reduction.png',
  [POWERUP_ID_PREFIXES.BREATHING]: '/assets/power-up/health-generate.png',

  // 유틸리티 파워업
  [POWERUP_ID_PREFIXES.XP_GAIN]: '/assets/power-up/experience-boost.png',

  // 특수 드롭 아이템
  [SPECIAL_DROP_IDS.REVIVE]: '/assets/power-up/health-plus.png',
} as const;

// 기본 아이콘
export const DEFAULT_ICON = '/assets/power-up/attack-power.png';
