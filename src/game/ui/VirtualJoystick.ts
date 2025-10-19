/**
 * 가상 조이스틱 (모바일용)
 */

import { Container, Graphics } from 'pixi.js';

import { GAME_CONFIG } from '@/config/game.config';

export interface JoystickState {
  x: number; // -1 ~ 1
  y: number; // -1 ~ 1
  active: boolean;
}

export class VirtualJoystick {
  private container: Container;
  private touchArea: Graphics; // 터치 영역 (전체 화면)

  private joystickX: number = 0;
  private joystickY: number = 0;
  private maxDistance: number = 80; // 스틱이 움직일 수 있는 최대 거리 (증가)

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isActive: boolean = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();
    // z-index: 조이스틱은 게임 레이어 위, UI 레이어 아래
    this.container.zIndex = GAME_CONFIG.layers.joystick;

    // 터치 영역 (전체 화면, 투명)
    this.touchArea = new Graphics();
    this.touchArea.rect(0, 0, screenWidth, screenHeight);
    this.touchArea.fill({ color: 0x000000, alpha: 0 });
    this.touchArea.eventMode = 'static';
    this.container.addChild(this.touchArea);

    this.setupEvents();
  }

  /**
   * 이벤트 설정
   */
  private setupEvents(): void {
    // 터치 시작
    this.touchArea.on('pointerdown', (event) => {
      this.isActive = true;

      // 터치 시작 위치 저장
      const pos = event.global;
      this.touchStartX = pos.x;
      this.touchStartY = pos.y;

      this.joystickX = 0;
      this.joystickY = 0;
    });

    // 터치 이동
    this.touchArea.on('pointermove', (event) => {
      if (!this.isActive) return;

      const pos = event.global;
      const dx = pos.x - this.touchStartX;
      const dy = pos.y - this.touchStartY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // 최대 거리 제한
      const clampedDistance = Math.min(distance, this.maxDistance);

      // 정규화된 값 (-1 ~ 1)
      this.joystickX = (Math.cos(angle) * clampedDistance) / this.maxDistance;
      this.joystickY = (Math.sin(angle) * clampedDistance) / this.maxDistance;
    });

    // 터치 종료
    const endTouch = () => {
      this.isActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
    };

    this.touchArea.on('pointerup', endTouch);
    this.touchArea.on('pointerupoutside', endTouch);
    this.touchArea.on('pointercancel', endTouch);
  }

  /**
   * 조이스틱 상태 가져오기
   */
  public getState(): JoystickState {
    return {
      x: this.joystickX,
      y: this.joystickY,
      active: this.isActive,
    };
  }

  /**
   * 컨테이너 가져오기
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * 화면 크기 업데이트
   */
  public updateScreenSize(width: number, height: number): void {
    // 터치 영역 재설정 (전체 화면)
    this.touchArea.clear();
    this.touchArea.rect(0, 0, width, height);
    this.touchArea.fill({ color: 0x000000, alpha: 0 });
  }

  /**
   * 보이기/숨기기
   */
  public setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.touchArea.removeAllListeners();
    this.container.destroy({ children: true });
  }
}
