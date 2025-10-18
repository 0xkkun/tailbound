/**
 * 궤도형 엔티티
 *
 * 플레이어 주변을 회전하며 적과 접촉 시 피해를 주는 엔티티
 * 사용: 도깨비불, 방어막 등
 */

import { Assets, Container, Graphics, Sprite } from 'pixi.js';

import type { Player } from './Player';

export class OrbitalEntity extends Container {
  public active: boolean = true;
  public damage: number = 10;
  public radius: number = 15; // 엔티티 크기 (충돌 판정)

  private angle: number; // 현재 각도 (라디안)
  private angularSpeed: number; // 회전 속도 (rad/s)
  private orbitRadius: number; // 궤도 반경

  // 시각화
  private orb: Graphics | Sprite;
  private texture: any = null;

  constructor(angle: number, orbitRadius: number, angularSpeed: number, color: number = 0x00ffff) {
    super();

    this.angle = angle;
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
    this.angle += this.angularSpeed * deltaTime;

    // 각도가 2π를 넘으면 정규화
    if (this.angle > Math.PI * 2) {
      this.angle -= Math.PI * 2;
    }

    // 위치 계산 (플레이어 중심으로 회전)
    this.x = player.x + Math.cos(this.angle) * this.orbitRadius;
    this.y = player.y + Math.sin(this.angle) * this.orbitRadius;

    // 회전 애니메이션 (선택)
    this.rotation += deltaTime * 2;
  }

  /**
   * 이미지 교체 (추후)
   */
  public async loadTexture(path: string): Promise<void> {
    try {
      this.texture = await Assets.load(path);

      // Graphics 제거하고 Sprite로 교체
      this.removeChild(this.orb);
      (this.orb as Graphics).destroy();

      this.orb = new Sprite(this.texture);
      (this.orb as Sprite).anchor.set(0.5);
      this.addChild(this.orb);

      console.log(`궤도 엔티티 텍스처 로드: ${path}`);
    } catch (error) {
      console.warn('궤도 엔티티 텍스처 로드 실패:', error);
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
