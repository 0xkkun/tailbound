/**
 * 무기 데이터 정의
 */

import { WEAPON_BALANCE } from '@/config/balance.config';

/**
 * 무기 타입
 */
export type WeaponType = 'talisman' | 'dokkaebi_fire' | 'moktak_sound' | 'jakdu_blade';

/**
 * 무기 데이터 인터페이스
 */
export interface WeaponData {
  id: WeaponType;
  name: string;
  description: string;
  baseDamage: number;
  baseCooldown: number;
  projectileSpeed?: number;
  projectileRadius?: number;
  projectileLifetime?: number;
  projectileCount: number;
  piercing: number;
  aoeRadius?: number; // 범위 공격용
  levelScaling: {
    damage: number;
    cooldownReduction: number;
    piercingPerLevel: number;
  };
}

/**
 * 무기 데이터베이스
 */
export const WEAPON_DATA: Record<WeaponType, WeaponData> = {
  talisman: {
    id: 'talisman',
    name: '부적',
    description: '가장 가까운 적을 자동으로 추적하는 부적',
    baseDamage: WEAPON_BALANCE.talisman.baseDamage,
    baseCooldown: WEAPON_BALANCE.talisman.baseCooldown,
    projectileSpeed: WEAPON_BALANCE.talisman.projectileSpeed,
    projectileRadius: WEAPON_BALANCE.talisman.projectileRadius,
    projectileLifetime: WEAPON_BALANCE.talisman.projectileLifetime,
    projectileCount: WEAPON_BALANCE.talisman.projectileCount,
    piercing: WEAPON_BALANCE.talisman.piercing,
    levelScaling: WEAPON_BALANCE.talisman.levelScaling,
  },

  dokkaebi_fire: {
    id: 'dokkaebi_fire',
    name: '도깨비불',
    description: '3방향으로 빠르게 발사되는 작은 불꽃',
    baseDamage: WEAPON_BALANCE.dokkaebi_fire.baseDamage,
    baseCooldown: WEAPON_BALANCE.dokkaebi_fire.baseCooldown,
    projectileSpeed: WEAPON_BALANCE.dokkaebi_fire.projectileSpeed,
    projectileRadius: WEAPON_BALANCE.dokkaebi_fire.projectileRadius,
    projectileLifetime: WEAPON_BALANCE.dokkaebi_fire.projectileLifetime,
    projectileCount: WEAPON_BALANCE.dokkaebi_fire.projectileCount,
    piercing: WEAPON_BALANCE.dokkaebi_fire.piercing,
    levelScaling: WEAPON_BALANCE.dokkaebi_fire.levelScaling,
  },

  moktak_sound: {
    id: 'moktak_sound',
    name: '목탁 소리',
    description: '플레이어 주변의 모든 적에게 피해를 입히는 소리 파동',
    baseDamage: WEAPON_BALANCE.moktak_sound.baseDamage,
    baseCooldown: WEAPON_BALANCE.moktak_sound.baseCooldown,
    aoeRadius: WEAPON_BALANCE.moktak_sound.aoeRadius,
    projectileCount: WEAPON_BALANCE.moktak_sound.projectileCount,
    piercing: WEAPON_BALANCE.moktak_sound.piercing,
    levelScaling: WEAPON_BALANCE.moktak_sound.levelScaling,
  },

  jakdu_blade: {
    id: 'jakdu_blade',
    name: '작두날',
    description: '강력한 데미지와 높은 관통력을 가진 회전하는 칼날',
    baseDamage: WEAPON_BALANCE.jakdu_blade.baseDamage,
    baseCooldown: WEAPON_BALANCE.jakdu_blade.baseCooldown,
    projectileSpeed: WEAPON_BALANCE.jakdu_blade.projectileSpeed,
    projectileRadius: WEAPON_BALANCE.jakdu_blade.projectileRadius,
    projectileLifetime: WEAPON_BALANCE.jakdu_blade.projectileLifetime,
    projectileCount: WEAPON_BALANCE.jakdu_blade.projectileCount,
    piercing: WEAPON_BALANCE.jakdu_blade.piercing,
    levelScaling: WEAPON_BALANCE.jakdu_blade.levelScaling,
  },
};

/**
 * 무기 ID로 데이터 가져오기
 */
export function getWeaponData(weaponType: WeaponType): WeaponData {
  return WEAPON_DATA[weaponType];
}

/**
 * 레벨에 따른 무기 스탯 계산
 */
export function calculateWeaponStats(
  weaponType: WeaponType,
  level: number
): {
  damage: number;
  cooldown: number;
  piercing: number;
} {
  const data = WEAPON_DATA[weaponType];
  const levelBonus = level - 1; // 레벨 1은 기본값

  const damage = data.baseDamage + data.levelScaling.damage * levelBonus;
  const cooldown = Math.max(
    0.1,
    data.baseCooldown - data.levelScaling.cooldownReduction * levelBonus
  );
  const piercing =
    data.piercing + Math.floor(levelBonus / 5) * (data.levelScaling.piercingPerLevel || 0);

  return { damage, cooldown, piercing };
}
