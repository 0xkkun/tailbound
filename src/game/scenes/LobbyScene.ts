import { Container, Graphics, Text } from 'pixi.js';

import { DEFAULT_CHARACTER } from '../../data/characters';
import { CharacterDisplay } from '../ui/CharacterDisplay';
import { PixelButton } from '../ui/PixelButton';

export class LobbyScene extends Container {
  private titleText!: Text;
  private subtitleText!: Text;
  private characterDisplay!: CharacterDisplay;
  private startButton!: PixelButton;
  private characterSelectButton!: PixelButton;
  private optionsButton!: PixelButton;
  private isMobile: boolean;
  private scaleFactor: number;

  public onStartGame?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    // 모바일 감지 및 스케일 팩터 계산
    this.isMobile = screenWidth < 768;
    this.scaleFactor = Math.min(screenWidth / 375, 1.5); // 375px 기준, 최대 1.5배

    // 극소형 화면 대응 (330px)
    if (screenWidth <= 330) {
      this.scaleFactor = 0.88; // 330/375
    }

    this.createBackground(screenWidth, screenHeight);
    this.createTitle(screenWidth);
    this.createCharacterDisplay(screenWidth, screenHeight);
    this.createButtons(screenWidth, screenHeight);
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

  private createCharacterDisplay(screenWidth: number, screenHeight: number): void {
    this.characterDisplay = new CharacterDisplay(
      DEFAULT_CHARACTER,
      this.isMobile,
      this.scaleFactor
    );
    this.characterDisplay.x = screenWidth / 2;
    this.characterDisplay.y = screenHeight / 2 - (this.isMobile ? 60 * this.scaleFactor : 80);

    // 모바일에서 캐릭터 크기 조정
    if (this.isMobile) {
      this.characterDisplay.scale.set(this.scaleFactor);
    }

    this.addChild(this.characterDisplay);
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

  public destroy(): void {
    this.startButton.destroy();
    this.characterSelectButton.destroy();
    this.optionsButton.destroy();
    super.destroy({ children: true });
  }
}
