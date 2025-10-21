/**
 * PortalIndicator - 포탈 방향 표시 UI
 * 포탈이 화면 밖에 있을 때 화살표로 방향 안내
 */

import { Container, Graphics, Text } from 'pixi.js';

export class PortalIndicator extends Container {
  private arrow: Graphics;
  private distanceText: Text;
  private padding: number = 60; // 화면 가장자리 여백

  constructor() {
    super();

    this.arrow = this.createArrow();
    this.distanceText = this.createDistanceText();

    this.addChild(this.arrow);
    this.addChild(this.distanceText);

    this.visible = false;
  }

  /**
   * 화살표 그래픽 생성
   */
  private createArrow(): Graphics {
    const g = new Graphics();

    // 화살표 삼각형
    g.moveTo(0, -20);
    g.lineTo(15, 10);
    g.lineTo(-15, 10);
    g.lineTo(0, -20);
    g.fill({ color: 0x9966ff, alpha: 0.9 });

    // 외곽선
    g.moveTo(0, -20);
    g.lineTo(15, 10);
    g.lineTo(-15, 10);
    g.lineTo(0, -20);
    g.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });

    // 화살표 몸통
    g.rect(-5, 10, 10, 15);
    g.fill({ color: 0x9966ff, alpha: 0.9 });

    g.rect(-5, 10, 10, 15);
    g.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });

    return g;
  }

  /**
   * 거리 텍스트
   */
  private createDistanceText(): Text {
    const text = new Text('경계로 가는 문', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xffffff,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 3,
        color: 0x000000,
        distance: 2,
      },
    });

    text.resolution = 2; // 고해상도 렌더링
    text.anchor.set(0.5, 0);
    text.y = 35;

    return text;
  }

  /**
   * 포탈 위치에 따라 인디케이터 업데이트
   * @param playerX 플레이어 X 좌표
   * @param playerY 플레이어 Y 좌표
   * @param portalX 포탈 X 좌표
   * @param portalY 포탈 Y 좌표
   * @param screenWidth 화면 너비
   * @param screenHeight 화면 높이
   * @param cameraX 카메라 X 오프셋
   * @param cameraY 카메라 Y 오프셋
   */
  public update(
    playerX: number,
    playerY: number,
    portalX: number,
    portalY: number,
    screenWidth: number,
    screenHeight: number,
    cameraX: number,
    cameraY: number
  ): void {
    // 포탈의 화면 상 위치 계산
    const portalScreenX = portalX + cameraX;
    const portalScreenY = portalY + cameraY;

    // 포탈이 화면 안에 있는지 확인
    const isOnScreen =
      portalScreenX > 0 &&
      portalScreenX < screenWidth &&
      portalScreenY > 0 &&
      portalScreenY < screenHeight;

    if (isOnScreen) {
      // 화면 안에 있으면 숨김
      this.visible = false;
      return;
    }

    // 화면 밖에 있으면 표시
    this.visible = true;

    // 플레이어에서 포탈로의 방향 벡터
    const dx = portalX - playerX;
    const dy = portalY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 각도 계산 (라디안)
    const angle = Math.atan2(dy, dx);

    // 화살표 회전 (위쪽이 0도)
    this.arrow.rotation = angle + Math.PI / 2;

    // 화면 가장자리에 인디케이터 배치
    this.positionOnEdge(angle, screenWidth, screenHeight);

    // 거리 표시 (미터 단위로 변환)
    const distanceInMeters = Math.floor(distance / 50); // 50px = 1m
    this.distanceText.text = `${distanceInMeters}m`;
  }

  /**
   * 각도에 따라 화면 가장자리에 배치
   */
  private positionOnEdge(angle: number, screenWidth: number, screenHeight: number): void {
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // 화면 경계까지의 최대 거리
    const maxX = centerX - this.padding;
    const maxY = centerY - this.padding;

    // 각도에 따른 위치 계산
    let x = centerX + Math.cos(angle) * maxX;
    let y = centerY + Math.sin(angle) * maxY;

    // 화면 경계로 클램핑
    x = Math.max(this.padding, Math.min(screenWidth - this.padding, x));
    y = Math.max(this.padding, Math.min(screenHeight - this.padding, y));

    this.x = x;
    this.y = y;
  }

  /**
   * 제거
   */
  public destroy(): void {
    super.destroy({ children: true });
  }
}
