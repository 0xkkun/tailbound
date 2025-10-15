import { Container, Graphics, Text } from 'pixi.js';

import { Character } from '../../types/character.types';

export class CharacterDisplay extends Container {
  private placeholder!: Graphics;
  private nameText!: Text;
  private isMobile: boolean;
  private scaleFactor: number;

  constructor(character: Character, isMobile: boolean = false, scaleFactor: number = 1) {
    super();

    this.isMobile = isMobile;
    this.scaleFactor = scaleFactor;

    this.createPlaceholder();
    this.createNameText(character.name);
  }

  private createPlaceholder(): void {
    // 임시 placeholder (추후 Sprite로 교체)
    const circleRadius = this.isMobile ? 60 : 80;
    const emojiSize = this.isMobile ? 60 : 80;

    this.placeholder = new Graphics();
    this.placeholder.beginFill(0xffffff, 0.1);
    this.placeholder.lineStyle(2, 0xffffff, 0.3);
    this.placeholder.drawCircle(0, 0, circleRadius);
    this.placeholder.endFill();

    // 임시 이모지
    const emoji = new Text('🐯', {
      fontSize: emojiSize,
    });
    emoji.anchor.set(0.5);
    this.placeholder.addChild(emoji);

    this.addChild(this.placeholder);
  }

  private createNameText(name: string): void {
    const fontSize = this.isMobile ? Math.floor(14 * this.scaleFactor) : 16;
    const yPosition = this.isMobile ? 80 : 100;

    this.nameText = new Text(name, {
      fontFamily: 'Nanum Gothic',
      fontSize: fontSize,
      fill: 0xd4af37,
      fontWeight: 'bold',
    });
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = yPosition;
    this.addChild(this.nameText);
  }
}
