/**
 * 천마총 천마도 유물
 * 부채바람 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { LOCAL_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CelestialHorseArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'celestial_horse',
      name: '천마총 천마도',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[부채바람] 부채바람 무기 레벨 7 달성 시 진화',
      iconPath: LOCAL_ASSETS.celestialHorseArtifact,
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
