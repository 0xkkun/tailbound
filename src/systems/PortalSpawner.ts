/**
 * PortalSpawner - 포탈 생성 시스템
 */

import { GAME_CONFIG } from '@config/game.config';
import type { Player } from '@game/entities/Player';
import { Portal } from '@game/entities/Portal';

export class PortalSpawner {
  private portal: Portal | null = null;
  private hasSpawned: boolean = false;

  /**
   * 포탈 즉시 생성
   */
  public triggerSpawn(player: Player): Portal | null {
    if (this.hasSpawned || this.portal) {
      return null;
    }

    this.portal = this.spawnPortalNearPlayer(player);
    this.hasSpawned = true;
    return this.portal;
  }

  /**
   * 플레이어 근처에 포탈 생성
   */
  private spawnPortalNearPlayer(player: Player): Portal {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      GAME_CONFIG.portal.spawnDistanceMin +
      Math.random() * (GAME_CONFIG.portal.spawnDistanceMax - GAME_CONFIG.portal.spawnDistanceMin);

    const portalX = player.x + Math.cos(angle) * distance;
    const portalY = player.y + Math.sin(angle) * distance;

    return new Portal(portalX, portalY);
  }

  /**
   * 리셋
   */
  public reset(): void {
    this.portal?.destroy();
    this.portal = null;
    this.hasSpawned = false;
  }

  /**
   * 포탈 가져오기
   */
  public getPortal(): Portal | null {
    return this.portal;
  }
}
