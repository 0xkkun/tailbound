/**
 * BoundaryGameScene - 경계 맵 씬
 * BaseGameScene을 확장하여 NPC와 DialogSystem만 추가
 */

import { Assets, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';

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
    await Assets.load('/assets/tile/tile_green1.png'); // 바닥 타일
    await Assets.load('/assets/tile/tile_deco.png'); // 풀 장식
  }

  /**
   * 플레이어 생성 (월드 중앙 하단)
   * 배경도 여기서 먼저 추가 (z-index 순서 중요)
   */
  protected createPlayer(): void {
    // 월드 배경 (타일링)
    const texture = Assets.get('/assets/tile/tile_green1.png');
    texture.source.scaleMode = 'nearest'; // 픽셀 아트용: 픽셀 단위 렌더링
    const bg = new TilingSprite({
      texture,
      width: this.worldWidth,
      height: this.worldHeight,
    });
    bg.tileScale.set(2, 2); // 16x16을 2배로 확대
    this.gameLayer.addChild(bg);

    // 풀 장식 무작위 배치
    this.createGrassDecorations();

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
   * 풀 장식 무작위 배치
   */
  private createGrassDecorations(): void {
    const grassTexture = Assets.get('/assets/tile/tile_deco.png');
    grassTexture.source.scaleMode = 'nearest';

    const tileSize = 32; // 타일 크기 (16x16을 2배 확대한 크기)
    const grassScale = 2; // 풀 장식 크기 (16x16을 2배 확대)

    // 그리드 기반으로 일정 간격마다 랜덤 배치 (듬성듬성)
    for (let x = 0; x < this.worldWidth; x += tileSize) {
      for (let y = 0; y < this.worldHeight; y += tileSize) {
        // 5% 확률로 풀 장식 배치
        if (Math.random() < 0.05) {
          const grass = new Sprite(grassTexture);
          grass.anchor.set(0, 1); // 하단 기준
          grass.scale.set(grassScale);
          grass.x = x + Math.random() * tileSize; // 타일 내 랜덤 위치
          grass.y = y + tileSize; // 타일 하단
          this.gameLayer.addChild(grass);
        }
      }
    }

    console.log('풀 장식 배치 완료 (Boundary)');
  }

  /**
   * 경계 씬 초기화
   */
  protected async initScene(): Promise<void> {
    // 타이틀
    const titleText = new Text('경계 (境界)', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 32,
      fill: 0xffffff,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 3,
      },
    });
    titleText.resolution = 2; // 고해상도 렌더링
    titleText.anchor.set(0.5, 0);
    titleText.x = this.screenWidth / 2;
    titleText.y = 40;
    this.uiLayer.addChild(titleText);

    // NPC 생성 (월드 중앙 상단)
    const merchantData: NPCData = {
      id: 'merchant_boundary',
      name: '저승의 상인',
      dialogId: 'boundary_merchant',
      portraitPath: '/assets/npc/monk.png', // 상인 초상화 (현재는 monk 사용)
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
