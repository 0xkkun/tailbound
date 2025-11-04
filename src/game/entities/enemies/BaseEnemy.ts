/**
 * 베이스 적 엔티티 (추상 클래스)
 */

import {
  BOSS_BALANCE,
  FIELD_ENEMY_BALANCE,
  KNOCKBACK_BALANCE,
  NAMED_ENEMY_BALANCE,
} from '@config/balance.config';
import { GAME_CONFIG } from '@config/game.config';
import type { EnemyCategory, FieldEnemyTier, NamedEnemyType } from '@game/data/enemies';
import { getDirection } from '@game/utils/collision';
import type { Vector2 } from '@type/game.types';
import {
  AnimatedSprite,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Text,
  Texture,
  Ticker,
} from 'pixi.js';

import type { EnemySpriteCache, EnemySpriteConfig } from './EnemySprite';

export abstract class BaseEnemy extends Container {
  // Static 텍스처 캐시 - 모든 적 타입이 공유
  private static spriteCache: Map<string, EnemySpriteCache> = new Map();

  public id: string;
  public active: boolean = true;
  public category!: EnemyCategory;
  public tier?: FieldEnemyTier;
  public namedType?: NamedEnemyType;
  public radius!: number;

  // 스텟
  public health!: number;
  public maxHealth!: number;
  public speed!: number;
  public damage!: number;
  public xpDrop!: number;

  // 그래픽스
  protected graphics!: Graphics;
  protected sprite?: AnimatedSprite;
  protected shadow!: Graphics; // 그림자
  protected color!: number;

  // AI
  protected targetPosition: Vector2 | null = null;

  // 넉백 시스템
  protected knockbackVelocity: Vector2 = { x: 0, y: 0 };
  protected knockbackResistance: number = 1.0; // 넉백 저항 (1.0 = 정상, 0.5 = 절반만 밀림)

  // 타임아웃 관리 (메모리 누수 방지)
  private flashTimeoutId?: ReturnType<typeof setTimeout>;

  constructor(
    id: string,
    x: number,
    y: number,
    category: EnemyCategory,
    tierOrType?: FieldEnemyTier | NamedEnemyType
  ) {
    super();

    this.id = id;
    this.x = x;
    this.y = y;

    // zIndex 설정
    this.zIndex = GAME_CONFIG.entities.enemy;

    // 카테고리 설정
    this.category = category;
    if (this.category === 'field' && tierOrType) {
      this.tier = tierOrType as FieldEnemyTier;
    } else if (this.category === 'named' && tierOrType) {
      this.namedType = tierOrType as NamedEnemyType;
    }

    // 카테고리에 따른 초기화
    if (this.category === 'field' && this.tier) {
      this.initFieldEnemy(this.tier);
    } else if (this.category === 'named' && this.namedType) {
      this.initNamedEnemy(this.namedType);
    } else if (this.category === 'boss') {
      this.initBoss();
    }

    // 그림자 생성 (가장 아래 레이어)
    this.shadow = new Graphics();
    this.createShadow();
    this.addChild(this.shadow);

    // 그래픽 생성
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // 스프라이트 애니메이션 로드
    this.loadSprite();

    this.render();
  }

  /**
   * 필드몹의 티어를 안전하게 반환 (타입 가드)
   * 필드몹이 아니거나 티어가 없으면 에러를 던짐
   */
  protected getFieldTier(): FieldEnemyTier {
    if (this.category !== 'field' || !this.tier) {
      throw new Error(`getFieldTier() can only be called on field enemies with a tier`);
    }
    return this.tier;
  }

  /**
   * 필드몹 초기화 (low/medium/high)
   */
  private initFieldEnemy(tier: FieldEnemyTier): void {
    const stats = FIELD_ENEMY_BALANCE[tier];
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;

    // 티어별 색상
    switch (tier) {
      case 'high':
        this.color = 0xff8855; // 주황색 (상급령)
        break;
      case 'medium':
        this.color = 0x55ff55; // 녹색 (중급령)
        break;
      case 'low':
        this.color = 0x88ff88; // 연한 녹색 (하급령)
        break;
    }
  }

  /**
   * 네임드 초기화
   */
  private initNamedEnemy(type: NamedEnemyType): void {
    const stats = NAMED_ENEMY_BALANCE[type];
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;
    this.knockbackResistance = stats.knockbackResistance ?? 0.5;

    // 네임드는 보라색
    this.color = 0xaa55ff;
  }

  /**
   * 보스 초기화 (자식 클래스에서 오버라이드)
   */
  protected initBoss(): void {
    // WhiteTigerBoss에서 구현
    // 기본값 설정 (폴백)
    const stats = BOSS_BALANCE.white_tiger;
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;
    this.knockbackResistance = stats.knockbackResistance ?? 0.2;
    this.color = 0xff5555;
  }

  /**
   * 그림자 생성 (서브클래스에서 오버라이드 가능)
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.7, this.radius * 0.25);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
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
      let animationSpeed = config.animationSpeed ?? 0.15;
      if (this.category === 'field' && this.tier) {
        animationSpeed =
          config.animationSpeed ?? FIELD_ENEMY_BALANCE[this.tier].animationSpeed ?? 0.15;
      }
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
  public takeDamage(amount: number, isCritical: boolean = false): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.active = false; // 체력이 0이면 비활성화
    }

    // 데미지 텍스트 표시
    this.showFloatingText(Math.round(amount).toString(), isCritical);

    // 피격 효과 (빨간색으로 잠깐 변경)
    this.flashRed();
  }

  /**
   * 플로팅 데미지 텍스트 표시
   */
  private showFloatingText(text: string, isCritical: boolean = false): void {
    const floatingText = new Text({
      text,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: isCritical ? 20 : 16,
        fill: isCritical ? 0xffff00 : 0xffffff, // 치명타: 노란색, 일반: 흰색
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      },
    });
    floatingText.resolution = 2;
    floatingText.anchor.set(0.5);
    floatingText.x = this.x;
    floatingText.y = this.y - this.radius - 20;

    // 부모에 추가
    if (this.parent) {
      this.parent.addChild(floatingText);
    }

    // 애니메이션 설정
    const duration = 1.0; // 1초
    const startY = floatingText.y;
    const riseDistance = 50; // 올라가는 거리
    let elapsed = 0;

    // Ticker 콜백 정의
    const animate = (ticker: Ticker) => {
      // deltaTime을 초 단위로 변환 (프레임율 독립적)
      const deltaTime = ticker.deltaTime / 60;
      elapsed += deltaTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // destroyed 체크 추가 (안전장치 - 메모리 누수 방지)
      if (floatingText.destroyed || !floatingText.parent) {
        Ticker.shared.remove(animate);
        return;
      }

      // 위로 올라가기
      floatingText.y = startY - progress * riseDistance;
      // 페이드아웃
      floatingText.alpha = 1.0 - progress;

      // 애니메이션 완료 시 정리
      if (progress >= 1.0) {
        Ticker.shared.remove(animate); // Ticker에서 제거
        if (!floatingText.destroyed) {
          floatingText.destroy(); // 텍스트 제거
        }
      }
    };

    // Ticker에 추가
    Ticker.shared.add(animate);
  }

  /**
   * 넉백 적용 (방향 벡터와 힘)
   */
  public applyKnockback(direction: Vector2, force: number): void {
    // 넉백 저항 적용
    const actualForce = force * this.knockbackResistance;

    // 방향 정규화
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length === 0) return;

    const normalizedX = direction.x / length;
    const normalizedY = direction.y / length;

    // 넉백 속도 설정
    this.knockbackVelocity.x = normalizedX * actualForce;
    this.knockbackVelocity.y = normalizedY * actualForce;
  }

  /**
   * 넉백 처리 (자식 클래스에서 update() 오버라이드 시 사용)
   * @returns 넉백 중이면 true (AI 동작을 스킵해야 함)
   */
  protected updateKnockback(deltaTime: number): boolean {
    if (this.knockbackVelocity.x === 0 && this.knockbackVelocity.y === 0) {
      return false; // 넉백 중이 아님
    }

    // 넉백 이동
    this.x += this.knockbackVelocity.x * deltaTime;
    this.y += this.knockbackVelocity.y * deltaTime;

    // 넉백 감속 (마찰력)
    const friction = KNOCKBACK_BALANCE.friction;
    this.knockbackVelocity.x *= Math.max(0, 1 - friction * deltaTime);
    this.knockbackVelocity.y *= Math.max(0, 1 - friction * deltaTime);

    // 거의 멈춤 상태면 완전히 정지
    const minVelocity = KNOCKBACK_BALANCE.minVelocity;
    if (
      Math.abs(this.knockbackVelocity.x) < minVelocity &&
      Math.abs(this.knockbackVelocity.y) < minVelocity
    ) {
      this.knockbackVelocity.x = 0;
      this.knockbackVelocity.y = 0;
    }

    return true; // 넉백 중
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

    // 넉백 처리
    if (this.updateKnockback(deltaTime)) {
      this.render();
      return; // 넉백 중에는 AI 동작 스킵
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

    // 자식 텍스트 즉시 제거 (Ticker 콜백 정리)
    this.removeChildren();

    this.sprite?.stop();
    // 프레임은 static 캐시이므로 destroy하지 않음
    // sprite 인스턴스만 destroy
    this.sprite?.destroy({ texture: false });
    this.shadow.destroy();
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
