/**
 * 투사체 엔티티 (무기가 발사하는 공격체)
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { Vector2 } from '@/types/game.types';

export class Projectile extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number = 8;

  // 투사체 속성
  public damage: number = 15;
  public speed: number = 500; // 픽셀/초
  public lifeTime: number = 3; // 3초 후 자동 소멸
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: Vector2;

  // 관통력
  public piercing: number = 1; // 1이면 적 1마리 관통 후 소멸
  private hitCount: number = 0;

  // 시각 효과
  private visual: Graphics | AnimatedSprite;

  constructor(id: string, x: number, y: number, direction: Vector2, color: number = 0xffff00) {
    super();

    this.id = id;
    this.direction = direction;
    this.x = x;
    this.y = y;

    // 그래픽 생성 (스프라이트 로드 전 폴백)
    this.visual = new Graphics();
    this.addChild(this.visual);

    this.render(color);
  }

  /**
   * 적 히트 처리
   */
  public onHit(): void {
    this.hitCount++;

    // 관통력 소진 시 비활성화
    if (this.hitCount >= this.piercing) {
      this.active = false;
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
   * 화면 밖 체크
   */
  public isOutOfBounds(width: number, height: number): boolean {
    // destroyed된 경우 안전하게 처리
    if (!this.active || this.destroyed) {
      return true;
    }

    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100;
  }

  /**
   * 렌더링
   */
  private render(color: number): void {
    if (this.destroyed || !(this.visual instanceof Graphics)) {
      return;
    }

    this.visual.clear();

    // 원형 투사체 (부적 이미지 대신)
    this.visual.beginFill(color);
    this.visual.drawCircle(0, 0, this.radius);
    this.visual.endFill();

    // 테두리
    this.visual.lineStyle(2, 0xffffff);
    this.visual.drawCircle(0, 0, this.radius);
  }

  /**
   * 스프라이트 시트를 애니메이션으로 로드
   */
  public async loadSpriteSheet(
    path: string,
    frameWidth: number,
    frameHeight: number,
    totalFrames: number,
    columns: number
  ): Promise<void> {
    try {
      const baseTexture = await Assets.load(path);

      // 프레임 텍스처 배열 생성
      const frames: Texture[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const x = (i % columns) * frameWidth;
        const y = Math.floor(i / columns) * frameHeight;

        const frame = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(x, y, frameWidth, frameHeight),
        });
        frames.push(frame);
      }

      // Graphics 제거하고 AnimatedSprite로 교체
      this.removeChild(this.visual);
      if (this.visual instanceof Graphics) {
        this.visual.destroy();
      }

      this.visual = new AnimatedSprite(frames);
      this.visual.anchor.set(0.5);
      this.visual.animationSpeed = 0.5; // 애니메이션 속도
      this.visual.loop = true;
      this.visual.play();

      this.addChild(this.visual);

      console.log(`Projectile 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('Projectile 스프라이트 시트 로드 실패:', error);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    super.destroy({ children: true });
  }
}
