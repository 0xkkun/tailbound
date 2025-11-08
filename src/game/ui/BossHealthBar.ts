/**
 * 보스 체력바 UI
 *
 * 화면 상단 중앙에 표시되는 보스 체력바
 */

import { Container, Graphics, Text } from 'pixi.js';

export class BossHealthBar extends Container {
  private background: Graphics;
  private healthBar: Graphics;
  private border: Graphics; // 보더 (별도 레이어)
  private nameText: Text;
  private healthText: Text;
  private percentBox: Graphics; // 퍼센티지 박스
  private percentBoxBorder: Graphics; // 퍼센티지 박스 보더

  private maxHealth: number;
  private currentHealth: number;

  private barWidth: number;
  private barHeight: number = 22;
  private percentBoxWidth: number = 100; // 퍼센티지 박스 너비

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

    // 퍼센티지 박스 (배경만, 체력바 아래)
    this.percentBox = new Graphics();
    this.addChild(this.percentBox);

    // 체력바 (퍼센티지 박스 위에 그려서 보이도록)
    this.healthBar = new Graphics();
    this.addChild(this.healthBar);

    // 보더 (체력바 위에)
    this.border = new Graphics();
    this.addChild(this.border);

    // 퍼센티지 박스 보더 (최상위)
    this.percentBoxBorder = new Graphics();
    this.addChild(this.percentBoxBorder);

    // 보스 이름 (왼쪽 정렬)
    this.nameText = new Text({
      text: bossName,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    this.nameText.resolution = 2;
    this.nameText.anchor.set(0, 0.5);
    this.addChild(this.nameText);

    // 체력 퍼센티지 (오른쪽)
    this.healthText = new Text({
      text: '',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    this.healthText.resolution = 2;
    this.healthText.anchor.set(1, 0.5); // 오른쪽 정렬
    this.healthText.alpha = 0.7; // 70% opacity
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
    const borderWidth = 2;

    // 배경 (380808) - 전체 너비 (체력이 없는 부분만 표시)
    this.background.clear();
    this.background.rect(-this.barWidth / 2, 0, this.barWidth, this.barHeight);
    this.background.fill({ color: 0x380808, alpha: 1.0 });

    // 체력바 (D32727) - 전체 너비 기준으로 계산 (퍼센티지 박스는 오버레이)
    this.healthBar.clear();
    // 체력바 시작 위치
    const barStartX = -this.barWidth / 2;
    // 체력바는 전체 barWidth를 기준으로 계산 (퍼센티지 박스 영역 포함)
    const currentBarWidth = this.barWidth * healthPercent;

    if (currentBarWidth > 0) {
      // 체력바를 전체 높이로 그리기 (보더 없이)
      this.healthBar.rect(barStartX, 0, currentBarWidth, this.barHeight);
      this.healthBar.fill({ color: 0xd32727, alpha: 1.0 });
    }

    // 보더 (791515) - 전체 너비
    this.border.clear();
    this.border.rect(-this.barWidth / 2, 0, this.barWidth, this.barHeight);
    this.border.stroke({ color: 0x791515, width: borderWidth });

    // 퍼센티지 박스 (배경 제거 - 체력바가 보이도록, 보더만 표시)
    this.percentBox.clear();
    // 배경색 제거 - 체력바가 퍼센티지 박스 영역까지 채워져야 함
    // this.percentBox.rect(...) 제거

    // 퍼센티지 박스 보더 (왼쪽 선 제거 - 위/오른쪽/아래만)
    this.percentBoxBorder.clear();
    const percentBoxX = this.barWidth / 2 - this.percentBoxWidth;
    const percentBoxY = 0;

    // 위쪽 선
    this.percentBoxBorder.moveTo(percentBoxX, percentBoxY);
    this.percentBoxBorder.lineTo(percentBoxX + this.percentBoxWidth, percentBoxY);

    // 오른쪽 선
    this.percentBoxBorder.moveTo(percentBoxX + this.percentBoxWidth, percentBoxY);
    this.percentBoxBorder.lineTo(percentBoxX + this.percentBoxWidth, percentBoxY + this.barHeight);

    // 아래쪽 선
    this.percentBoxBorder.moveTo(percentBoxX + this.percentBoxWidth, percentBoxY + this.barHeight);
    this.percentBoxBorder.lineTo(percentBoxX, percentBoxY + this.barHeight);

    this.percentBoxBorder.stroke({ color: 0x791515, width: borderWidth });

    // 보스 이름 위치 (왼쪽 4px, 위아래 3px 간격)
    const textPaddingTop = 3;
    const textAreaHeight = this.barHeight - textPaddingTop * 2; // 위아래 3px씩
    this.nameText.x = -this.barWidth / 2 + 4;
    this.nameText.y = textPaddingTop + textAreaHeight / 2;

    // 체력 퍼센티지 위치 (오른쪽 4px, 위아래 3px 간격)
    const healthPercentText = Math.ceil(healthPercent * 100);
    this.healthText.text = `${healthPercentText}%`;
    this.healthText.x = this.barWidth / 2 - 4;
    this.healthText.y = textPaddingTop + textAreaHeight / 2;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.background.destroy();
    this.healthBar.destroy();
    this.border.destroy();
    this.percentBox.destroy();
    this.percentBoxBorder.destroy();
    this.nameText.destroy();
    this.healthText.destroy();
    super.destroy({ children: true });
  }
}
