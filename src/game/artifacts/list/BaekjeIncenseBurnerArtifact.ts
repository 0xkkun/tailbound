/**
 * 백제 금동대향로 유물
 * 작두 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class BaekjeIncenseBurnerArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'baekje_incense_burner',
      name: '백제 금동대향로',
      tier: 2,
      rarity: 'legendary',
      category: 'evolution',
      description: '작두날 Lv.7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.baekjeIncenseBurner,
      color: 0xffd700, // 골드
      weaponCategories: ['jakdu_blade'], // 작두날
    });
  }

  public update(_delta: number): void {
    void _delta;

    if (!this.centerUI) {
      void this.createCenterUI();
    }
  }
}
