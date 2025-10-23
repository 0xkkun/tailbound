import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { PixelButton } from '../ui/PixelButton';

export class LobbyScene extends Container {
  private titleImage!: Sprite;
  private subtitleText!: Text;
  private fanImage!: Sprite;
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
    this.loadAndCreateTitleImage();
    this.createSubtitle(screenWidth);
    this.loadAndCreateFanImage();
    this.createButtons(screenWidth, screenHeight);
    this.createCopyright(screenWidth, screenHeight);
  }

  private createBackground(width: number, height: number): void {
    // 버튼과 어울리는 따뜻한 갈색 톤의 단색 배경
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill(0x4a3226);
    this.addChild(bg);
  }

  private async loadAndCreateTitleImage(): Promise<void> {
    try {
      // 타이틀 이미지 로드
      const texture = await Assets.load('/assets/gui/title.png');

      // 픽셀 아트 렌더링 설정
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      const titleY = this.isMobile ? 40 * this.scaleFactor : 80;

      // 타이틀 이미지
      this.titleImage = new Sprite(texture);
      this.titleImage.anchor.set(0.5, 0);
      this.titleImage.x = this.screenWidth / 2;
      this.titleImage.y = titleY;

      // 이미지 크기 조정
      const baseScale = this.isMobile ? 2.0 * this.scaleFactor : 3.0;
      this.titleImage.scale.set(baseScale);

      this.addChild(this.titleImage);
      console.log('타이틀 이미지 로드 완료');
    } catch (error) {
      console.error('타이틀 이미지 로드 실패:', error);
    }
  }

  private createSubtitle(screenWidth: number): void {
    const titleSize = this.isMobile ? Math.floor(48 * this.scaleFactor) : 64;
    const subtitleSize = this.isMobile ? Math.floor(16 * this.scaleFactor) : 16;
    const subtitleY = this.isMobile ? 40 * this.scaleFactor + titleSize + 10 : 160;

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

  private async loadAndCreateFanImage(): Promise<void> {
    try {
      // 이미지 로드
      const texture = await Assets.load('/assets/gui/title-fan.png');

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

      // 부채 이미지를 타이틀과 버튼 사이에 배치 (버튼 위로 12px 간격)
      const imageY = (subtitleY + subtitleSize + buttonY) / 2 - (this.isMobile ? 26 : 36);

      // 부채 타이틀 이미지
      this.fanImage = new Sprite(texture);
      this.fanImage.anchor.set(0.5);
      this.fanImage.x = this.screenWidth / 2;
      this.fanImage.y = imageY;

      // 이미지 크기 조정 (크기 줄임)
      const baseScale = this.isMobile ? 1.5 * this.scaleFactor : 2.5;
      this.fanImage.scale.set(baseScale);

      this.addChild(this.fanImage);
      console.log('부채 타이틀 이미지 로드 완료');
    } catch (error) {
      console.error('부채 타이틀 이미지 로드 실패:', error);
    }
  }

  private createButtons(screenWidth: number, screenHeight: number): void {
    const buttonX = screenWidth / 2;
    const baseY = this.isMobile ? screenHeight / 2 + 80 * this.scaleFactor : screenHeight / 2 + 100;

    // 버튼 높이 + 버튼 사이 간격(12px)
    const buttonHeight = this.isMobile ? 60 * this.scaleFactor : 70;
    const gap = buttonHeight + 6;

    // 게임 시작 버튼 (활성화)
    this.startButton = PixelButton.createResponsive(
      '게임 시작',
      screenWidth,
      buttonX,
      baseY,
      () => {
        console.log('게임 시작!');
        this.onStartGame?.();
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
      baseY + gap,
      undefined,
      true,
      this.isMobile,
      this.scaleFactor
    );
    this.addChild(this.characterSelectButton);

    // 옵션 버튼 (비활성화)
    this.optionsButton = PixelButton.createResponsive(
      '옵션',
      screenWidth,
      buttonX,
      baseY + gap * 2,
      undefined,
      true,
      this.isMobile,
      this.scaleFactor
    );
    this.addChild(this.optionsButton);
  }

  private createCopyright(screenWidth: number, screenHeight: number): void {
    const fontSize = this.isMobile ? 12 : 16;
    const padding = this.isMobile ? 10 : 20;
    const lineHeight = this.isMobile ? 32 : 40;

    // 프로젝트 저작권 (위)
    this.copyrightText = new Text('0xkkun © 2025', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: fontSize,
      fill: 0x888888,
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
        fill: 0x888888,
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
