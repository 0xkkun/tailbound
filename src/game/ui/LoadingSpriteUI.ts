import { CDN_ASSETS } from '@config/assets.config';
import {
  AnimatedSprite,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Text,
  Texture,
  TilingSprite,
} from 'pixi.js';

/**
 * 로딩 스프라이트 UI
 * - 120x32 스프라이트 16프레임 애니메이션
 * - 패턴 배경 (24px 간격, #2A2627)
 * - 최소 2초 표시
 */
export class LoadingSpriteUI extends Container {
  private background!: Graphics;
  private patternSprite!: TilingSprite;
  private loadingContainer!: Container; // 스프라이트 + 텍스트 컨테이너
  private loadingSprite!: AnimatedSprite;
  private loadingText!: Text;
  private dotAnimationTimer: number = 0;
  private dotState: number = 0;
  private startTime: number = 0;
  private isLoaded: boolean = false;

  private readonly BACKGROUND_COLOR = 0x2a2627;
  private readonly SPRITE_WIDTH = 120;
  private readonly SPRITE_HEIGHT = 32;
  private readonly FRAME_COUNT = 16;
  private readonly MIN_DISPLAY_TIME = 2000; // 최소 2초 표시
  private readonly LOADING_SPRITE_SCALE = 2; // 로딩 스프라이트 2배 확대
  private readonly DOT_ANIMATION_INTERVAL = 500; // 점 애니메이션 간격 (ms)

  constructor(
    private screenWidth: number,
    private screenHeight: number
  ) {
    super();
    this.zIndex = 10000; // 최상위 레이어
    this.startTime = Date.now();
  }

  /**
   * 로딩 UI 초기화 및 에셋 로드
   */
  async initialize(): Promise<void> {
    // 배경 생성 (단색)
    this.createBackground();

    try {
      // 패턴 이미지 로드
      const patternTexture = await Assets.load(CDN_ASSETS.gui.pattern);
      this.createPatternBackground(patternTexture);

      // 로딩 컨테이너 생성 (스프라이트 + 텍스트)
      this.loadingContainer = new Container();
      this.loadingContainer.x = this.screenWidth / 2;
      this.loadingContainer.y = this.screenHeight / 2 - 40; // 하단 패딩 40px (위로 이동)
      this.addChild(this.loadingContainer);

      // 로딩 스프라이트 로드
      const spriteTexture = await Assets.load(CDN_ASSETS.gui.loadingSprite);
      await this.createLoadingSprite(spriteTexture);

      // 로딩 텍스트 생성
      this.createLoadingText();

      // 점 애니메이션 시작
      this.startDotAnimation();

      console.log('[LoadingSpriteUI] 로딩 UI 초기화 완료');
    } catch (error) {
      console.error('[LoadingSpriteUI] 로딩 UI 초기화 실패:', error);
      // 에러 발생 시 기본 배경만 표시
    }
  }

  /**
   * 단색 배경 생성
   */
  private createBackground(): void {
    this.background = new Graphics();
    this.background.rect(0, 0, this.screenWidth, this.screenHeight);
    this.background.fill(this.BACKGROUND_COLOR);
    this.addChild(this.background);
  }

  /**
   * 패턴 배경 생성 (24px 간격)
   * Canvas를 사용하여 간격 있는 패턴 텍스처 생성
   */
  private createPatternBackground(texture: Texture): void {
    const PATTERN_GAP = 24;
    const baseSize = Math.floor(texture.width);
    const tileSize = baseSize + PATTERN_GAP;

    // Canvas 생성 (패턴 크기만큼)
    const canvas = document.createElement('canvas');
    canvas.width = tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      console.error('[LoadingSpriteUI] Canvas context를 생성할 수 없습니다');
      return;
    }

    // 원본 텍스처를 canvas에 그리기
    const source = texture.source;
    const resource = source.resource;

    // HTMLImageElement, HTMLCanvasElement, HTMLVideoElement 등 다양한 타입 지원
    if (
      resource instanceof HTMLImageElement ||
      resource instanceof HTMLCanvasElement ||
      resource instanceof ImageBitmap
    ) {
      try {
        ctx.drawImage(resource as CanvasImageSource, 0, 0, baseSize, baseSize);
        console.log('[LoadingSpriteUI] 패턴 canvas 생성 완료:', tileSize, 'x', tileSize);
      } catch (error) {
        console.error('[LoadingSpriteUI] Canvas drawImage 실패:', error);
        return;
      }
    } else {
      console.error('[LoadingSpriteUI] 지원하지 않는 리소스 타입:', resource);
      return;
    }

    // Canvas를 새로운 텍스처로 변환
    const gapTexture = Texture.from(canvas);
    gapTexture.source.scaleMode = 'nearest'; // 픽셀 아트 렌더링

    // TilingSprite로 패턴 반복
    this.patternSprite = new TilingSprite({
      texture: gapTexture,
      width: this.screenWidth,
      height: this.screenHeight,
    });

    // 화면 크기를 고려해서 패턴 중앙 정렬
    // 남는 공간을 양쪽에 균등 배분
    const offsetX = (this.screenWidth % tileSize) / 2;
    const offsetY = (this.screenHeight % tileSize) / 2;
    this.patternSprite.tilePosition.set(offsetX, offsetY);

    console.log(
      `[LoadingSpriteUI] 패턴 오프셋 적용: offsetX=${offsetX}, offsetY=${offsetY}, tileSize=${tileSize}`
    );

    this.addChildAt(this.patternSprite, 1); // 배경 위에
  }

  /**
   * 로딩 스프라이트 애니메이션 생성
   */
  private async createLoadingSprite(spriteSheet: Texture): Promise<void> {
    // 스프라이트 시트를 프레임으로 분할
    const frames: Texture[] = [];
    for (let i = 0; i < this.FRAME_COUNT; i++) {
      const frame = new Texture({
        source: spriteSheet.source,
        frame: new Rectangle(i * this.SPRITE_WIDTH, 0, this.SPRITE_WIDTH, this.SPRITE_HEIGHT),
      });
      frames.push(frame);
    }

    // 애니메이션 스프라이트 생성
    this.loadingSprite = new AnimatedSprite(frames);
    this.loadingSprite.anchor.set(0.5);
    this.loadingSprite.x = 0; // 컨테이너 내부 상대 좌표
    this.loadingSprite.y = 0;
    this.loadingSprite.scale.set(this.LOADING_SPRITE_SCALE);
    this.loadingSprite.animationSpeed = 0.3;
    this.loadingSprite.loop = true;
    this.loadingSprite.play();

    // 픽셀 아트 렌더링
    frames.forEach((frame) => {
      if (frame.source) {
        frame.source.scaleMode = 'nearest';
      }
    });

    this.loadingContainer.addChild(this.loadingSprite);
  }

  /**
   * 로딩 텍스트 생성
   */
  private createLoadingText(): void {
    this.loadingText = new Text({
      text: '로오오오디이이잉 중..',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 24,
        fill: 0xffffff,
        align: 'center',
        stroke: {
          color: 0x000000,
          width: 2,
        },
      },
    });

    this.loadingText.anchor.set(0.5);
    this.loadingText.x = 0; // 컨테이너 내부 상대 좌표
    this.loadingText.y = 48; // 스프라이트 아래 60px

    this.loadingContainer.addChild(this.loadingText);
  }

  /**
   * 점 애니메이션 시작
   */
  private startDotAnimation(): void {
    const updateDots = () => {
      if (!this.loadingText) return;

      const dotPatterns = ['.', '..', '...'];
      this.dotState = (this.dotState + 1) % dotPatterns.length;

      this.loadingText.text = '로오오오디이이잉 중' + dotPatterns[this.dotState];
    };

    // 500ms마다 점 패턴 변경
    this.dotAnimationTimer = window.setInterval(updateDots, this.DOT_ANIMATION_INTERVAL);
  }

  /**
   * 에셋 로딩 완료 알림
   */
  public notifyAssetsLoaded(): void {
    this.isLoaded = true;
  }

  /**
   * 최소 표시 시간이 지났는지 확인
   */
  public canHide(): boolean {
    const elapsed = Date.now() - this.startTime;
    return this.isLoaded && elapsed >= this.MIN_DISPLAY_TIME;
  }

  /**
   * 페이드아웃 애니메이션
   */
  public async fadeOut(duration: number = 300): Promise<void> {
    return new Promise((resolve) => {
      const startAlpha = this.alpha;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.alpha = startAlpha * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * 정리
   */
  public destroy(): void {
    // 점 애니메이션 타이머 정리
    if (this.dotAnimationTimer) {
      clearInterval(this.dotAnimationTimer);
    }

    if (this.loadingText) {
      this.loadingText.destroy();
    }
    if (this.loadingSprite) {
      this.loadingSprite.stop();
      this.loadingSprite.destroy();
    }
    if (this.patternSprite) {
      this.patternSprite.destroy();
    }
    if (this.background) {
      this.background.destroy();
    }
    super.destroy();
  }
}
