/**
 * 레벨업 UI - 선택지 카드 표시
 */

import { Container, Graphics, Text } from 'pixi.js';

import type { LevelUpChoice } from '@/systems/LevelSystem';

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
  public show(choices: LevelUpChoice[]): void {
    this.choices = choices;

    // 기존 카드 제거
    this.clearCards();

    // 새 카드 생성
    this.createCards();

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
  private createCards(): void {
    const cardWidth = 300;
    const cardHeight = 150; // 세로 정렬이므로 카드 높이 줄임
    const cardSpacing = 20;
    const totalHeight = cardHeight * 3 + cardSpacing * 2;

    const startX = (window.innerWidth - cardWidth) / 2;
    const startY = (window.innerHeight - totalHeight) / 2;

    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      const x = startX;
      const y = startY + i * (cardHeight + cardSpacing);

      const card = this.createCard(choice, x, y, cardWidth, cardHeight);
      this.choiceCards.push(card);
      this.addChild(card);
    }
  }

  /**
   * 개별 카드 생성
   */
  private createCard(
    choice: LevelUpChoice,
    x: number,
    y: number,
    width: number,
    height: number
  ): Container {
    const card = new Container();
    card.x = x;
    card.y = y;

    // 등급별 색상
    const rarityColors: Record<string, number> = {
      common: 0x808080,
      rare: 0x4169e1,
      epic: 0x9370db,
      legendary: 0xffd700,
    };
    const borderColor = rarityColors[choice.rarity || 'common'] || 0x808080;

    // 카드 배경
    const bg = new Graphics();
    bg.beginFill(0x1a1a1a);
    bg.lineStyle(4, borderColor);
    bg.drawRoundedRect(0, 0, width, height, 10);
    bg.endFill();
    card.addChild(bg);

    // 등급 표시 (상단)
    const rarityBg = new Graphics();
    rarityBg.beginFill(borderColor);
    rarityBg.drawRoundedRect(10, 10, 80, 30, 5);
    rarityBg.endFill();
    card.addChild(rarityBg);

    const rarityText = new Text({
      text: (choice.rarity || 'common').toUpperCase(),
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    rarityText.anchor.set(0.5);
    rarityText.x = 50;
    rarityText.y = 25;
    card.addChild(rarityText);

    // 이름
    const nameText = new Text({
      text: choice.name,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: width - 40,
      },
    });
    nameText.x = 20;
    nameText.y = 60;
    card.addChild(nameText);

    // 설명
    const descText = new Text({
      text: choice.description,
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xcccccc,
        wordWrap: true,
        wordWrapWidth: width - 40,
      },
    });
    descText.x = 20;
    descText.y = 100;
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
    console.log(`선택됨: ${choiceId}`);

    // 콜백 호출
    this.onChoiceSelected?.(choiceId);

    // UI 숨김
    this.hide();
  }

  /**
   * 화면 크기 변경 시 오버레이 업데이트
   */
  public resize(width: number, height: number): void {
    this.overlay.clear();
    this.overlay.beginFill(0x000000, 0.7);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();

    // 카드 재배치
    if (this.visible && this.choices.length > 0) {
      this.clearCards();
      this.createCards();
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
