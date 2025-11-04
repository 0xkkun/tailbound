/**
 * 보스 영혼 - 보스 처치 시 드랍되는 특별한 아이템
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { AnimatedSprite, Assets, Container, Rectangle, Texture } from 'pixi.js';

import type { Player } from './Player';

export class BossSoul extends Container {
  // 상태
  public active: boolean = true;
  private collected: boolean = false;

  // 애니메이션
  private sprite: AnimatedSprite | null = null;
  private floatTime: number = 0;
  private attractSpeed: number = 0;
  private isBeingCollected: boolean = false;

  // 스프라이트 설정
  private static readonly SPRITE_CONFIG = {
    assetPath: `${CDN_BASE_URL}/assets/drop/soul.png`,
    totalWidth: 320, // 10프레임 × 32px
    height: 32,
    frameCount: 10,
    frameWidth: 32,
    scale: 3.0, // 3배 크기 (96x96px)
    animationSpeed: 0.15,
  };

  // 스프라이트 캐시
  private static frames: Texture[] | null = null;
  private static isLoading: boolean = false;
  private static loadPromise: Promise<void> | null = null;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // z-index 설정 (높은 우선순위)
    this.zIndex = 1500;

    // 스프라이트 로드
    this.loadSprite();
  }

  /**
   * 스프라이트 로드
   */
  private async loadSprite(): Promise<void> {
    // 캐시된 프레임이 있으면 즉시 사용
    if (BossSoul.frames) {
      this.createSprite(BossSoul.frames);
      return;
    }

    // 로딩 중이면 대기
    if (BossSoul.isLoading && BossSoul.loadPromise) {
      await BossSoul.loadPromise;
      if (BossSoul.frames) {
        this.createSprite(BossSoul.frames);
      }
      return;
    }

    // 새로 로드
    BossSoul.isLoading = true;
    BossSoul.loadPromise = this.loadFrames();
    await BossSoul.loadPromise;

    if (BossSoul.frames) {
      this.createSprite(BossSoul.frames);
    }
  }

  /**
   * 프레임 로드
   */
  private async loadFrames(): Promise<void> {
    try {
      const { assetPath, frameCount, frameWidth, height } = BossSoul.SPRITE_CONFIG;

      const baseTexture = await Assets.load(assetPath);
      baseTexture.source.scaleMode = 'nearest';

      const frames: Texture[] = [];
      for (let i = 0; i < frameCount; i++) {
        const rect = new Rectangle(i * frameWidth, 0, frameWidth, height);
        frames.push(new Texture({ source: baseTexture.source, frame: rect }));
      }

      BossSoul.frames = frames;
      BossSoul.isLoading = false;
      console.log('[BossSoul] Sprites loaded successfully');
    } catch (error) {
      console.error('[BossSoul] Failed to load sprites:', error);
      BossSoul.isLoading = false;
    }
  }

  /**
   * 스프라이트 생성
   */
  private createSprite(frames: Texture[]): void {
    if (this.destroyed) {
      return;
    }

    this.sprite = new AnimatedSprite(frames);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(BossSoul.SPRITE_CONFIG.scale);
    this.sprite.animationSpeed = BossSoul.SPRITE_CONFIG.animationSpeed;
    this.sprite.loop = true;
    this.sprite.play();

    this.addChild(this.sprite);
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number, player: Player): void {
    if (!this.active || this.collected) {
      return;
    }

    // 부유 애니메이션
    this.floatTime += deltaTime;
    const floatOffset = Math.sin(this.floatTime * 2) * 10;
    if (this.sprite) {
      this.sprite.y = floatOffset;
    }

    // 플레이어와의 거리 체크
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 획득 범위 (넓게 설정)
    const pickupRadius = 150;

    if (distance < pickupRadius) {
      if (!this.isBeingCollected) {
        this.isBeingCollected = true;
        this.attractSpeed = 300;
      }

      // 플레이어에게 끌려감
      this.attractSpeed += 1000 * deltaTime;
      const moveDistance = Math.min(this.attractSpeed * deltaTime, distance);
      const ratio = moveDistance / distance;

      this.x += dx * ratio;
      this.y += dy * ratio;

      // 충돌 범위 (좁게 설정)
      const collectRadius = 30;
      if (distance < collectRadius) {
        this.onCollect(player);
      }
    }
  }

  /**
   * 획득 처리
   */
  private onCollect(player: Player): void {
    if (this.collected) {
      return;
    }

    this.collected = true;
    this.active = false;

    console.log('[BossSoul] Soul collected!');

    // 플레이어 체력 완전 회복
    player.health = player.maxHealth;

    // 경험치 대량 획득
    player.gainExperience(1000);

    // TODO: 추가 보상 처리 (스테이지 클리어, 업그레이드 등)

    this.destroy();
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    super.destroy({ children: true });
  }

  /**
   * 프리로드 (게임 시작 시 호출)
   */
  public static async preload(): Promise<void> {
    if (BossSoul.frames) {
      return;
    }

    if (BossSoul.isLoading && BossSoul.loadPromise) {
      return BossSoul.loadPromise;
    }

    const soul = new BossSoul(0, 0);
    await soul.loadSprite();
    soul.destroy();
  }
}
