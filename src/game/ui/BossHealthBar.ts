/**
 * 보스 체력바 UI
 *
 * 화면 상단 중앙에 표시되는 보스 체력바
 */

import { Container, Graphics, Text } from 'pixi.js';

export class BossHealthBar extends Container {
  private background: Graphics;
  private healthBar: Graphics;
  private nameText: Text;
  private healthText: Text;

  private maxHealth: number;
  private currentHealth: number;

  private barWidth: number;
  private barHeight: number = 30;

  constructor(bossName: string, maxHealth: number, screenWidth: number) {
    super();

    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.barWidth = screenWidth - 32; // 경험치바와 동일한 길이 (양쪽 패딩 16px)

    // 화면 상단 중앙에 배치 (타이머 아래)
    this.x = screenWidth / 2;
    this.y = 80; // 타이머 아래 충분한 여백을 두고 배치

    // 배경
    this.background = new Graphics();
    this.addChild(this.background);

    // 체력바
    this.healthBar = new Graphics();
    this.addChild(this.healthBar);

    // 보스 이름
    this.nameText = new Text({
      text: bossName,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 4 },
      },
    });
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = -35;
    this.addChild(this.nameText);

    // 체력 텍스트
    this.healthText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 },
      },
    });
    this.healthText.anchor.set(0.5);
    this.addChild(this.healthText);

    this.render();
  }

  /**
   * 체력 업데이트
   */
  public updateHealth(currentHealth: number): void {
    this.currentHealth = Math.max(0, currentHealth);
    this.render();
  }

  /**
   * 렌더링
   */
  private render(): void {
    const healthPercent = this.currentHealth / this.maxHealth;

    // 배경 (검은색 테두리)
    this.background.clear();
    this.background.rect(-this.barWidth / 2, 0, this.barWidth, this.barHeight);
    this.background.fill({ color: 0x000000, alpha: 0.7 });
    this.background.stroke({ color: 0xffffff, width: 3 });

    // 체력바 색상 (체력 % 기준)
    let barColor: number;
    if (healthPercent > 0.5) {
      barColor = 0x00ff00; // 녹색
    } else if (healthPercent > 0.25) {
      barColor = 0xffff00; // 노란색
    } else {
      barColor = 0xff0000; // 빨간색
    }

    // 체력바
    this.healthBar.clear();
    const currentBarWidth = this.barWidth * healthPercent;
    if (currentBarWidth > 0) {
      this.healthBar.rect(-this.barWidth / 2, 0, currentBarWidth, this.barHeight);
      this.healthBar.fill({ color: barColor, alpha: 0.8 });
    }

    // 체력 텍스트
    const healthPercentText = Math.ceil(healthPercent * 100);
    this.healthText.text = `${healthPercentText}%`;
    this.healthText.y = this.barHeight / 2;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.background.destroy();
    this.healthBar.destroy();
    this.nameText.destroy();
    this.healthText.destroy();
    super.destroy({ children: true });
  }
}
