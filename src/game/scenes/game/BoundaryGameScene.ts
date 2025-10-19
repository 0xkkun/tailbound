/**
 * BoundaryGameScene - 경계 맵 씬
 * BaseGameScene을 확장하여 NPC와 DialogSystem만 추가
 */

import { Assets, Graphics, Text, TilingSprite } from 'pixi.js';

import { GAME_CONFIG } from '@/config/game.config';
import { BOUNDARY_MERCHANT_DIALOG } from '@/data/dialogs';
import type { NPCData } from '@/game/entities/NPC';
import { NPC } from '@/game/entities/NPC';
import { Player } from '@/game/entities/Player';
import { DialogUI } from '@/game/ui/DialogUI';
import type { PlayerSnapshot } from '@/hooks/useGameState';
import { DialogSystem } from '@/systems/DialogSystem';

import { BaseGameScene } from './BaseGameScene';

export class BoundaryGameScene extends BaseGameScene {
  // 경계 씬 전용 시스템
  private npc!: NPC;
  private dialogSystem!: DialogSystem;
  private dialogUI!: DialogUI;
  private isDialogActive: boolean = false;

  public onContinueToStage2?: () => void;

  constructor(screenWidth: number, screenHeight: number, playerSnapshot?: PlayerSnapshot | null) {
    super({
      screenWidth,
      screenHeight,
      worldWidth: GAME_CONFIG.world.boundary.width,
      worldHeight: GAME_CONFIG.world.boundary.height,
      playerSnapshot,
    });
  }

  /**
   * 에셋 로딩 오버라이드 (바닥 타일 로딩)
   */
  protected async loadAssets(): Promise<void> {
    await super.loadAssets();
    await Assets.load('/assets/bottom.png'); // 바닥 타일
  }

  /**
   * 플레이어 생성 (월드 중앙 하단)
   * 배경도 여기서 먼저 추가 (z-index 순서 중요)
   */
  protected createPlayer(): void {
    // 월드 배경 (타일링)
    const texture = Assets.get('/assets/bottom.png');
    const bg = new TilingSprite({
      texture,
      width: this.worldWidth,
      height: this.worldHeight,
    });
    bg.tileScale.set(1, 1); // 32x32 원본 크기 사용
    this.gameLayer.addChild(bg);

    // 월드 경계선
    const border = new Graphics();
    border.rect(0, 0, this.worldWidth, this.worldHeight);
    border.stroke({ width: 4, color: 0x6a3d9a });
    this.gameLayer.addChild(border);

    // 플레이어 (배경 위에)
    this.player = new Player(this.worldWidth / 2, this.worldHeight - 200);
    this.gameLayer.addChild(this.player);
    console.log(
      `[BoundaryGameScene] 플레이어 생성됨: (${this.player.x}, ${this.player.y})`,
      this.player
    );
  }

  /**
   * 경계 씬 초기화
   */
  protected async initScene(): Promise<void> {
    // 타이틀
    const titleText = new Text('경계 (境界)', {
      fontFamily: 'Nanum Gothic',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 3,
      },
    });
    titleText.anchor.set(0.5, 0);
    titleText.x = this.screenWidth / 2;
    titleText.y = 40;
    this.uiLayer.addChild(titleText);

    // NPC 생성 (월드 중앙 상단)
    const merchantData: NPCData = {
      id: 'merchant_boundary',
      name: '저승의 상인',
      dialogId: 'boundary_merchant',
      portraitPath: '/assets/monk.png', // 상인 초상화 (현재는 monk 사용)
    };
    this.npc = new NPC(this.worldWidth / 2, 300, merchantData);
    this.npc.onInteract = () => this.startDialog();
    this.gameLayer.addChild(this.npc);

    // 대화 시스템
    this.dialogSystem = new DialogSystem();
    this.dialogUI = new DialogUI(this.screenWidth, this.screenHeight);
    this.dialogUI.onClick = () => this.dialogSystem.nextDialog();
    this.dialogUI.setNPC(merchantData);
    this.uiLayer.addChild(this.dialogUI);
  }

  /**
   * 대화 시작
   */
  private startDialog(): void {
    if (this.isDialogActive) return;

    this.isDialogActive = true;

    // 조이스틱 숨기기
    this.virtualJoystick?.setVisible(false);

    this.dialogSystem.startDialog(
      BOUNDARY_MERCHANT_DIALOG,
      (node) => {
        if (node) {
          this.dialogUI.showDialog(node);
        } else {
          this.dialogUI.hide();
        }
      },
      () => {
        this.isDialogActive = false;

        // 조이스틱 다시 보이기
        this.virtualJoystick?.setVisible(true);

        console.log('[BoundaryGameScene] 대화 종료');
        // TODO: 상점 UI 열기 또는 다음 스테이지 진입
      }
    );
  }

  /**
   * 경계 씬 업데이트
   */
  protected updateScene(deltaTime: number): void {
    // 대화 중이 아닐 때만 플레이어 이동 및 NPC 근접 체크
    if (!this.isDialogActive) {
      this.updatePlayer(deltaTime);
      this.npc.checkPlayerProximity(this.player.x, this.player.y);
    }
  }

  /**
   * 화면 크기 업데이트
   */
  public updateScreenSize(width: number, height: number): void {
    super.updateScreenSize(width, height);

    // DialogUI 크기도 업데이트 (필요시)
    // this.dialogUI.updateScreenSize(width, height);
  }

  /**
   * 씬 정리
   */
  public destroy(): void {
    if (this.isReady) {
      this.npc?.destroy();
      this.dialogUI?.destroy();
    }

    super.destroy();
  }
}
