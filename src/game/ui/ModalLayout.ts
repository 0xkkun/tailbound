/**
 * 모달 레이아웃 컴포넌트
 *
 * 파워업 리스트, 설정창 등에서 공통으로 사용하는 레이아웃
 * - 배경 박스 (#dcc7af, border #9d5a29)
 * - Line 컨테이너 (border #baa48b)
 * - 코너 패턴 (네 모서리)
 * - 타이틀
 */

import { CDN_ASSETS } from '@config/assets.config';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

// 색상 팔레트 (Figma 디자인 기준)
const MODAL_COLORS = {
  BACKGROUND: 0xdcc7af, // Figma: 갈색 베이지
  BORDER: 0x9d5a29, // Figma: 진한 갈색
  LINE_BORDER: 0xbaa48b, // Figma: Line 컨테이너 border
  TITLE: 0x773f16, // Figma: 갈색 (제목)
} as const;

export interface ModalLayoutConfig {
  width: number; // 모달 너비 (기본 360px)
  height: number; // 모달 높이 (콘텐츠에 따라 가변)
  title: string; // 모달 제목
}

/**
 * 모달 레이아웃
 *
 * 공통 UI 요소:
 * - 배경 박스
 * - Line 컨테이너
 * - 코너 패턴
 * - 타이틀
 */
export class ModalLayout extends Container {
  private backgroundBox!: Graphics;
  private lineContainer!: Graphics;
  private titleText!: Text;
  private cornerPatterns: Sprite[] = [];

  // 레이아웃 정보
  public readonly config: ModalLayoutConfig;
  public readonly contentArea: { x: number; y: number; width: number; height: number };

  constructor(config: ModalLayoutConfig) {
    super();
    this.config = config;

    // 콘텐츠 영역 계산 (Line 컨테이너 안쪽)
    const boxX = (window.innerWidth - config.width) / 2;
    const boxY = (window.innerHeight - config.height) / 2;
    const lineX = boxX + 8;
    const lineY = boxY + 8;
    const titleHeight = 70; // 타이틀 영역 높이

    this.contentArea = {
      x: lineX + 15, // Line 컨테이너 + padding
      y: lineY + titleHeight, // 타이틀 아래
      width: config.width - 16 - 30, // Line 컨테이너 - padding
      height: config.height - 16 - titleHeight - 8, // 나머지 높이
    };

    // UI 생성
    this.createBackgroundBox();
    this.createLineContainer();
    this.createTitle();

    // 코너 패턴 비동기 로드
    void this.loadCornerPatterns();

    // 최상위 레이어
    this.zIndex = 1000;
  }

  /**
   * 배경 박스 생성
   */
  private createBackgroundBox(): void {
    this.backgroundBox = new Graphics();
    const x = (window.innerWidth - this.config.width) / 2;
    const y = (window.innerHeight - this.config.height) / 2;

    this.backgroundBox.rect(x, y, this.config.width, this.config.height);
    this.backgroundBox.fill(MODAL_COLORS.BACKGROUND);
    this.backgroundBox.rect(x, y, this.config.width, this.config.height);
    this.backgroundBox.stroke({ color: MODAL_COLORS.BORDER, width: 2 });

    this.addChild(this.backgroundBox);
  }

  /**
   * Line 컨테이너 생성
   */
  private createLineContainer(): void {
    this.lineContainer = new Graphics();
    const boxX = (window.innerWidth - this.config.width) / 2;
    const boxY = (window.innerHeight - this.config.height) / 2;

    const lineX = boxX + 8;
    const lineY = boxY + 8;
    const lineWidth = this.config.width - 16;
    const lineHeight = this.config.height - 16;

    this.lineContainer.rect(lineX, lineY, lineWidth, lineHeight);
    this.lineContainer.stroke({ color: MODAL_COLORS.LINE_BORDER, width: 1 });

    this.addChild(this.lineContainer);
  }

  /**
   * 타이틀 생성
   */
  private createTitle(): void {
    this.titleText = new Text({
      text: this.config.title,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 24,
        fill: MODAL_COLORS.TITLE,
      },
    });
    this.titleText.resolution = 2;
    this.titleText.anchor.set(0.5);

    const boxY = (window.innerHeight - this.config.height) / 2;
    const lineY = boxY + 8;

    this.titleText.x = window.innerWidth / 2;
    this.titleText.y = lineY + 30;
    this.addChild(this.titleText);
  }

  /**
   * 코너 패턴 로드
   */
  private async loadCornerPatterns(): Promise<void> {
    try {
      const texture = await Assets.load(CDN_ASSETS.gui.cornerPattern);
      texture.source.scaleMode = 'nearest';

      const boxX = (window.innerWidth - this.config.width) / 2;
      const boxY = (window.innerHeight - this.config.height) / 2;

      const lineX = boxX + 8;
      const lineY = boxY + 8;
      const lineWidth = this.config.width - 16;
      const lineHeight = this.config.height - 16;

      const displaySize = 40;
      const halfSize = displaySize / 2;
      const imageScale = 0.5;

      const corners = [
        // 좌상: 원본
        {
          x: lineX + halfSize,
          y: lineY + halfSize,
          rotation: 0,
          scaleX: imageScale,
          scaleY: imageScale,
        },
        // 우상: rotate 180° + scaleY -1
        {
          x: lineX + lineWidth - halfSize,
          y: lineY + halfSize,
          rotation: Math.PI,
          scaleX: imageScale,
          scaleY: -imageScale,
        },
        // 우하: rotate 180°
        {
          x: lineX + lineWidth - halfSize,
          y: lineY + lineHeight - halfSize,
          rotation: Math.PI,
          scaleX: imageScale,
          scaleY: imageScale,
        },
        // 좌하: scaleY -1
        {
          x: lineX + halfSize,
          y: lineY + lineHeight - halfSize,
          rotation: 0,
          scaleX: imageScale,
          scaleY: -imageScale,
        },
      ];

      for (const corner of corners) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.x = corner.x;
        sprite.y = corner.y;
        sprite.rotation = corner.rotation;
        sprite.scale.set(corner.scaleX, corner.scaleY);
        sprite.zIndex = 100;
        this.cornerPatterns.push(sprite);
        this.addChild(sprite);
      }
    } catch (error) {
      console.error('❌ Failed to load corner pattern:', error);
    }
  }

  /**
   * 타이틀 업데이트
   */
  public updateTitle(title: string): void {
    this.titleText.text = title;
  }

  /**
   * 화면 크기 변경 시 레이아웃 재계산
   */
  public resize(width: number, height: number): void {
    // 배경 박스 재생성
    this.backgroundBox.clear();
    const x = (width - this.config.width) / 2;
    const y = (height - this.config.height) / 2;
    this.backgroundBox.rect(x, y, this.config.width, this.config.height);
    this.backgroundBox.fill(MODAL_COLORS.BACKGROUND);
    this.backgroundBox.rect(x, y, this.config.width, this.config.height);
    this.backgroundBox.stroke({ color: MODAL_COLORS.BORDER, width: 2 });

    // Line 컨테이너 재생성
    this.lineContainer.clear();
    const lineX = x + 8;
    const lineY = y + 8;
    const lineWidth = this.config.width - 16;
    const lineHeight = this.config.height - 16;
    this.lineContainer.rect(lineX, lineY, lineWidth, lineHeight);
    this.lineContainer.stroke({ color: MODAL_COLORS.LINE_BORDER, width: 1 });

    // 타이틀 위치 업데이트
    this.titleText.x = width / 2;
    this.titleText.y = lineY + 30;

    // 코너 패턴 위치 업데이트
    if (this.cornerPatterns.length === 4) {
      const displaySize = 40;
      const halfSize = displaySize / 2;
      const corners = [
        { x: lineX + halfSize, y: lineY + halfSize },
        { x: lineX + lineWidth - halfSize, y: lineY + halfSize },
        { x: lineX + lineWidth - halfSize, y: lineY + lineHeight - halfSize },
        { x: lineX + halfSize, y: lineY + lineHeight - halfSize },
      ];
      this.cornerPatterns.forEach((sprite, i) => {
        sprite.x = corners[i].x;
        sprite.y = corners[i].y;
      });
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.backgroundBox?.destroy();
    this.lineContainer?.destroy();
    this.titleText?.destroy();
    for (const pattern of this.cornerPatterns) {
      pattern.destroy();
    }
    super.destroy();
  }
}
