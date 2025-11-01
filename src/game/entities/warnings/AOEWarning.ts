/**
 * AOE 장판 경고
 *
 * 장판이 생성되기 전 3초 동안 빨간색 원으로 경고를 표시
 */

import { Graphics } from 'pixi.js';

export class AOEWarning extends Graphics {
  private timer: number = 0;
  private duration: number = 3.0;
  private finalRadius: number; // 최종 장판 크기
  public destroyed: boolean = false;

  // 콜백
  public onSpawnAOE?: () => void;

  constructor(x: number, y: number, finalRadius: number) {
    super();

    this.x = x;
    this.y = y;
    this.finalRadius = finalRadius;
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (this.destroyed) {
      return;
    }

    this.timer += deltaTime;
    const progress = this.timer / this.duration; // 0.0 ~ 1.0

    // 원이 점점 커짐
    const currentRadius = this.finalRadius * progress;

    // 빨간색 원 (테두리만)
    this.clear();
    this.circle(0, 0, currentRadius);
    this.stroke({
      width: 3,
      color: 0xff0000,
      alpha: 0.8,
    });

    // 3초 후 장판 생성
    if (this.timer >= this.duration) {
      if (this.onSpawnAOE) {
        this.onSpawnAOE();
      }
      this.destroyed = true;
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.destroyed = true;
    this.clear();
    super.destroy({ children: true });
  }
}
