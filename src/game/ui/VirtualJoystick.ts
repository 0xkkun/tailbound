/**
 * 가상 조이스틱 (모바일용)
 */

import { Container, Graphics } from 'pixi.js';

export interface JoystickState {
  x: number; // -1 ~ 1
  y: number; // -1 ~ 1
  active: boolean;
}

export class VirtualJoystick {
  private container: Container;
  private base: Graphics; // 외부 원
  private stick: Graphics; // 내부 스틱
  private touchArea: Graphics; // 터치 영역

  // @ts-expect-error - updateScreenSize에서 사용됨
  private screenWidth: number;
  // @ts-expect-error - updateScreenSize에서 사용됨
  private screenHeight: number;

  private joystickX: number = 0;
  private joystickY: number = 0;
  private maxDistance: number = 40; // 스틱이 움직일 수 있는 최대 거리

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isActive: boolean = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.container = new Container();

    // 터치 영역 (화면 하단 1/3, 투명)
    this.touchArea = new Graphics();
    this.touchArea.rect(0, (screenHeight * 2) / 3, screenWidth, screenHeight / 3);
    this.touchArea.fill({ color: 0x000000, alpha: 0 });
    this.touchArea.eventMode = 'static';
    this.container.addChild(this.touchArea);

    // 화면 크기 저장 (updateScreenSize에서도 사용됨)
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 베이스 원 (외부)
    this.base = new Graphics();
    this.base.circle(0, 0, 60);
    this.base.fill({ color: 0x000000, alpha: 0.3 });
    this.base.circle(0, 0, 60);
    this.base.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    this.base.visible = false;
    this.container.addChild(this.base);

    // 스틱 (내부)
    this.stick = new Graphics();
    this.stick.circle(0, 0, 25);
    this.stick.fill({ color: 0xffffff, alpha: 0.6 });
    this.stick.visible = false;
    this.container.addChild(this.stick);

    this.setupEvents();
  }

  /**
   * 이벤트 설정
   */
  private setupEvents(): void {
    // 터치 시작
    this.touchArea.on('pointerdown', (event) => {
      this.isActive = true;

      // 조이스틱 위치를 터치 위치로 설정
      const pos = event.global;
      this.touchStartX = pos.x;
      this.touchStartY = pos.y;

      this.base.position.set(this.touchStartX, this.touchStartY);
      this.stick.position.set(this.touchStartX, this.touchStartY);

      this.base.visible = true;
      this.stick.visible = true;

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

      // 스틱 위치 업데이트
      const stickX = this.touchStartX + Math.cos(angle) * clampedDistance;
      const stickY = this.touchStartY + Math.sin(angle) * clampedDistance;
      this.stick.position.set(stickX, stickY);

      // 정규화된 값 (-1 ~ 1)
      this.joystickX = (Math.cos(angle) * clampedDistance) / this.maxDistance;
      this.joystickY = (Math.sin(angle) * clampedDistance) / this.maxDistance;
    });

    // 터치 종료
    const endTouch = () => {
      this.isActive = false;
      this.base.visible = false;
      this.stick.visible = false;
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
    this.screenWidth = width;
    this.screenHeight = height;

    // 터치 영역 재설정
    this.touchArea.clear();
    this.touchArea.rect(0, (height * 2) / 3, width, height / 3);
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
