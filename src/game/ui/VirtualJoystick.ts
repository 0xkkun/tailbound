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
  private maxDistance: number = 120; // 스틱이 움직일 수 있는 최대 거리 (80 -> 120으로 증가)
  private deadzone: number = 0.15; // 데드존: 15% 이하의 입력은 무시

  // 입력 스무딩을 위한 변수
  private targetX: number = 0;
  private targetY: number = 0;
  private smoothFactor: number = 0.3; // 스무딩 강도 (0~1, 낮을수록 부드러움)

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
      event.preventDefault?.();
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

      event.preventDefault?.();

      const pos = event.global;
      const dx = pos.x - this.touchStartX;
      const dy = pos.y - this.touchStartY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // 최대 거리 제한
      const clampedDistance = Math.min(distance, this.maxDistance);

      // 정규화된 값 (-1 ~ 1)
      let normalizedX = (Math.cos(angle) * clampedDistance) / this.maxDistance;
      let normalizedY = (Math.sin(angle) * clampedDistance) / this.maxDistance;

      // 데드존 적용
      const magnitude = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
      if (magnitude < this.deadzone) {
        normalizedX = 0;
        normalizedY = 0;
      } else {
        // 데드존을 넘은 경우 값 재조정 (0 ~ 1 범위로)
        const scale = (magnitude - this.deadzone) / (1 - this.deadzone);
        normalizedX = (normalizedX / magnitude) * scale;
        normalizedY = (normalizedY / magnitude) * scale;
      }

      // 타겟 값 설정 (스무딩에 사용)
      this.targetX = normalizedX;
      this.targetY = normalizedY;
    });

    // 터치 종료
    const endTouch = (event?: unknown) => {
      if (event && typeof event === 'object' && 'preventDefault' in event) {
        (event.preventDefault as (() => void) | undefined)?.();
      }
      this.isActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
    };

    this.touchArea.on('pointerup', endTouch);
    this.touchArea.on('pointerupoutside', endTouch);
    this.touchArea.on('pointercancel', endTouch);
  }

  /**
   * 조이스틱 업데이트 (스무딩 적용)
   */
  public update(): void {
    if (!this.isActive) {
      // 비활성 상태일 때는 빠르게 0으로 복귀
      this.joystickX *= 0.5;
      this.joystickY *= 0.5;
      if (Math.abs(this.joystickX) < 0.01) this.joystickX = 0;
      if (Math.abs(this.joystickY) < 0.01) this.joystickY = 0;
    } else {
      // 활성 상태일 때는 타겟 값으로 부드럽게 이동 (lerp)
      this.joystickX += (this.targetX - this.joystickX) * this.smoothFactor;
      this.joystickY += (this.targetY - this.joystickY) * this.smoothFactor;
    }
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
