/**
 * 적의 투사체 (원거리 공격하는 적이 발사)
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { Player } from './Player';

export class EnemyProjectile extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number = 8;

  // 투사체 속성
  public damage: number = 10;
  public speed: number = 300; // 픽셀/초
  public lifeTime: number = 5; // 5초 후 자동 소멸
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: { x: number; y: number };

  // 시각 효과
  private visual: Graphics | AnimatedSprite;

  constructor(
    id: string,
    x: number,
    y: number,
    direction: { x: number; y: number },
    color: number = 0xff00ff
  ) {
    super();

    this.id = id;
    this.direction = direction;
    this.x = x;
    this.y = y;

    // 투사체 회전 - 날아가는 방향을 향하도록
    this.rotation = Math.atan2(direction.y, direction.x);

    // 그래픽 생성 (스프라이트 로드 전 폴백)
    this.visual = new Graphics();
    this.addChild(this.visual);

    this.render(color);
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
   * 화면 밖 체크
   */
  public isOutOfBounds(width: number, height: number): boolean {
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

    // 원형 투사체
    this.visual.circle(0, 0, this.radius);
    this.visual.fill(color);

    // 테두리
    this.visual.circle(0, 0, this.radius);
    this.visual.stroke({ width: 2, color: 0xffffff });
  }

  /**
   * 스프라이트 시트를 애니메이션으로 로드
   */
  public async loadSpriteSheet(
    path: string,
    frameWidth: number,
    frameHeight: number,
    totalFrames: number,
    columns: number,
    scale: number = 1
  ): Promise<void> {
    try {
      const baseTexture = await Assets.load(path);

      // 픽셀 아트용 필터링
      baseTexture.source.scaleMode = 'nearest';

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
      this.visual.scale.set(scale);
      this.visual.animationSpeed = 0.5;
      this.visual.loop = true;
      this.visual.play();

      this.addChild(this.visual);

      console.log(`EnemyProjectile 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('EnemyProjectile 스프라이트 시트 로드 실패:', error);
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
