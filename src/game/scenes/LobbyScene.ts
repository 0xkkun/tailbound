import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { PixelButton } from '../ui/PixelButton';

export class LobbyScene extends Container {
  private titleText!: Text;
  private subtitleText!: Text;
  private titleImage!: Sprite;
  private startButton!: PixelButton;
  private characterSelectButton!: PixelButton;
  private optionsButton!: PixelButton;
  private copyrightText!: Text;
  private isMobile: boolean;
  private scaleFactor: number;
  private screenWidth: number;
  private screenHeight: number;

  public onStartGame?: () => void;

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

    this.createBackground(screenWidth, screenHeight);
    this.createTitle(screenWidth);
    this.loadAndCreateTitleImage();
    this.createButtons(screenWidth, screenHeight);
    this.createCopyright(screenWidth, screenHeight);
  }

  private createBackground(width: number, height: number): void {
    // 단색 배경 (추후 그라데이션/이미지로 교체)
    const bg = new Graphics();
    bg.beginFill(0x1a1a2e);
    bg.drawRect(0, 0, width, height);
    bg.endFill();
    this.addChild(bg);
  }

  private createTitle(screenWidth: number): void {
    // 타이틀 (추후 이미지로 교체)
    const titleSize = this.isMobile ? Math.floor(48 * this.scaleFactor) : 64;
    const subtitleSize = this.isMobile ? Math.floor(16 * this.scaleFactor) : 16;
    const titleY = this.isMobile ? 40 * this.scaleFactor : 80;
    const subtitleY = this.isMobile ? 40 * this.scaleFactor + titleSize + 10 : 160;

    this.titleText = new Text('설화(說話)', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: titleSize,
      fill: 0xeaeaea,
    });
    this.titleText.resolution = 3; // 초고해상도 렌더링 (로비 화면용)
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = screenWidth / 2;
    this.titleText.y = titleY;
    this.addChild(this.titleText);

    // 부제
    this.subtitleText = new Text('Talebound', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: subtitleSize,
      fill: 0xb8b8b8,
    });
    this.subtitleText.resolution = 3; // 초고해상도 렌더링 (로비 화면용)
    this.subtitleText.anchor.set(0.5, 0);
    this.subtitleText.x = screenWidth / 2;
    this.subtitleText.y = subtitleY;
    this.addChild(this.subtitleText);
  }

  private async loadAndCreateTitleImage(): Promise<void> {
    try {
      // 이미지 로드
      const texture = await Assets.load('/assets/loby-title.png');

      // 픽셀 아트 렌더링 설정
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      // 타이틀 하단 위치 계산
      const subtitleSize = this.isMobile ? Math.floor(16 * this.scaleFactor) : 16;
      const subtitleY = this.isMobile
        ? 40 * this.scaleFactor + Math.floor(48 * this.scaleFactor) + 10
        : 160;

      // 게임 시작 버튼 상단 위치 계산
      const buttonY = this.isMobile
        ? this.screenHeight / 2 + 80 * this.scaleFactor
        : this.screenHeight / 2 + 100;

      // 부채 이미지를 타이틀과 버튼 사이에 배치 (약간 위로)
      const imageY = (subtitleY + subtitleSize + buttonY) / 2 - (this.isMobile ? 20 : 30);

      // 부채 타이틀 이미지
      this.titleImage = new Sprite(texture);
      this.titleImage.anchor.set(0.5);
      this.titleImage.x = this.screenWidth / 2;
      this.titleImage.y = imageY;

      // 이미지 크기 조정 (크기 줄임)
      const baseScale = this.isMobile ? 2.0 * this.scaleFactor : 2.5;
      this.titleImage.scale.set(baseScale);

      this.addChild(this.titleImage);
      console.log('부채 타이틀 이미지 로드 완료');
    } catch (error) {
      console.error('부채 타이틀 이미지 로드 실패:', error);
    }
  }

  private createButtons(screenWidth: number, screenHeight: number): void {
    const buttonX = screenWidth / 2;

    // 모바일에서 버튼 위치와 크기 조정
    const baseY = this.isMobile ? screenHeight / 2 + 80 * this.scaleFactor : screenHeight / 2 + 100;
    const gap = this.isMobile ? 55 * this.scaleFactor : 75;

    // 버튼 크기 계산 - 화면 너비의 80% 사용 (최대 300px, 최소 260px)
    const buttonWidth = Math.min(Math.max(screenWidth * 0.8, 260), 300);
    const startButtonHeight = this.isMobile ? 60 * this.scaleFactor : 70;
    const subButtonHeight = this.isMobile ? 50 * this.scaleFactor : 60;

    // 게임 시작 버튼 (활성화, 금색 강조)
    this.startButton = new PixelButton(
      '게임 시작',
      buttonWidth,
      startButtonHeight,
      0xd4af37, // 금색
      false, // 활성화
      this.isMobile,
      this.scaleFactor
    );
    this.startButton.x = buttonX;
    this.startButton.y = baseY;
    this.startButton.onClick = () => {
      console.log('게임 시작!');
      this.onStartGame?.();
    };
    this.addChild(this.startButton);

    // 캐릭터 선택 버튼 (비활성화)
    this.characterSelectButton = new PixelButton(
      '캐릭터 선택',
      buttonWidth,
      subButtonHeight,
      0xffffff,
      true, // 비활성화
      this.isMobile,
      this.scaleFactor
    );
    this.characterSelectButton.x = buttonX;
    this.characterSelectButton.y = baseY + gap;
    this.addChild(this.characterSelectButton);

    // 옵션 버튼 (비활성화)
    this.optionsButton = new PixelButton(
      '옵션',
      buttonWidth,
      subButtonHeight,
      0xffffff,
      true, // 비활성화
      this.isMobile,
      this.scaleFactor
    );
    this.optionsButton.x = buttonX;
    this.optionsButton.y = baseY + gap * 2;
    this.addChild(this.optionsButton);
  }

  private createCopyright(screenWidth: number, screenHeight: number): void {
    const fontSize = this.isMobile ? 12 : 16;
    const padding = this.isMobile ? 10 : 20;
    const lineHeight = this.isMobile ? 32 : 40;

    // 프로젝트 저작권 (위)
    this.copyrightText = new Text('Tailbound © 2025', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: fontSize,
      fill: 0x666666,
    });
    this.copyrightText.resolution = 2;
    this.copyrightText.anchor.set(0.5, 1);
    this.copyrightText.x = screenWidth / 2;
    this.copyrightText.y = screenHeight - padding - lineHeight;
    this.addChild(this.copyrightText);

    // 폰트 저작권 (아래, 줄바꿈)
    const fontCopyright = new Text(
      'Neo둥근모 Pro © 2017-2024, Eunbin Jeong (Dalgona.)\n<project-neodgm@dalgona.dev>',
      {
        fontFamily: 'NeoDunggeunmo',
        fontSize: fontSize,
        fill: 0x666666,
        align: 'center',
      }
    );
    fontCopyright.resolution = 2;
    fontCopyright.anchor.set(0.5, 1);
    fontCopyright.x = screenWidth / 2;
    fontCopyright.y = screenHeight - padding;
    this.addChild(fontCopyright);
  }

  public destroy(): void {
    this.startButton.destroy();
    this.characterSelectButton.destroy();
    this.optionsButton.destroy();
    super.destroy({ children: true });
  }
}
