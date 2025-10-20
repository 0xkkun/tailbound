/**
 * 궤도형 엔티티
 *
 * 플레이어 주변을 회전하며 적과 접촉 시 피해를 주는 엔티티
 * 사용: 도깨비불, 방어막 등
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';

import type { Player } from './Player';

export class OrbitalEntity extends Container {
  public active: boolean = true;
  public damage: number = 10;
  public radius: number = 15; // 엔티티 크기 (충돌 판정)

  private orbitAngle: number; // 현재 각도 (라디안)
  private angularSpeed: number; // 회전 속도 (rad/s)
  private orbitRadius: number; // 궤도 반경

  // 시각화
  private orb: Graphics | Sprite | AnimatedSprite;

  constructor(angle: number, orbitRadius: number, angularSpeed: number, color: number = 0x00ffff) {
    super();

    this.orbitAngle = angle;
    this.orbitRadius = orbitRadius;
    this.angularSpeed = angularSpeed;

    // 플레이스홀더 그래픽 (이미지 없을 때)
    this.orb = new Graphics();
    (this.orb as Graphics).beginFill(color);
    (this.orb as Graphics).drawCircle(0, 0, this.radius);
    (this.orb as Graphics).endFill();
    this.addChild(this.orb);
  }

  /**
   * 플레이어 주변을 회전
   */
  public update(deltaTime: number, player: Player): void {
    // 각도 증가 (반시계 방향)
    this.orbitAngle += this.angularSpeed * deltaTime;

    // 각도가 2π를 넘으면 정규화
    if (this.orbitAngle > Math.PI * 2) {
      this.orbitAngle -= Math.PI * 2;
    }

    // 위치 계산 (플레이어 중심으로 회전)
    this.x = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.y = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

    // 회전 애니메이션 (선택)
    this.rotation += deltaTime * 2;
  }

  /**
   * 이미지 교체 (추후)
   */
  public async loadTexture(path: string): Promise<void> {
    try {
      const loadedTexture = await Assets.load(path);

      // Graphics 제거하고 Sprite로 교체
      this.removeChild(this.orb);
      (this.orb as Graphics).destroy();

      this.orb = new Sprite(loadedTexture);
      (this.orb as Sprite).anchor.set(0.5);
      this.addChild(this.orb);

      console.log(`궤도 엔티티 텍스처 로드: ${path}`);
    } catch (error) {
      console.warn('궤도 엔티티 텍스처 로드 실패:', error);
    }
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
      this.removeChild(this.orb);
      if (this.orb instanceof Graphics) {
        this.orb.destroy();
      }

      this.orb = new AnimatedSprite(frames);
      this.orb.anchor.set(0.5);
      (this.orb as AnimatedSprite).animationSpeed = 0.3; // 애니메이션 속도
      (this.orb as AnimatedSprite).play();
      this.addChild(this.orb);

      console.log(`궤도 엔티티 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('궤도 엔티티 스프라이트 시트 로드 실패:', error);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.orb) {
      this.orb.destroy();
    }
    super.destroy({ children: true });
  }
}
