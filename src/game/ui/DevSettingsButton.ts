/**
 * DevSettingsButton - 개발용 설정 버튼 (DEV 전용)
 *
 * 로비 화면에 설정 모달을 여는 간단한 버튼을 추가합니다.
 * 프로덕션 빌드 시 쉽게 제거 가능하도록 분리된 컴포넌트입니다.
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';

import { SettingsModal } from './SettingsModal';

export class DevSettingsButton extends Container {
  private button!: Container;
  private screenWidth: number;
  private screenHeight: number;
  private modal: SettingsModal | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.createButton();
  }

  private async createButton(): Promise<void> {
    this.button = new Container();

    try {
      // 설정 아이콘 로드 시도
      const texture = await Assets.load(`${CDN_BASE_URL}/assets/gui/settings.png`);
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.anchor.set(0.5);
      icon.scale.set(0.6);
      this.button.addChild(icon);
    } catch (error) {
      console.error('설정 아이콘 로드 실패:', error);
      // 아이콘 로드 실패 시 폴백: 간단한 기어 모양
      const fallbackIcon = this.createFallbackIcon();
      this.button.addChild(fallbackIcon);
    }

    // 위치: 좌측 상단 (토스 네비게이션 회피)
    this.button.x = 40;
    this.button.y = 80;

    // 인터랙션 설정
    this.button.eventMode = 'static';
    this.button.cursor = 'pointer';

    // 호버 효과
    this.button.on('pointerover', () => {
      this.button.scale.set(1.1);
    });

    this.button.on('pointerout', () => {
      this.button.scale.set(1);
    });

    // 클릭 시 설정 모달 열기
    this.button.on('pointerdown', () => {
      this.openSettingsModal();
    });

    this.addChild(this.button);

    // DEV 라벨 추가
    this.addDevLabel();
  }

  /**
   * 폴백 아이콘 생성 (기어 모양)
   */
  private createFallbackIcon(): Graphics {
    const gear = new Graphics();

    // 외부 원
    gear.circle(0, 0, 20);
    gear.fill({ color: 0x4a4a6a, alpha: 0.9 });

    // 내부 원
    gear.circle(0, 0, 8);
    gear.fill({ color: 0x1a1a2e });

    // 기어 톱니 (간단한 버전)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 15;
      const y = Math.sin(angle) * 15;
      gear.circle(x, y, 3);
      gear.fill({ color: 0x4a4a6a, alpha: 0.9 });
    }

    return gear;
  }

  /**
   * DEV 라벨 추가
   */
  private addDevLabel(): void {
    const label = new Text({
      text: 'DEV',
      style: new TextStyle({
        fontFamily: 'DungGeunMo',
        fontSize: 10,
        fill: 0xff6b6b,
        stroke: { color: 0x000000, width: 2 },
      }),
    });
    label.anchor.set(0.5);
    label.x = this.button.x;
    label.y = this.button.y + 25;
    this.addChild(label);
  }

  /**
   * 설정 모달 열기
   */
  private openSettingsModal(): void {
    if (this.modal) return; // 이미 열려있으면 무시

    this.modal = new SettingsModal(this.screenWidth, this.screenHeight);
    this.modal.onClose = () => {
      this.closeSettingsModal();
    };

    // 씬의 최상위 레벨에 추가되도록 부모에 추가
    if (this.parent) {
      this.parent.addChild(this.modal);
    }
  }

  /**
   * 설정 모달 닫기
   */
  private closeSettingsModal(): void {
    if (this.modal) {
      if (this.parent) {
        this.parent.removeChild(this.modal);
      }
      this.modal.destroy();
      this.modal = null;
    }
  }

  /**
   * 정리
   */
  public override destroy(
    options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean }
  ): void {
    this.closeSettingsModal();
    super.destroy(options);
  }
}
