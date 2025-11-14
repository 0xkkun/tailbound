/**
 * 네임드 몬스터 스폰 시스템
 *
 * 3분/6분/9분에 각각 2마리씩 랜덤 네임드 몬스터를 스폰
 */

import { NAMED_SPAWN_TIMES } from '@config/balance.config';
import { selectRandomNamedType } from '@game/data/enemies';
import { NamedEnemy } from '@game/entities/enemies/NamedEnemy';
import { NamedProjectile } from '@game/entities/NamedProjectile';
import { Player } from '@game/entities/Player';
import { checkCircleCollision } from '@game/utils/collision';
import { Container } from 'pixi.js';

export class NamedSpawnSystem {
  // 엔티티
  private namedEnemies: NamedEnemy[] = [];
  private namedProjectiles: NamedProjectile[] = [];

  // 레이어 참조
  private gameLayer: Container;

  // 플레이어 참조
  private player: Player;

  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  // 맵 크기
  private mapWidth: number;
  private mapHeight: number;

  // 게임 시간
  private gameTime: number = 0;

  // 스폰 상태 추적
  private spawnedPhases: Set<number> = new Set(); // 이미 스폰된 페이즈 (0=3분, 1=6분, 2=9분)

  constructor(
    gameLayer: Container,
    player: Player,
    screenWidth: number,
    screenHeight: number,
    mapWidth: number,
    mapHeight: number
  ) {
    this.gameLayer = gameLayer;
    this.player = player;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
  }

  /**
   * 게임 시간 업데이트 및 스폰 체크
   */
  public update(deltaTime: number): void {
    this.gameTime += deltaTime;

    // 스폰 타이밍 체크
    this.checkSpawnTiming();

    // 네임드 몬스터 업데이트
    this.updateNamedEnemies(deltaTime);

    // 투사체 업데이트
    this.updateProjectiles(deltaTime);

    // 충돌 처리
    this.checkCollisions();

    // 죽은 엔티티 제거
    this.cleanup();
  }

  /**
   * 스폰 타이밍 체크
   */
  private checkSpawnTiming(): void {
    for (let i = 0; i < NAMED_SPAWN_TIMES.length; i++) {
      const spawnTime = NAMED_SPAWN_TIMES[i];

      // 이미 스폰했거나 아직 시간이 안 되었으면 스킵
      if (this.spawnedPhases.has(i) || this.gameTime < spawnTime) {
        continue;
      }

      // 스폰
      this.spawnNamedEnemies();
      this.spawnedPhases.add(i);
    }
  }

  /**
   * 네임드 몬스터 2마리 스폰
   */
  private spawnNamedEnemies(): void {
    if (!this.player) {
      console.error('[NamedSpawnSystem] player가 없습니다!');
      return;
    }

    console.log('[NamedSpawnSystem] spawnNamedEnemies 호출됨', {
      gameTime: this.gameTime,
      playerPos: { x: this.player.x, y: this.player.y },
    });

    const count = 2; // 2마리씩 스폰

    for (let i = 0; i < count; i++) {
      const namedType = selectRandomNamedType();
      const position = this.getRandomSpawnPosition();

      console.log('[NamedSpawnSystem] 네임드 생성:', {
        index: i,
        namedType,
        position,
      });

      const named = new NamedEnemy(
        `named_${Date.now()}_${Math.random()}`,
        position.x,
        position.y,
        namedType,
        this.gameTime
      );

      // 플레이어 타겟 설정
      named.setTarget({ x: this.player.x, y: this.player.y });

      // 투사체 발사 콜백 등록
      named.onFireProjectile = (projInfo) => {
        console.log('[NamedSpawnSystem] 투사체 발사 콜백 호출됨!', projInfo);
        this.createNamedProjectile(projInfo);
      };

      this.namedEnemies.push(named);
      this.gameLayer.addChild(named);

      console.log('[NamedSpawnSystem] 네임드 추가 완료:', {
        totalCount: this.namedEnemies.length,
        active: named.active,
      });
    }
  }

  /**
   * 랜덤 스폰 위치 생성 (화면 밖 600px)
   */
  private getRandomSpawnPosition(): { x: number; y: number } {
    const margin = 600; // 화면 밖 마진
    const playerX = this.player.x;
    const playerY = this.player.y;

    // 화면 경계 계산
    const minX = Math.max(0, playerX - this.screenWidth / 2 - margin);
    const maxX = Math.min(this.mapWidth, playerX + this.screenWidth / 2 + margin);
    const minY = Math.max(0, playerY - this.screenHeight / 2 - margin);
    const maxY = Math.min(this.mapHeight, playerY + this.screenHeight / 2 + margin);

    // 화면 밖 영역에서 랜덤 위치 선택
    const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽

    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // 위
        x = minX + Math.random() * (maxX - minX);
        y = minY;
        break;
      case 1: // 오른쪽
        x = maxX;
        y = minY + Math.random() * (maxY - minY);
        break;
      case 2: // 아래
        x = minX + Math.random() * (maxX - minX);
        y = maxY;
        break;
      case 3: // 왼쪽
        x = minX;
        y = minY + Math.random() * (maxY - minY);
        break;
    }

    // 맵 경계 내로 제한
    x = Math.max(100, Math.min(this.mapWidth - 100, x));
    y = Math.max(100, Math.min(this.mapHeight - 100, y));

    return { x, y };
  }

  /**
   * 네임드 몬스터 업데이트
   */
  private updateNamedEnemies(deltaTime: number): void {
    for (const named of this.namedEnemies) {
      if (!named.active) continue;

      // 타겟 위치 업데이트
      named.setTarget({ x: this.player.x, y: this.player.y });
      named.update(deltaTime);
    }
  }

  /**
   * 네임드 투사체 생성
   */
  private createNamedProjectile(projInfo: {
    startX: number;
    startY: number;
    direction: { x: number; y: number };
    damage: number;
  }): void {
    const projectile = new NamedProjectile(
      projInfo.startX,
      projInfo.startY,
      projInfo.direction,
      projInfo.damage
    );

    this.namedProjectiles.push(projectile);
    this.gameLayer.addChild(projectile);
  }

  /**
   * 투사체 업데이트
   */
  private updateProjectiles(deltaTime: number): void {
    for (const projectile of this.namedProjectiles) {
      projectile.update(deltaTime);

      // 맵 밖으로 나가면 비활성화
      if (
        projectile.x < 0 ||
        projectile.x > this.mapWidth ||
        projectile.y < 0 ||
        projectile.y > this.mapHeight
      ) {
        projectile.active = false;
      }
    }
  }

  /**
   * 충돌 처리
   */
  private checkCollisions(): void {
    // 네임드 투사체 vs 플레이어
    for (const projectile of this.namedProjectiles) {
      if (!projectile.active) continue;

      if (
        checkCircleCollision(
          { x: projectile.x, y: projectile.y, radius: projectile.radius },
          { x: this.player.x, y: this.player.y, radius: this.player.radius }
        )
      ) {
        this.player.takeDamage(projectile.damage);
        projectile.active = false;
      }
    }
  }

  /**
   * 죽은 엔티티 제거
   */
  private cleanup(): void {
    // 네임드 몬스터 제거
    this.namedEnemies = this.namedEnemies.filter((named) => {
      if (!named.active) {
        this.gameLayer.removeChild(named);
        named.destroy();
        return false;
      }
      return true;
    });

    // 투사체 제거
    this.namedProjectiles = this.namedProjectiles.filter((projectile) => {
      if (!projectile.active) {
        this.gameLayer.removeChild(projectile);
        projectile.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * 네임드 몬스터 목록 반환
   */
  public getNamedEnemies(): NamedEnemy[] {
    return this.namedEnemies;
  }

  /**
   * 모든 엔티티 제거
   */
  public destroy(): void {
    for (const named of this.namedEnemies) {
      this.gameLayer.removeChild(named);
      named.destroy();
    }

    for (const projectile of this.namedProjectiles) {
      this.gameLayer.removeChild(projectile);
      projectile.destroy();
    }

    this.namedEnemies = [];
    this.namedProjectiles = [];
  }
}
