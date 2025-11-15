/**
 * 청자 상감운학문 매병 유물
 * 정화수 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CeladonCraneVaseArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'celadon_crane_vase',
      name: '청자 상감운학문 매병',
      tier: 2,
      rarity: 'legendary',
      category: 'evolution',
      description: '정화수 Lv.7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.celadonCraneVase,
      color: 0xffd700, // 골드
      weaponCategories: ['purifying_water'], // 정화수
    });
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
