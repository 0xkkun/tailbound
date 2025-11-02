import gsap from 'gsap';
import { Assets, Container, Graphics, Sprite } from 'pixi.js';

export class StageTransitionScene extends Container {
  private shamanSprite!: Sprite;
  private blackOverlay!: Graphics;
  private background!: Graphics;
  private screenWidth: number;
  private screenHeight: number;

  public onTransitionComplete?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.init();
  }

  private async init(): Promise<void> {
    // 전환 애니메이션 실행 (배경 없이 시작, 무당 이미지만 표시)
    await this.playTransitionAnimation();
  }

  private async playTransitionAnimation(): Promise<void> {
    try {
      // 1. 무당 이미지 설정 및 페이드인+줌아웃 동시 시작 (1.0초)
      await this.showShamanAndStartZoom();

      // 2. 줌아웃 완료 후 0.3초 대기
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. 전체 화면 페이드아웃하여 게임 화면 드러내기 (0.5초)
      await this.fadeOutEntireScreen();

      // 4. 페이드아웃 완료 후 게임 시작 콜백 및 씬 제거
      this.onTransitionComplete?.();
    } catch (error) {
      console.error('전환 애니메이션 실패:', error);
      // 에러 발생 시에도 게임 시작
      this.onTransitionComplete?.();
    }
  }

  private async showShamanAndStartZoom(): Promise<void> {
    try {
      // 검은 배경 생성 (무당 캐릭터 뒤에)
      this.background = new Graphics();
      this.background.rect(0, 0, this.screenWidth, this.screenHeight);
      this.background.fill(0x000000);
      this.addChild(this.background);

      // shaman-signature.png 로드 (3초 타임아웃)
      const texture = await Promise.race([
        Assets.load('/assets/gui/shaman-signature.png'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Asset loading timeout')), 3000)
        ),
      ]);

      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      // 무당 스프라이트 생성
      this.shamanSprite = new Sprite(texture);
      this.shamanSprite.anchor.set(0.5);

      // 화면 중앙에 배치
      this.shamanSprite.x = this.screenWidth / 2;
      this.shamanSprite.y = this.screenHeight / 2;

      // 초기 스케일: 화면 높이의 80%에 맞춤 (크게 시작)
      const targetHeight = this.screenHeight * 0.8;
      const initialScale = targetHeight / texture.height;
      this.shamanSprite.scale.set(initialScale);

      // 초기 alpha 0으로 설정
      this.shamanSprite.alpha = 0;

      this.addChild(this.shamanSprite);

      // 검은 화면 오버레이 생성
      this.blackOverlay = new Graphics();
      this.blackOverlay.rect(0, 0, this.screenWidth, this.screenHeight);
      this.blackOverlay.fill(0x000000);
      this.blackOverlay.alpha = 0;
      this.addChild(this.blackOverlay);

      // 목표 크기: 128x128 크기로 축소, 원본 이미지는 96x96 (scale 1.3)
      const targetScale = 1.3;
      const zoomDuration = 1.0; // 1.0초

      // 페이드인과 줌아웃을 동시에 시작 (1.0초)
      return new Promise((resolve) => {
        // 페이드인 애니메이션
        gsap.to(this.shamanSprite, {
          alpha: 1,
          duration: 0.3,
          ease: 'power2.out',
        });

        // 줌아웃 애니메이션 (화면 중심 기준, 큰 크기 → 원본 크기)
        gsap.to(this.shamanSprite.scale, {
          x: targetScale,
          y: targetScale,
          duration: zoomDuration,
          ease: 'power2.in',
          onComplete: resolve,
        });
      });
    } catch (error) {
      console.error('무당 이미지 로드 실패:', error);
      // 이미지 로드 실패 시 폴백: 검은 배경만 표시하고 짧은 지연 후 완료
      console.warn('[StageTransition] 폴백 모드: 이미지 없이 전환 진행');

      // 검은 오버레이 생성 (이미지가 없을 때의 폴백)
      this.blackOverlay = new Graphics();
      this.blackOverlay.rect(0, 0, this.screenWidth, this.screenHeight);
      this.blackOverlay.fill(0x000000);
      this.blackOverlay.alpha = 1;
      this.addChild(this.blackOverlay);

      // 짧은 지연 (0.5초)
      return new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async fadeOutEntireScreen(): Promise<void> {
    if (!this.background) {
      return Promise.resolve();
    }

    // 전체 화면 페이드아웃 (무당 스프라이트 + 배경 + 오버레이) (0.5초)
    return new Promise((resolve) => {
      // 무당 스프라이트 페이드아웃 + scale 0으로 축소
      if (this.shamanSprite) {
        gsap.to(this.shamanSprite, {
          alpha: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
        gsap.to(this.shamanSprite.scale, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'power2.in',
        });
      }

      // 검은 오버레이 페이드아웃
      if (this.blackOverlay) {
        gsap.to(this.blackOverlay, {
          alpha: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      // 배경도 페이드아웃 (게임 화면이 서서히 드러남)
      gsap.to(this.background, {
        alpha: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: resolve,
      });
    });
  }

  public async destroy(): Promise<void> {
    // 모든 진행 중인 애니메이션 완료 대기
    await new Promise<void>((resolve) => {
      // 애니메이션이 모두 완료되었는지 확인
      const checkAnimations = () => {
        const hasActiveAnimations =
          (this.shamanSprite && gsap.isTweening(this.shamanSprite)) ||
          (this.shamanSprite && gsap.isTweening(this.shamanSprite.scale)) ||
          (this.blackOverlay && gsap.isTweening(this.blackOverlay)) ||
          (this.background && gsap.isTweening(this.background));

        if (!hasActiveAnimations) {
          resolve();
        } else {
          requestAnimationFrame(checkAnimations);
        }
      };

      checkAnimations();
    });

    // gsap 애니메이션 정리
    if (this.shamanSprite) {
      gsap.killTweensOf(this.shamanSprite);
      gsap.killTweensOf(this.shamanSprite.scale);
    }
    if (this.blackOverlay) {
      gsap.killTweensOf(this.blackOverlay);
    }
    if (this.background) {
      gsap.killTweensOf(this.background);
    }

    super.destroy({ children: true });
  }
}
