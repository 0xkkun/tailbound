/**
 * 불꽃 투사체
 *
 * 보스가 발사하는 불꽃 속성 투사체
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { Player } from './Player';

export class FireballProjectile extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number;

  // 투사체 속성
  public damage: number;
  public speed: number;
  public lifeTime: number;
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: { x: number; y: number };

  // 시각 효과
  private sprite: AnimatedSprite | null = null;

  // 스프라이트 설정
  private static readonly SPRITE_PATH = `${CDN_BASE_URL}/assets/boss/boss-soulball.png`;
  private static readonly FRAME_WIDTH = 128;
  private static readonly FRAME_HEIGHT = 128;
  private static readonly FRAME_COUNT = 8; // 전체 8프레임 (1줄 8열)
  private static readonly VISUAL_SIZE = 120; // 시각적 크기 (픽셀) - 원래 radius 60 기준 (60 * 2)
  private static textures: Texture[] | null = null;

  constructor(
    id: string,
    x: number,
    y: number,
    direction: { x: number; y: number },
    damage: number,
    speed: number,
    radius: number = 20,
    lifeTime: number = 3
  ) {
    super();

    this.id = id;
    this.direction = direction;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = speed;
    this.radius = radius;
    this.lifeTime = lifeTime;

    // 보이도록 설정
    this.visible = true;
    this.alpha = 1.0;

    // 스프라이트 생성
    if (!FireballProjectile.textures) {
      console.error('[FireballProjectile] Textures not loaded! Creating fallback graphics.');
      // Fallback: 더 크고 눈에 띄는 주황색 원 생성
      const fallback = new Graphics();
      fallback.circle(0, 0, radius * 2);
      fallback.fill({ color: 0xff0000, alpha: 1.0 }); // 빨간색, 완전 불투명
      fallback.circle(0, 0, radius * 1.5);
      fallback.fill({ color: 0xff6600, alpha: 1.0 }); // 주황색 내부
      fallback.circle(0, 0, radius);
      fallback.fill({ color: 0xffff00, alpha: 1.0 }); // 노란색 중심
      this.addChild(fallback);
      console.log('[FireballProjectile] Using fallback graphics with radius:', radius);
      return;
    }

    this.sprite = new AnimatedSprite(FireballProjectile.textures);
    this.sprite.anchor.set(0.5);
    // 스프라이트 크기 조정 - 시각적 크기는 고정, 히트박스(radius)와 독립적
    const scale = FireballProjectile.VISUAL_SIZE / FireballProjectile.FRAME_WIDTH;
    this.sprite.scale.set(scale, scale);
    this.sprite.animationSpeed = 0.15; // 애니메이션 속도 느리게 조정 (0.3 -> 0.15)
    this.sprite.loop = true; // 루프 활성화 (계속 재생)
    this.sprite.play();

    // 스프라이트가 항상 보이도록 설정
    this.sprite.visible = true;
    this.sprite.alpha = 1.0;
    // blendMode 제거 - 깜빡임 원인일 수 있음

    // 불꽃이 진행 방향을 향하도록 회전
    const angle = Math.atan2(direction.y, direction.x);
    this.sprite.rotation = angle;

    this.addChild(this.sprite);

    // 디버깅: 프레임과 텍스처 상태 확인
    console.log(`[FireballProjectile] Created with ${FireballProjectile.textures.length} frames`);
    console.log(
      `[FireballProjectile] Current frame: ${this.sprite.currentFrame}, Total frames: ${this.sprite.totalFrames}`
    );
  }

  /**
   * 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    // 캐시 초기화 (이미지 변경 시 필수)
    FireballProjectile.textures = null;

    try {
      const baseTexture = await Assets.load(FireballProjectile.SPRITE_PATH);

      // 8프레임 추출 (1줄 8열 구조)
      const textures: Texture[] = [];

      for (let i = 0; i < FireballProjectile.FRAME_COUNT; i++) {
        const frame = new Rectangle(
          i * FireballProjectile.FRAME_WIDTH,
          0,
          FireballProjectile.FRAME_WIDTH,
          FireballProjectile.FRAME_HEIGHT
        );
        const texture = new Texture({
          source: baseTexture.source,
          frame: frame,
        });
        textures.push(texture);
      }

      FireballProjectile.textures = textures;
      console.log(
        `[FireballProjectile] Loaded ${textures.length} frames from sprite sheet (1 row x 8 columns)`
      );
    } catch (error) {
      console.error('[FireballProjectile] Failed to load sprites:', error);
      throw error;
    }
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    // 이동
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;

    // 애니메이션 루프 수동 처리 (깜빡임 방지)
    if (this.sprite && !this.sprite.playing) {
      this.sprite.gotoAndPlay(0); // 다시 시작
    }

    // 생명 시간 체크
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.lifeTime) {
      this.active = false;
    }
  }

  /**
   * 플레이어와 충돌 체크
   */
  public checkPlayerCollision(player: Player): boolean {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.radius + player.radius;
  }

  /**
   * 화면 밖 체크 (월드 좌표 기준으로 넓은 범위 체크)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isOutOfBounds(_width: number, _height: number): boolean {
    if (!this.active || this.destroyed) {
      return true;
    }

    // 월드 좌표에서 더 넓은 범위 허용 (카메라가 움직이므로)
    const worldBoundary = 3000; // 월드 경계를 3000으로 설정
    return (
      this.x < -worldBoundary ||
      this.x > worldBoundary ||
      this.y < -worldBoundary ||
      this.y > worldBoundary
    );
  }

  /**
   * 정리
   */
  public destroy(): void {
    try {
      if (this.sprite && !this.sprite.destroyed) {
        this.sprite.destroy();
      }
      super.destroy({ children: true });
    } catch (error) {
      console.error('[FireballProjectile] Error during destroy:', error);
    }
  }
}
