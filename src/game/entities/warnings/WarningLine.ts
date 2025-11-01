/**
 * 보스 돌진 공격 경고선 UI
 *
 * 돌진 전 1.5초 동안 노란색 직선으로 경로를 표시
 */

import { Container, Graphics } from 'pixi.js';

export class WarningLine extends Container {
  private line: Graphics;
  private blinkTimer: number = 0;
  private isVisible: boolean = true;
  private lifetime: number = 0;
  private maxLifetime: number;

  constructor(
    startX: number,
    startY: number,
    direction: { x: number; y: number },
    duration: number = 1500 // ms
  ) {
    super();

    this.x = startX;
    this.y = startY;
    this.maxLifetime = duration / 1000; // 초 단위로 변환

    // 각도 계산
    const angle = Math.atan2(direction.y, direction.x);

    // Graphics 생성
    this.line = new Graphics();
    this.renderLine(angle);
    this.addChild(this.line);
  }

  private renderLine(angle: number): void {
    const length = 2000; // 긴 경고선
    const width = 150;

    this.line.clear();

    // 회전 적용
    this.line.rotation = angle;

    // 중심선 (노란색)
    this.line.rect(0, -width / 2, length, width);
    this.line.fill({ color: 0xffff00, alpha: 0.5 });

    // 테두리 (빨간색)
    this.line.rect(0, -width / 2, length, width);
    this.line.stroke({ color: 0xff0000, width: 4 });
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    // 수명 체크
    if (this.lifetime >= this.maxLifetime) {
      this.destroy();
      return;
    }

    // 점멸 애니메이션
    this.blinkTimer += deltaTime;
    if (this.blinkTimer >= 0.25) {
      this.blinkTimer = 0;
      this.isVisible = !this.isVisible;
      this.line.alpha = this.isVisible ? 0.8 : 0.5;
    }
  }

  public destroy(): void {
    this.line.destroy();
    if (this.parent) {
      this.parent.removeChild(this);
    }
    super.destroy({ children: true });
  }
}
