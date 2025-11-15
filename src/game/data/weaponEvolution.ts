/**
 * 무기 진화 시스템 데이터
 *
 * 무기 진화 조건:
 * - 해당 무기 레벨 7 달성
 * - 대응되는 진화 유물 보유
 */

export interface WeaponEvolutionData {
  weaponId: string; // 기본 무기 ID
  requiredLevel: number; // 진화 요구 레벨
  requiredArtifactId: string; // 진화에 필요한 유물 ID
  evolvedWeaponName: string; // 진화 후 무기 이름
  evolvedWeaponClass: string; // 진화 무기 클래스명
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
    evolvedWeaponClass: 'JakduBladeEvolvedWeapon',
  },
  weapon_talisman: {
    weaponId: 'weapon_talisman',
    requiredLevel: 7,
    requiredArtifactId: 'fine_line_mirror',
    evolvedWeaponName: '정문경',
    evolvedWeaponClass: 'TalismanEvolvedWeapon',
  },
  weapon_dokkaebi_fire: {
    weaponId: 'weapon_dokkaebi_fire',
    requiredLevel: 7,
    requiredArtifactId: 'crown_of_silla',
    evolvedWeaponName: '금관총 금관',
    evolvedWeaponClass: 'DokkaebiFireEvolvedWeapon',
  },
  // TODO: 나머지 무기 진화 구현 후 활성화
  // weapon_moktak_sound: {
  //   weaponId: 'weapon_moktak_sound',
  //   requiredLevel: 7,
  //   requiredArtifactId: 'pensive_buddha',
  //   evolvedWeaponName: '금동미륵보살반가사유상',
  //   evolvedWeaponClass: 'MoktakSoundEvolvedWeapon',
  // },
  // weapon_fan_wind: {
  //   weaponId: 'weapon_fan_wind',
  //   requiredLevel: 7,
  //   requiredArtifactId: 'celestial_horse',
  //   evolvedWeaponName: '천마총 천마도',
  //   evolvedWeaponClass: 'FanWindEvolvedWeapon',
  // },
  // weapon_purifying_water: {
  //   weaponId: 'weapon_purifying_water',
  //   requiredLevel: 7,
  //   requiredArtifactId: 'celadon_crane_vase',
  //   evolvedWeaponName: '청자 상감운학문 매병',
  //   evolvedWeaponClass: 'PurifyingWaterEvolvedWeapon',
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
  const evolutionData = getEvolutionData(weaponId);
  if (!evolutionData) return false;

  return (
    level >= evolutionData.requiredLevel && artifactIds.includes(evolutionData.requiredArtifactId)
  );
}
