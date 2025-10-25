import { Assets, Container, Graphics, NineSliceSprite, Text, Texture } from 'pixi.js';

export class PixelButton extends Container {
  private background!: NineSliceSprite | Graphics;
  private labelText!: Text;
  private buttonWidth: number;
  private buttonHeight: number;
  private color: number;
  private isDisabled: boolean;
  private static buttonTexture: Texture | null = null;
  private static textureLoading: Promise<Texture> | null = null;

  public onClick?: () => void;

  constructor(
    text: string,
    width: number = 300,
    height: number = 60,
    color: number = 0xffffff,
    disabled: boolean = false
  ) {
    super();

    this.buttonWidth = width;
    this.buttonHeight = height;
    this.color = color;
    this.isDisabled = disabled;

    this.initButton(text, disabled);
  }

  private async initButton(text: string, disabled: boolean): Promise<void> {
    await this.createBackground();
    this.createLabel(text);

    if (!disabled) {
      this.setupInteraction();
    } else {
      // 비활성화 상태: 전체 alpha 0.6 (60% 불투명 = 40% 검은색 효과)
      this.alpha = 0.6;
      this.cursor = 'not-allowed';
    }
  }

  private async createBackground(): Promise<void> {
    try {
      // 텍스처 로딩 (싱글톤 패턴으로 한 번만 로드)
      if (!PixelButton.buttonTexture && !PixelButton.textureLoading) {
        PixelButton.textureLoading = Assets.load('/assets/gui/bg-button.png').then(
          (texture: Texture) => {
            // 픽셀 아트 렌더링 설정
            if (texture.baseTexture) {
              texture.baseTexture.scaleMode = 'nearest';
            }
            PixelButton.buttonTexture = texture;
            return texture;
          }
        );
      }

      // 텍스처 대기
      if (PixelButton.textureLoading) {
        await PixelButton.textureLoading;
      }

      if (PixelButton.buttonTexture) {
        // NineSliceSprite로 버튼 배경 생성 (모서리는 유지하고 중앙 부분만 늘림)
        this.background = new NineSliceSprite({
          texture: PixelButton.buttonTexture,
          leftWidth: 20,
          topHeight: 20,
          rightWidth: 20,
          bottomHeight: 20,
        });

        this.background.width = this.buttonWidth;
        this.background.height = this.buttonHeight;
        this.background.anchor.set(0.5);

        this.addChild(this.background);
      }
    } catch (error) {
      console.error('버튼 이미지 로드 실패, 기본 그래픽으로 폴백:', error);
      this.createFallbackBackground();
    }
  }

  private createFallbackBackground(): void {
    // 이미지 로드 실패 시 기존 그래픽 방식 사용
    const graphics = new Graphics();
    const alpha = 0.2;
    const borderAlpha = 0.6;

    graphics.lineStyle(3, this.color, borderAlpha);
    graphics.beginFill(0x000000, alpha);
    graphics.drawRect(
      -this.buttonWidth / 2,
      -this.buttonHeight / 2,
      this.buttonWidth,
      this.buttonHeight
    );
    graphics.endFill();

    this.background = graphics;
    this.addChild(this.background);
  }

  private updateButtonAppearance(hover: boolean): void {
    if (this.background instanceof NineSliceSprite) {
      // 이미지 기반 버튼의 hover 효과
      if (hover && !this.isDisabled) {
        this.background.alpha = 1;
      } else if (!this.isDisabled) {
        this.background.alpha = 0.9;
      }
    }
  }

  private createLabel(text: string): void {
    // 폰트 크기 고정 16
    const fontSize = 16;

    this.labelText = new Text(text, {
      fontFamily: 'NeoDunggeunmo',
      fontSize: fontSize,
      fill: 0x773f16,
    });
    this.labelText.resolution = 3; // 초고해상도 렌더링 (로비 화면용)

    // 0.5 단위 금지 - 정수 위치로 조정
    this.labelText.anchor.set(0.5);
    this.labelText.x = Math.round(this.labelText.x);
    this.labelText.y = Math.round(this.labelText.y);

    this.addChild(this.labelText);
  }

  private setupInteraction(): void {
    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.updateButtonAppearance(true);
      this.scale.set(1.05);
    });

    this.on('pointerout', () => {
      this.updateButtonAppearance(false);
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

  /**
   * 표준 크기의 버튼을 생성하는 정적 팩토리 메서드
   * @param text 버튼 텍스트
   * @param x X 좌표
   * @param y Y 좌표
   * @param onClick 클릭 핸들러
   * @param disabled 비활성화 여부 (기본값: false)
   * @param width 버튼 너비 (기본값: 300)
   * @param height 버튼 높이 (기본값: 70)
   * @returns 생성된 PixelButton 인스턴스
   */
  public static create(
    text: string,
    x: number,
    y: number,
    onClick?: () => void,
    disabled: boolean = false,
    width: number = 300,
    height: number = 70
  ): PixelButton {
    const button = new PixelButton(text, width, height, 0xffffff, disabled);
    button.x = x;
    button.y = y;
    if (onClick) {
      button.onClick = onClick;
    }
    return button;
  }

  /**
   * 반응형 크기의 버튼을 생성하는 정적 팩토리 메서드
   * @param text 버튼 텍스트
   * @param screenWidth 화면 너비
   * @param x X 좌표
   * @param y Y 좌표
   * @param onClick 클릭 핸들러
   * @param disabled 비활성화 여부 (기본값: false)
   * @param isMobile 모바일 여부
   * @param scaleFactor 스케일 팩터
   * @returns 생성된 PixelButton 인스턴스
   */
  public static createResponsive(
    text: string,
    screenWidth: number,
    x: number,
    y: number,
    onClick?: () => void,
    disabled: boolean = false,
    isMobile: boolean = false,
    scaleFactor: number = 1
  ): PixelButton {
    // 버튼 크기 계산 - 화면 너비의 80% 사용 (최대 300px, 최소 260px)
    const buttonWidth = Math.min(Math.max(screenWidth * 0.8, 260), 300);
    const buttonHeight = isMobile ? 60 * scaleFactor : 70;

    return PixelButton.create(text, x, y, onClick, disabled, buttonWidth, buttonHeight);
  }
}
