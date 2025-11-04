/**
 * 테스트 게임 씬 - 디버그/치트 기능 포함
 *
 * 보스와 무기를 빠르게 테스트하기 위한 씬
 */

import type { PlayerSnapshot } from '@hooks/useGameState';
import { Container, Graphics, Text } from 'pixi.js';

import { OverworldGameScene } from './OverworldGameScene';

// 테스트 씬 UI 상수
const TEST_UI_CONSTANTS = {
  DEBUG_BUTTON: {
    SIZE: 50,
    MARGIN: 10,
    Z_INDEX: 10000,
    COLOR: 0x00ff00,
    ALPHA_NORMAL: 0.8,
    ALPHA_HOVER: 1.0,
    ICON_SIZE: 30,
  },
  DEBUG_PANEL: {
    WIDTH: 300,
    HEIGHT: 700,
    SMALL_WIDTH: 280,
    SMALL_HEIGHT: 650,
    MIN_MARGIN: 20,
    SCREEN_HEIGHT_MARGIN: 100,
    PADDING: 15,
    SMALL_PADDING: 10,
    Z_INDEX: 10001,
    BG_COLOR: 0x000000,
    BG_ALPHA: 0.85,
    BORDER_COLOR: 0x00ff00,
    BORDER_WIDTH: 2,
  },
  BREAKPOINT: {
    SMALL_SCREEN: 600,
  },
  CHEAT: {
    BOSS_SPAWN_TIME: 600, // 10분
    XP_AMOUNT: 1000,
  },
} as const;

export class TestGameScene extends OverworldGameScene {
  // 디버그 UI
  private debugPanel: Container | null = null;
  private debugToggleButton: Container | null = null;
  private isDebugPanelOpen: boolean = false; // 초기에는 닫힌 상태

  // 무적 모드
  private godMode: boolean = false;

  constructor(screenWidth: number, screenHeight: number, playerSnapshot?: PlayerSnapshot | null) {
    super(screenWidth, screenHeight, playerSnapshot);
  }

  /**
   * 플레이어 생성 후 디버그 UI 생성
   */
  protected createPlayer(): void {
    super.createPlayer();

    // 디버그 패널 생성
    this.createDebugPanel();

    // 디버그 토글 버튼 생성
    this.createDebugToggleButton();
  }

  /**
   * 디버그 토글 버튼 생성
   */
  private createDebugToggleButton(): void {
    console.log('[TestGameScene] 디버그 토글 버튼 생성 시작');
    const { SIZE, MARGIN, Z_INDEX, COLOR, ALPHA_NORMAL, ALPHA_HOVER, ICON_SIZE } =
      TEST_UI_CONSTANTS.DEBUG_BUTTON;

    // uiLayer의 sortableChildren 활성화
    this.uiLayer.sortableChildren = true;

    this.debugToggleButton = new Container();
    this.debugToggleButton.x = this.screenWidth - SIZE - MARGIN;
    this.debugToggleButton.y = MARGIN;
    this.debugToggleButton.zIndex = Z_INDEX;
    console.log('[TestGameScene] 버튼 위치:', this.debugToggleButton.x, this.debugToggleButton.y);

    // 버튼 배경
    const bg = new Graphics();
    bg.rect(0, 0, SIZE, SIZE);
    bg.fill({ color: COLOR, alpha: ALPHA_NORMAL });
    bg.stroke({ color: 0xffffff, width: 2 });
    this.debugToggleButton.addChild(bg);

    // 아이콘 텍스트
    const icon = new Text({
      text: '🧪',
      style: {
        fontSize: ICON_SIZE,
      },
    });
    icon.anchor.set(0.5);
    icon.x = SIZE / 2;
    icon.y = SIZE / 2;
    this.debugToggleButton.addChild(icon);

    // 인터랙션 설정
    this.debugToggleButton.eventMode = 'static';
    this.debugToggleButton.cursor = 'pointer';

    this.debugToggleButton.on('pointerover', () => {
      bg.clear();
      bg.rect(0, 0, SIZE, SIZE);
      bg.fill({ color: COLOR, alpha: ALPHA_HOVER });
      bg.stroke({ color: 0xffffff, width: 2 });
    });

    this.debugToggleButton.on('pointerout', () => {
      bg.clear();
      bg.rect(0, 0, SIZE, SIZE);
      bg.fill({ color: COLOR, alpha: ALPHA_NORMAL });
      bg.stroke({ color: 0xffffff, width: 2 });
    });

    this.debugToggleButton.on('pointerdown', () => {
      console.log('[TestGameScene] 버튼 클릭됨!');
      this.toggleDebugPanel();
    });

    this.uiLayer.addChild(this.debugToggleButton);
    console.log(
      '[TestGameScene] 버튼이 uiLayer에 추가됨. uiLayer children 수:',
      this.uiLayer.children.length
    );
  }

  /**
   * 디버그 패널 생성
   */
  private createDebugPanel(): void {
    // 화면 크기에 따라 패널 크기 조정
    const {
      WIDTH,
      HEIGHT,
      SMALL_WIDTH,
      SMALL_HEIGHT,
      MIN_MARGIN,
      SCREEN_HEIGHT_MARGIN,
      PADDING,
      SMALL_PADDING,
      Z_INDEX,
      BG_COLOR,
      BG_ALPHA,
      BORDER_COLOR,
      BORDER_WIDTH,
    } = TEST_UI_CONSTANTS.DEBUG_PANEL;
    const { SMALL_SCREEN } = TEST_UI_CONSTANTS.BREAKPOINT;

    const isSmallScreen = this.screenWidth < SMALL_SCREEN;
    const panelWidth = isSmallScreen ? Math.min(SMALL_WIDTH, this.screenWidth - MIN_MARGIN) : WIDTH;
    const panelHeight = isSmallScreen
      ? Math.min(SMALL_HEIGHT, this.screenHeight - SCREEN_HEIGHT_MARGIN)
      : HEIGHT;
    const padding = isSmallScreen ? SMALL_PADDING : PADDING;

    this.debugPanel = new Container();
    this.debugPanel.x = this.screenWidth - panelWidth - 10;
    this.debugPanel.y = 10;
    this.debugPanel.visible = this.isDebugPanelOpen;
    this.debugPanel.zIndex = Z_INDEX;

    // 배경
    const bg = new Graphics();
    bg.rect(0, 0, panelWidth, panelHeight);
    bg.fill({ color: BG_COLOR, alpha: BG_ALPHA });
    bg.stroke({ color: BORDER_COLOR, width: BORDER_WIDTH });
    this.debugPanel.addChild(bg);

    // 제목
    const title = new Text({
      text: '🧪 테스트 모드',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0x00ff00,
      },
    });
    title.x = padding;
    title.y = padding;
    this.debugPanel.addChild(title);

    let yPos = 60;

    // 무기 섹션
    yPos = this.addSection(this.debugPanel, '🎮 무기', yPos, padding);
    yPos = this.addButton(
      this.debugPanel,
      '모든 무기 추가',
      panelWidth - padding * 2,
      yPos,
      padding,
      () => this.cheatAllWeapons()
    );
    yPos += 40;

    // 개별 무기 버튼 (2줄)
    const weaponButtons = [
      { label: '부적', action: () => this.cheatAddWeapon('talisman') },
      { label: '도깨비불', action: () => this.cheatAddWeapon('dokkaebi_fire') },
      { label: '목탁', action: () => this.cheatAddWeapon('moktak') },
    ];
    yPos = this.addButtonRow(this.debugPanel, weaponButtons, panelWidth, yPos, padding);

    const weaponButtons2 = [
      { label: '작두날', action: () => this.cheatAddWeapon('jakdu') },
      { label: '부채바람', action: () => this.cheatAddWeapon('fan_wind') },
    ];
    yPos = this.addButtonRow(this.debugPanel, weaponButtons2, panelWidth, yPos, padding);

    yPos += 10;

    // 보스/적 섹션
    yPos = this.addSection(this.debugPanel, '👹 보스/적', yPos, padding);
    const bossButtons = [
      { label: '보스 소환', action: () => this.cheatSpawnBoss() },
      { label: '적 제거', action: () => this.cheatClearEnemies() },
    ];
    yPos = this.addButtonRow(this.debugPanel, bossButtons, panelWidth, yPos, padding);

    yPos += 10;

    // 스탯 섹션
    yPos = this.addSection(this.debugPanel, '📊 스탯', yPos, padding);
    const statButtons1 = [
      { label: '공격력+', action: () => this.cheatIncreaseDamage() },
      { label: '속도+', action: () => this.cheatIncreaseSpeed() },
    ];
    yPos = this.addButtonRow(this.debugPanel, statButtons1, panelWidth, yPos, padding);

    const statButtons2 = [
      { label: '쿨타임-', action: () => this.cheatDecreaseCooldown() },
      { label: '범위+', action: () => this.cheatIncreaseArea() },
    ];
    yPos = this.addButtonRow(this.debugPanel, statButtons2, panelWidth, yPos, padding);

    const statButtons3 = [
      { label: '치명타+', action: () => this.cheatIncreaseCrit() },
      { label: '최대체력+', action: () => this.cheatIncreaseMaxHealth() },
    ];
    yPos = this.addButtonRow(this.debugPanel, statButtons3, panelWidth, yPos, padding);

    yPos += 10;

    // 치트 섹션
    yPos = this.addSection(this.debugPanel, '⚡ 치트', yPos, padding);
    const cheatButtons = [
      { label: '레벨업', action: () => this.cheatLevelUp() },
      { label: '경험치+', action: () => this.cheatAddXP() },
    ];
    yPos = this.addButtonRow(this.debugPanel, cheatButtons, panelWidth, yPos, padding);

    const cheatButtons2 = [
      { label: '체력 최대', action: () => this.cheatMaxHealth() },
      { label: this.godMode ? '무적 OFF' : '무적 ON', action: () => this.toggleGodMode() },
    ];
    yPos = this.addButtonRow(this.debugPanel, cheatButtons2, panelWidth, yPos, padding);

    // 닫기 버튼
    yPos += 20;
    this.addButton(this.debugPanel, '닫기', panelWidth - padding * 2, yPos, padding, () =>
      this.toggleDebugPanel()
    );

    // 패널 추가
    this.uiLayer.addChild(this.debugPanel);
  }

  /**
   * 섹션 제목 추가
   */
  private addSection(container: Container, title: string, yPos: number, padding: number): number {
    const text = new Text({
      text: title,
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    text.x = padding;
    text.y = yPos;
    container.addChild(text);
    return yPos + 30;
  }

  /**
   * 버튼 추가
   */
  private addButton(
    container: Container,
    label: string,
    width: number,
    yPos: number,
    xOffset: number,
    onClick: () => void
  ): number {
    const button = new Graphics();
    const height = 35;

    button.rect(0, 0, width, height);
    button.fill({ color: 0x333333 });
    button.stroke({ color: 0x00ff00, width: 2 });

    button.x = xOffset;
    button.y = yPos;

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
      },
    });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    button.addChild(text);

    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      button.clear();
      button.rect(0, 0, width, height);
      button.fill({ color: 0x444444 });
      button.stroke({ color: 0x00ff00, width: 2 });
    });

    button.on('pointerout', () => {
      button.clear();
      button.rect(0, 0, width, height);
      button.fill({ color: 0x333333 });
      button.stroke({ color: 0x00ff00, width: 2 });
    });

    button.on('pointerdown', onClick);

    container.addChild(button);
    return yPos + height + 5;
  }

  /**
   * 버튼 행 추가 (2~3개 버튼)
   */
  private addButtonRow(
    container: Container,
    buttons: Array<{ label: string; action: () => void }>,
    panelWidth: number,
    yPos: number,
    padding: number
  ): number {
    const buttonWidth = (panelWidth - padding * 2 - 10 * (buttons.length - 1)) / buttons.length;
    const height = 35;

    buttons.forEach((btn, index) => {
      const xPos = padding + (buttonWidth + 10) * index;
      const button = new Graphics();

      button.rect(0, 0, buttonWidth, height);
      button.fill({ color: 0x333333 });
      button.stroke({ color: 0x00ff00, width: 2 });

      button.x = xPos;
      button.y = yPos;

      const text = new Text({
        text: btn.label,
        style: {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 0xffffff,
        },
      });
      text.anchor.set(0.5);
      text.x = buttonWidth / 2;
      text.y = height / 2;
      button.addChild(text);

      button.eventMode = 'static';
      button.cursor = 'pointer';

      button.on('pointerover', () => {
        button.clear();
        button.rect(0, 0, buttonWidth, height);
        button.fill({ color: 0x444444 });
        button.stroke({ color: 0x00ff00, width: 2 });
      });

      button.on('pointerout', () => {
        button.clear();
        button.rect(0, 0, buttonWidth, height);
        button.fill({ color: 0x333333 });
        button.stroke({ color: 0x00ff00, width: 2 });
      });

      button.on('pointerdown', btn.action);

      container.addChild(button);
    });

    return yPos + height + 5;
  }

  /**
   * 디버그 패널 토글
   */
  private toggleDebugPanel(): void {
    console.log('[TestGameScene] toggleDebugPanel 호출됨');
    if (!this.debugPanel) {
      console.log('[TestGameScene] debugPanel이 null입니다');
      return;
    }

    this.isDebugPanelOpen = !this.isDebugPanelOpen;
    this.debugPanel.visible = this.isDebugPanelOpen;
    console.log('[TestGameScene] 패널 상태:', this.isDebugPanelOpen ? '열림' : '닫힘');
  }

  /**
   * 치트: 모든 무기 추가
   */
  private async cheatAllWeapons(): Promise<void> {
    console.log('[치트] 모든 무기 추가');
    const weapons = ['talisman', 'dokkaebi_fire', 'moktak', 'jakdu', 'fan_wind'];
    for (const weapon of weapons) {
      await this.cheatAddWeapon(weapon);
    }
  }

  /**
   * 치트: 특정 무기 추가
   */
  private async cheatAddWeapon(weaponId: string): Promise<void> {
    console.log(`[치트] 무기 추가: ${weaponId}`);
    await this.addWeapon(`weapon_${weaponId}`);
  }

  /**
   * 치트: 보스 소환
   */
  private cheatSpawnBoss(): void {
    console.log('[치트] 보스 소환');
    // spawnBoss는 private이므로 접근 불가
    // 대신 bossSpawned를 false로 하고 gameTime을 BOSS_SPAWN_TIME으로 설정
    // @ts-expect-error - private 필드 접근
    this.bossSpawned = false;
    // @ts-expect-error - private 필드 접근
    this.gameTime = TEST_UI_CONSTANTS.CHEAT.BOSS_SPAWN_TIME;
  }

  /**
   * 치트: 모든 적 제거
   */
  private cheatClearEnemies(): void {
    console.log('[치트] 모든 적 제거');
    // @ts-expect-error - private 필드 접근
    for (const enemy of this.enemies) {
      enemy.health = 0;
    }
  }

  /**
   * 치트: 레벨업
   */
  private cheatLevelUp(): void {
    console.log('[치트] 레벨업');
    // @ts-expect-error - private 필드 접근
    this.player?.getLevelSystem().gainExperience(this.player.getLevelSystem().getXPNeeded());
  }

  /**
   * 치트: 경험치 추가
   */
  private cheatAddXP(): void {
    console.log(`[치트] 경험치 +${TEST_UI_CONSTANTS.CHEAT.XP_AMOUNT}`);
    // @ts-expect-error - private 필드 접근
    this.player?.getLevelSystem().gainExperience(TEST_UI_CONSTANTS.CHEAT.XP_AMOUNT);
  }

  /**
   * 치트: 체력 최대
   */
  private cheatMaxHealth(): void {
    console.log('[치트] 체력 최대');
    if (this.player) {
      this.player.health = this.player.maxHealth;
    }
  }

  /**
   * 무적 모드 토글
   */
  private toggleGodMode(): void {
    this.godMode = !this.godMode;
    console.log(`[치트] 무적 모드: ${this.godMode ? 'ON' : 'OFF'}`);

    // 디버그 패널 재생성
    if (this.debugPanel) {
      this.uiLayer.removeChild(this.debugPanel);
      this.debugPanel.destroy();
      this.debugPanel = null;
      this.createDebugPanel();
    }
  }

  /**
   * 치트: 공격력 증가
   */
  private cheatIncreaseDamage(): void {
    if (!this.player) return;
    this.player.damageMultiplier = Math.min(this.player.damageMultiplier + 0.5, 5.0);
    console.log(`[치트] 공격력: ${(this.player.damageMultiplier * 100).toFixed(0)}%`);
  }

  /**
   * 치트: 이동 속도 증가
   */
  private cheatIncreaseSpeed(): void {
    if (!this.player) return;
    this.player.speedMultiplier = Math.min(this.player.speedMultiplier + 0.2, 2.0);
    console.log(`[치트] 속도: ${(this.player.speedMultiplier * 100).toFixed(0)}%`);
  }

  /**
   * 치트: 쿨타임 감소
   */
  private cheatDecreaseCooldown(): void {
    if (!this.player) return;
    this.player.cooldownMultiplier = Math.max(this.player.cooldownMultiplier - 0.1, 0.3);
    console.log(`[치트] 쿨타임: ${(this.player.cooldownMultiplier * 100).toFixed(0)}%`);
  }

  /**
   * 치트: 범위 증가 (현재 미구현)
   */
  private cheatIncreaseArea(): void {
    if (!this.player) return;
    console.log(`[치트] 범위 증가 기능은 현재 미구현입니다.`);
  }

  /**
   * 치트: 치명타 증가
   */
  private cheatIncreaseCrit(): void {
    if (!this.player) return;
    this.player.criticalRate = Math.min(this.player.criticalRate + 0.1, 1.0);
    this.player.criticalDamage = Math.min(this.player.criticalDamage + 0.5, 6.5);
    console.log(
      `[치트] 치명타: ${(this.player.criticalRate * 100).toFixed(0)}% / ${(this.player.criticalDamage * 100).toFixed(0)}%`
    );
  }

  /**
   * 치트: 최대 체력 증가
   */
  private cheatIncreaseMaxHealth(): void {
    if (!this.player) return;
    this.player.maxHealth = Math.min(this.player.maxHealth + 50, 500);
    this.player.health = Math.min(this.player.health + 50, this.player.maxHealth);
    console.log(`[치트] 최대 체력: ${this.player.maxHealth}`);
  }

  /**
   * 업데이트 오버라이드 (무적 모드 적용)
   */
  protected async updateScene(deltaTime: number): Promise<void> {
    // 무적 모드일 때 체력 고정
    if (this.godMode && this.player) {
      const maxHealth = this.player.maxHealth;
      this.player.health = maxHealth;
    }

    // 부모 업데이트 호출
    await super.updateScene(deltaTime);
  }

  /**
   * 정리
   */
  public async destroy(): Promise<void> {
    if (this.debugPanel) {
      this.uiLayer.removeChild(this.debugPanel);
      this.debugPanel.destroy();
      this.debugPanel = null;
    }

    if (this.debugToggleButton) {
      this.uiLayer.removeChild(this.debugToggleButton);
      this.debugToggleButton.destroy();
      this.debugToggleButton = null;
    }

    await super.destroy();
  }
}
