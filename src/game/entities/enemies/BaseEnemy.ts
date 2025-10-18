/**
 * 베이스 적 엔티티 (추상 클래스)
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';
import { getDirection } from '@/game/utils/collision';
import type { Vector2 } from '@/types/game.types';

import type { EnemySpriteCache, EnemySpriteConfig } from './EnemySprite';

export abstract class BaseEnemy extends Container {
  // Static 텍스처 캐시 - 모든 적 타입이 공유
  private static spriteCache: Map<string, EnemySpriteCache> = new Map();

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
  protected graphics: Graphics;
  protected sprite?: AnimatedSprite;
  protected color: number;

  // AI
  protected targetPosition: Vector2 | null = null;

  // 타임아웃 관리 (메모리 누수 방지)
  private flashTimeoutId?: ReturnType<typeof setTimeout>;

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
   * 각 적 타입의 스프라이트 설정 반환 (서브클래스에서 구현)
   */
  protected abstract getSpriteConfig(): EnemySpriteConfig;

  /**
   * 적 타입 이름 반환 (캐시 키로 사용)
   */
  protected abstract getEnemyType(): string;

  /**
   * 게임 시작 시 특정 적 타입의 스프라이트 미리 로드
   */
  public static async preloadSpriteType(
    enemyType: string,
    config: EnemySpriteConfig
  ): Promise<void> {
    // 캐시 확인
    let cache = BaseEnemy.spriteCache.get(enemyType);

    // 이미 로드 완료되었으면 즉시 반환
    if (cache?.frames && cache.frames.length > 0) {
      return;
    }

    // 로딩 중이면 기존 Promise 대기
    if (cache?.isLoading && cache.loadPromise) {
      return cache.loadPromise;
    }

    // 캐시 생성 및 즉시 isLoading=true 설정 (race condition 방지)
    if (!cache) {
      cache = {
        config,
        frames: null,
        isLoading: true, // 즉시 true로 설정
        loadPromise: null,
      };
      BaseEnemy.spriteCache.set(enemyType, cache);
    } else {
      cache.isLoading = true;
    }
    cache.loadPromise = (async () => {
      try {
        // 스프라이트 시트 로드
        const baseTexture = await Assets.load(config.assetPath);

        // 프레임 분할
        const frameWidthExact = config.totalWidth / config.frameCount;

        // 픽셀 아트용 필터링 설정
        baseTexture.source.scaleMode = 'nearest';

        const frames: Texture[] = [];
        for (let i = 0; i < config.frameCount; i++) {
          // 실수 계산으로 정확한 경계 찾기
          const x = Math.floor(i * frameWidthExact);
          const nextX =
            i === config.frameCount - 1 ? config.totalWidth : Math.floor((i + 1) * frameWidthExact);
          const width = nextX - x;

          const frame = new Texture({
            source: baseTexture.source,
            frame: new Rectangle(x, 0, width, config.height),
          });
          frames.push(frame);
        }

        // 캐시에 저장
        if (cache) {
          cache.frames = frames;
        }

        if (import.meta.env.DEV) {
          console.log(`[${enemyType}] Sprite frames preloaded successfully`);
        }
      } catch (error) {
        console.error(`[${enemyType}] Failed to preload sprite frames:`, error);
        if (cache) {
          cache.frames = null;
        }
      } finally {
        if (cache) {
          cache.isLoading = false;
          cache.loadPromise = null; // Promise 참조 정리
        }
      }
    })();

    return cache.loadPromise;
  }

  /**
   * 스프라이트 애니메이션 생성 (캐시된 텍스처 사용)
   */
  protected loadSprite(): void {
    const enemyType = this.getEnemyType();
    const cache = BaseEnemy.spriteCache.get(enemyType);

    // 캐시가 없거나 프레임이 없으면 스킵 (기본 그래픽 사용)
    if (!cache || cache.isLoading || !cache.frames || cache.frames.length === 0) {
      console.error(`[${enemyType} ${this.id}] Failed to load sprite:`, cache);
      return;
    }

    try {
      const config = this.getSpriteConfig();

      // 캐시된 프레임으로 AnimatedSprite 생성
      this.sprite = new AnimatedSprite(cache.frames);
      this.sprite.anchor.set(0.5);
      this.sprite.scale.set(config.scale);

      // 티어별 애니메이션 속도 적용
      const animationSpeed =
        config.animationSpeed ?? ENEMY_BALANCE[this.tier].animationSpeed ?? 0.15;
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
      console.error(`[${enemyType} ${this.id}] Failed to create sprite:`, error);
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
  protected flashRed(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    // 이전 타임아웃 정리 (메모리 누수 방지)
    if (this.flashTimeoutId !== undefined) {
      clearTimeout(this.flashTimeoutId);
    }

    // 스프라이트가 있으면 색상 틴트로 효과 적용
    if (this.sprite) {
      this.sprite.tint = 0xff0000;
      this.flashTimeoutId = setTimeout(() => {
        if (!this.destroyed && this.sprite) {
          this.sprite.tint = 0xffffff; // 원래 색으로
        }
        this.flashTimeoutId = undefined;
      }, 100);
    } else {
      // 스프라이트 없으면 그래픽으로 표시
      this.graphics.clear();
      this.graphics.circle(0, 0, this.radius);
      this.graphics.fill(0xff0000);

      // 0.1초 후 원래 색으로
      this.flashTimeoutId = setTimeout(() => {
        if (!this.destroyed && this.graphics) {
          this.render();
        }
        this.flashTimeoutId = undefined;
      }, 100);
    }
  }

  /**
   * 렌더링
   */
  protected render(): void {
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
    // 타임아웃 정리 (메모리 누수 방지)
    if (this.flashTimeoutId !== undefined) {
      clearTimeout(this.flashTimeoutId);
      this.flashTimeoutId = undefined;
    }

    this.sprite?.stop();
    // 프레임은 static 캐시이므로 destroy하지 않음
    // sprite 인스턴스만 destroy
    this.sprite?.destroy({ texture: false });
    this.graphics.destroy();
    super.destroy({ children: true });
  }

  /**
   * 모든 적 타입의 캐시 정리 (게임 종료 시 호출)
   */
  public static clearAllCaches(): void {
    for (const [, cache] of BaseEnemy.spriteCache.entries()) {
      if (cache.frames) {
        cache.frames.forEach((frame) => frame.destroy(false));
        cache.frames = null;
      }
      cache.loadPromise = null;
      cache.isLoading = false;
    }
    BaseEnemy.spriteCache.clear();
  }
}
