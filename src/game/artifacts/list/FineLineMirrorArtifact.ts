/**
 * 정문경 유물
 * 부적 무기를 진화시키는 유물 (7레벨 달성 시)
 */

import { CDN_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class FineLineMirrorArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'fine_line_mirror',
      name: '정문경',
      tier: 2,
      rarity: 'rare',
      category: 'evolution',
      description: '[부적] 부적 무기 레벨 7 달성 시 진화',
      iconPath: CDN_ASSETS.artifact.fineLineMirror,
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
