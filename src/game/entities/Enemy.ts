/**
 * 적 엔티티
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';
import { getDirection } from '@/game/utils/collision';
import type { Vector2 } from '@/types/game.types';

export class Enemy extends Container {
  // Static 텍스처 캐시 (모든 Enemy 인스턴스가 공유)
  private static spriteFrames: Texture[] | null = null;
  private static isLoading: boolean = false;
  private static loadPromise: Promise<void> | null = null;

  public id: string;
  public active: boolean = true;
  public tier: EnemyTier;
  public radius: number;

  // 스텟
  public health: number;
  public maxHealth: number;
  public speed: number;
  public damage: number;
  public xpDrop: number;

  // 그래픽스
  private graphics: Graphics;
  private sprite?: AnimatedSprite;
  private color: number;

  // AI
  private targetPosition: Vector2 | null = null;

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super();

    this.id = id;
    this.x = x;
    this.y = y;
    this.tier = tier;

    // 티어에 따른 스탯 설정
    const stats = ENEMY_BALANCE[tier];
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;

    // 티어별 색상
    switch (tier) {
      case 'elite':
        this.color = 0xff8855;
        break;
      case 'boss':
        this.color = 0xff5555;
        break;
      default:
        this.color = 0x55ff55;
    }

    // 그래픽 생성
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // 스프라이트 애니메이션 로드
    this.loadSprite();

    this.render();
  }

  /**
   * 게임 시작 시 스프라이트 미리 로드 (static 메서드)
   * GameScene 초기화 시 한 번만 호출
   */
  public static async preloadSprites(): Promise<void> {
    // 이미 로드되었거나 로딩 중이면 기존 Promise 반환
    if (Enemy.spriteFrames !== null) {
      return;
    }
    if (Enemy.isLoading && Enemy.loadPromise) {
      return Enemy.loadPromise;
    }

    Enemy.isLoading = true;
    Enemy.loadPromise = (async () => {
      try {
        // 스프라이트 시트 로드
        const baseTexture = await Assets.load('/assets/skeleton-walk.png');

        // 프레임 분할 (286x33 이미지, 13개 프레임)
        const totalWidth = 286;
        const frameCount = 13;
        const frameWidthExact = totalWidth / frameCount; // 22.0769...
        const frameHeight = 33;

        // 픽셀 아트용 필터링 설정
        baseTexture.source.scaleMode = 'nearest';

        const frames: Texture[] = [];
        for (let i = 0; i < frameCount; i++) {
          // 실수 계산으로 정확한 경계 찾기
          const x = Math.floor(i * frameWidthExact);
          const nextX = i === frameCount - 1 ? totalWidth : Math.floor((i + 1) * frameWidthExact);
          const width = nextX - x;

          const frame = new Texture({
            source: baseTexture.source,
            frame: new Rectangle(x, 0, width, frameHeight),
          });
          frames.push(frame);
        }

        // Static 캐시에 저장
        Enemy.spriteFrames = frames;

        if (import.meta.env.DEV) {
          console.log('[Enemy] Sprite frames preloaded successfully');
        }
      } catch (error) {
        console.error('[Enemy] Failed to preload sprite frames:', error);
        Enemy.spriteFrames = null;
      } finally {
        Enemy.isLoading = false;
      }
    })();

    return Enemy.loadPromise;
  }

  /**
   * 스프라이트 애니메이션 생성 (캐시된 텍스처 사용)
   */
  private loadSprite(): void {
    // 캐시된 프레임이 없으면 스킵 (기본 그래픽 사용)
    if (!Enemy.spriteFrames || Enemy.spriteFrames.length === 0) {
      if (import.meta.env.DEV) {
        console.warn(`[Enemy ${this.id}] No cached sprite frames available`);
      }
      return;
    }

    try {
      // 캐시된 프레임으로 AnimatedSprite 생성
      this.sprite = new AnimatedSprite(Enemy.spriteFrames);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(2); // 크기 2배 확대

      // 티어별 애니메이션 속도 적용
      const animationSpeed = ENEMY_BALANCE[this.tier].animationSpeed ?? 0.15;
      this.sprite.animationSpeed = animationSpeed;
      this.sprite.play();

      // 초기 방향 설정
      if (this.targetPosition) {
        const currentPos = { x: this.x, y: this.y };
        const direction = getDirection(currentPos, this.targetPosition);
        if (direction.x < 0) {
          this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        }
      }

      // graphics 아래에 추가
      const graphicsIndex = this.getChildIndex(this.graphics);
      this.addChildAt(this.sprite, Math.max(0, graphicsIndex));

      // 스프라이트 로드 완료 후 렌더링 업데이트
      this.render();
    } catch (error) {
      console.error(`[Enemy ${this.id}] Failed to create sprite:`, error);
      // 폴백: 기본 그래픽 사용
    }
  }

  /**
   * 타겟 설정 (플레이어 위치)
   */
  public setTarget(target: Vector2): void {
    this.targetPosition = target;
  }

  /**
   * 데미지 받기
   */
  public takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    // 피격 효과 (빨간색으로 잠깐 변경)
    this.flashRed();
  }

  /**
   * 생존 여부
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) {
      return;
    }

    // 플레이어를 향해 이동
    const currentPos = { x: this.x, y: this.y };
    const direction = getDirection(currentPos, this.targetPosition);

    this.x += direction.x * this.speed * deltaTime;
    this.y += direction.y * this.speed * deltaTime;

    // 스프라이트 좌우 반전 (왼쪽으로 이동할 때 반전)
    if (this.sprite && direction.x !== 0) {
      if (direction.x < 0) {
        // 왼쪽으로 이동 (플레이어가 왼쪽) - 반전
        this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
      } else {
        // 오른쪽으로 이동 (플레이어가 오른쪽) - 정상
        this.sprite.scale.x = Math.abs(this.sprite.scale.x);
      }
    }

    this.render();
  }

  /**
   * 피격 효과 (빨간색 깜빡임)
   */
  private flashRed(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    // 스프라이트가 있으면 색상 틴트로 효과 적용
    if (this.sprite) {
      this.sprite.tint = 0xff0000;
      setTimeout(() => {
        if (!this.destroyed && this.sprite) {
          this.sprite.tint = 0xffffff; // 원래 색으로
        }
      }, 100);
    } else {
      // 스프라이트 없으면 그래픽으로 표시
      this.graphics.clear();
      this.graphics.circle(0, 0, this.radius);
      this.graphics.fill(0xff0000);

      // 0.1초 후 원래 색으로
      setTimeout(() => {
        if (!this.destroyed && this.graphics) {
          this.render();
        }
      }, 100);
    }
  }

  /**
   * 렌더링
   */
  private render(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    this.graphics.clear();

    // 스프라이트가 없으면 기본 원형 그리기
    if (!this.sprite) {
      // 티어별 색상 원
      this.graphics.circle(0, 0, this.radius);
      this.graphics.fill(this.color);

      // 테두리
      this.graphics.circle(0, 0, this.radius);
      this.graphics.stroke({ width: 2, color: 0xffffff });
    }

    // 체력바 (적 위에 표시)
    const barWidth = this.radius * 2;
    const barHeight = 4;
    const barY = -this.radius - 10;

    // 배경 (빨간색)
    this.graphics.rect(-barWidth / 2, barY, barWidth, barHeight);
    this.graphics.fill(0xff0000);

    // 현재 체력 (녹색)
    const healthRatio = this.health / this.maxHealth;
    this.graphics.rect(-barWidth / 2, barY, barWidth * healthRatio, barHeight);
    this.graphics.fill(0x00ff00);
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.sprite?.stop();
    // 프레임은 static 캐시이므로 destroy하지 않음
    // sprite 인스턴스만 destroy
    this.sprite?.destroy({ texture: false });
    this.graphics.destroy();
    super.destroy({ children: true });
  }

  /**
   * Static 캐시 정리 (게임 종료 시 호출)
   */
  public static clearCache(): void {
    if (Enemy.spriteFrames) {
      Enemy.spriteFrames.forEach((frame) => frame.destroy(false));
      Enemy.spriteFrames = null;
    }
    Enemy.loadPromise = null;
    Enemy.isLoading = false;
  }
}
