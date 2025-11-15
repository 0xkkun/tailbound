/**
 * 청자 상감운학문 매병 유물
 * 정화수 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { LOCAL_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CeladonCraneVaseArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'celadon_crane_vase',
      name: '청자 상감운학문 매병',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[정화수] 정화수 무기 레벨 7 달성 시 진화',
      iconPath: LOCAL_ASSETS.celadonCraneVaseArtifact,
      color: 0xffd700, // 골드
    });
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
