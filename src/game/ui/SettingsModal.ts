/**
 * SettingsModal - 설정 모달 (PixiJS)
 *
 * 게임 내에서 오디오/햅틱 설정을 제어하는 모달 UI입니다.
 * - BGM/SFX ON/OFF 토글
 * - 햅틱 ON/OFF 토글
 * - 볼륨 슬라이더
 * - 반투명 오버레이
 */
import { CDN_ASSETS } from '@config/assets.config';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { audioManager } from '../../services/audioManager';
import { hapticManager } from '../../services/hapticManager';

import { PixelButton } from './PixelButton';

export class SettingsModal extends Container {
  private overlay!: Graphics;

  // 버튼 참조 (텍스트 업데이트용)
  private bgmButton!: PixelButton;
  private sfxButton!: PixelButton;
  private hapticButton!: PixelButton;

  public onClose?: () => void;

  constructor(
    private screenWidth: number,
    private screenHeight: number
  ) {
    super();

    this.createOverlay();
    this.createModal();
  }

  /**
   * 반투명 검은색 오버레이
   */
  private createOverlay(): void {
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, this.screenWidth, this.screenHeight);
    this.overlay.fill({ color: 0x000000, alpha: 0.7 });
    this.overlay.eventMode = 'static';
    this.overlay.on('pointerdown', () => {
      // 오버레이 클릭 시 모달 닫기
      this.close();
    });
    this.addChild(this.overlay);
  }

  /**
   * 모달 UI 생성 (인게임 설정 메뉴와 동일한 형태)
   */
  private createModal(): void {
    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // 버튼 크기 및 간격 (인게임과 동일)
    const buttonGap = 72;
    const buttonWidth = 184;
    const buttonHeight = 56;

    // 배경음 켜기/끄기 버튼
    const bgmEnabled = audioManager.isBGMEnabled();
    this.createMenuButtonWithIcon(
      bgmEnabled ? '배경음 끄기' : '배경음 켜기',
      bgmEnabled ? CDN_ASSETS.gui.soundOff : CDN_ASSETS.gui.sound,
      centerX,
      centerY - 80 - buttonGap,
      buttonWidth,
      buttonHeight,
      () => {
        const newState = audioManager.toggleBGM();
        // 버튼 텍스트 및 아이콘 업데이트 (켜기/끄기)
        this.updateButtonWithIcon(
          this.bgmButton,
          newState ? '배경음 끄기' : '배경음 켜기',
          newState ? CDN_ASSETS.gui.soundOff : CDN_ASSETS.gui.sound
        );
      }
    ).then((button) => {
      this.bgmButton = button;
    });

    // 효과음 켜기/끄기 버튼
    const sfxEnabled = audioManager.isSFXEnabled();
    this.createMenuButtonWithIcon(
      sfxEnabled ? '효과음 끄기' : '효과음 켜기',
      sfxEnabled ? CDN_ASSETS.gui.soundOff : CDN_ASSETS.gui.sound,
      centerX,
      centerY - 80,
      buttonWidth,
      buttonHeight,
      () => {
        const newState = audioManager.toggleSFX();
        // 토글 후에 버튼 클릭 사운드 재생 (효과음이 켜진 상태에서만)
        if (newState) {
          audioManager.playButtonClickSound();
        }
        // 버튼 텍스트 및 아이콘 업데이트 (켜기/끄기)
        this.updateButtonWithIcon(
          this.sfxButton,
          newState ? '효과음 끄기' : '효과음 켜기',
          newState ? CDN_ASSETS.gui.soundOff : CDN_ASSETS.gui.sound
        );
      }
    ).then((button) => {
      this.sfxButton = button;
      // 효과음 버튼은 자동 클릭 사운드 끄기
      button.setPlayClickSound(false);
    });

    // 진동 켜기/끄기 버튼
    const hapticEnabled = hapticManager.isEnabled();
    this.createMenuButtonWithIcon(
      hapticEnabled ? '진동 끄기' : '진동 켜기',
      CDN_ASSETS.gui.resume,
      centerX,
      centerY - 80 + buttonGap,
      buttonWidth,
      buttonHeight,
      () => {
        const newState = hapticManager.toggle();
        // 버튼 텍스트 업데이트 (켜기/끄기)
        this.updateButtonWithIcon(
          this.hapticButton,
          newState ? '진동 끄기' : '진동 켜기',
          CDN_ASSETS.gui.resume
        );
      }
    ).then((button) => {
      this.hapticButton = button;
    });

    // 닫기 버튼은 이제 필요없음 (오버레이 클릭으로 닫기)
  }

  /**
   * 아이콘이 있는 메뉴 버튼 생성 (인게임과 동일한 스타일)
   */
  private async createMenuButtonWithIcon(
    text: string,
    iconPath: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: () => void
  ): Promise<PixelButton> {
    // 버튼 생성 (텍스트 없이)
    const button = PixelButton.create('', x, y, onClick, false, width, height);
    this.addChild(button);

    // 아이콘 로드 및 버튼 내부에 [아이콘+텍스트] 배치
    try {
      const texture = await Assets.load(iconPath);
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.anchor.set(0.5);

      // 아이콘 크기를 32px로 조정
      const targetSize = 32;
      const scale = targetSize / texture.width;
      icon.scale.set(scale);

      // 텍스트 생성
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);

      // 아이콘과 텍스트 사이 간격 (4px)
      const gap = 4;

      // [아이콘 + 텍스트] 전체 너비 계산
      const totalContentWidth = targetSize + gap + labelText.width;

      // 버튼 중앙에 맞춰 아이콘과 텍스트 배치
      icon.x = -totalContentWidth / 2 + targetSize / 2;
      icon.y = 0;
      button.addChild(icon);

      labelText.x = -totalContentWidth / 2 + targetSize + gap + labelText.width / 2;
      labelText.y = 0;
      button.addChild(labelText);
    } catch (error) {
      console.error(`아이콘 로드 실패: ${iconPath}`, error);

      // 폴백: 텍스트만 표시
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);
      labelText.x = 0;
      labelText.y = 0;
      button.addChild(labelText);
    }

    return button;
  }

  /**
   * 버튼 아이콘과 텍스트 업데이트
   */
  private async updateButtonWithIcon(
    button: PixelButton,
    text: string,
    iconPath: string
  ): Promise<void> {
    // 배경을 제외한 컨텐츠만 제거 (배경은 첫 번째 자식)
    while (button.children.length > 1) {
      const child = button.children[1];
      button.removeChild(child);
      child.destroy();
    }

    // 아이콘 로드 및 버튼 내부에 [아이콘+텍스트] 배치
    try {
      const texture = await Assets.load(iconPath);
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.anchor.set(0.5);

      // 아이콘 크기를 32px로 조정
      const targetSize = 32;
      const scale = targetSize / texture.width;
      icon.scale.set(scale);

      // 텍스트 생성
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);

      // 아이콘과 텍스트 사이 간격 (4px)
      const gap = 4;

      // [아이콘 + 텍스트] 전체 너비 계산
      const totalContentWidth = targetSize + gap + labelText.width;

      // 버튼 중앙에 맞춰 아이콘과 텍스트 배치
      icon.x = -totalContentWidth / 2 + targetSize / 2;
      icon.y = 0;
      button.addChild(icon);

      labelText.x = -totalContentWidth / 2 + targetSize + gap + labelText.width / 2;
      labelText.y = 0;
      button.addChild(labelText);
    } catch (error) {
      console.error(`아이콘 로드 실패: ${iconPath}`, error);

      // 폴백: 텍스트만 표시
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);
      labelText.x = 0;
      labelText.y = 0;
      button.addChild(labelText);
    }
  }

  /**
   * 모달 닫기
   */
  private close(): void {
    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 설정 아이콘 생성 (로비/게임 씬에 추가용)
   */
  static async createSettingsIcon(x: number, y: number): Promise<Sprite> {
    try {
      const texture = await Assets.load(CDN_ASSETS.gui.settings);
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.anchor.set(0.5);
      icon.x = x;
      icon.y = y;
      icon.scale.set(0.8);
      icon.eventMode = 'static';
      icon.cursor = 'pointer';

      return icon;
    } catch (error) {
      console.error('설정 아이콘 로드 실패:', error);
      // 폴백: 간단한 기어 아이콘
      const fallbackIcon = new Graphics();
      fallbackIcon.circle(0, 0, 20);
      fallbackIcon.fill({ color: 0x4a4a6a, alpha: 0.8 });
      fallbackIcon.x = x;
      fallbackIcon.y = y;
      fallbackIcon.eventMode = 'static';
      fallbackIcon.cursor = 'pointer';

      const sprite = new Sprite();
      sprite.addChild(fallbackIcon);
      return sprite;
    }
  }

  /**
   * 정리
   */
  public override destroy(
    options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean }
  ): void {
    super.destroy(options);
  }
}
