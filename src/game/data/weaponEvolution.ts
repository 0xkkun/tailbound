/**
 * 무기 진화 시스템 데이터
 *
 * 무기 진화 조건:
 * - 해당 무기 레벨 7 달성
 * - 대응되는 진화 유물 보유
 */

import { DokkaebiFireEvolvedWeapon } from '@game/weapons/evolved/DokkaebiFireEvolvedWeapon';
import { FanWindEvolvedWeapon } from '@game/weapons/evolved/FanWindEvolvedWeapon';
import { JakduBladeEvolvedWeapon } from '@game/weapons/evolved/JakduBladeEvolvedWeapon';
import { MoktakSoundEvolvedWeapon } from '@game/weapons/evolved/MoktakSoundEvolvedWeapon';
import { TalismanEvolvedWeapon } from '@game/weapons/evolved/TalismanEvolvedWeapon';
import type { Weapon } from '@game/weapons/Weapon';

// TODO: 정수 무기 활성화 시 주석 해제
// import { PurifyingWaterEvolvedWeapon } from '@game/weapons/evolved/PurifyingWaterEvolvedWeapon';

/**
 * 진화 무기 생성자 타입
 */
export type EvolvedWeaponConstructor = new (baseLevel: number) => Weapon;

export interface WeaponEvolutionData {
  weaponId: string; // 기본 무기 ID
  requiredLevel: number; // 진화 요구 레벨
  requiredArtifactId: string; // 진화에 필요한 유물 ID
  evolvedWeaponName: string; // 진화 후 무기 이름
  evolvedWeaponFactory: EvolvedWeaponConstructor; // 타입 안전한 생성자
  enabled: boolean; // 활성화 여부
}

/**
 * 무기 진화 맵 (검증된 무기만 활성화)
 */
export const WEAPON_EVOLUTION_MAP: Record<string, WeaponEvolutionData> = {
  weapon_jakdu: {
    weaponId: 'weapon_jakdu',
    requiredLevel: 7,
    requiredArtifactId: 'baekje_incense_burner',
    evolvedWeaponName: '백제 금동대향로',
    evolvedWeaponFactory: JakduBladeEvolvedWeapon,
    enabled: true,
  },
  weapon_talisman: {
    weaponId: 'weapon_talisman',
    requiredLevel: 7,
    requiredArtifactId: 'fine_line_mirror',
    evolvedWeaponName: '정문경',
    evolvedWeaponFactory: TalismanEvolvedWeapon,
    enabled: true,
  },
  weapon_dokkaebi_fire: {
    weaponId: 'weapon_dokkaebi_fire',
    requiredLevel: 7,
    requiredArtifactId: 'crown_of_silla',
    evolvedWeaponName: '금관총 금관',
    evolvedWeaponFactory: DokkaebiFireEvolvedWeapon,
    enabled: true,
  },
  weapon_moktak: {
    weaponId: 'weapon_moktak',
    requiredLevel: 7,
    requiredArtifactId: 'pensive_buddha',
    evolvedWeaponName: '금동미륵보살반가사유상',
    evolvedWeaponFactory: MoktakSoundEvolvedWeapon,
    enabled: true,
  },
  weapon_fan_wind: {
    weaponId: 'weapon_fan_wind',
    requiredLevel: 7,
    requiredArtifactId: 'celestial_horse',
    evolvedWeaponName: '천마총 천마도',
    evolvedWeaponFactory: FanWindEvolvedWeapon,
    enabled: true,
  },
  // weapon_purifying_water: {
  //   weaponId: 'weapon_purifying_water',
  //   requiredLevel: 7,
  //   requiredArtifactId: 'celadon_crane_vase',
  //   evolvedWeaponName: '청자 상감운학문 매병',
  //   evolvedWeaponFactory: PurifyingWaterEvolvedWeapon,
  //   enabled: false,
  // },
};

/**
 * 무기 ID로 진화 데이터 조회
 */
export function getEvolutionData(weaponId: string): WeaponEvolutionData | null {
  return WEAPON_EVOLUTION_MAP[weaponId] || null;
}

/**
 * 진화 가능한 무기인지 확인
 */
export function canEvolve(weaponId: string, level: number, artifactIds: string[]): boolean {
  // 입력 검증
  if (!weaponId || typeof weaponId !== 'string') {
    console.warn('[Evolution] Invalid weaponId:', weaponId);
    return false;
  }

  if (typeof level !== 'number' || level < 1) {
    console.warn('[Evolution] Invalid level:', level);
    return false;
  }

  if (!Array.isArray(artifactIds)) {
    console.warn('[Evolution] Invalid artifactIds:', artifactIds);
    return false;
  }

  const evolutionData = getEvolutionData(weaponId);
  if (!evolutionData || !evolutionData.enabled) return false;

  return (
    level >= evolutionData.requiredLevel && artifactIds.includes(evolutionData.requiredArtifactId)
  );
}

/**
 * 진화 시스템 검증 (개발/테스트용)
 * 모든 진화 무기가 올바르게 설정되어 있는지 확인
 */
export function validateEvolutionSystem(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [weaponId, data] of Object.entries(WEAPON_EVOLUTION_MAP)) {
    // weaponId 일치성 확인
    if (data.weaponId !== weaponId) {
      errors.push(`[${weaponId}] weaponId mismatch: ${data.weaponId} !== ${weaponId}`);
    }

    // 필수 필드 확인
    if (!data.evolvedWeaponName) {
      errors.push(`[${weaponId}] Missing evolvedWeaponName`);
    }

    if (!data.requiredArtifactId) {
      errors.push(`[${weaponId}] Missing requiredArtifactId`);
    }

    if (!data.evolvedWeaponFactory) {
      errors.push(`[${weaponId}] Missing evolvedWeaponFactory`);
    }

    // 레벨 범위 확인
    if (data.requiredLevel < 1 || data.requiredLevel > 10) {
      errors.push(`[${weaponId}] Invalid requiredLevel: ${data.requiredLevel}`);
    }

    // Factory 함수 테스트 (enabled인 경우만)
    if (data.enabled) {
      try {
        const testWeapon = new data.evolvedWeaponFactory(data.requiredLevel);
        if (!testWeapon.isEvolved) {
          errors.push(`[${weaponId}] Factory created weapon without isEvolved flag`);
        }
      } catch (error) {
        errors.push(`[${weaponId}] Factory test failed: ${error}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
