/**
 * SettingsModal - 설정 모달 (PixiJS)
 *
 * 게임 내에서 오디오/햅틱 설정을 제어하는 모달 UI입니다.
 * - BGM/SFX ON/OFF 토글
 * - 햅틱 ON/OFF 토글
 * - 볼륨 슬라이더
 * - 반투명 오버레이
 */

import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';

import { audioManager } from '../../services/audioManager';
import { hapticManager } from '../../services/hapticManager';

import { PixelButton } from './PixelButton';

interface ToggleButton {
  container: Container;
  background: Graphics;
  toggle: Graphics;
  label: Text;
  isOn: boolean;
}

export class SettingsModal extends Container {
  private overlay!: Graphics;
  private modalBackground!: Graphics;
  private titleText!: Text;
  private closeButton!: PixelButton;

  // Toggle buttons
  private bgmToggle!: ToggleButton;
  private sfxToggle!: ToggleButton;
  private hapticToggle!: ToggleButton;

  // Volume sliders
  private bgmVolumeSlider!: { bar: Graphics; handle: Graphics; label: Text };
  private sfxVolumeSlider!: { bar: Graphics; handle: Graphics; label: Text };

  // RAF IDs for cleanup
  private rafIds: Set<number> = new Set();

  public onClose?: () => void;

  constructor(
    private screenWidth: number,
    private screenHeight: number
  ) {
    super();

    this.createOverlay();
    this.createModal();
    this.loadSettings();
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
   * 모달 UI 생성
   */
  private createModal(): void {
    const modalWidth = Math.min(400, this.screenWidth - 40);
    const modalHeight = Math.min(500, this.screenHeight - 80);
    const modalX = this.screenWidth / 2;
    const modalY = this.screenHeight / 2;

    // 모달 배경
    this.modalBackground = new Graphics();
    this.modalBackground.rect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight);
    this.modalBackground.fill({ color: 0x1a1a2e, alpha: 0.95 });
    this.modalBackground.stroke({ width: 2, color: 0x4a4a6a });
    this.modalBackground.x = modalX;
    this.modalBackground.y = modalY;
    this.modalBackground.eventMode = 'static';
    this.addChild(this.modalBackground);

    // 타이틀
    this.titleText = new Text({
      text: '설정',
      style: new TextStyle({
        fontFamily: 'NeoDunggeunmo',
        fontSize: 28,
        fill: 0xffffff,
      }),
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = modalX;
    this.titleText.y = modalY - modalHeight / 2 + 20;
    this.addChild(this.titleText);

    // 토글 버튼들
    const startY = modalY - modalHeight / 2 + 80;
    const gap = 80;

    this.bgmToggle = this.createToggle('배경 음악', modalX - 120, startY);
    this.sfxToggle = this.createToggle('효과음', modalX - 120, startY + gap);
    this.hapticToggle = this.createToggle('진동', modalX - 120, startY + gap * 2);

    // 볼륨 슬라이더들 (라벨 공간 50px 확보)
    this.bgmVolumeSlider = this.createVolumeSlider(modalX - 150, startY + 35, modalWidth - 110);
    this.sfxVolumeSlider = this.createVolumeSlider(
      modalX - 150,
      startY + gap + 35,
      modalWidth - 110
    );

    // 닫기 버튼
    this.closeButton = new PixelButton('닫기', 200, 50);
    this.closeButton.x = modalX;
    this.closeButton.y = modalY + modalHeight / 2 - 50;
    this.closeButton.onClick = () => this.close();
    this.addChild(this.closeButton);

    // BGM 토글 이벤트
    this.bgmToggle.container.on('pointerdown', () => {
      const newState = audioManager.toggleBGM();
      this.updateToggle(this.bgmToggle, newState);
      this.bgmVolumeSlider.bar.alpha = newState ? 1 : 0.3;
      this.bgmVolumeSlider.handle.alpha = newState ? 1 : 0.3;
      this.bgmVolumeSlider.label.alpha = newState ? 1 : 0.5;
    });

    // SFX 토글 이벤트
    this.sfxToggle.container.on('pointerdown', () => {
      const newState = audioManager.toggleSFX();
      this.updateToggle(this.sfxToggle, newState);
      this.sfxVolumeSlider.bar.alpha = newState ? 1 : 0.3;
      this.sfxVolumeSlider.handle.alpha = newState ? 1 : 0.3;
      this.sfxVolumeSlider.label.alpha = newState ? 1 : 0.5;
    });

    // 햅틱 토글 이벤트
    this.hapticToggle.container.on('pointerdown', () => {
      const newState = hapticManager.toggle();
      this.updateToggle(this.hapticToggle, newState);
    });

    // BGM 볼륨 슬라이더 이벤트 (피드백 없음)
    this.setupSliderInteraction(
      this.bgmVolumeSlider,
      (volume) => {
        audioManager.setBGMVolume(volume);
      },
      false
    );

    // SFX 볼륨 슬라이더 이벤트 (피드백 있음)
    this.setupSliderInteraction(
      this.sfxVolumeSlider,
      (volume) => {
        audioManager.setSFXVolume(volume);
        // 볼륨 조절 시 테스트 사운드 재생 (즉시 피드백)
        audioManager.playButtonClickSound();
      },
      true
    );
  }

  /**
   * 토글 버튼 생성
   */
  private createToggle(labelText: string, x: number, y: number): ToggleButton {
    const container = new Container();
    container.x = x;
    container.y = y;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    // 라벨
    const label = new Text({
      text: labelText,
      style: new TextStyle({
        fontFamily: 'NeoDunggeunmo',
        fontSize: 18,
        fill: 0xffffff,
      }),
    });
    label.anchor.set(0, 0.5);
    container.addChild(label);

    // 토글 배경 (오른쪽 정렬)
    const background = new Graphics();
    background.roundRect(0, 0, 60, 30, 15);
    background.fill({ color: 0x4a4a6a });
    background.x = 180;
    background.y = -15;
    container.addChild(background);

    // 토글 핸들
    const toggle = new Graphics();
    toggle.circle(15, 15, 12);
    toggle.fill({ color: 0xffffff });
    toggle.x = 180;
    toggle.y = -15;
    container.addChild(toggle);

    this.addChild(container);

    return {
      container,
      background,
      toggle,
      label,
      isOn: false,
    };
  }

  /**
   * 토글 상태 업데이트
   */
  private updateToggle(toggle: ToggleButton, isOn: boolean): void {
    toggle.isOn = isOn;

    // 애니메이션 (즉시 변경)
    toggle.toggle.x = isOn ? 210 : 180;
    toggle.background.clear();
    toggle.background.roundRect(0, 0, 60, 30, 15);
    toggle.background.fill({ color: isOn ? 0x4caf50 : 0x4a4a6a });
  }

  /**
   * 볼륨 슬라이더 생성
   */
  private createVolumeSlider(
    x: number,
    y: number,
    width: number
  ): { bar: Graphics; handle: Graphics; label: Text } {
    // 슬라이더 바
    const bar = new Graphics();
    bar.rect(0, 0, width, 4);
    bar.fill({ color: 0x4a4a6a });
    bar.x = x;
    bar.y = y;
    this.addChild(bar);

    // 슬라이더 핸들
    const handle = new Graphics();
    handle.circle(0, 0, 10);
    handle.fill({ color: 0xffffff });
    handle.x = x;
    handle.y = y + 2;
    handle.eventMode = 'static';
    handle.cursor = 'pointer';
    this.addChild(handle);

    // 볼륨 퍼센트 라벨
    const label = new Text({
      text: '50%',
      style: new TextStyle({
        fontFamily: 'NeoDunggeunmo',
        fontSize: 14,
        fill: 0xaaaaaa,
      }),
    });
    label.anchor.set(0, 0.5);
    label.x = x + width + 10;
    label.y = y + 2;
    this.addChild(label);

    return { bar, handle, label };
  }

  /**
   * 슬라이더 상호작용 설정
   */
  private setupSliderInteraction(
    slider: { bar: Graphics; handle: Graphics; label: Text },
    onChange: (volume: number) => void,
    enableFeedback: boolean = false
  ): void {
    let isDragging = false;
    let rafId: number | null = null;
    let lastFeedbackTime = 0;
    const FEEDBACK_THROTTLE = 150; // ms

    const updateVolume = (globalX: number) => {
      const barLeft = slider.bar.x;
      const barRight = slider.bar.x + slider.bar.width;
      const clampedX = Math.max(barLeft, Math.min(barRight, globalX));
      const volume = (clampedX - barLeft) / slider.bar.width;

      slider.handle.x = clampedX;
      slider.label.text = `${Math.round(volume * 100)}%`;

      // requestAnimationFrame으로 throttle (성능 최적화)
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          // 피드백 throttle (너무 자주 재생되지 않도록)
          const now = Date.now();
          if (enableFeedback && now - lastFeedbackTime > FEEDBACK_THROTTLE) {
            onChange(volume);
            lastFeedbackTime = now;
          } else if (!enableFeedback) {
            onChange(volume);
          }
          this.rafIds.delete(rafId!);
          rafId = null;
        });
        this.rafIds.add(rafId);
      }
    };

    slider.handle.on('pointerdown', (e) => {
      isDragging = true;
      e.stopPropagation();
    });

    slider.bar.eventMode = 'static';
    slider.bar.on('pointerdown', (e) => {
      updateVolume(e.globalX);
      isDragging = true;
      e.stopPropagation();
    });

    this.on('pointermove', (e) => {
      if (isDragging) {
        updateVolume(e.globalX);
      }
    });

    this.on('pointerup', () => {
      isDragging = false;
    });

    this.on('pointerupoutside', () => {
      isDragging = false;
    });
  }

  /**
   * 현재 설정 로드
   */
  private loadSettings(): void {
    // BGM
    const bgmEnabled = audioManager.isBGMEnabled();
    const bgmVolume = audioManager.getBGMVolume();
    this.updateToggle(this.bgmToggle, bgmEnabled);
    this.bgmVolumeSlider.handle.x =
      this.bgmVolumeSlider.bar.x + bgmVolume * this.bgmVolumeSlider.bar.width;
    this.bgmVolumeSlider.label.text = `${Math.round(bgmVolume * 100)}%`;
    this.bgmVolumeSlider.bar.alpha = bgmEnabled ? 1 : 0.3;
    this.bgmVolumeSlider.handle.alpha = bgmEnabled ? 1 : 0.3;
    this.bgmVolumeSlider.label.alpha = bgmEnabled ? 1 : 0.5;

    // SFX
    const sfxEnabled = audioManager.isSFXEnabled();
    const sfxVolume = audioManager.getSFXVolume();
    this.updateToggle(this.sfxToggle, sfxEnabled);
    this.sfxVolumeSlider.handle.x =
      this.sfxVolumeSlider.bar.x + sfxVolume * this.sfxVolumeSlider.bar.width;
    this.sfxVolumeSlider.label.text = `${Math.round(sfxVolume * 100)}%`;
    this.sfxVolumeSlider.bar.alpha = sfxEnabled ? 1 : 0.3;
    this.sfxVolumeSlider.handle.alpha = sfxEnabled ? 1 : 0.3;
    this.sfxVolumeSlider.label.alpha = sfxEnabled ? 1 : 0.5;

    // Haptic
    const hapticEnabled = hapticManager.isEnabled();
    this.updateToggle(this.hapticToggle, hapticEnabled);
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
      const texture = await Assets.load('/assets/gui/settings.png');
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
    // RAF cleanup
    this.rafIds.forEach((id) => cancelAnimationFrame(id));
    this.rafIds.clear();

    super.destroy(options);
  }
}
