/**
 * 적 스폰 시스템
 */

import { SPAWN_BALANCE } from '@/config/balance.config';
import { selectEnemyTier } from '@/game/data/enemies';
import type { BaseEnemy } from '@/game/entities/enemies';
import { SkeletonEnemy, TigerEnemy } from '@/game/entities/enemies';
import type { Vector2 } from '@/types/game.types';

export class SpawnSystem {
  private spawnTimer: number = 0;
  private spawnInterval: number = SPAWN_BALANCE.initialInterval;
  private enemyCount: number = 0;
  private gameTime: number = 0;

  // 월드 크기
  private worldWidth: number;
  private worldHeight: number;

  // 화면 크기 (동적)
  private screenWidth: number;
  private screenHeight: number;

  constructor(worldWidth: number, worldHeight: number, screenWidth: number, screenHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * 업데이트
   */
  public update(
    deltaTime: number,
    enemies: BaseEnemy[],
    gameTime: number,
    playerPos: Vector2
  ): void {
    this.gameTime = gameTime;
    this.spawnTimer += deltaTime;

    // 스폰 시간 도달
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      // 웨이브 형태로 여러 적 생성
      this.spawnWave(playerPos, enemies);
    }
  }

  /**
   * 웨이브 스폰 (여러 방향에서 소규모 그룹으로 생성)
   */
  private spawnWave(playerPos: Vector2, enemies: BaseEnemy[]): void {
    // 게임 시간에 따라 그룹 수 증가
    const timeBonus = Math.floor(this.gameTime / SPAWN_BALANCE.groupIncreaseInterval);
    const groupCount = Math.min(SPAWN_BALANCE.maxGroups, SPAWN_BALANCE.minGroups + timeBonus);

    let totalSpawned = 0;
    const usedSides = new Set<number>();

    // 여러 그룹 생성
    for (let i = 0; i < groupCount; i++) {
      // 각 그룹의 크기 (1~4마리)
      const groupSize =
        Math.floor(Math.random() * (SPAWN_BALANCE.maxGroupSize - SPAWN_BALANCE.minGroupSize + 1)) +
        SPAWN_BALANCE.minGroupSize;

      // 중복되지 않는 방향 선택 (가능하면)
      let side: number;
      let attempts = 0;
      do {
        side = Math.floor(Math.random() * 4);
        attempts++;
      } while (usedSides.has(side) && usedSides.size < 4 && attempts < 10);

      usedSides.add(side);

      // 해당 방향의 화면 밖 중심점
      const spawnCenter = this.getOffScreenSpawnCenterBySide(playerPos, side);

      // 중심점 주변에 그룹의 적들 생성
      for (let j = 0; j < groupSize; j++) {
        const spawnPos = this.getClusteredPosition(spawnCenter);

        // 게임 시간에 따라 적 티어 선택
        const tier = selectEnemyTier(this.gameTime);

        // 랜덤하게 적 타입 선택 (50% 스켈레톤, 50% 호랑이)
        const enemyType = Math.random() < 0.5 ? 'skeleton' : 'tiger';
        const enemy =
          enemyType === 'skeleton'
            ? new SkeletonEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier)
            : new TigerEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);

        enemies.push(enemy);
        totalSpawned++;
      }
    }

    console.log(`웨이브 스폰: ${groupCount}개 그룹, 총 ${totalSpawned}마리`);
  }

  /**
   * 특정 방향의 화면 밖 스폰 중심점 생성
   */
  private getOffScreenSpawnCenterBySide(playerPos: Vector2, side: number): Vector2 {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // 위쪽 화면 밖
        x = playerPos.x + (Math.random() - 0.5) * this.screenWidth;
        y = playerPos.y - halfScreenHeight - SPAWN_BALANCE.spawnMargin;
        break;
      case 1: // 오른쪽 화면 밖
        x = playerPos.x + halfScreenWidth + SPAWN_BALANCE.spawnMargin;
        y = playerPos.y + (Math.random() - 0.5) * this.screenHeight;
        break;
      case 2: // 아래쪽 화면 밖
        x = playerPos.x + (Math.random() - 0.5) * this.screenWidth;
        y = playerPos.y + halfScreenHeight + SPAWN_BALANCE.spawnMargin;
        break;
      case 3: // 왼쪽 화면 밖
        x = playerPos.x - halfScreenWidth - SPAWN_BALANCE.spawnMargin;
        y = playerPos.y + (Math.random() - 0.5) * this.screenHeight;
        break;
    }

    // 월드 경계 내로 제한
    x = Math.max(50, Math.min(this.worldWidth - 50, x));
    y = Math.max(50, Math.min(this.worldHeight - 50, y));

    return { x, y };
  }

  /**
   * 중심점 주변에 랜덤하게 퍼진 위치 생성
   */
  private getClusteredPosition(center: Vector2): Vector2 {
    // 랜덤 각도와 거리
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * SPAWN_BALANCE.clusterRadius;

    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance;

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

  /**
   * 화면 크기 업데이트 (리사이즈 시)
   */
  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }
}
