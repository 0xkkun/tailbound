/**
 * 나선형 공격 차징 이펙트
 *
 * 보스가 나선형 공격을 준비할 때 보스를 감싸는 이펙트
 */

import { AnimatedSprite, Assets, Container, Graphics, Texture } from 'pixi.js';

import type { WhiteTigerBoss } from './enemies/WhiteTigerBoss';

export class SpiralChargeEffect extends Container {
  private sprite: AnimatedSprite | null = null;
  private timer: number = 0;
  private duration: number = 2.0;
  private boss: WhiteTigerBoss;

  // 스프라이트 설정
  private static readonly SPRITE_PATH = '/assets/boss/boss-skill-effect.png';
  private static readonly FRAME_WIDTH = 59;
  private static readonly FRAME_HEIGHT = 49;
  private static readonly FRAME_COUNT = 15;
  private static textures: Texture[] | null = null;

  constructor(boss: WhiteTigerBoss) {
    super();

    this.boss = boss;

    // 보스 위치에 생성
    this.x = boss.x;
    this.y = boss.y;

    // 스프라이트 생성
    if (!SpiralChargeEffect.textures) {
      console.error('[SpiralChargeEffect] Textures not loaded! Creating fallback graphics.');
      // Fallback: 빨간색 원형 아우라
      const fallback = new Graphics();
      fallback.circle(0, 0, 80);
      fallback.fill({ color: 0xff0000, alpha: 0.3 });
      fallback.circle(0, 0, 60);
      fallback.fill({ color: 0xff0000, alpha: 0.5 });
      this.addChild(fallback);

      // 보스 스프라이트 색상 변경
      boss.setSpriteTint(0xff0000); // 빨간색
      return;
    }

    this.sprite = new AnimatedSprite(SpiralChargeEffect.textures);
    this.sprite.anchor.set(0.5);

    // 보스를 감쌀 수 있도록 스케일 조정
    // 보스가 144px 정도 (48px * 3.0 scale)
    // 원본 이펙트는 59x49로 작으므로 3배 확대
    const scale = 3.0;
    this.sprite.scale.set(scale, scale);

    // 애니메이션 설정
    // 15프레임을 2초 동안 재생 (7.5 fps)
    this.sprite.animationSpeed = 0.25;
    this.sprite.loop = true;
    this.sprite.play();

    this.addChild(this.sprite);

    // 보스 스프라이트 색상 변경
    boss.setSpriteTint(0xff0000); // 빨간색
  }

  /**
   * 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    console.log('[SpiralChargeEffect] Starting preload...');

    if (SpiralChargeEffect.textures) {
      console.log('[SpiralChargeEffect] Already loaded');
      return; // 이미 로드됨
    }

    try {
      console.log('[SpiralChargeEffect] Loading texture from:', SpiralChargeEffect.SPRITE_PATH);
      const baseTexture = await Assets.load(SpiralChargeEffect.SPRITE_PATH);
      console.log('[SpiralChargeEffect] Base texture loaded:', baseTexture);

      // 15프레임 추출 (가로로 배치)
      const textures: Texture[] = [];
      for (let i = 0; i < SpiralChargeEffect.FRAME_COUNT; i++) {
        const texture = new Texture({
          source: baseTexture.source,
          frame: {
            x: i * SpiralChargeEffect.FRAME_WIDTH,
            y: 0,
            width: SpiralChargeEffect.FRAME_WIDTH,
            height: SpiralChargeEffect.FRAME_HEIGHT,
          },
        });
        textures.push(texture);
      }

      SpiralChargeEffect.textures = textures;
      console.log(
        '[SpiralChargeEffect] Sprites loaded successfully. Frame count:',
        textures.length
      );
    } catch (error) {
      console.error('[SpiralChargeEffect] Failed to load sprites:', error);
      throw error;
    }
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): boolean {
    this.timer += deltaTime;

    // 보스 위치 추적 (넉백되어도 따라감)
    this.x = this.boss.x;
    this.y = this.boss.y;

    // 2초 후 완료
    if (this.timer >= this.duration) {
      // 보스 스프라이트 색상 복구
      this.boss.setSpriteTint(0xffffff);
      return true; // 완료
    }

    return false; // 진행 중
  }

  /**
   * 정리
   */
  public destroy(): void {
    try {
      // 보스 스프라이트 색상 복구 (안전장치)
      if (this.boss && !this.boss.destroyed) {
        this.boss.setSpriteTint(0xffffff);
      }

      if (this.sprite && !this.sprite.destroyed) {
        this.sprite.destroy();
      }
      super.destroy({ children: true });
    } catch (error) {
      console.error('[SpiralChargeEffect] Error during destroy:', error);
    }
  }
}
