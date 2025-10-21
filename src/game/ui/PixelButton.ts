import { Container, Graphics, Text } from 'pixi.js';

export class PixelButton extends Container {
  private background!: Graphics;
  private labelText!: Text;
  private buttonWidth: number;
  private buttonHeight: number;
  private color: number;
  private isDisabled: boolean;
  private isMobile: boolean;
  private scaleFactor: number;

  public onClick?: () => void;

  constructor(
    text: string,
    width: number = 300,
    height: number = 60,
    color: number = 0xffffff,
    disabled: boolean = false,
    isMobile: boolean = false,
    scaleFactor: number = 1
  ) {
    super();

    this.buttonWidth = width;
    this.buttonHeight = height;
    this.color = disabled ? 0x666666 : color;
    this.isDisabled = disabled;
    this.isMobile = isMobile;
    this.scaleFactor = scaleFactor;

    this.createBackground();
    this.createLabel(text);

    if (!disabled) {
      this.setupInteraction();
    } else {
      this.alpha = 0.5;
      this.cursor = 'not-allowed';
    }
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.drawButton(false);
    this.addChild(this.background);
  }

  private drawButton(hover: boolean): void {
    this.background.clear();

    const alpha = hover ? 0.4 : 0.2;
    const borderAlpha = hover ? 1 : 0.6;

    // 픽셀 스타일 사각형 버튼
    this.background.lineStyle(3, this.color, borderAlpha);
    this.background.beginFill(0x000000, alpha);
    this.background.drawRect(
      -this.buttonWidth / 2,
      -this.buttonHeight / 2,
      this.buttonWidth,
      this.buttonHeight
    );
    this.background.endFill();

    // 코너 강조 (hover 시)
    if (hover && !this.isDisabled) {
      const cornerSize = 8;
      this.background.beginFill(this.color, 0.8);

      // 4개 코너
      this.background.drawRect(
        -this.buttonWidth / 2,
        -this.buttonHeight / 2,
        cornerSize,
        cornerSize
      );
      this.background.drawRect(
        this.buttonWidth / 2 - cornerSize,
        -this.buttonHeight / 2,
        cornerSize,
        cornerSize
      );
      this.background.drawRect(
        -this.buttonWidth / 2,
        this.buttonHeight / 2 - cornerSize,
        cornerSize,
        cornerSize
      );
      this.background.drawRect(
        this.buttonWidth / 2 - cornerSize,
        this.buttonHeight / 2 - cornerSize,
        cornerSize,
        cornerSize
      );

      this.background.endFill();
    }
  }

  private createLabel(text: string): void {
    // 모바일에서 폰트 크기 조정
    const fontSize = this.isMobile ? Math.floor(16 * this.scaleFactor) : 16;

    this.labelText = new Text(text, {
      fontFamily: 'NeoDunggeunmo',
      fontSize: fontSize,
      fill: this.isDisabled ? 0x999999 : 0xeaeaea,
    });
    this.labelText.resolution = 3; // 초고해상도 렌더링 (로비 화면용)
    this.labelText.anchor.set(0.5);
    this.addChild(this.labelText);
  }

  private setupInteraction(): void {
    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.drawButton(true);
      this.scale.set(1.05);
    });

    this.on('pointerout', () => {
      this.drawButton(false);
      this.scale.set(1);
    });

    this.on('pointerdown', () => {
      this.scale.set(0.95);
    });

    this.on('pointerup', () => {
      this.scale.set(1.05);
      this.onClick?.();
    });
  }

  public destroy(): void {
    this.removeAllListeners();
    super.destroy({ children: true });
  }
}
