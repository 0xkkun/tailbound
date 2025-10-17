/**
 * 카메라 시스템 - 플레이어 중심 뷰포트 관리
 */

import { Container } from 'pixi.js';

export interface CameraConfig {
  /** 화면 너비 */
  screenWidth: number;
  /** 화면 높이 */
  screenHeight: number;
  /** 월드(맵) 너비 */
  worldWidth: number;
  /** 월드(맵) 높이 */
  worldHeight: number;
}

export class CameraSystem {
  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  // 월드(맵) 크기
  private worldWidth: number;
  private worldHeight: number;

  // 카메라 위치 (월드 좌표)
  public x: number = 0;
  public y: number = 0;

  constructor(config: CameraConfig) {
    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.worldWidth = config.worldWidth;
    this.worldHeight = config.worldHeight;

    // 카메라 초기 위치를 월드 중앙으로
    this.x = this.worldWidth / 2;
    this.y = this.worldHeight / 2;
  }

  /**
   * 타겟(플레이어)을 따라가도록 카메라 업데이트
   */
  public followTarget(targetX: number, targetY: number): void {
    // 카메라를 타겟 위치로 이동
    this.x = targetX;
    this.y = targetY;

    // 카메라가 월드 경계를 벗어나지 않도록 제한
    this.clampToWorld();
  }

  /**
   * 카메라를 월드 경계 내로 제한
   */
  private clampToWorld(): void {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    // X 좌표 제한
    if (this.x - halfScreenWidth < 0) {
      this.x = halfScreenWidth;
    }
    if (this.x + halfScreenWidth > this.worldWidth) {
      this.x = this.worldWidth - halfScreenWidth;
    }

    // Y 좌표 제한
    if (this.y - halfScreenHeight < 0) {
      this.y = halfScreenHeight;
    }
    if (this.y + halfScreenHeight > this.worldHeight) {
      this.y = this.worldHeight - halfScreenHeight;
    }
  }

  /**
   * 게임 레이어에 카메라 변환 적용
   * 게임 레이어를 이동시켜 카메라 효과를 구현
   */
  public applyToContainer(container: Container): void {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    // 컨테이너를 카메라 위치의 반대 방향으로 이동
    // (카메라가 오른쪽으로 이동하면 월드는 왼쪽으로 이동)
    container.x = -this.x + halfScreenWidth;
    container.y = -this.y + halfScreenHeight;
  }

  /**
   * 화면 좌표를 월드 좌표로 변환
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    return {
      x: screenX + this.x - halfScreenWidth,
      y: screenY + this.y - halfScreenHeight,
    };
  }

  /**
   * 월드 좌표를 화면 좌표로 변환
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const halfScreenWidth = this.screenWidth / 2;
    const halfScreenHeight = this.screenHeight / 2;

    return {
      x: worldX - this.x + halfScreenWidth,
      y: worldY - this.y + halfScreenHeight,
    };
  }

  /**
   * 화면 크기 업데이트 (리사이즈 시)
   */
  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.clampToWorld();
  }

  /**
   * 월드 크기 업데이트
   */
  public updateWorldSize(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
    this.clampToWorld();
  }
}
