/**
 * 불꽃 투사체
 *
 * 보스가 발사하는 불꽃 속성 투사체
 */

import { AnimatedSprite, Assets, Container, Graphics, Texture } from 'pixi.js';

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
  private static readonly SPRITE_PATH = '/assets/boss/boss-fireball.png';
  private static readonly FRAME_WIDTH = 64;
  private static readonly FRAME_HEIGHT = 64;
  private static readonly FRAME_COUNT = 10;
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
    // 스프라이트 크기 조정 (64x64 원본에서 적절한 크기로)
    const scale = (radius * 2) / FireballProjectile.FRAME_WIDTH;
    this.sprite.scale.set(scale, scale);
    this.sprite.animationSpeed = 0.3; // 10프레임을 약 0.33초에 재생 (30fps)
    this.sprite.loop = true;
    this.sprite.play();

    // 불꽃이 진행 방향을 향하도록 회전
    const angle = Math.atan2(direction.y, direction.x);
    this.sprite.rotation = angle;

    this.addChild(this.sprite);
  }

  /**
   * 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    if (FireballProjectile.textures) {
      return; // 이미 로드됨
    }

    try {
      const baseTexture = await Assets.load(FireballProjectile.SPRITE_PATH);

      // 10프레임 추출 (가로로 배치)
      const textures: Texture[] = [];
      for (let i = 0; i < FireballProjectile.FRAME_COUNT; i++) {
        const texture = new Texture({
          source: baseTexture.source,
          frame: {
            x: i * FireballProjectile.FRAME_WIDTH,
            y: 0,
            width: FireballProjectile.FRAME_WIDTH,
            height: FireballProjectile.FRAME_HEIGHT,
          },
        });
        textures.push(texture);
      }

      FireballProjectile.textures = textures;
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
