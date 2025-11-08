/**
 * 적 스폰 시스템
 */

import { SPAWN_BALANCE } from '@config/balance.config';
import { selectFieldEnemyTier } from '@game/data/enemies';
import type { BaseEnemy } from '@game/entities/enemies';
import {
  DokkaebiEnemy,
  EvilSpiritEnemy,
  FoxEnemy,
  GrimReaperEnemy,
  MaidenGhostEnemy,
  MaskEnemy,
  SkeletonEnemy,
  TotemEnemy,
  WaterGhostEnemy,
} from '@game/entities/enemies';
import type { Vector2 } from '@type/game.types';

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

  // 테두리 크기 (스폰 제한용)
  private borderLeft: number = 0;
  private borderRight: number = 0;
  private borderBottom: number = 0;

  // 스폰 마진 상수
  private readonly SPAWN_MARGIN_FROM_BORDER = 50;

  constructor(worldWidth: number, worldHeight: number, screenWidth: number, screenHeight: number) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /**
   * 테두리 크기 설정 (스폰 제한용)
   */
  public setBorderSizes(left: number, right: number, bottom: number): void {
    this.borderLeft = Math.max(0, left);
    this.borderRight = Math.max(0, right);
    this.borderBottom = Math.max(0, bottom);
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
   * 게임 시간에 따라 등장 가능한 적 타입 리스트 반환
   */
  private getAvailableEnemyTypes(gameTime: number): readonly string[] {
    const phases = SPAWN_BALANCE.timePhases;
    const types = SPAWN_BALANCE.enemyTypesByPhase;

    if (gameTime < phases.phase1) {
      return types.phase0;
    } else if (gameTime < phases.phase2) {
      return types.phase1;
    } else if (gameTime < phases.phase3) {
      return types.phase2;
    } else if (gameTime < phases.phase4) {
      return types.phase3;
    } else if (gameTime < phases.final) {
      return types.phase4;
    } else {
      return types.final;
    }
  }

  /**
   * 가용 적 타입 중 확률에 따라 선택 (확률 정규화)
   */
  private selectEnemyType(availableTypes: readonly string[]): string {
    const rates = SPAWN_BALANCE.enemySpawnRates;

    // 가용 타입의 확률만 추출
    let totalRate = 0;
    const filteredRates: { [key: string]: number } = {};

    for (const type of availableTypes) {
      filteredRates[type] = rates[type as keyof typeof rates];
      totalRate += filteredRates[type];
    }

    // 확률 정규화 (합을 1.0으로)
    const normalizedRates: { [key: string]: number } = {};
    for (const type of availableTypes) {
      normalizedRates[type] = filteredRates[type] / totalRate;
    }

    // 정규화된 확률로 선택
    const rand = Math.random();
    let cumulative = 0;

    for (const type of availableTypes) {
      cumulative += normalizedRates[type];
      if (rand < cumulative) {
        return type;
      }
    }

    return availableTypes[0]; // 폴백
  }

  /**
   * 웨이브 스폰 (여러 방향에서 소규모 그룹으로 생성)
   */
  private spawnWave(playerPos: Vector2, enemies: BaseEnemy[]): void {
    // 최대 적 개체 수 체크 (성능 최적화)
    const activeEnemyCount = enemies.filter((e) => e.active && e.isAlive()).length;
    if (activeEnemyCount >= SPAWN_BALANCE.maxActiveEnemies) {
      console.log(
        `최대 적 개체 수 도달 (${activeEnemyCount}/${SPAWN_BALANCE.maxActiveEnemies}), 스폰 생략`
      );
      return;
    }

    const availableSlots = SPAWN_BALANCE.maxActiveEnemies - activeEnemyCount;

    // 게임 시간에 따라 그룹 수 증가
    const timeBonus = Math.floor(this.gameTime / SPAWN_BALANCE.groupIncreaseInterval);
    const groupCount = Math.min(SPAWN_BALANCE.maxGroups, SPAWN_BALANCE.minGroups + timeBonus);

    let totalSpawned = 0;
    const usedSides = new Set<number>();

    // 여러 그룹 생성
    for (let i = 0; i < groupCount; i++) {
      // 슬롯 초과 체크
      if (totalSpawned >= availableSlots) {
        break;
      }

      // 각 그룹의 크기 (1~4마리), 남은 슬롯만큼만
      const groupSize = Math.min(
        Math.floor(Math.random() * (SPAWN_BALANCE.maxGroupSize - SPAWN_BALANCE.minGroupSize + 1)) +
          SPAWN_BALANCE.minGroupSize,
        availableSlots - totalSpawned
      );

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

        // 게임 시간에 따라 필드몹 티어 선택
        const tier = selectFieldEnemyTier(this.gameTime);

        // 시간대별 등장 가능한 적 타입 필터링
        const availableTypes = this.getAvailableEnemyTypes(this.gameTime);

        // 확률에 따라 적 타입 선택
        const selectedType = this.selectEnemyType(availableTypes);

        // 선택된 타입에 따라 적 생성
        let enemy: BaseEnemy;
        switch (selectedType) {
          case 'skeleton':
            enemy = new SkeletonEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'dokkaebi':
            enemy = new DokkaebiEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'mask':
            enemy = new MaskEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'maidenGhost':
            enemy = new MaidenGhostEnemy(
              `enemy_${this.enemyCount++}`,
              spawnPos.x,
              spawnPos.y,
              tier
            );
            break;
          case 'evilSpirit':
            enemy = new EvilSpiritEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'fox':
            enemy = new FoxEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'grimReaper':
            enemy = new GrimReaperEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'totem':
            enemy = new TotemEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          case 'waterGhost':
            enemy = new WaterGhostEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
            break;
          default:
            enemy = new SkeletonEnemy(`enemy_${this.enemyCount++}`, spawnPos.x, spawnPos.y, tier);
        }

        enemies.push(enemy);
        totalSpawned++;
      }
    }

    console.log(
      `웨이브 스폰: ${groupCount}개 그룹, 총 ${totalSpawned}마리 (활성: ${activeEnemyCount + totalSpawned}/${SPAWN_BALANCE.maxActiveEnemies})`
    );
  }

  /**
   * 특정 방향의 화면 밖 스폰 중심점 생성
   */
  private getOffScreenSpawnCenterBySide(playerPos: Vector2, side: number): Vector2 {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    // 스폰 가능한 유효 영역 (테두리 제외)
    const minX = this.borderLeft + this.SPAWN_MARGIN_FROM_BORDER;
    const maxX = this.worldWidth - this.borderRight - this.SPAWN_MARGIN_FROM_BORDER;
    const minY = this.SPAWN_MARGIN_FROM_BORDER;
    const maxY = this.worldHeight - this.borderBottom - this.SPAWN_MARGIN_FROM_BORDER;

    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // 위쪽 화면 밖
        x = playerPos.x + (Math.random() - 0.5) * this.screenWidth;
        y = playerPos.y - halfScreenHeight - SPAWN_BALANCE.spawnMargin;
        // X 좌표를 유효 영역 내로 제한
        x = Math.max(minX, Math.min(maxX, x));
        // Y 좌표: 위쪽 경계를 넘지 않으면서 화면 밖에 유지
        if (y < minY) {
          y = minY;
          // 위쪽 경계에 막혔으면 X를 화면 밖으로 조정
          if (Math.abs(x - playerPos.x) < halfScreenWidth) {
            x = Math.random() < 0.5 ? minX : maxX;
          }
        }
        break;
      case 1: // 오른쪽 화면 밖
        x = playerPos.x + halfScreenWidth + SPAWN_BALANCE.spawnMargin;
        y = playerPos.y + (Math.random() - 0.5) * this.screenHeight;
        // Y 좌표를 유효 영역 내로 제한
        y = Math.max(minY, Math.min(maxY, y));
        // X 좌표: 오른쪽 경계를 넘지 않으면서 화면 밖에 유지
        if (x > maxX) {
          x = maxX;
          // 오른쪽 경계에 막혔으면 Y를 화면 밖으로 조정
          if (Math.abs(y - playerPos.y) < halfScreenHeight) {
            y = Math.random() < 0.5 ? minY : maxY;
          }
        }
        break;
      case 2: // 아래쪽 화면 밖
        x = playerPos.x + (Math.random() - 0.5) * this.screenWidth;
        y = playerPos.y + halfScreenHeight + SPAWN_BALANCE.spawnMargin;
        // X 좌표를 유효 영역 내로 제한
        x = Math.max(minX, Math.min(maxX, x));
        // Y 좌표: 아래쪽 경계를 넘지 않으면서 화면 밖에 유지
        if (y > maxY) {
          y = maxY;
          // 아래쪽 경계에 막혔으면 X를 화면 밖으로 조정
          if (Math.abs(x - playerPos.x) < halfScreenWidth) {
            x = Math.random() < 0.5 ? minX : maxX;
          }
        }
        break;
      case 3: // 왼쪽 화면 밖
        x = playerPos.x - halfScreenWidth - SPAWN_BALANCE.spawnMargin;
        y = playerPos.y + (Math.random() - 0.5) * this.screenHeight;
        // Y 좌표를 유효 영역 내로 제한
        y = Math.max(minY, Math.min(maxY, y));
        // X 좌표: 왼쪽 경계를 넘지 않으면서 화면 밖에 유지
        if (x < minX) {
          x = minX;
          // 왼쪽 경계에 막혔으면 Y를 화면 밖으로 조정
          if (Math.abs(y - playerPos.y) < halfScreenHeight) {
            y = Math.random() < 0.5 ? minY : maxY;
          }
        }
        break;
    }

    return { x, y };
  }

  /**
   * 중심점 주변에 랜덤하게 퍼진 위치 생성
   */
  private getClusteredPosition(center: Vector2): Vector2 {
    // 랜덤 각도와 거리
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * SPAWN_BALANCE.clusterRadius;

    let x = center.x + Math.cos(angle) * distance;
    let y = center.y + Math.sin(angle) * distance;

    // 테두리 영역 제외하고 재제한 (클러스터링 후에도 안전)
    const minX = this.borderLeft + this.SPAWN_MARGIN_FROM_BORDER;
    const maxX = this.worldWidth - this.borderRight - this.SPAWN_MARGIN_FROM_BORDER;
    const minY = this.SPAWN_MARGIN_FROM_BORDER;
    const maxY = this.worldHeight - this.borderBottom - this.SPAWN_MARGIN_FROM_BORDER;

    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

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
