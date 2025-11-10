/**
 * 레벨업 UI - 선택지 카드 표시
 */

import { CDN_ASSETS } from '@config/assets.config';
import {
  DEFAULT_ICON,
  POWERUP_ICON_MAP,
  STAT_ICON_MAP,
  WEAPON_SPRITE_INFO,
} from '@config/levelup.config';
import { audioManager } from '@services/audioManager';
import { GameAnalytics } from '@services/gameAnalytics';
import type { LevelUpChoice } from '@systems/LevelSystem';
import { Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';

// 색상 팔레트 (Figma 디자인 기준)
const COLORS = {
  // 배경
  OVERLAY: 0x000000,
  BACKGROUND: 0xdcc7af, // Figma: 갈색 베이지
  BORDER: 0x9d5a29, // Figma: 진한 갈색

  // 등급별 카드 배경
  RARITY_BG: {
    common: 0xf5f1e9, // 베이지
    rare: 0xf0ecf7, // 연보라
    epic: 0xf4ebee, // 연핑크
    legendary: 0xfef5e7, // 연금색
  },

  // 등급별 테두리
  RARITY_BORDER: {
    common: 0xcac3a6, // 연한 갈색
    rare: 0xa782e2, // 보라색
    epic: 0xde8092, // 핑크색
    legendary: 0xd4af37, // 금색
  },

  // 등급별 뱃지 배경 (Figma 디자인)
  RARITY_BADGE_BG: {
    common: 0x8f8a74, // Base 뱃지
    rare: 0x8041e4, // Rare 뱃지
    epic: 0xd3294a, // Epic 뱃지
    legendary: 0xd4af37, // Legendary 뱃지
  },

  // 텍스트
  TITLE: 0x773f16, // Figma: 갈색 (제목)
  TEXT: 0x292826, // Figma: 진한 회갈색 (본문)
  TEXT_DESC: 0x8f867f, // Figma: 회갈색 (설명)
  NEW_TEXT: 0xd61c1f, // Figma: 빨간색 (NEW!)
} as const;

export class LevelUpUI extends Container {
  // 입력 블록 딜레이 (ms) - 나중에 설정으로 변경 가능
  private static readonly INPUT_BLOCK_DELAY = 500;

  private overlay!: Graphics;
  private backgroundBox!: Graphics;
  private lineContainer!: Graphics; // Figma: border가 있는 Line 컨테이너
  private cardsWrapper!: Graphics; // Figma: 카드들을 감싸는 래퍼 (#f4efe9)
  private titleText!: Text;
  private cornerPatterns: Sprite[] = [];
  private choiceCards: Container[] = [];
  private choices: LevelUpChoice[] = [];
  private isInputBlocked: boolean = false;
  private playerLevel: number = 1;

  // 하단 파워업 목록
  private powerupsSection!: Container;
  private acquiredPowerups: Map<string, number> = new Map();
  private powerupTotalValues: Map<string, number> = new Map();
  private powerupDisplayIds: Map<string, string> = new Map();

  // 콜백
  public onChoiceSelected?: (choiceId: string) => void;

  constructor() {
    super();

    // 오버레이 배경
    this.createOverlay();

    // 배경 박스
    this.createBackgroundBox();

    // Line 컨테이너 (border가 있는 내부 컨테이너)
    this.createLineContainer();

    // 제목
    this.createTitle();

    // UI는 항상 최상위 레이어에 표시
    this.zIndex = 1000;

    // 기본적으로 숨김
    this.visible = false;

    // 코너 패턴 비동기 로드
    void this.loadCornerPatterns();
  }

  /**
   * 반투명 오버레이 생성
   */
  private createOverlay(): void {
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.fill({ color: COLORS.OVERLAY, alpha: 0.8 });

    // 오버레이도 클릭 가능하게 (카드 외부 클릭 방지)
    this.overlay.eventMode = 'static';
    this.addChild(this.overlay);
  }

  /**
   * 배경 박스 생성 (Figma: 바깥 박스, radius 없음)
   */
  private createBackgroundBox(): void {
    this.backgroundBox = new Graphics();
    const boxWidth = Math.min(360, window.innerWidth - 40); // Figma 모바일 디자인
    const boxHeight = Math.min(450, window.innerHeight - 160); // 파워업 섹션(120px) + 간격(40px) 여유
    const x = (window.innerWidth - boxWidth) / 2;
    const y = (window.innerHeight - boxHeight) / 2 - 60; // 위로 조금 올림

    // 배경 (Figma: radius 없음)
    this.backgroundBox.rect(x, y, boxWidth, boxHeight);
    this.backgroundBox.fill(COLORS.BACKGROUND);

    // 테두리 (Figma: border-2 = 2px, #9d5a29)
    this.backgroundBox.rect(x, y, boxWidth, boxHeight);
    this.backgroundBox.stroke({ color: COLORS.BORDER, width: 2 });

    this.addChild(this.backgroundBox);
  }

  /**
   * Line 컨테이너 생성 (Figma: border가 있는 내부 컨테이너, 코너 패턴이 이곳에 위치)
   */
  private createLineContainer(): void {
    this.lineContainer = new Graphics();
    const boxWidth = Math.min(360, window.innerWidth - 40);
    const boxHeight = Math.min(450, window.innerHeight - 160); // 파워업 섹션 여유
    const x = (window.innerWidth - boxWidth) / 2;
    const y = (window.innerHeight - boxHeight) / 2 - 60; // 위로 조금 올림

    // Line 컨테이너는 배경 박스 안쪽에 8px 패딩
    const lineX = x + 8;
    const lineY = y + 8;
    const lineWidth = boxWidth - 16;
    const lineHeight = boxHeight - 16;

    // border만 (Figma: border-[#baa48b])
    this.lineContainer.rect(lineX, lineY, lineWidth, lineHeight);
    this.lineContainer.stroke({ color: 0xbaa48b, width: 1 });

    this.addChild(this.lineContainer);
  }

  /**
   * 제목 생성 (Figma: Line 컨테이너 상단에 위치)
   */
  private createTitle(): void {
    this.titleText = new Text({
      text: '파워 업!',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 24, // Figma 디자인: 24px
        fill: COLORS.TITLE,
      },
    });
    this.titleText.resolution = 2;
    this.titleText.anchor.set(0.5);

    // 위치 계산
    const boxHeight = Math.min(450, window.innerHeight - 160); // 파워업 섹션 여유
    const boxY = (window.innerHeight - boxHeight) / 2 - 60; // 위로 조금 올림
    const lineY = boxY + 8;

    this.titleText.x = window.innerWidth / 2;
    this.titleText.y = lineY + 30; // Line 컨테이너 상단에서 약간 아래
    this.addChild(this.titleText);
  }

  /**
   * 코너 패턴 로드 (Figma: Line 컨테이너의 네 모서리에 위치)
   * Figma 디자인 기준:
   * - 좌상: 원본
   * - 우상: rotate 180° + scaleY -1 (좌우반전 + 상하반전)
   * - 우하: rotate 180° (180도 회전)
   * - 좌하: scaleY -1 (상하반전)
   */
  private async loadCornerPatterns(): Promise<void> {
    try {
      console.log('🎨 Loading corner pattern from:', CDN_ASSETS.gui.cornerPattern);
      const texture = await Assets.load(CDN_ASSETS.gui.cornerPattern);
      texture.source.scaleMode = 'nearest';
      console.log('✅ Corner pattern loaded successfully');

      const boxWidth = Math.min(360, window.innerWidth - 40);
      const boxHeight = Math.min(450, window.innerHeight - 160); // 파워업 섹션 여유
      const boxX = (window.innerWidth - boxWidth) / 2;
      const boxY = (window.innerHeight - boxHeight) / 2 - 60; // 위로 조금 올림

      // Line 컨테이너의 위치 (배경 박스 + 8px 패딩)
      const lineX = boxX + 8;
      const lineY = boxY + 8;
      const lineWidth = boxWidth - 16;
      const lineHeight = boxHeight - 16;

      // 이미지는 80x80px, 화면에는 40x40으로 표시 (scale 0.5)
      const displaySize = 40; // 화면에 표시될 크기
      const halfSize = displaySize / 2;
      const imageScale = 0.5; // 80px -> 40px

      // 네 모서리 위치 및 변환 (Figma 디자인 기준)
      // anchor를 중앙(0.5, 0.5)으로 설정하여 회전/반전이 중앙 기준으로 적용
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
        sprite.anchor.set(0.5, 0.5); // 중앙 기준 회전/반전
        sprite.x = corner.x;
        sprite.y = corner.y;
        sprite.rotation = corner.rotation;
        sprite.scale.set(corner.scaleX, corner.scaleY);
        sprite.zIndex = 100; // 최상위에 표시
        this.cornerPatterns.push(sprite);
        this.addChild(sprite);
      }
      console.log('✅ Corner patterns added:', this.cornerPatterns.length);
    } catch (error) {
      console.error('❌ Failed to load corner pattern:', error);
    }
  }

  /**
   * 선택지 표시
   */
  public async show(
    choices: LevelUpChoice[],
    playerLevel: number = 1,
    acquiredPowerups?: Map<string, number>,
    powerupTotalValues?: Map<string, number>,
    powerupDisplayIds?: Map<string, string>
  ): Promise<void> {
    // TODO: 파워업 선택지 효과음 적용. 임시로 인게임 시작 효과음
    audioManager.playIngameStartSound();
    this.choices = choices;
    this.playerLevel = playerLevel;

    // 획득한 파워업 정보 업데이트
    if (acquiredPowerups) {
      this.acquiredPowerups = acquiredPowerups;
    }
    if (powerupTotalValues) {
      this.powerupTotalValues = powerupTotalValues;
    }
    if (powerupDisplayIds) {
      this.powerupDisplayIds = powerupDisplayIds;
    }

    // 입력 블록 활성화 (오선택 방지)
    this.isInputBlocked = true;

    // 기존 카드 제거
    this.clearCards();

    // 새 카드 생성
    await this.createCards();

    // 파워업 섹션 생성/업데이트
    await this.createPowerupsSection();

    // 표시
    this.visible = true;

    // 설정된 시간 후 입력 허용
    setTimeout(() => {
      this.isInputBlocked = false;
    }, LevelUpUI.INPUT_BLOCK_DELAY);
  }

  /**
   * UI 숨김
   */
  public hide(): void {
    this.visible = false;
    this.clearCards();
  }

  /**
   * 기존 카드 제거
   */
  private clearCards(): void {
    for (const card of this.choiceCards) {
      card.destroy();
    }
    this.choiceCards = [];

    // 카드 래퍼도 제거
    if (this.cardsWrapper) {
      this.cardsWrapper.destroy();
    }
  }

  /**
   * 하단 파워업 목록 섹션 생성
   */
  private async createPowerupsSection(): Promise<void> {
    // 기존 섹션 제거
    if (this.powerupsSection) {
      this.powerupsSection.destroy();
    }

    this.powerupsSection = new Container();

    const boxHeight = Math.min(450, window.innerHeight - 160);
    const boxY = (window.innerHeight - boxHeight) / 2 - 60;

    // 파워업 섹션 위치 (모달 바깥쪽 아래)
    const sectionY = boxY + boxHeight + 20; // 모달 박스 바로 아래 20px 간격
    const sectionHeight = 120;
    const sectionWidth = Math.min(360, window.innerWidth - 40);
    const sectionX = (window.innerWidth - sectionWidth) / 2;

    // 검은색 배경
    const bg = new Graphics();
    bg.rect(sectionX, sectionY, sectionWidth, sectionHeight);
    bg.fill(0x000000);
    this.powerupsSection.addChild(bg);

    // 파워업 아이콘 배치
    const iconSize = 40;
    const iconSpacingX = 8; // 좌우 간격
    const iconSpacingY = 12; // 상하 간격
    const paddingX = 10; // 좌우 패딩
    const startX = sectionX + paddingX;
    const startY = sectionY + 10;

    // 반응형: 섹션 너비에 따라 한 줄에 들어갈 아이콘 개수 계산
    const availableWidth = sectionWidth - paddingX * 2; // 좌우 패딩 제외
    const iconsPerRow = Math.max(1, Math.floor(availableWidth / (iconSize + iconSpacingX)));

    let row = 0;
    let col = 0;

    // 파워업 목록을 배열로 변환하여 순회
    for (const [powerupType, level] of this.acquiredPowerups.entries()) {
      if (row >= 2) break; // 최대 2줄

      const iconX = startX + col * (iconSize + iconSpacingX);
      const iconY = startY + row * (iconSize + 20 + iconSpacingY); // iconSize + 레벨텍스트(20px) + 상하간격

      // 아이콘 카드
      const iconCard = new Container();
      iconCard.x = iconX;
      iconCard.y = iconY;

      // 아이콘 배경 (작은 정사각형, 보더)
      const iconBg = new Graphics();
      iconBg.rect(0, 0, iconSize, iconSize);
      iconBg.fill(0x222222);
      iconBg.stroke({ color: 0x9d5a29, width: 2 }); // #9D5A29 보더
      iconCard.addChild(iconBg);

      // 파워업 아이콘 로드 (실제 아이콘 사용)
      try {
        // 무기는 powerupType 그대로, 파워업은 전체 ID 사용
        const displayId = powerupType.startsWith('weapon_')
          ? powerupType
          : this.powerupDisplayIds.get(powerupType) || powerupType;

        const iconPath = this.getIconPath(displayId);
        const baseTexture = await Assets.load(iconPath);

        let iconSprite: Sprite;

        // 무기인 경우 스프라이트 시트에서 첫 프레임 추출
        if (displayId.startsWith('weapon_')) {
          const spriteInfo = this.getWeaponSpriteInfo(displayId);
          const frameX = spriteInfo.frameCol * spriteInfo.frameWidth;
          const frameY = spriteInfo.frameRow * spriteInfo.frameHeight;

          const texture = new Texture({
            source: baseTexture.source,
            frame: new Rectangle(frameX, frameY, spriteInfo.frameWidth, spriteInfo.frameHeight),
          });
          iconSprite = new Sprite(texture);
        } else {
          // 파워업은 단일 이미지
          iconSprite = new Sprite(baseTexture);
        }

        // 아이콘 크기 조정 (40x40에 맞춤, 약간 여백)
        const targetSize = iconSize - 8; // 4px 패딩
        const scale = Math.min(targetSize / iconSprite.width, targetSize / iconSprite.height);
        iconSprite.scale.set(scale);
        iconSprite.anchor.set(0.5);
        iconSprite.x = iconSize / 2;
        iconSprite.y = iconSize / 2;

        iconCard.addChild(iconSprite);
      } catch (error) {
        console.error(`Failed to load powerup icon: ${powerupType}`, error);
        // 폴백: 텍스트 표시
        const iconText = new Text({
          text: powerupType.substring(0, 3).toUpperCase(),
          style: {
            fontFamily: 'NeoDunggeunmo',
            fontSize: 10,
            fill: 0xffffff,
          },
        });
        iconText.resolution = 2;
        iconText.anchor.set(0.5);
        iconText.x = iconSize / 2;
        iconText.y = iconSize / 2;
        iconCard.addChild(iconText);
      }

      // 레벨 또는 누적 수치 텍스트
      let displayText: string;
      if (powerupType.startsWith('weapon_')) {
        // 무기: 레벨 표시
        displayText = `Lv.${level}`;
      } else {
        // 파워업: 누적 수치 표시
        const totalValue = this.powerupTotalValues.get(powerupType) || 0;
        // 퍼센트로 변환 (0.35 -> 35%)
        const percentage = Math.round(totalValue * 100);
        displayText = `+${percentage}%`;
      }

      const levelText = new Text({
        text: displayText,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 9, // 약간 작게 조정 (긴 텍스트 대비)
          fill: 0xffffff,
        },
      });
      levelText.resolution = 2;
      levelText.anchor.set(0.5, 0);
      levelText.x = iconSize / 2;
      levelText.y = iconSize + 2;
      iconCard.addChild(levelText);

      this.powerupsSection.addChild(iconCard);

      // 다음 위치 계산
      col++;
      if (col >= iconsPerRow) {
        col = 0;
        row++;
      }
    }

    this.addChild(this.powerupsSection);
  }

  /**
   * 선택 카드 생성 (Figma 디자인: 카드 래퍼 포함)
   */
  private async createCards(): Promise<void> {
    const boxWidth = Math.min(360, window.innerWidth - 40);
    const boxHeight = Math.min(450, window.innerHeight - 160); // 파워업 섹션 여유
    const boxX = (window.innerWidth - boxWidth) / 2;
    const boxY = (window.innerHeight - boxHeight) / 2 - 60; // 위로 조금 올림

    // Line 컨테이너 위치
    const lineX = boxX + 8;
    const lineY = boxY + 8;
    const lineWidth = boxWidth - 16;

    // 카드 래퍼 생성 (Figma: #f4efe9 배경, border #baa48b)
    this.cardsWrapper = new Graphics();
    const wrapperX = lineX + 15; // px-[15px]
    const wrapperY = lineY + 70; // 타이틀 아래 위치
    const wrapperWidth = lineWidth - 30; // 좌우 15px씩 패딩
    const wrapperPaddingY = 32; // py-[32px]
    const cardHeight = 76; // 카드 높이
    const cardSpacing = 12; // gap-[12px]
    const wrapperHeight = wrapperPaddingY * 2 + cardHeight * 3 + cardSpacing * 2;

    // 카드 래퍼 배경 (Figma: rounded-[2px])
    this.cardsWrapper.roundRect(wrapperX, wrapperY, wrapperWidth, wrapperHeight, 2);
    this.cardsWrapper.fill(0xf4efe9); // Figma: #f4efe9
    this.cardsWrapper.roundRect(wrapperX, wrapperY, wrapperWidth, wrapperHeight, 2);
    this.cardsWrapper.stroke({ color: 0xbaa48b, width: 1 });
    this.addChild(this.cardsWrapper);

    // 카드 생성 (래퍼 안쪽에 배치)
    const cardWidth = wrapperWidth - 24; // 래퍼 padding 12px씩
    const startX = wrapperX + 12;
    const startY = wrapperY + wrapperPaddingY;

    // 모든 카드를 병렬로 생성
    const cardPromises = this.choices.map(async (choice, i) => {
      const x = startX;
      const y = startY + i * (cardHeight + cardSpacing);
      return await this.createCard(choice, x, y, cardWidth, cardHeight);
    });

    const cards = await Promise.all(cardPromises);

    // 생성된 카드들을 추가
    for (const card of cards) {
      this.choiceCards.push(card);
      this.addChild(card);
    }
  }

  /**
   * 개별 카드 생성
   */
  private async createCard(
    choice: LevelUpChoice,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Container> {
    const card = new Container();
    card.x = x;
    card.y = y;

    // 등급별 색상
    const rarity = choice.rarity || 'common';
    const bgColor =
      COLORS.RARITY_BG[rarity as keyof typeof COLORS.RARITY_BG] || COLORS.RARITY_BG.common;
    const borderColor =
      COLORS.RARITY_BORDER[rarity as keyof typeof COLORS.RARITY_BORDER] ||
      COLORS.RARITY_BORDER.common;

    // 카드 배경 (Figma: border-2 = 2px, rounded-[3px])
    const bg = new Graphics();
    bg.roundRect(0, 0, width, height, 3);
    bg.fill(bgColor);
    bg.roundRect(0, 0, width, height, 3);
    bg.stroke({ color: borderColor, width: 2 });
    card.addChild(bg);

    // Figma 디자인 기준 레이아웃
    const iconSize = 32; // Figma: 32x32 고정
    const iconX = 12 + iconSize / 2; // 좌측 12px 패딩
    const textStartX = 12 + iconSize + 8; // 아이콘 + 8px 간격
    const nameFontSize = 16; // Figma 기준
    const descFontSize = 12; // Figma 기준
    const rarityBadgeWidth = 60;
    const rarityBadgeHeight = 20;

    // 레이아웃 상수
    const topPadding = 12; // 카드 상단 패딩

    // 등급 표시 (우측 상단) - Figma 디자인 기준
    const badgeBgColor =
      COLORS.RARITY_BADGE_BG[rarity as keyof typeof COLORS.RARITY_BADGE_BG] ||
      COLORS.RARITY_BADGE_BG.common;

    const rarityBg = new Graphics();
    rarityBg.roundRect(
      width - rarityBadgeWidth - 6,
      topPadding,
      rarityBadgeWidth,
      rarityBadgeHeight,
      15
    );
    rarityBg.fill(badgeBgColor);
    card.addChild(rarityBg);

    // 등급 텍스트 매핑 (Figma 디자인)
    const rarityTextMap: Record<string, string> = {
      common: 'Base',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    };

    const rarityText = new Text({
      text: rarityTextMap[rarity] || 'Base',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 12,
        fill: 0xffffff,
      },
    });
    rarityText.resolution = 2;
    rarityText.anchor.set(0.5);
    rarityText.x = width - rarityBadgeWidth / 2 - 6;
    rarityText.y = topPadding + rarityBadgeHeight / 2;
    card.addChild(rarityText);

    // 아이콘 배경 및 보더 (등급별 색상)
    const iconBorderColors = {
      common: 0xe7d58d,
      rare: 0xb99bea,
      epic: 0xee95a6,
      legendary: 0xd4af37,
    };
    const iconBorderColor =
      iconBorderColors[rarity as keyof typeof iconBorderColors] || iconBorderColors.common;

    const iconY = topPadding + iconSize / 2;

    // 아이콘 배경 박스 (검은색 배경 + 등급별 보더)
    const iconBg = new Graphics();
    iconBg.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    iconBg.fill(0x000000);
    iconBg.rect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    iconBg.stroke({ color: iconBorderColor, width: 2 });
    card.addChild(iconBg);

    // 아이콘 이미지
    const iconPath = this.getIconPath(choice.id);
    try {
      const baseTexture = await Assets.load(iconPath);

      // 무기 스프라이트 시트의 첫 프레임 추출
      let iconSprite: Sprite;
      if (choice.id.startsWith('weapon_')) {
        // 무기별 스프라이트 시트 정보
        const spriteInfo = this.getWeaponSpriteInfo(choice.id);

        const frameX = spriteInfo.frameCol * spriteInfo.frameWidth;
        const frameY = spriteInfo.frameRow * spriteInfo.frameHeight;

        const texture = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(frameX, frameY, spriteInfo.frameWidth, spriteInfo.frameHeight),
        });
        iconSprite = new Sprite(texture);
      } else {
        // 파워업 아이콘은 단일 이미지
        iconSprite = new Sprite(baseTexture);
      }

      // 아이콘 크기 조정 (배경보다 약간 작게)
      const iconPadding = 4; // 배경과 아이콘 사이 여백
      const targetIconSize = iconSize - iconPadding * 2;
      const scale = Math.min(targetIconSize / iconSprite.width, targetIconSize / iconSprite.height);
      iconSprite.scale.set(scale);

      // 중앙 배치
      iconSprite.anchor.set(0.5);
      iconSprite.x = iconX;
      iconSprite.y = iconY;
      card.addChild(iconSprite);
    } catch (error) {
      console.error(`❌ Failed to load icon: ${iconPath}`, error);
      // 폴백 아이콘 로드 시도
      try {
        const fallbackTexture = await Assets.load(DEFAULT_ICON);
        const iconSprite = new Sprite(fallbackTexture);
        const scale = Math.min(iconSize / iconSprite.width, iconSize / iconSprite.height);
        iconSprite.scale.set(scale);
        iconSprite.anchor.set(0.5);
        iconSprite.x = iconX;
        iconSprite.y = iconY;
        card.addChild(iconSprite);
      } catch (fallbackError) {
        // 폴백도 실패하면 아이콘 없이 진행
        console.error('❌ Fallback icon also failed to load', fallbackError);
      }
    }

    // 레벨 또는 NEW! 텍스트 (아이콘 바로 아래)
    // NEW인 경우: "NEW!" 표시
    // 기존 파워업/무기: 선택 시 얻게 될 다음 레벨 표시 (현재 레벨 + 1)
    const isNew = choice.currentLevel === 0; // 레벨 0이면 새 파워업
    const levelText = new Text({
      text: isNew ? 'NEW!' : `Lv.${(choice.currentLevel || 0) + 1}`,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 12,
        fill: isNew ? COLORS.NEW_TEXT : COLORS.TEXT,
      },
    });
    levelText.resolution = 2;
    levelText.anchor.set(0.5, 0);
    levelText.x = iconX;
    levelText.y = iconY + iconSize / 2 + 4; // 아이콘 바로 아래 4px 간격
    card.addChild(levelText);

    // 텍스트 영역 계산
    const rarityBadgeStartX = width - rarityBadgeWidth - 6;
    const textAreaWidth = rarityBadgeStartX - textStartX - 4; // 라벨 바로 앞까지

    // 파워업 이름 (좌측 정렬, Figma 디자인)
    const nameText = new Text({
      text: choice.name,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: nameFontSize,
        fill: COLORS.TEXT,
        wordWrap: true,
        wordWrapWidth: textAreaWidth,
        align: 'left',
      },
    });
    nameText.resolution = 2;
    nameText.anchor.set(0, 0); // 좌측 상단 기준
    nameText.x = textStartX;
    nameText.y = topPadding;
    card.addChild(nameText);

    // 설명 (좌측 정렬, 이름 아래 8px 간격)
    const descY = topPadding + nameFontSize + 8;
    const descText = new Text({
      text: choice.description,
      style: {
        fontFamily: 'RIDIBatang', // Figma 디자인: RIDIBatang 폰트
        fontSize: descFontSize,
        fill: COLORS.TEXT_DESC,
        wordWrap: true,
        wordWrapWidth: textAreaWidth,
        align: 'left',
        lineHeight: 16,
      },
    });
    descText.resolution = 2;
    descText.anchor.set(0, 0);
    descText.x = textStartX;
    descText.y = descY;
    card.addChild(descText);

    // 터치/클릭 이벤트
    card.eventMode = 'static';
    card.cursor = 'pointer';

    // 호버 효과 - 배경을 약간 어둡게
    const darkenColor = (color: number, amount: number = 0.95): number => {
      const r = Math.floor(((color >> 16) & 0xff) * amount);
      const g = Math.floor(((color >> 8) & 0xff) * amount);
      const b = Math.floor((color & 0xff) * amount);
      return (r << 16) | (g << 8) | b;
    };

    card.on('pointerover', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 3);
      bg.fill(darkenColor(bgColor, 0.95));
      bg.roundRect(0, 0, width, height, 3);
      bg.stroke({ color: borderColor, width: 2 });
    });

    card.on('pointerout', () => {
      bg.clear();
      bg.roundRect(0, 0, width, height, 3);
      bg.fill(bgColor);
      bg.roundRect(0, 0, width, height, 3);
      bg.stroke({ color: borderColor, width: 2 });
    });

    // 클릭/터치 선택
    card.on('pointerdown', () => {
      this.selectChoice(choice.id);
    });

    return card;
  }

  /**
   * 선택 처리
   */
  private selectChoice(choiceId: string): void {
    // 입력 블록 중이면 무시 (오선택 방지)
    if (this.isInputBlocked) {
      return;
    }

    // Analytics: 레벨업 선택 추적
    const choiceType = choiceId.startsWith('weapon_') ? 'weapon' : 'powerup';
    GameAnalytics.trackLevelUpChoice(choiceType, choiceId, this.playerLevel);

    // 콜백 호출
    this.onChoiceSelected?.(choiceId);

    // UI 숨김
    this.hide();
  }

  /**
   * 무기별 스프라이트 시트 정보
   */
  private getWeaponSpriteInfo(weaponId: string): {
    frameWidth: number;
    frameHeight: number;
    frameCol: number;
    frameRow: number;
  } {
    const info = WEAPON_SPRITE_INFO[weaponId as keyof typeof WEAPON_SPRITE_INFO];
    if (info) {
      return {
        frameWidth: info.frameWidth,
        frameHeight: info.frameHeight,
        frameCol: info.frameCol,
        frameRow: info.frameRow,
      };
    }
    // 기본값
    return { frameWidth: 32, frameHeight: 32, frameCol: 0, frameRow: 0 };
  }

  /**
   * 아이콘 이미지 경로 반환 (중앙 집중식 설정 기반)
   */
  private getIconPath(choiceId: string): string {
    // 1. 무기 아이콘
    const weaponInfo = WEAPON_SPRITE_INFO[choiceId as keyof typeof WEAPON_SPRITE_INFO];
    if (weaponInfo) {
      return weaponInfo.path;
    }

    // 2. 스탯 아이콘 (접두사 매칭)
    for (const [prefix, iconPath] of Object.entries(STAT_ICON_MAP)) {
      if (choiceId.startsWith(prefix)) {
        return iconPath;
      }
    }

    // 3. 복합 파워업 (정확한 ID 매칭)
    const hybridIcon = POWERUP_ICON_MAP[choiceId as keyof typeof POWERUP_ICON_MAP];
    if (hybridIcon) {
      return hybridIcon;
    }

    // 4. 일반 파워업 (접두사 매칭)
    for (const [prefix, iconPath] of Object.entries(POWERUP_ICON_MAP)) {
      if (choiceId.startsWith(prefix)) {
        return iconPath;
      }
    }

    // 5. 기본 아이콘
    console.warn(`⚠️ 매핑되지 않은 선택지 ID: ${choiceId}`);
    return DEFAULT_ICON;
  }

  /**
   * 화면 크기 변경 시 전체 UI 재구성
   */
  public async resize(width: number, height: number): Promise<void> {
    // 오버레이 업데이트
    this.overlay.clear();
    this.overlay.rect(0, 0, width, height);
    this.overlay.fill({ color: COLORS.OVERLAY, alpha: 0.8 });

    // 배경 박스 재생성
    this.backgroundBox.clear();
    const boxWidth = Math.min(360, width - 40);
    const boxHeight = Math.min(450, height - 160); // 파워업 섹션 여유
    const x = (width - boxWidth) / 2;
    const y = (height - boxHeight) / 2 - 60; // 위로 조금 올림
    this.backgroundBox.rect(x, y, boxWidth, boxHeight);
    this.backgroundBox.fill(COLORS.BACKGROUND);
    this.backgroundBox.rect(x, y, boxWidth, boxHeight);
    this.backgroundBox.stroke({ color: COLORS.BORDER, width: 2 });

    // Line 컨테이너 재생성
    this.lineContainer.clear();
    const lineX = x + 8;
    const lineY = y + 8;
    const lineWidth = boxWidth - 16;
    const lineHeight = boxHeight - 16;
    this.lineContainer.rect(lineX, lineY, lineWidth, lineHeight);
    this.lineContainer.stroke({ color: 0xbaa48b, width: 1 });

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

    // 카드 재배치
    if (this.visible && this.choices.length > 0) {
      this.clearCards();
      await this.createCards();
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.clearCards();
    this.overlay?.destroy();
    this.backgroundBox?.destroy();
    this.lineContainer?.destroy();
    this.cardsWrapper?.destroy();
    for (const pattern of this.cornerPatterns) {
      pattern.destroy();
    }
    super.destroy();
  }
}
