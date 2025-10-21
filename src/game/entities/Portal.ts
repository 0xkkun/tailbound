/**
 * Portal - 경계로 가는 포탈 엔티티
 */

import { Container, Graphics, Text } from 'pixi.js';

import { GAME_CONFIG } from '@/config/game.config';

export class Portal extends Container {
  private graphic: Graphics;
  private labelText: Text;
  private animationTime: number = 0;

  public onEnter?: () => void;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    this.graphic = this.createPortalGraphic();
    this.labelText = this.createLabel();

    this.addChild(this.graphic);
    this.addChild(this.labelText);
  }

  /**
   * 임시 포탈 그래픽 (placeholder)
   */
  private createPortalGraphic(): Graphics {
    const g = new Graphics();

    // 외곽 원 (회전 효과용)
    g.lineStyle(4, 0x9966ff, 0.8);
    g.drawCircle(0, 0, 60);

    // 내부 원 (빛나는 효과)
    g.beginFill(0x9966ff, 0.3);
    g.drawCircle(0, 0, 50);
    g.endFill();

    // 중앙 별 모양
    g.beginFill(0xffffff, 0.9);
    const starPoints = 5;
    const outerRadius = 15;
    const innerRadius = 7;

    for (let i = 0; i < starPoints * 2; i++) {
      const angle = (i * Math.PI) / starPoints - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.closePath();
    g.endFill();

    return g;
  }

  /**
   * 포탈 라벨
   */
  private createLabel(): Text {
    const text = new Text('경계로 가는 문', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xffffff,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 2,
        color: 0x000000,
        distance: 2,
      },
    });
    text.resolution = 2; // 고해상도 렌더링
    text.anchor.set(0.5, 0);
    text.y = 75;
    return text;
  }

  /**
   * 애니메이션 업데이트 (회전 효과)
   */
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // 회전 애니메이션
    this.graphic.rotation = this.animationTime * 0.5;

    // 펄스 효과 (크기 변화)
    const scale = 1 + Math.sin(this.animationTime * 2) * 0.1;
    this.graphic.scale.set(scale);
  }

  /**
   * 플레이어가 포탈 범위 안에 있는지 확인
   */
  public checkPlayerCollision(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= GAME_CONFIG.portal.radius) {
      this.onEnter?.();
      return true;
    }
    return false;
  }

  /**
   * 포탈 제거
   */
  public destroy(): void {
    this.graphic.destroy();
    this.labelText.destroy();
    super.destroy({ children: true });
  }
}
