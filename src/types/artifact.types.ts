/**
 * 유물 시스템 타입 정의
 */

export type ArtifactTier = 1 | 2 | 3 | 4;
export type ArtifactRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'cursed';

/**
 * 유물 카테고리
 * - offensive: 공격 강화 (데미지, 크리티컬, 관통 등)
 * - defensive: 방어 강화 (체력, 회피, 피해 감소 등)
 * - utility: 유틸리티 (이동속도, 경험치, 골드 등)
 * - debuff: 적 약화 (둔화, 기절, 매혹 등)
 * - summon: 소환물 (동료, 터렛, 오브 등)
 * - special: 특수 효과 (조건부 발동, 복합 효과 등)
 * - evolution: 무기 진화 (특정 무기 레벨 달성 시 진화)
 */
export type ArtifactCategory =
  | 'offensive'
  | 'defensive'
  | 'utility'
  | 'debuff'
  | 'summon'
  | 'special'
  | 'evolution';

/**
 * 유물 메타데이터
 */
export interface ArtifactData {
  id: string;
  name: string;
  tier: ArtifactTier;
  rarity: ArtifactRarity;
  category: ArtifactCategory;
  description: string;
  iconPath: string;
  color: number;
}
