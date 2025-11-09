import { CDN_BASE_URL } from '@config/assets.config';
import { audioManager } from '@services/audioManager';
import { GameAnalytics } from '@services/gameAnalytics';
import { safeGetSafeAreaInsets } from '@utils/tossAppBridge';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { PixelButton } from '../ui/PixelButton';
import { SettingsModal } from '../ui/SettingsModal';

export class LobbyScene extends Container {
  private backgroundSprite!: Sprite;
  private gradientOverlay!: Graphics;
  private titleImage!: Sprite;
  private startButton!: PixelButton;
  private characterSelectButton!: PixelButton;
  private testButton?: PixelButton; // 개발 환경 전용
  private comingSoonText!: Text;
  private copyrightText!: Text;
  private settingsButton!: Container;
  private settingsModal: SettingsModal | null = null;
  private isMobile: boolean;
  private scaleFactor: number;
  private screenWidth: number;
  private screenHeight: number;

  // UI 레이아웃 상수
  private readonly UI_PADDING = 16;
  private readonly UI_SETTINGS_SIZE = 32;

  public onStartGame?: () => void;
  public onStartTestMode?: () => void;
  public onShowStageSelect?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    // 모바일 감지 및 스케일 팩터 계산
    this.isMobile = screenWidth < 768;
    this.scaleFactor = Math.min(screenWidth / 375, 1.5); // 375px 기준, 최대 1.5배
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 극소형 화면 대응 (330px)
    if (screenWidth <= 330) {
      this.scaleFactor = 0.88; // 330/375
    }

    this.loadAndCreateBackground(screenWidth, screenHeight);
    this.loadAndCreateTitleImage();
    this.createButtons(screenWidth, screenHeight);
    this.createSettingsButton();
    this.createCopyright(screenWidth, screenHeight);

    // 로비 BGM 시작 (인게임에서 돌아왔을 때도 재생)
    audioManager.playBGMByTrack('main');

    // Analytics: 로비 화면 노출 추적
    GameAnalytics.trackScreenView('lobby');
  }

  private async loadAndCreateBackground(width: number, height: number): Promise<void> {
    try {
      // bg-main 이미지 로드 (로컬 번들)
      const texture = await Assets.load('/assets/gui/bg-main.png');

      // 배경 스프라이트 생성
      this.backgroundSprite = new Sprite(texture);

      // 이미지 원본 크기
      const imgWidth = texture.width;
      const imgHeight = texture.height;

      // 화면 전체를 덮도록 스케일 계산 (가로 또는 세로 중 큰 스케일 사용)
      const scaleX = width / imgWidth;
      const scaleY = height / imgHeight;
      const scale = Math.max(scaleX, scaleY);
      this.backgroundSprite.scale.set(scale);

      // 스케일 적용 후 실제 크기
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // 검은색 배경 (전체)
      const blackBg = new Graphics();
      blackBg.rect(0, 0, width, height);
      blackBg.fill(0x000000);
      this.addChildAt(blackBg, 0);

      // 배경 스프라이트를 추가 (중앙 정렬, 화면을 완전히 덮음)
      this.addChildAt(this.backgroundSprite, 1);
      this.backgroundSprite.x = (width - scaledWidth) / 2;
      this.backgroundSprite.y = (height - scaledHeight) / 2;

      // 하단 그라디언트 오버레이
      this.gradientOverlay = new Graphics();

      // 그라디언트 높이 (화면 높이의 30% 정도)
      const gradientHeight = Math.min(height * 0.3, 200);

      // 그라디언트 시작 위치 (화면 하단에서 그라디언트 높이만큼 위)
      const gradientStartY = height - gradientHeight;

      // 수직 그라디언트 생성 (투명 -> 검은색)
      const gradientSteps = 20;
      for (let i = 0; i < gradientSteps; i++) {
        const progress = i / gradientSteps;
        const y = gradientStartY + gradientHeight * progress;
        const nextY = gradientStartY + (gradientHeight * (i + 1)) / gradientSteps;
        const alpha = progress; // 0 (투명) -> 1 (불투명)

        this.gradientOverlay.rect(0, y, width, nextY - y);
        this.gradientOverlay.fill({ color: 0x000000, alpha });
      }

      this.addChildAt(this.gradientOverlay, 2);

      console.log('배경 이미지 로드 완료');
    } catch (error) {
      console.error('배경 이미지 로드 실패:', error);
      // 폴백: 검은색 배경
      const bg = new Graphics();
      bg.rect(0, 0, width, height);
      bg.fill(0x000000);
      this.addChild(bg);
    }
  }

  private async loadAndCreateTitleImage(): Promise<void> {
    try {
      // 타이틀 이미지 로드 (로컬 번들)
      const texture = await Assets.load('/assets/gui/title.png');

      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      // 타이틀 이미지
      this.titleImage = new Sprite(texture);
      this.titleImage.anchor.set(0.5, 0);
      this.titleImage.x = this.screenWidth / 2;
      this.titleImage.y = 100;

      // 이미지 크기 조정 - 화면 가로의 2/3, 최대 400px
      const targetWidth = Math.min(Math.floor((this.screenWidth * 2) / 3), 400);
      const scale = targetWidth / texture.width;
      this.titleImage.scale.set(scale);

      this.addChild(this.titleImage);
      console.log('타이틀 이미지 로드 완료');
    } catch (error) {
      console.error('타이틀 이미지 로드 실패:', error);
    }
  }

  private createButtons(screenWidth: number, screenHeight: number): void {
    const buttonX = screenWidth / 2;
    const buttonHeight = this.isMobile ? 60 * this.scaleFactor : 70;
    const gap = 72; // 버튼 사이 간격

    // 하단에서 80px 떨어진 위치 계산 (캐릭터 선택 버튼이 가장 아래)
    const bottomOffset = 80;
    const characterSelectY = screenHeight - bottomOffset - buttonHeight / 2;
    const startButtonY = characterSelectY - gap;

    // 게임 시작 버튼 (활성화)
    this.startButton = PixelButton.createResponsive(
      '게임 시작',
      screenWidth,
      buttonX,
      startButtonY,
      () => {
        // 사용자 인터랙션 발생 - 대기 중인 BGM 재시도
        audioManager.retryPendingBGM();

        // Analytics: 게임 시작 추적
        GameAnalytics.trackGameStart();

        this.onShowStageSelect?.();
      },
      false,
      this.isMobile,
      this.scaleFactor
    );
    this.addChild(this.startButton);

    // 캐릭터 선택 버튼 (비활성화)
    this.characterSelectButton = PixelButton.createResponsive(
      '캐릭터 선택',
      screenWidth,
      buttonX,
      characterSelectY,
      undefined,
      true,
      this.isMobile,
      this.scaleFactor
    );
    this.addChild(this.characterSelectButton);

    // Coming Soon!!! 텍스트 (캐릭터 선택 버튼 하단)
    this.comingSoonText = new Text('Coming Soon!!!', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 12,
      fill: 0xf7a74f,
    });
    this.comingSoonText.resolution = 2;
    this.comingSoonText.anchor.set(0.5, 0);
    this.comingSoonText.x = buttonX;
    this.comingSoonText.y = characterSelectY + buttonHeight / 2;
    this.addChild(this.comingSoonText);

    // 테스트 모드 버튼 (개발 환경에서만 표시, 가장 하단에 배치)
    if (import.meta.env.DEV) {
      const testButtonY = characterSelectY + gap;
      this.testButton = PixelButton.createResponsive(
        '테스트 모드',
        screenWidth,
        buttonX,
        testButtonY,
        () => {
          // 사용자 인터랙션 발생 - 대기 중인 BGM 재시도
          audioManager.retryPendingBGM();
          console.log('테스트 모드 시작!');
          this.onStartTestMode?.();
        },
        false, // 활성화 상태
        this.isMobile,
        this.scaleFactor
      );
      this.addChild(this.testButton);
    }
  }

  private createSettingsButton(): void {
    // 인앱토스 SafeArea 적용
    const insets = safeGetSafeAreaInsets();

    const buttonContainer = new Container();
    buttonContainer.x = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    buttonContainer.y = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2 + insets.top;
    buttonContainer.zIndex = 1000; // 다른 UI보다 위에

    // 설정 아이콘 비동기 로드
    Assets.load(`${CDN_BASE_URL}/assets/gui/settings.png`).then((texture) => {
      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.width = this.UI_SETTINGS_SIZE;
      icon.height = this.UI_SETTINGS_SIZE;
      icon.anchor.set(0.5);
      buttonContainer.addChild(icon);
    });

    // 인터랙션 활성화
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    // 호버 효과
    buttonContainer.on('pointerover', () => {
      buttonContainer.scale.set(1.1);
    });

    buttonContainer.on('pointerout', () => {
      buttonContainer.scale.set(1.0);
    });

    // 클릭 시 설정 모달 토글
    buttonContainer.on('pointerdown', () => {
      // 사용자 인터랙션 발생 - 대기 중인 BGM 재시도
      audioManager.retryPendingBGM();
      this.toggleSettingsModal();
    });

    this.settingsButton = buttonContainer;
    this.addChild(this.settingsButton);
  }

  private toggleSettingsModal(): void {
    if (this.settingsModal) {
      // 모달 닫기
      this.removeChild(this.settingsModal);
      this.settingsModal.destroy();
      this.settingsModal = null;
      // BGM 재개
      audioManager.resumeBGM();
    } else {
      // 모달 열기
      this.settingsModal = new SettingsModal(this.screenWidth, this.screenHeight);
      this.settingsModal.onClose = () => {
        this.toggleSettingsModal();
      };
      this.addChild(this.settingsModal);
      // BGM 일시정지
      audioManager.pauseAllBGM();

      // Analytics: 설정 모달 접근 추적
      GameAnalytics.trackSettingsModalOpen('lobby');
    }
  }

  private createCopyright(screenWidth: number, screenHeight: number): void {
    const fontSize = this.isMobile ? 10 : 16;
    const padding = this.isMobile ? 10 : 20;
    const lineHeight = this.isMobile ? 32 : 40;

    // 프로젝트 저작권 (위)
    this.copyrightText = new Text('© 2025 0xkkun', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: fontSize,
      fill: 0x888888,
    });
    this.copyrightText.resolution = 2;
    this.copyrightText.anchor.set(0.5, 1);
    this.copyrightText.x = screenWidth / 2;
    this.copyrightText.y = screenHeight - lineHeight;
    this.addChild(this.copyrightText);

    // 폰트 저작권 (아래, 줄바꿈)
    const fontCopyright = new Text({
      text: 'Neo둥근모 Pro © 2017-2024, Eunbin Jeong (Dalgona.)\n<project-neodgm@dalgona.dev>',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: fontSize,
        fill: 0x888888,
        align: 'center',
      },
    });
    fontCopyright.resolution = 2;
    fontCopyright.anchor.set(0.5, 1);
    fontCopyright.x = screenWidth / 2;
    fontCopyright.y = screenHeight - padding;
    this.addChild(fontCopyright);
  }

  public destroy(): void {
    this.startButton.destroy();
    this.characterSelectButton.destroy();
    if (this.testButton) {
      this.testButton.destroy();
    }
    if (this.settingsModal) {
      this.settingsModal.destroy();
    }
    super.destroy({ children: true });
  }
}
