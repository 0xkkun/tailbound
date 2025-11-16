/**
 * 천마총 천마도 유물
 * 부채바람 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CelestialHorseArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'celestial_horse',
      name: '천마총 천마도',
      tier: 2,
      rarity: 'legendary',
      category: 'evolution',
      description: '부채바람 Lv.7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.celestialHorse,
      color: 0xffd700, // 골드
      weaponCategories: ['fan_wind'], // 부채바람
    });
  }

  public update(_delta: number): void {
    void _delta;

    if (!this.centerUI) {
      void this.createCenterUI();
    }
  }
}
