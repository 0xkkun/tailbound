import { CDN_ASSETS } from '@config/assets.config';
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
    path: CDN_ASSETS.weapon.talisman,
    frameWidth: 32,
    frameHeight: 32,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.FAN_WIND]: {
    path: CDN_ASSETS.weapon.wind,
    frameWidth: 96,
    frameHeight: 96,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.MOKTAK]: {
    path: CDN_ASSETS.weapon.mocktak,
    frameWidth: 120,
    frameHeight: 120,
    frameCol: 0,
    frameRow: 0,
  },
  [WEAPON_IDS.JAKDU]: {
    path: CDN_ASSETS.weapon.jakdu,
    frameWidth: 128,
    frameHeight: 128,
    frameCol: 0,
    frameRow: 2,
  },
  [WEAPON_IDS.DOKKAEBI_FIRE]: {
    path: CDN_ASSETS.weapon.dokkabiFire,
    frameWidth: 48,
    frameHeight: 48,
    frameCol: 0,
    frameRow: 0,
  },
} as const;

// 스탯 아이콘 매핑
export const STAT_ICON_MAP = {
  [STAT_ID_PREFIXES.DAMAGE]: CDN_ASSETS.powerUp.attackPower,
  [STAT_ID_PREFIXES.COOLDOWN]: CDN_ASSETS.powerUp.attackSpeed,
  [STAT_ID_PREFIXES.HEALTH]: CDN_ASSETS.powerUp.healthPlus,
  [STAT_ID_PREFIXES.SPEED]: CDN_ASSETS.powerUp.moveSpeed,
  [STAT_ID_PREFIXES.PICKUP]: CDN_ASSETS.powerUp.magnetic,
} as const;

// 파워업 아이콘 매핑
export const POWERUP_ICON_MAP = {
  // 공격 파워업
  [POWERUP_ID_PREFIXES.CRIT_RATE]: CDN_ASSETS.powerUp.criticalChance,
  [POWERUP_ID_PREFIXES.CRIT_DAMAGE]: CDN_ASSETS.powerUp.criticalDamage,

  // 방어 파워업
  [POWERUP_ID_PREFIXES.DAMAGE_REDUCTION]: CDN_ASSETS.powerUp.damageReduction,
  [POWERUP_ID_PREFIXES.BREATHING]: CDN_ASSETS.powerUp.healthGenerate,

  // 유틸리티 파워업
  [POWERUP_ID_PREFIXES.XP_GAIN]: CDN_ASSETS.powerUp.experienceBoost,

  // 특수 드롭 아이템
  [SPECIAL_DROP_IDS.REVIVE]: CDN_ASSETS.powerUp.healthPlus,
} as const;

// 기본 아이콘
export const DEFAULT_ICON = CDN_ASSETS.powerUp.attackPower;
