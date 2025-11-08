/**
 * 불 장판 AOE
 *
 * 보스가 생성하는 불 장판 공격
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { Player } from './Player';

export class FireAOE extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number;

  // AOE 속성
  public damage: number;
  private duration: number = 2.0;
  private timer: number = 0;

  // 시각 효과
  private sprite: AnimatedSprite | null = null;

  // 틱 데미지 방지
  private damagedPlayers: Set<string> = new Set();

  // 스프라이트 설정
  private static readonly SPRITE_PATH = `${CDN_BASE_URL}/assets/boss/boss-AOE.png`;
  private static readonly FRAME_WIDTH = 100;
  private static readonly FRAME_HEIGHT = 100;
  private static readonly FRAME_COUNT = 61;
  private static readonly GRID_WIDTH = 8; // 8x8 그리드
  private static readonly VISUAL_SIZE = 288; // 시각적 크기 (픽셀, 지름) - radius 144 기준 원래 크기
  private static textures: Texture[] | null = null;

  constructor(
    id: string,
    x: number,
    y: number,
    radius: number,
    damage: number = 40,
    onSpawn?: () => void
  ) {
    super();

    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;

    console.log('[FireAOE] Creating at', { x, y, radius });

    // 생성 시 콜백 호출 (의존성 주입)
    onSpawn?.();

    // 스프라이트 생성
    if (!FireAOE.textures) {
      console.error('[FireAOE] Textures not loaded! Creating fallback graphics.');
      // Fallback: 주황색/빨간색 불 원
      const fallback = new Graphics();
      fallback.circle(0, 0, radius);
      fallback.fill({ color: 0xff3300, alpha: 0.6 });
      fallback.circle(0, 0, radius * 0.7);
      fallback.fill({ color: 0xff6600, alpha: 0.8 });
      this.addChild(fallback);
      return;
    }

    this.sprite = new AnimatedSprite(FireAOE.textures);
    this.sprite.anchor.set(0.5);

    // 크기 조정 - 시각적 크기는 고정, 히트박스(radius)와 독립적
    const scale = FireAOE.VISUAL_SIZE / FireAOE.FRAME_WIDTH;
    this.sprite.scale.set(scale, scale);

    // 애니메이션 설정
    // 61프레임을 2초 동안 재생 (30.5 fps)
    this.sprite.animationSpeed = 0.5;
    this.sprite.loop = false;
    this.sprite.play();

    this.addChild(this.sprite);
    console.log('[FireAOE] Created successfully with sprite');
  }

  /**
   * 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    console.log('[FireAOE] Starting preload...');

    if (FireAOE.textures) {
      console.log('[FireAOE] Already loaded');
      return; // 이미 로드됨
    }

    try {
      console.log('[FireAOE] Loading texture from:', FireAOE.SPRITE_PATH);
      const baseTexture = await Assets.load(FireAOE.SPRITE_PATH);
      console.log('[FireAOE] Base texture loaded:', baseTexture);

      // 61프레임 추출 (8x8 그리드)
      const textures: Texture[] = [];
      for (let i = 0; i < FireAOE.FRAME_COUNT; i++) {
        const row = Math.floor(i / FireAOE.GRID_WIDTH);
        const col = i % FireAOE.GRID_WIDTH;

        const frame = new Rectangle(
          col * FireAOE.FRAME_WIDTH,
          row * FireAOE.FRAME_HEIGHT,
          FireAOE.FRAME_WIDTH,
          FireAOE.FRAME_HEIGHT
        );

        const texture = new Texture({
          source: baseTexture.source,
          frame: frame,
        });
        textures.push(texture);
      }

      FireAOE.textures = textures;
      console.log('[FireAOE] Sprites loaded successfully. Frame count:', textures.length);
    } catch (error) {
      console.error('[FireAOE] Failed to load sprites:', error);
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

    this.timer += deltaTime;

    // 2초 후 제거
    if (this.timer >= this.duration) {
      this.active = false;
    }
  }

  /**
   * 플레이어와 충돌 체크 (1회만 데미지)
   */
  public checkPlayerCollision(player: Player): boolean {
    // 이미 데미지를 입은 플레이어는 스킵
    if (this.damagedPlayers.has(player.id)) {
      return false;
    }

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius + player.radius) {
      // 데미지 적용 표시
      this.damagedPlayers.add(player.id);
      return true;
    }

    return false;
  }

  /**
   * 정리
   */
  public destroy(): void {
    try {
      this.damagedPlayers.clear();

      if (this.sprite && !this.sprite.destroyed) {
        this.sprite.destroy();
      }
      super.destroy({ children: true });
    } catch (error) {
      console.error('[FireAOE] Error during destroy:', error);
    }
  }
}
