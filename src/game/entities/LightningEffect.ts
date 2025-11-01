/**
 * 번개 잔상 이펙트
 *
 * 보스 돌진 시 경로를 따라 생성되는 번개 이펙트
 */

import { AnimatedSprite, Assets, Container, Rectangle, Texture } from 'pixi.js';

export class LightningEffect extends Container {
  private sprite: AnimatedSprite | null = null;
  private lifetime: number = 0;
  private maxLifetime: number = 1.0; // 1초 후 소멸

  private static readonly SPRITE_CONFIG = {
    assetPath: '/assets/boss/lighting.png',
    totalWidth: 1352, // 13프레임 × 104px
    height: 22,
    frameCount: 13,
    scale: 6.0, // 보스 크기에 맞게 증가 (2.5 → 6.0)
    animationSpeed: 0.5,
  };

  // 스프라이트 캐시
  private static frames: Texture[] | null = null;
  private static isLoading: boolean = false;
  private static loadPromise: Promise<void> | null = null;

  constructor(x: number, y: number, rotation: number = 0) {
    super();

    this.x = x;
    this.y = y;
    this.rotation = rotation;

    this.loadSprite();
  }

  /**
   * 스프라이트 로드
   */
  private async loadSprite(): Promise<void> {
    // 캐시된 프레임이 있으면 즉시 사용
    if (LightningEffect.frames) {
      this.createSprite(LightningEffect.frames);
      return;
    }

    // 로딩 중이면 대기
    if (LightningEffect.isLoading && LightningEffect.loadPromise) {
      await LightningEffect.loadPromise;
      if (LightningEffect.frames) {
        this.createSprite(LightningEffect.frames);
      }
      return;
    }

    // 새로 로드
    LightningEffect.isLoading = true;
    LightningEffect.loadPromise = this.loadFrames();
    await LightningEffect.loadPromise;

    if (LightningEffect.frames) {
      this.createSprite(LightningEffect.frames);
    }
  }

  /**
   * 프레임 로드
   */
  private async loadFrames(): Promise<void> {
    try {
      const { assetPath, totalWidth, height, frameCount } = LightningEffect.SPRITE_CONFIG;
      const frameWidth = totalWidth / frameCount;

      const baseTexture = await Assets.load(assetPath);
      baseTexture.source.scaleMode = 'nearest';

      const frames: Texture[] = [];
      for (let i = 0; i < frameCount; i++) {
        const x = i * frameWidth;
        const rect = new Rectangle(x, 0, frameWidth, height);
        frames.push(new Texture({ source: baseTexture.source, frame: rect }));
      }

      LightningEffect.frames = frames;
      LightningEffect.isLoading = false;
    } catch (error) {
      console.warn('LightningEffect 스프라이트 로드 실패:', error);
      LightningEffect.isLoading = false;
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
    this.sprite.scale.set(LightningEffect.SPRITE_CONFIG.scale);
    this.sprite.animationSpeed = LightningEffect.SPRITE_CONFIG.animationSpeed;
    this.sprite.loop = true;
    this.sprite.play();

    this.addChild(this.sprite);
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    // 페이드아웃
    const fadeStart = 0.5; // 0.5초부터 페이드 시작
    if (this.lifetime > fadeStart) {
      const fadeProgress = (this.lifetime - fadeStart) / (this.maxLifetime - fadeStart);
      this.alpha = 1 - fadeProgress;
    }

    // 수명 체크
    if (this.lifetime >= this.maxLifetime) {
      this.destroy();
    }
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
    if (LightningEffect.frames) {
      return;
    }

    if (LightningEffect.isLoading && LightningEffect.loadPromise) {
      return LightningEffect.loadPromise;
    }

    const effect = new LightningEffect(0, 0);
    await effect.loadSprite();
    effect.destroy();
  }
}
