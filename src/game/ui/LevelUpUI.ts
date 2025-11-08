/**
 * 레벨업 UI - 선택지 카드 표시
 */

import {
  DEFAULT_ICON,
  POWERUP_ICON_MAP,
  STAT_ICON_MAP,
  WEAPON_SPRITE_INFO,
} from '@config/levelup.config';
import { audioManager } from '@services/audioManager';
import type { LevelUpChoice } from '@systems/LevelSystem';
import { Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';

export class LevelUpUI extends Container {
  private overlay!: Graphics;
  private choiceCards: Container[] = [];
  private choices: LevelUpChoice[] = [];

  // 콜백
  public onChoiceSelected?: (choiceId: string) => void;

  constructor() {
    super();

    // 오버레이 배경
    this.createOverlay();

    // UI는 항상 최상위 레이어에 표시
    this.zIndex = 1000;

    // 기본적으로 숨김
    this.visible = false;
  }

  /**
   * 반투명 오버레이 생성
   */
  private createOverlay(): void {
    this.overlay = new Graphics();
    this.overlay.beginFill(0x000000, 0.7);
    this.overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.endFill();

    // 오버레이도 클릭 가능하게 (카드 외부 클릭 방지)
    this.overlay.eventMode = 'static';
    this.addChild(this.overlay);
  }

  /**
   * 선택지 표시
   */
  public async show(choices: LevelUpChoice[]): Promise<void> {
    // TODO: 파워업 선택지 효과음 적용. 임시로 인게임 시작 효과음
    audioManager.playIngameStartSound();
    this.choices = choices;

    // 기존 카드 제거
    this.clearCards();

    // 새 카드 생성
    await this.createCards();

    // 표시
    this.visible = true;
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
  }

  /**
   * 선택 카드 생성 (세로 정렬)
   */
  private async createCards(): Promise<void> {
    const cardWidth = 300;
    const cardHeight = 200; // 아이콘과 설명을 표시하기 위해 높이 증가
    const cardSpacing = 20;
    const totalHeight = cardHeight * 3 + cardSpacing * 2;

    const startX = (window.innerWidth - cardWidth) / 2;
    const startY = (window.innerHeight - totalHeight) / 2;

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

    // 등급별 테두리 색상
    const rarity = choice.rarity || 'common';
    let borderColor = 0x808080; // 회색 (common)
    if (rarity === 'rare') {
      borderColor = 0x4a90e2; // 파란색
    } else if (rarity === 'epic') {
      borderColor = 0x9b59b6; // 보라색
    } else if (rarity === 'legendary') {
      borderColor = 0xffd700; // 금색
    }

    // 카드 배경
    const bg = new Graphics();
    bg.beginFill(0x1a1a1a);
    bg.lineStyle(4, borderColor);
    bg.drawRoundedRect(0, 0, width, height, 10);
    bg.endFill();
    card.addChild(bg);

    // 등급 표시 (상단 좌측)
    const rarityBg = new Graphics();
    rarityBg.beginFill(borderColor);
    rarityBg.drawRoundedRect(10, 10, 80, 28, 5);
    rarityBg.endFill();
    card.addChild(rarityBg);

    const rarityText = new Text({
      text: (choice.rarity || 'common').toUpperCase(),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 14,
        fill: 0xffffff,
      },
    });
    rarityText.resolution = 2;
    rarityText.anchor.set(0.5);
    rarityText.x = 50;
    rarityText.y = 24;
    card.addChild(rarityText);

    // 아이콘 이미지 (상단 중앙, 크게)
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

      // 아이콘 크기 조정 (64x64)
      const iconSize = 64;
      const scale = Math.min(iconSize / iconSprite.width, iconSize / iconSprite.height);
      iconSprite.scale.set(scale);

      // 중앙 배치
      iconSprite.anchor.set(0.5);
      iconSprite.x = width / 2;
      iconSprite.y = 70;
      card.addChild(iconSprite);
    } catch (error) {
      console.error(`❌ Failed to load icon: ${iconPath}`, error);
      // 폴백 아이콘 로드 시도
      try {
        const fallbackTexture = await Assets.load(DEFAULT_ICON);
        const iconSprite = new Sprite(fallbackTexture);
        const iconSize = 64;
        const scale = Math.min(iconSize / iconSprite.width, iconSize / iconSprite.height);
        iconSprite.scale.set(scale);
        iconSprite.anchor.set(0.5);
        iconSprite.x = width / 2;
        iconSprite.y = 70;
        card.addChild(iconSprite);
      } catch (fallbackError) {
        // 폴백도 실패하면 아이콘 없이 진행
        console.error('❌ Fallback icon also failed to load', fallbackError);
      }
    }

    // 이름 (아이콘 아래)
    const nameText = new Text({
      text: choice.name,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 24,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: width - 30,
        align: 'center',
      },
    });
    nameText.resolution = 2;
    nameText.anchor.set(0.5, 0);
    nameText.x = width / 2;
    nameText.y = 115;
    card.addChild(nameText);

    // 설명 (이름 아래)
    const descText = new Text({
      text: choice.description,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 14,
        fill: 0xcccccc,
        wordWrap: true,
        wordWrapWidth: width - 30,
        align: 'center',
        lineHeight: 18,
      },
    });
    descText.resolution = 2;
    descText.anchor.set(0.5, 0);
    descText.x = width / 2;
    descText.y = 150;
    card.addChild(descText);

    // 터치/클릭 이벤트
    card.eventMode = 'static';
    card.cursor = 'pointer';

    // 호버 효과
    card.on('pointerover', () => {
      bg.clear();
      bg.beginFill(0x2a2a2a);
      bg.lineStyle(4, borderColor);
      bg.drawRoundedRect(0, 0, width, height, 10);
      bg.endFill();
    });

    card.on('pointerout', () => {
      bg.clear();
      bg.beginFill(0x1a1a1a);
      bg.lineStyle(4, borderColor);
      bg.drawRoundedRect(0, 0, width, height, 10);
      bg.endFill();
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
   * 화면 크기 변경 시 오버레이 업데이트
   */
  public async resize(width: number, height: number): Promise<void> {
    this.overlay.clear();
    this.overlay.beginFill(0x000000, 0.7);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();

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
    super.destroy();
  }
}
