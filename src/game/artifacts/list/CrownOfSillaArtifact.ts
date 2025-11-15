/**
 * 금관총 금관 유물
 * 도깨비불 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CrownOfSillaArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'crown_of_silla',
      name: '금관총 금관',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[도깨비불] 도깨비불 무기 레벨 7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.crownOfSilla,
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
