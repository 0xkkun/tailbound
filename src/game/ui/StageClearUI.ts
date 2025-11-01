/**
 * 스테이지 클리어 UI
 *
 * 보스 처치 후 표시되는 클리어 화면
 */

import { Container, Graphics, Text } from 'pixi.js';

import { PixelButton } from './PixelButton';

export interface StageClearStats {
  clearTime: string; // "10:35" 형식
  totalXP: number;
  level: number;
}

// 스테이지 클리어 UI 상수
const STAGE_CLEAR_UI_CONSTANTS = {
  OVERLAY: {
    COLOR: 0x000000,
    ALPHA: 0.8,
  },
  FONT: {
    FAMILY: 'NeoDunggeunmo',
    TITLE_MAX: 64,
    TITLE_RATIO: 0.12,
    STAT_MAX: 24,
    STAT_RATIO: 0.045,
    RESOLUTION: 2,
  },
  COLOR: {
    TITLE: 0xffd700, // 금색
    STAT: 0xffffff,
  },
  POSITION: {
    TITLE_Y: 0.25,
    STATS_Y: 0.45,
    BUTTON_Y: 0.7,
    CENTER: 0.5,
  },
  Z_INDEX: {
    OVERLAY: 0,
    CONTENT: 1,
    BUTTON: 2,
  },
  BUTTON: {
    MAX_WIDTH: 184,
    WIDTH_RATIO: 0.4,
    MAX_HEIGHT: 56,
    HEIGHT_RATIO: 0.1,
  },
  LAYOUT: {
    LINE_HEIGHT_OFFSET: 10,
  },
  ANIMATION: {
    EXPAND_DURATION: 0.5,
    BOUNCE_DURATION: 0.2,
    MAX_SCALE: 1.2,
    FINAL_SCALE: 1.0,
    INITIAL_SCALE: 0.0,
  },
} as const;

export class StageClearUI extends Container {
  private overlay: Graphics;
  private titleText: Text;
  private statsContainer: Container;
  private buttonsContainer: Container;
  private screenWidth: number;
  private screenHeight: number;

  // 애니메이션
  private scaleTimer: number = 0;
  private initialScale: number = 0;

  // 콜백
  public onReturnToLobby?: () => void;

  constructor(stats: StageClearStats, screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // zIndex 정렬 활성화
    this.sortableChildren = true;

    // 오버레이 (반투명 검은색 배경)
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, screenWidth, screenHeight);
    this.overlay.fill({
      color: STAGE_CLEAR_UI_CONSTANTS.OVERLAY.COLOR,
      alpha: STAGE_CLEAR_UI_CONSTANTS.OVERLAY.ALPHA,
    });
    this.overlay.eventMode = 'none'; // 클릭 이벤트 무시 (자식 요소는 클릭 가능)
    this.overlay.zIndex = STAGE_CLEAR_UI_CONSTANTS.Z_INDEX.OVERLAY;
    this.addChild(this.overlay);

    // 반응형 폰트 크기 계산
    const titleFontSize = Math.min(
      STAGE_CLEAR_UI_CONSTANTS.FONT.TITLE_MAX,
      screenWidth * STAGE_CLEAR_UI_CONSTANTS.FONT.TITLE_RATIO
    );
    const statFontSize = Math.min(
      STAGE_CLEAR_UI_CONSTANTS.FONT.STAT_MAX,
      screenWidth * STAGE_CLEAR_UI_CONSTANTS.FONT.STAT_RATIO
    );

    // 제목 텍스트
    this.titleText = new Text({
      text: '스테이지 클리어!',
      style: {
        fontFamily: STAGE_CLEAR_UI_CONSTANTS.FONT.FAMILY,
        fontSize: titleFontSize,
        fill: STAGE_CLEAR_UI_CONSTANTS.COLOR.TITLE,
      },
    });
    this.titleText.resolution = STAGE_CLEAR_UI_CONSTANTS.FONT.RESOLUTION;
    this.titleText.anchor.set(STAGE_CLEAR_UI_CONSTANTS.POSITION.CENTER);
    this.titleText.x = screenWidth * STAGE_CLEAR_UI_CONSTANTS.POSITION.CENTER;
    this.titleText.y = screenHeight * STAGE_CLEAR_UI_CONSTANTS.POSITION.TITLE_Y;
    this.titleText.zIndex = STAGE_CLEAR_UI_CONSTANTS.Z_INDEX.CONTENT;
    this.addChild(this.titleText);

    // 통계 컨테이너
    this.statsContainer = new Container();
    this.statsContainer.x = screenWidth * STAGE_CLEAR_UI_CONSTANTS.POSITION.CENTER;
    this.statsContainer.y = screenHeight * STAGE_CLEAR_UI_CONSTANTS.POSITION.STATS_Y;
    this.statsContainer.zIndex = STAGE_CLEAR_UI_CONSTANTS.Z_INDEX.CONTENT;
    this.addChild(this.statsContainer);

    this.createStats(stats, statFontSize);

    // 버튼 컨테이너
    this.buttonsContainer = new Container();
    this.buttonsContainer.x = screenWidth * STAGE_CLEAR_UI_CONSTANTS.POSITION.CENTER;
    this.buttonsContainer.y = screenHeight * STAGE_CLEAR_UI_CONSTANTS.POSITION.BUTTON_Y;
    this.buttonsContainer.zIndex = STAGE_CLEAR_UI_CONSTANTS.Z_INDEX.BUTTON;
    this.buttonsContainer.eventMode = 'static'; // 이벤트 활성화
    this.addChild(this.buttonsContainer);

    this.createButtons();

    // 초기 스케일 애니메이션을 위해 0으로 시작
    this.titleText.scale.set(STAGE_CLEAR_UI_CONSTANTS.ANIMATION.INITIAL_SCALE);
  }

  /**
   * 통계 생성
   */
  private createStats(stats: StageClearStats, fontSize: number): void {
    const statTexts = [
      `클리어 타임: ${stats.clearTime}`,
      `총 경험치: ${stats.totalXP.toLocaleString()} XP`,
      `최종 레벨: ${stats.level}`,
    ];

    const lineHeight = fontSize + STAGE_CLEAR_UI_CONSTANTS.LAYOUT.LINE_HEIGHT_OFFSET;
    let yOffset = 0;

    for (const statText of statTexts) {
      const text = new Text({
        text: statText,
        style: {
          fontFamily: STAGE_CLEAR_UI_CONSTANTS.FONT.FAMILY,
          fontSize: fontSize,
          fill: STAGE_CLEAR_UI_CONSTANTS.COLOR.STAT,
        },
      });
      text.resolution = STAGE_CLEAR_UI_CONSTANTS.FONT.RESOLUTION;
      text.anchor.set(STAGE_CLEAR_UI_CONSTANTS.POSITION.CENTER);
      text.y = yOffset;
      this.statsContainer.addChild(text);
      yOffset += lineHeight;
    }
  }

  /**
   * 버튼 생성
   */
  private createButtons(): void {
    // 반응형 버튼 크기
    const buttonWidth = Math.min(
      STAGE_CLEAR_UI_CONSTANTS.BUTTON.MAX_WIDTH,
      this.screenWidth * STAGE_CLEAR_UI_CONSTANTS.BUTTON.WIDTH_RATIO
    );
    const buttonHeight = Math.min(
      STAGE_CLEAR_UI_CONSTANTS.BUTTON.MAX_HEIGHT,
      this.screenHeight * STAGE_CLEAR_UI_CONSTANTS.BUTTON.HEIGHT_RATIO
    );

    // "로비로 돌아가기" 버튼 (PixelButton 사용)
    const button = PixelButton.create(
      '로비로 돌아가기',
      0,
      0,
      () => {
        console.log('로비로 돌아가기 클릭됨');
        this.onReturnToLobby?.();
      },
      false,
      buttonWidth,
      buttonHeight
    );

    this.buttonsContainer.addChild(button);
  }

  /**
   * 업데이트 (애니메이션)
   */
  public update(deltaTime: number): void {
    const { EXPAND_DURATION, BOUNCE_DURATION, MAX_SCALE, FINAL_SCALE } =
      STAGE_CLEAR_UI_CONSTANTS.ANIMATION;

    // 제목 텍스트 바운스 애니메이션
    this.scaleTimer += deltaTime;

    if (this.scaleTimer < EXPAND_DURATION) {
      // 확장 단계: 0 → MAX_SCALE
      const progress = this.scaleTimer / EXPAND_DURATION;
      const scale = progress * MAX_SCALE;
      this.titleText.scale.set(scale);
    } else if (this.scaleTimer < EXPAND_DURATION + BOUNCE_DURATION) {
      // 바운스 단계: MAX_SCALE → FINAL_SCALE
      const progress = (this.scaleTimer - EXPAND_DURATION) / BOUNCE_DURATION;
      const scale = MAX_SCALE - progress * (MAX_SCALE - FINAL_SCALE);
      this.titleText.scale.set(scale);
    } else {
      // 최종 스케일 유지
      this.titleText.scale.set(FINAL_SCALE);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.overlay.destroy();
    this.titleText.destroy();
    this.statsContainer.destroy({ children: true });
    this.buttonsContainer.destroy({ children: true });
    super.destroy({ children: true });
  }
}
