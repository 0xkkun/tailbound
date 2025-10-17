/**
 * 적 스폰 시스템
 */

import { SPAWN_BALANCE } from '@/config/balance.config';
import { selectEnemyTier } from '@/game/data/enemies';
import { Enemy } from '@/game/entities/Enemy';
import type { Vector2 } from '@/types/game.types';

export class SpawnSystem {
  private spawnTimer: number = 0;
  private spawnInterval: number = SPAWN_BALANCE.initialInterval;
  private enemyCount: number = 0;
  private gameTime: number = 0;

  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number, enemies: Enemy[], gameTime: number): void {
    this.gameTime = gameTime;
    this.spawnTimer += deltaTime;

    // 스폰 시간 도달
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      // 새로운 적 생성
      const newEnemy = this.spawnEnemy();
      if (newEnemy) {
        enemies.push(newEnemy);
      }
    }
  }

  /**
   * 적 생성
   */
  private spawnEnemy(): Enemy | null {
    // 화면 가장자리에서 랜덤 위치 생성
    const spawnPos = this.getRandomSpawnPosition();

    // 게임 시간에 따라 적 티어 선택
    const tier = selectEnemyTier(this.gameTime);

    const enemy = new Enemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
    return enemy;
  }

  /**
   * 랜덤 스폰 위치 생성 (화면 가장자리)
   */
  private getRandomSpawnPosition(): Vector2 {
    const margin = SPAWN_BALANCE.spawnMargin;
    const side = Math.floor(Math.random() * 4); // 0~3: 상하좌우

    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // 위쪽
        x = Math.random() * this.screenWidth;
        y = -margin;
        break;
      case 1: // 오른쪽
        x = this.screenWidth + margin;
        y = Math.random() * this.screenHeight;
        break;
      case 2: // 아래쪽
        x = Math.random() * this.screenWidth;
        y = this.screenHeight + margin;
        break;
      case 3: // 왼쪽
        x = -margin;
        y = Math.random() * this.screenHeight;
        break;
    }

    return { x, y };
  }

  /**
   * 스폰 간격 조정 (난이도 증가)
   */
  public increaseSpawnRate(): void {
    this.spawnInterval = Math.max(
      SPAWN_BALANCE.minInterval,
      this.spawnInterval - SPAWN_BALANCE.intervalReduction
    );
    console.log(`스폰 간격 감소: ${this.spawnInterval.toFixed(1)}초`);
  }
}
