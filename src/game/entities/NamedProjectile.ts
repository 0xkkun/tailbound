/**
 * 네임드 몬스터 투사체
 *
 * 네임드 몬스터가 발사하는 불꽃 투사체
 * named-skillpng.png 에셋 사용
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

export class NamedProjectile extends Container {
  public active: boolean = true;
  public radius: number = 15; // 히트박스 크기

  // 투사체 속성
  public damage: number;
  private speed: number = 300; // 투사체 속도
  private lifeTime: number = 4; // 생존 시간 (초)
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: { x: number; y: number };

  // 시각 효과
  private sprite: AnimatedSprite | null = null;

  // 스프라이트 설정
  private static readonly SPRITE_PATH = `${CDN_BASE_URL}/assets/named-skillpng.png`;
  private static readonly FRAME_WIDTH = 32;
  private static readonly FRAME_HEIGHT = 32;
  private static readonly FRAME_COUNT = 10; // 10프레임 (1줄 10열)
  private static textures: Texture[] | null = null;

  constructor(x: number, y: number, direction: { x: number; y: number }, damage: number) {
    super();

    this.direction = direction;
    this.x = x;
    this.y = y;
    this.damage = damage;

    // 스프라이트 생성
    if (!NamedProjectile.textures) {
      console.warn('[NamedProjectile] Textures not loaded! Creating fallback graphics.');
      // Fallback: 빨간색 불꽃 원
      const fallback = new Graphics();
      fallback.circle(0, 0, this.radius * 1.5);
      fallback.fill({ color: 0xff4400, alpha: 1.0 }); // 주황빛 빨강
      fallback.circle(0, 0, this.radius);
      fallback.fill({ color: 0xffaa00, alpha: 1.0 }); // 노란색 중심
      this.addChild(fallback);
      return;
    }

    this.sprite = new AnimatedSprite(NamedProjectile.textures);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(1.5); // 1.5배 확대
    this.sprite.animationSpeed = 0.25;
    this.sprite.play();
    this.addChild(this.sprite);
  }

  /**
   * 투사체 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    // 이동
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;

    // 회전 효과 (방향에 따라)
    if (this.sprite) {
      this.sprite.rotation += deltaTime * 3;
    }

    // 생존 시간 체크
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.lifeTime) {
      this.active = false;
    }

    // 페이드 아웃 효과 (마지막 0.5초)
    if (this.elapsedTime >= this.lifeTime - 0.5) {
      this.alpha = 1.0 - (this.elapsedTime - (this.lifeTime - 0.5)) / 0.5;
    }
  }

  /**
   * 스프라이트 preload (Static)
   */
  public static async preloadSprite(): Promise<void> {
    try {
      const baseTexture = await Assets.load<Texture>(NamedProjectile.SPRITE_PATH);

      if (!baseTexture) {
        console.error('[NamedProjectile] Failed to load sprite:', NamedProjectile.SPRITE_PATH);
        return;
      }

      // 텍스처 프레임 분할
      NamedProjectile.textures = [];
      for (let i = 0; i < NamedProjectile.FRAME_COUNT; i++) {
        const frame = new Rectangle(
          i * NamedProjectile.FRAME_WIDTH,
          0,
          NamedProjectile.FRAME_WIDTH,
          NamedProjectile.FRAME_HEIGHT
        );
        NamedProjectile.textures.push(new Texture({ source: baseTexture.source, frame }));
      }

      console.log('[NamedProjectile] Sprite loaded successfully');
    } catch (error) {
      console.error('[NamedProjectile] Failed to preload sprite:', error);
    }
  }

  /**
   * 클린업
   */
  public destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    super.destroy();
  }
}
