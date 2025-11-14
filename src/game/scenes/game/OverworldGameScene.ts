/**
 * 게임 씬 - 메인 게임 로직
 */
import { CDN_ASSETS, CDN_BASE_URL } from '@config/assets.config';
import { KNOCKBACK_BALANCE, POTION_BALANCE } from '@config/balance.config';
import { GAME_CONFIG } from '@config/game.config';
import { ExecutionerAxeArtifact } from '@game/artifacts/list/ExecutionerAxeArtifact';
import { FoxTearArtifact } from '@game/artifacts/list/FoxTearArtifact';
import { WEAPON_DATA } from '@game/data/weapons';
import { AoEEffect } from '@game/entities/AoEEffect';
import {
  BaseEnemy,
  DokkaebiEnemy,
  EvilSpiritEnemy,
  FoxEnemy,
  GrimReaperEnemy,
  MaidenGhostEnemy,
  MaskEnemy,
  SkeletonEnemy,
  TotemEnemy,
  WaterGhostEnemy,
  WhiteTigerBoss,
} from '@game/entities/enemies';
import { EnemyProjectile } from '@game/entities/EnemyProjectile';
import { ExperienceGem } from '@game/entities/ExperienceGem';
import { FireAOE } from '@game/entities/FireAOE';
import { FireballProjectile } from '@game/entities/FireballProjectile';
import { HealthPotion } from '@game/entities/HealthPotion';
import { MeleeSwing } from '@game/entities/MeleeSwing';
import { Player } from '@game/entities/Player';
import { Portal } from '@game/entities/Portal';
import { Projectile } from '@game/entities/Projectile';
import { SpiralChargeEffect } from '@game/entities/SpiralChargeEffect';
import { WaterBottle } from '@game/entities/WaterBottle';
import { WaterSplash } from '@game/entities/WaterSplash';
import { StageTransitionScene } from '@game/scenes/StageTransitionScene';
import { LevelUpUI } from '@game/ui/LevelUpUI';
import { PixelButton } from '@game/ui/PixelButton';
import { PortalIndicator } from '@game/ui/PortalIndicator';
import { checkCircleCollision, checkEllipseCircleCollision } from '@game/utils/collision';
import { DokkaebiFireWeapon } from '@game/weapons/DokkaebiFireWeapon';
import { FanWindWeapon } from '@game/weapons/FanWindWeapon';
import { JakduBladeWeapon } from '@game/weapons/JakduBladeWeapon';
import { MoktakSoundWeapon } from '@game/weapons/MoktakSoundWeapon';
import { PurifyingWaterWeapon } from '@game/weapons/PurifyingWaterWeapon';
import { TalismanWeapon } from '@game/weapons/TalismanWeapon';
import type { Weapon } from '@game/weapons/Weapon';
import type { PlayerSnapshot } from '@hooks/useGameState';
import i18n from '@i18n/config';
import { audioManager } from '@services/audioManager';
import { GameAnalytics } from '@services/gameAnalytics';
import { ArtifactSystem } from '@systems/ArtifactSystem';
import { BossSystem } from '@systems/BossSystem';
import { CombatSystem } from '@systems/CombatSystem';
import { PortalSpawner } from '@systems/PortalSpawner';
import { SpawnSystem } from '@systems/SpawnSystem';
import type { GameResult } from '@type/game.types';
import {
  isInTossApp,
  safeAnalyticsClick,
  safeGetSafeAreaInsets,
  safeGetUserKeyForGame,
  safeOpenGameCenterLeaderboard,
  safeSubmitGameCenterLeaderBoardScore,
} from '@utils/tossAppBridge';
import { Assets, Container, Graphics, Sprite, Spritesheet, Text } from 'pixi.js';

import { BaseGameScene } from './BaseGameScene';

export class OverworldGameScene extends BaseGameScene {
  // 엔티티
  public enemies: BaseEnemy[] = []; // IGameScene 인터페이스 구현
  private projectiles: Projectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private experienceGems: ExperienceGem[] = [];
  private healthPotions: HealthPotion[] = [];
  private aoeEffects: AoEEffect[] = [];
  private meleeSwings: MeleeSwing[] = [];
  private waterSplashes: WaterSplash[] = []; // 정화수 스플래시

  // 스프라이트시트
  private spiritEnergySpritesheet1!: Spritesheet;
  private spiritEnergySpritesheet2!: Spritesheet;
  private spiritEnergySpritesheet3!: Spritesheet;

  // 무기
  private weapons: Weapon[] = [];

  // 시스템
  private combatSystem: CombatSystem;
  private spawnSystem: SpawnSystem;
  private portalSpawner: PortalSpawner;
  private bossSystem?: BossSystem;
  public artifactSystem!: ArtifactSystem; // TODO: 테스트중 - 유물 전체 적용 후 제거 필요

  // 포탈
  private portal: Portal | null = null;
  private portalSpawnTriggered: boolean = false;

  // 게임 상태
  private gameTime: number = 0;
  private enemiesKilled: number = 0;
  private isGameOver: boolean = false;
  private bossDefeated: boolean = false; // 보스 처치 여부
  private bossSpawned: boolean = false; // 보스 스폰 여부
  private readonly BOSS_SPAWN_TIME: number = 600; // 10분 (600초)

  // 게임 오버 통계 (Analytics용)
  private lastGameStats: {
    result: 'victory' | 'defeat';
    level: number;
    score: number;
  } | null = null;
  private bgmStarted: boolean = false; // BGM 시작 여부

  // UI 레이아웃 상수
  private readonly UI_PADDING = 16;
  private readonly UI_SETTINGS_SIZE = 32;
  private readonly UI_GAP_SETTINGS_TO_BAR = 18;
  private readonly UI_GAP_BAR_TO_LEVEL = 8;
  private readonly UI_BAR_HEIGHT = 10;
  private readonly UI_KILL_ICON_SIZE = 24;
  private readonly UI_KILL_ICON_GAP = 6;
  private readonly UI_KILL_ICON_OFFSET_Y = -4; // 텍스트와 수직 정렬 조정

  // 테두리 크기 상수
  private readonly BORDER_LEFT_WIDTH = 24 * 2; // 48px
  private readonly BORDER_RIGHT_WIDTH = 24 * 2; // 48px
  private readonly BORDER_BOTTOM_HEIGHT = 48 * 2; // 96px

  // UI 요소
  private scoreText!: Text;
  private killIcon!: Sprite;
  private timeText!: Text;
  private levelText!: Text;
  private xpBarFill!: Graphics;
  private xpBarContainer!: Graphics;
  private xpBarWidth: number = 0; // 경험치바 너비 (동적 계산용)
  private xpBarY: number = 0; // 경험치바 Y 위치
  private levelTextY: number = 0; // 레벨/킬 텍스트 Y 위치
  private levelUpUI!: LevelUpUI;
  private portalIndicator!: PortalIndicator;
  private settingsButton!: Container;
  private leaderboardButton!: Container;
  private settingsMenu: Container | null = null;
  private transitionScene: StageTransitionScene | null = null;
  private devClearButton?: Container; // 개발 모드 클리어 버튼

  // 콜백
  public onGameOver?: (result: GameResult) => void;
  public onReturnToLobby?: () => void;
  public onRestartGame?: () => void;
  public onEnterBoundary?: () => void;

  constructor(screenWidth: number, screenHeight: number, playerSnapshot?: PlayerSnapshot | null) {
    super({
      screenWidth,
      screenHeight,
      worldWidth: GAME_CONFIG.world.overworld.width,
      worldHeight: GAME_CONFIG.world.overworld.height,
      playerSnapshot,
    });

    // 시스템 초기화
    this.combatSystem = new CombatSystem();
    this.spawnSystem = new SpawnSystem(
      GAME_CONFIG.world.overworld.width,
      GAME_CONFIG.world.overworld.height,
      screenWidth,
      screenHeight
    );
    // 테두리 크기 설정 (스폰 제한)
    this.spawnSystem.setBorderSizes(
      this.BORDER_LEFT_WIDTH,
      this.BORDER_RIGHT_WIDTH,
      this.BORDER_BOTTOM_HEIGHT
    );
    this.portalSpawner = new PortalSpawner();
  }

  /**
   * 에셋 로딩 오버라이드 (적 스프라이트 추가 로딩)
   */
  protected async loadAssets(): Promise<void> {
    await super.loadAssets();
    // 모든 적 타입 스프라이트 미리 로드
    await Promise.all([
      SkeletonEnemy.preloadSprites(),
      DokkaebiEnemy.preloadSprites(),
      MaskEnemy.preloadSprites(),
      MaidenGhostEnemy.preloadSprites(),
      EvilSpiritEnemy.preloadSprites(),
      WhiteTigerBoss.preloadSprites(), // 보스
      FireballProjectile.preloadSprites(), // 보스 불꽃 투사체
      SpiralChargeEffect.preloadSprites(), // 보스 나선형 차징 이펙트
      FireAOE.preloadSprites(), // 보스 불 장판
      FoxEnemy.preloadSprites(),
      GrimReaperEnemy.preloadSprites(),
      TotemEnemy.preloadSprites(),
      WaterGhostEnemy.preloadSprites(),
      Assets.load(`${CDN_BASE_URL}/assets/tile/tile1.png`), // 바닥 타일 1 (32x48)
      Assets.load(`${CDN_BASE_URL}/assets/tile/tile2.png`), // 바닥 타일 2 (32x48)
      Assets.load(`${CDN_BASE_URL}/assets/tile/tile3.png`), // 바닥 타일 3 (32x32)
      Assets.load(`${CDN_BASE_URL}/assets/tile/outline-left.png`), // 테두리 왼쪽 (24x48)
      Assets.load(`${CDN_BASE_URL}/assets/tile/outline-right.png`), // 테두리 오른쪽 (24x48)
      Assets.load(`${CDN_BASE_URL}/assets/tile/outline-bottom.png`), // 테두리 하단 (64x48)
    ]);

    // Spirit Energy 스프라이트시트 로드 (1, 2, 3)
    [this.spiritEnergySpritesheet1, this.spiritEnergySpritesheet2, this.spiritEnergySpritesheet3] =
      await Promise.all([
        this.loadSpiritEnergySpritesheet(`${CDN_BASE_URL}/assets/drop/spirit-enery-1.png`),
        this.loadSpiritEnergySpritesheet(`${CDN_BASE_URL}/assets/drop/spirit-enery-2.png`),
        this.loadSpiritEnergySpritesheet(`${CDN_BASE_URL}/assets/drop/spirit-enery-3.png`),
      ]);
  }

  /**
   * Spirit Energy 스프라이트시트 로드
   */
  private async loadSpiritEnergySpritesheet(path: string): Promise<Spritesheet> {
    const texture = await Assets.load(path);

    // 픽셀 아트 렌더링 설정
    if (texture.baseTexture) {
      texture.baseTexture.scaleMode = 'nearest';
    }

    // 스프라이트시트 설정 (11개 프레임, 여백 없음)
    const frameWidth = texture.width / 11;
    const frameHeight = texture.height;

    const frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> = {};
    for (let i = 0; i < 11; i++) {
      frames[`spirit-energy-${i}`] = {
        frame: {
          x: i * frameWidth,
          y: 0,
          w: frameWidth,
          h: frameHeight,
        },
      };
    }

    const spritesheet = new Spritesheet(texture, {
      frames,
      meta: {
        scale: '1',
      },
      animations: {
        'spirit-energy': Object.keys(frames),
      },
    });

    await spritesheet.parse();
    return spritesheet;
  }

  /**
   * 플레이어 생성 (BaseGameScene abstract 메서드 구현)
   */
  protected createPlayer(): void {
    // 월드 배경 (무작위 타일 배치)
    this.createRandomTileBackground();

    // 풀 장식 무작위 배치
    // this.createGrassDecorations();

    // 월드 경계선 (시각화용)
    const border = new Graphics();
    border.rect(0, 0, GAME_CONFIG.world.overworld.width, GAME_CONFIG.world.overworld.height);
    border.stroke({ width: 4, color: 0x444444 });
    this.gameLayer.addChild(border);

    // 플레이어 생성 (월드 중앙에)
    this.player = new Player(
      GAME_CONFIG.world.overworld.width / 2,
      GAME_CONFIG.world.overworld.height / 2
    );
    this.gameLayer.addChild(this.player);
  }

  /**
   * 무작위 타일 배경 생성
   * tile1, tile2 (32x48), tile3 (32x32)를 자연스럽게 배치
   */
  private createRandomTileBackground(): void {
    const tile1Texture = Assets.get(`${CDN_BASE_URL}/assets/tile/tile1.png`);
    const tile2Texture = Assets.get(`${CDN_BASE_URL}/assets/tile/tile2.png`);
    const tile3Texture = Assets.get(`${CDN_BASE_URL}/assets/tile/tile3.png`);

    // 픽셀 아트 렌더링 설정
    tile1Texture.source.scaleMode = 'nearest';
    tile2Texture.source.scaleMode = 'nearest';
    tile3Texture.source.scaleMode = 'nearest';

    const worldWidth = GAME_CONFIG.world.overworld.width;
    const worldHeight = GAME_CONFIG.world.overworld.height;
    const tileWidth = 64; // 스케일 적용 후 크기
    const tileHeight = 64; // 스케일 적용 후 크기

    // 타일 타입별 가중치 (자연스러운 분포를 위해)
    const tileWeights = [
      { texture: tile1Texture, weight: 5, height: 48 }, // 60%
      { texture: tile2Texture, weight: 2, height: 48 }, // 30%
      { texture: tile3Texture, weight: 3, height: 32 }, // 10%
    ];

    // 클러스터링을 위한 노이즈 시뮬레이션 (간단한 방법)
    const getClusterValue = (x: number, y: number): number => {
      // 간단한 체커보드 패턴 + 랜덤으로 자연스러운 변화
      const gridX = Math.floor(x / (tileWidth * 4));
      const gridY = Math.floor(y / (tileHeight * 4));
      const seed = (gridX * 73856093) ^ (gridY * 19349663);
      return ((seed % 100) / 100 + Math.random() * 0.3) % 1;
    };

    // 타일 배치
    for (let y = 0; y < worldHeight; y += tileHeight) {
      for (let x = 0; x < worldWidth; x += tileWidth) {
        // 클러스터 값으로 타일 선택 편향
        const clusterValue = getClusterValue(x, y);
        const randomValue = Math.random() * 0.7 + clusterValue * 0.3;

        // 가중치 기반 타일 선택
        let selectedTile = tileWeights[0];
        let cumulative = 0;
        const totalWeight = tileWeights.reduce((sum, t) => sum + t.weight, 0);

        for (const tileType of tileWeights) {
          cumulative += tileType.weight / totalWeight;
          if (randomValue < cumulative) {
            selectedTile = tileType;
            break;
          }
        }

        // 타일 스프라이트 생성
        const tile = new Sprite(selectedTile.texture);
        tile.scale.set(2); // 2배 확대
        tile.x = x;
        tile.y = y + (tileHeight - selectedTile.height * 2); // 하단 정렬 (스케일 적용)
        tile.anchor.set(0, 0);
        this.gameLayer.addChild(tile);
      }
    }

    // 테두리 추가
    this.createTileBorders();

    console.log('무작위 타일 배경 생성 완료');
  }

  /**
   * 타일 테두리 생성
   * 월드의 좌/우/하단에 테두리 배치
   */
  private createTileBorders(): void {
    const leftTexture = Assets.get(`${CDN_BASE_URL}/assets/tile/outline-left.png`);
    const rightTexture = Assets.get(`${CDN_BASE_URL}/assets/tile/outline-right.png`);
    const bottomTexture = Assets.get(`${CDN_BASE_URL}/assets/tile/outline-bottom.png`);

    // 픽셀 아트 렌더링 설정
    leftTexture.source.scaleMode = 'nearest';
    rightTexture.source.scaleMode = 'nearest';
    bottomTexture.source.scaleMode = 'nearest';

    const worldWidth = GAME_CONFIG.world.overworld.width;
    const worldHeight = GAME_CONFIG.world.overworld.height;

    const leftBorderHeight = 48 * 2; // 96px
    const rightBorderHeight = 48 * 2; // 96px
    const bottomTileWidth = 64 * 2; // 128px

    // 좌측 테두리 (24x48 에셋을 2배 확대 = 48x96)
    // 하단 테두리 높이만큼 위까지만 배치
    for (let y = 0; y < worldHeight - this.BORDER_BOTTOM_HEIGHT; y += leftBorderHeight) {
      const border = new Sprite(leftTexture);
      border.scale.set(2);
      border.x = 0;
      border.y = y;
      border.anchor.set(0, 0);
      this.gameLayer.addChild(border);
    }

    // 우측 테두리 (24x48 에셋을 2배 확대 = 48x96)
    // 하단 테두리 높이만큼 위까지만 배치
    for (let y = 0; y < worldHeight - this.BORDER_BOTTOM_HEIGHT; y += rightBorderHeight) {
      const border = new Sprite(rightTexture);
      border.scale.set(2);
      border.x = worldWidth - this.BORDER_RIGHT_WIDTH;
      border.y = y;
      border.anchor.set(0, 0);
      this.gameLayer.addChild(border);
    }

    // 하단 좌측 코너 (왼쪽 테두리 사용)
    const bottomLeftCorner = new Sprite(leftTexture);
    bottomLeftCorner.scale.set(2);
    bottomLeftCorner.x = 0;
    bottomLeftCorner.y = worldHeight - this.BORDER_BOTTOM_HEIGHT;
    bottomLeftCorner.anchor.set(0, 0);
    this.gameLayer.addChild(bottomLeftCorner);

    // 하단 중앙 테두리 (64x48 에셋을 2배 확대 = 128x96)
    // 좌우 테두리 너비를 제외한 영역에만 배치
    for (
      let x = this.BORDER_LEFT_WIDTH;
      x < worldWidth - this.BORDER_RIGHT_WIDTH;
      x += bottomTileWidth
    ) {
      const border = new Sprite(bottomTexture);
      border.scale.set(2);
      border.x = x;
      border.y = worldHeight - this.BORDER_BOTTOM_HEIGHT;
      border.anchor.set(0, 0);
      this.gameLayer.addChild(border);
    }

    // 하단 우측 코너 (오른쪽 테두리 사용)
    const bottomRightCorner = new Sprite(rightTexture);
    bottomRightCorner.scale.set(2);
    bottomRightCorner.x = worldWidth - this.BORDER_RIGHT_WIDTH;
    bottomRightCorner.y = worldHeight - this.BORDER_BOTTOM_HEIGHT;
    bottomRightCorner.anchor.set(0, 0);
    this.gameLayer.addChild(bottomRightCorner);

    console.log('타일 테두리 생성 완료');
  }

  /**
   * 풀 장식 무작위 배치
   */
  // private createGrassDecorations(): void {
  //   const grassTexture = Assets.get(`${CDN_BASE_URL}/assets/tile/tile_deco.png`);
  //   grassTexture.source.scaleMode = 'nearest';

  //   const worldWidth = GAME_CONFIG.world.overworld.width;
  //   const worldHeight = GAME_CONFIG.world.overworld.height;
  //   const tileSize = 32; // 타일 크기 (16x16을 2배 확대한 크기)
  //   const grassScale = 2; // 풀 장식 크기 (16x16을 2배 확대)

  //   // 그리드 기반으로 일정 간격마다 랜덤 배치 (듬성듬성)
  //   for (let x = 0; x < worldWidth; x += tileSize) {
  //     for (let y = 0; y < worldHeight; y += tileSize) {
  //       // 5% 확률로 풀 장식 배치
  //       if (Math.random() < 0.05) {
  //         const grass = new Sprite(grassTexture);
  //         grass.anchor.set(0, 1); // 하단 중앙 기준
  //         grass.scale.set(grassScale);
  //         grass.x = x + Math.random() * tileSize; // 타일 내 랜덤 위치
  //         grass.y = y + tileSize; // 타일 하단
  //         this.gameLayer.addChild(grass);
  //       }
  //     }
  //   }

  //   console.log('풀 장식 배치 완료');
  // }

  /**
   * 씬 초기화 (BaseGameScene abstract 메서드 구현)
   */
  protected async initScene(): Promise<void> {
    // TODO: 테스트중 - 유물 시스템 초기화 (게임 시작 시 유물 자동 획득)
    this.artifactSystem = new ArtifactSystem(this.player, this);
    const foxTear = new FoxTearArtifact();
    const executionerAxe = new ExecutionerAxeArtifact();
    this.artifactSystem.add(foxTear);
    this.artifactSystem.add(executionerAxe);
    console.log('[OverworldGameScene] 🦊 FoxTear & ⚔️ ExecutionerAxe 테스트 모드 활성화');

    // 플레이어 레벨업 콜백 설정
    this.player.onLevelUp = (level, choices) => {
      console.log(`플레이어가 레벨 ${level}에 도달했습니다!`);

      // 현재 무기 레벨 정보를 선택지에 추가
      const choicesWithLevel = choices.map((choice) => {
        if (choice.type === 'weapon') {
          // 현재 보유한 무기 찾기
          const existingWeapon = this.weapons.find((w) => w.id === choice.id);
          return {
            ...choice,
            currentLevel: existingWeapon ? existingWeapon.level : 0,
          };
        }
        // 파워업과 스탯은 현재 레벨 추적 미구현 (TODO)
        return { ...choice, currentLevel: 0 };
      });

      // 획득한 파워업 목록 가져오기
      const acquiredPowerups = this.player.getAcquiredPowerups();
      const powerupTotalValues = this.player.getPowerupTotalValues();
      const powerupDisplayIds = this.player.getPowerupDisplayIds();

      // 조이스틱 상태 리셋 (레벨업 UI 표시 전)
      if (this.virtualJoystick) {
        this.virtualJoystick.reset();
      }
      // await는 콜백 함수를 async로 만들어야 하지만, 레벨업 UI는 비동기로 로드해도 무방
      void this.levelUpUI.show(
        choicesWithLevel,
        level,
        acquiredPowerups,
        powerupTotalValues,
        powerupDisplayIds
      );
    };

    // 초기 무기: 부적
    const talisman = new TalismanWeapon();
    this.weapons.push(talisman);
    // 초기 무기도 추적
    this.player.trackWeaponAcquisition('weapon_talisman', talisman.level);

    // TODO: 테스트중 - 적 타격 시 유물 이벤트 트리거
    this.combatSystem.onEnemyHit = (enemy, damage, weaponCategories) => {
      this.artifactSystem.triggerHit(enemy, damage, weaponCategories);
    };

    // 적 처치 시 경험치 젬 및 포션 드롭 콜백 설정
    this.combatSystem.onEnemyKilled = (result) => {
      // 경험치 양에 따라 적절한 스프라이트시트 선택
      let spritesheet: Spritesheet;
      if (result.xpValue >= 100) {
        // 보스 경험치 -> spirit-energy-3
        spritesheet = this.spiritEnergySpritesheet3;
      } else if (result.xpValue >= 25) {
        // 엘리트 경험치 -> spirit-energy-2
        spritesheet = this.spiritEnergySpritesheet2;
      } else {
        // 일반 경험치 -> spirit-energy-1
        spritesheet = this.spiritEnergySpritesheet1;
      }

      // 경험치 젬 드롭
      const gem = new ExperienceGem(
        result.position.x,
        result.position.y,
        result.xpValue,
        spritesheet
      );
      this.experienceGems.push(gem);
      this.gameLayer.addChild(gem);

      // 체력 포션 드롭 (10% 확률)
      if (result.dropPotion) {
        const potion = new HealthPotion(result.position.x, result.position.y);
        this.healthPotions.push(potion);
        this.gameLayer.addChild(potion);
      }
    };

    // UI 초기화
    this.initUI();

    // 스테이지 전환 애니메이션 표시
    this.showTransitionAnimation();

    // 개발 환경: 5초 후 자동으로 보스 처치 이벤트 발생
    // if (import.meta.env.DEV) {
    //   setTimeout(() => {
    //     console.log('[DEV] 자동 보스 처치 (5초 후)');
    //     this.handleBossDefeat();
    //   }, 5000);
    // }

    console.log('게임 시작!');
  }

  /**
   * 스테이지 전환 애니메이션 표시
   */
  private showTransitionAnimation(): void {
    // 전환 씬 생성 (모달처럼 최상위에 표시)
    this.transitionScene = new StageTransitionScene(this.screenWidth, this.screenHeight);
    this.transitionScene.zIndex = GAME_CONFIG.layers.ui + 100; // UI보다 위에 표시

    // 전환 완료 콜백 (fade-out 완료 후 호출됨)
    this.transitionScene.onTransitionComplete = async () => {
      // 전환 씬 제거 (이미 완전히 투명해진 상태)
      if (this.transitionScene) {
        this.removeChild(this.transitionScene);
        await this.transitionScene.destroy();
        this.transitionScene = null;
      }
    };

    // 씬에 추가 (최상위 레이어)
    this.addChild(this.transitionScene);
  }

  /**
   * UI 초기화
   */
  private initUI(): void {
    // zIndex 정렬 활성화
    this.uiLayer.sortableChildren = true;

    // Safe Area Insets 적용 - uiLayer 전체를 내림
    const insets = safeGetSafeAreaInsets();
    this.uiLayer.y = insets.top;

    // 경험치 바 위치 계산 및 저장
    this.xpBarY = this.UI_PADDING + this.UI_SETTINGS_SIZE + this.UI_GAP_SETTINGS_TO_BAR;
    this.xpBarWidth = this.screenWidth - this.UI_PADDING * 2;
    this.levelTextY = this.xpBarY + this.UI_BAR_HEIGHT + this.UI_GAP_BAR_TO_LEVEL;

    // 시간 텍스트 (중앙 상단)
    this.timeText = new Text('0:00', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.timeText.resolution = 2;
    this.timeText.anchor.set(0.5, 0);
    this.timeText.x = this.screenWidth / 2;
    this.timeText.y = this.UI_PADDING;
    this.uiLayer.addChild(this.timeText);

    // 경험치 바 생성
    this.createXPBar();

    // 레벨 텍스트 (경험치바 아래 왼쪽)
    this.levelText = new Text('Lv.1', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xffffff,
    });
    this.levelText.resolution = 2;
    this.levelText.x = this.UI_PADDING;
    this.levelText.y = this.levelTextY;
    this.uiLayer.addChild(this.levelText);

    // 처치 아이콘 및 텍스트 (우측에 배치)
    this.loadAndCreateKillUI();

    // 레벨업 UI (모달이므로 uiLayer가 아닌 Scene 루트에 추가하여 safe area 무시)
    this.levelUpUI = new LevelUpUI();
    this.addChild(this.levelUpUI);

    // 레벨업 UI 선택 콜백
    this.levelUpUI.onChoiceSelected = (choiceId: string) => {
      this.handleLevelUpChoice(choiceId);
    };

    // 포탈 인디케이터
    this.portalIndicator = new PortalIndicator();
    this.uiLayer.addChild(this.portalIndicator);

    // 설정 버튼 (우측 상단)
    this.settingsButton = this.createSettingsButton();
    this.uiLayer.addChild(this.settingsButton);

    // 리더보드 버튼 (설정 버튼 오른쪽)
    this.leaderboardButton = this.createLeaderboardButton();
    this.uiLayer.addChild(this.leaderboardButton);

    // 개발 모드: 클리어 테스트 버튼 (하단 중앙)
    if (import.meta.env.DEV) {
      this.devClearButton = this.createDevClearButton();
      this.uiLayer.addChild(this.devClearButton);
    }
  }

  /**
   * 경험치 바 생성 (리사이즈 대응)
   */
  private createXPBar(): void {
    // 기존 경험치바 제거
    if (this.xpBarContainer) {
      this.uiLayer.removeChild(this.xpBarContainer);
      this.xpBarContainer.destroy();
    }
    if (this.xpBarFill) {
      this.uiLayer.removeChild(this.xpBarFill);
      this.xpBarFill.destroy();
    }

    // 경험치 바 컨테이너 (테두리 + 배경)
    this.xpBarContainer = new Graphics();

    // 1. 테두리 (1px, #472612)
    this.xpBarContainer.rect(
      this.UI_PADDING - 1,
      this.xpBarY - 1,
      this.xpBarWidth + 2,
      this.UI_BAR_HEIGHT + 2
    );
    this.xpBarContainer.fill(0x472612);

    // 2. 배경 (#1E1611)
    this.xpBarContainer.rect(this.UI_PADDING, this.xpBarY, this.xpBarWidth, this.UI_BAR_HEIGHT);
    this.xpBarContainer.fill(0x1e1611);

    this.uiLayer.addChild(this.xpBarContainer);

    // 3. 경험치 바 채우기
    this.xpBarFill = new Graphics();
    this.xpBarFill.x = this.UI_PADDING;
    this.xpBarFill.y = this.xpBarY;
    this.uiLayer.addChild(this.xpBarFill);
  }

  /**
   * 처치 아이콘 및 텍스트 로드 및 생성
   */
  private async loadAndCreateKillUI(): Promise<void> {
    try {
      // 해골 아이콘 로드
      const texture = await Assets.load(`${CDN_BASE_URL}/assets/power-up/kill.png`);

      // 픽셀 아트 렌더링 설정
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      // 점수 텍스트 (우측 정렬)
      this.scoreText = new Text('0', {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xffffff,
      });
      this.scoreText.resolution = 2;
      this.scoreText.anchor.set(1, 0); // 오른쪽 정렬
      this.scoreText.x = this.screenWidth - this.UI_PADDING;
      this.scoreText.y = this.levelTextY;
      this.uiLayer.addChild(this.scoreText);

      // 해골 아이콘 생성 (텍스트 왼쪽에 배치, 24px 크기)
      this.killIcon = new Sprite(texture);
      this.killIcon.anchor.set(1, 0); // 오른쪽 정렬
      this.killIcon.width = this.UI_KILL_ICON_SIZE;
      this.killIcon.height = this.UI_KILL_ICON_SIZE;
      this.killIcon.x = this.scoreText.x - this.scoreText.width - this.UI_KILL_ICON_GAP;
      this.killIcon.y = this.levelTextY + this.UI_KILL_ICON_OFFSET_Y;
      this.uiLayer.addChild(this.killIcon);
    } catch (error) {
      console.error('해골 아이콘 로드 실패:', error);

      // 폴백: 텍스트만 표시
      this.scoreText = new Text('처치: 0', {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xffffff,
      });
      this.scoreText.resolution = 2;
      this.scoreText.anchor.set(1, 0);
      this.scoreText.x = this.screenWidth - this.UI_PADDING;
      this.scoreText.y = this.levelTextY;
      this.uiLayer.addChild(this.scoreText);
    }
  }

  /**
   * 플레이어 업데이트 오버라이드 (테두리 충돌 처리)
   */
  protected override updatePlayer(deltaTime: number): void {
    // 기본 플레이어 업데이트 (부모 메서드 호출)
    super.updatePlayer(deltaTime);

    // 테두리 충돌 제한 (좌/우/하단)
    this.player.x = Math.max(
      this.BORDER_LEFT_WIDTH + this.player.radius,
      Math.min(this.worldWidth - this.BORDER_RIGHT_WIDTH - this.player.radius, this.player.x)
    );
    this.player.y = Math.max(
      this.player.radius,
      Math.min(this.worldHeight - this.BORDER_BOTTOM_HEIGHT - this.player.radius, this.player.y)
    );
  }

  /**
   * 씬 업데이트 (BaseGameScene abstract 메서드 구현)
   */
  protected async updateScene(deltaTime: number): Promise<void> {
    if (this.isGameOver) {
      return;
    }

    // 레벨업 UI가 표시 중이면 게임 일시정지
    if (this.levelUpUI.visible) {
      return;
    }

    // 설정 메뉴가 열려있으면 게임 일시정지
    if (this.settingsMenu) {
      return;
    }

    // BGM 시작 (첫 프레임에서 시작 - 씬이 완전히 로드된 후)
    if (!this.bgmStarted) {
      this.bgmStarted = true;
      audioManager.playBGMByTrack('game-01', true); // Loop infinitely
      console.log('[Audio] In-game BGM started');
    }

    // 게임 시간 증가
    this.gameTime += deltaTime;

    // TODO: 테스트중 - 유물 업데이트
    this.artifactSystem.update(deltaTime);

    // 1. 플레이어 업데이트 (오버라이드된 메서드 사용)
    this.updatePlayer(deltaTime);

    // 4. 무기 업데이트 및 발사
    for (const weapon of this.weapons) {
      // 쿨다운 배율 적용 (쿨타임이 낮을수록 빠르게 발사)
      const effectiveDeltaTime = deltaTime / this.player.cooldownMultiplier;
      weapon.update(effectiveDeltaTime);

      // 궤도형 무기 (DokkaebiFireWeapon) 업데이트
      if (weapon instanceof DokkaebiFireWeapon) {
        weapon.updateOrbitals(deltaTime, this.player);
      }

      // 고정형 무기 (JakduBladeWeapon) 업데이트
      if (weapon instanceof JakduBladeWeapon) {
        weapon.updateBlades(deltaTime, this.player);
      }

      // 투척형 무기 (PurifyingWaterWeapon) 물병 업데이트
      if (weapon instanceof PurifyingWaterWeapon) {
        weapon.updateBottles(deltaTime);

        // 착탄한 물병에서 스플래시 생성
        const reachedBottles = weapon.getReachedBottles();
        for (const bottleInfo of reachedBottles) {
          // 정화수 효과음 재생
          audioManager.playPurifyingWaterSound();

          const splash = new WaterSplash(
            bottleInfo.x,
            bottleInfo.y,
            bottleInfo.aoeRadius,
            0x00bfff,
            this.artifactSystem // ArtifactSystem 주입
          );
          splash.damage = bottleInfo.damage;
          splash.isCritical = bottleInfo.isCritical;

          // 무기 카테고리 설정 (유물 시스템용)
          splash.weaponCategories = WEAPON_DATA.purifying_water.categories;

          // 스플래시 스프라이트 로드 (purifying-water-spike.png: 64x48, 16프레임, 1024x48 horizontal strip)
          splash.loadSpriteSheet(
            `${CDN_BASE_URL}/assets/weapon/purifying-water-spike.png`,
            64,
            48,
            16,
            16
          );

          this.waterSplashes.push(splash);
          this.gameLayer.addChild(splash);
        }
      }

      // 발사 (투사체형, AoE형, 근접형)
      const playerPos = { x: this.player.x, y: this.player.y };
      // 보스가 있으면 타겟 배열에 포함 (무기가 보스를 공격할 수 있도록)
      const boss = this.bossSystem?.getBoss();
      const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;
      const fireResult = await Promise.resolve(weapon.fire(playerPos, targetEnemies, this.player));

      // 결과 타입에 따라 분기 처리
      for (const entity of fireResult) {
        if (entity instanceof AoEEffect) {
          // AoE 이펙트
          entity.damage *= this.player.damageMultiplier;

          // 목탁 소리는 플레이어를 따라다니고 캐릭터 뒤에 표시
          if (weapon instanceof MoktakSoundWeapon) {
            entity.setFollowTarget(this.player);
            entity.zIndex = GAME_CONFIG.entities.aoeEffect; // 캐릭터 뒤
          }

          this.aoeEffects.push(entity);
          this.gameLayer.addChild(entity);
        } else if (entity instanceof MeleeSwing) {
          // 근접 휘두르기
          entity.damage *= this.player.damageMultiplier;
          this.meleeSwings.push(entity);
          this.gameLayer.addChild(entity);
        } else if (entity instanceof WaterBottle) {
          // 정화수 물병 투사체 (별도 업데이트 처리됨)
          this.gameLayer.addChild(entity);
        } else if (entity instanceof WaterSplash) {
          // 정화수 스플래시 (발생하지 않음 - 물병 착탄 시 생성됨)
          entity.damage *= this.player.damageMultiplier;
          this.gameLayer.addChild(entity);
        } else {
          // 일반 투사체 (Projectile)
          entity.damage *= this.player.damageMultiplier;
          this.projectiles.push(entity);
          this.gameLayer.addChild(entity);
        }
      }
    }

    // 5. 투사체 업데이트
    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);
    }

    // 5-1. 적 투사체 업데이트 및 플레이어 충돌
    for (const enemyProj of this.enemyProjectiles) {
      enemyProj.update(deltaTime);

      // 플레이어와 충돌 체크
      if (enemyProj.active && enemyProj.checkPlayerCollision(this.player)) {
        this.player.takeDamage(enemyProj.damage, 'enemy_contact');
        enemyProj.active = false;

        if (!this.player.isAlive()) {
          console.log('플레이어 사망! (적 투사체)');
        }
      }
    }

    // 6. AoE 이펙트 업데이트 및 충돌
    for (const aoe of this.aoeEffects) {
      aoe.update(deltaTime);

      // AoE 이펙트가 시작된 동안 범위 내 적에게 데미지
      if (aoe.isEffectStarted()) {
        // 보스가 있으면 타겟 배열에 포함
        const boss = this.bossSystem?.getBoss();
        const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;

        for (const enemy of targetEnemies) {
          // 죽은 적이거나 이번 틱에 데미지를 받을 수 없는 적은 스킵
          if (!enemy.active || !enemy.isAlive() || !aoe.canHitEnemyThisTick(enemy.id)) {
            continue;
          }

          const dx = enemy.x - aoe.x;
          const dy = enemy.y - aoe.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= aoe.radius) {
            enemy.takeDamage(aoe.damage, aoe.isCritical);
            aoe.recordEnemyHit(enemy.id); // 틱 데미지용 기록

            // 유물 이벤트 트리거 (AoE)
            this.artifactSystem.triggerHit(enemy, aoe.damage, aoe.weaponCategories);

            // 넉백 적용 (AoE 중심에서 바깥쪽으로)
            enemy.applyKnockback({ x: dx, y: dy }, KNOCKBACK_BALANCE.aoe);

            if (!enemy.isAlive()) {
              enemy.active = false;
              this.enemiesKilled++;
              console.log(
                `[AoE] 적 처치! (남은 적: ${this.enemies.filter((e) => e.isAlive()).length})`
              );

              // 체력 포션 드랍 확률
              const dropPotion = Math.random() < POTION_BALANCE.dropRate;

              this.combatSystem.onEnemyKilled?.({
                enemy,
                position: { x: enemy.x, y: enemy.y },
                xpValue: enemy.xpDrop,
                dropPotion,
              });
            }
          }
        }
      }
    }

    // 6-1. 정화수 스플래시 업데이트 및 충돌 (설치형 DoT)
    this.waterSplashes = this.waterSplashes.filter((splash) => {
      if (!splash.active) {
        if (splash.parent) {
          splash.parent.removeChild(splash);
        }
        splash.destroy();
        return false;
      }

      // 보스가 있으면 타겟 배열에 포함
      const boss = this.bossSystem?.getBoss();
      const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;

      // 스플래시 업데이트 및 처치된 적 확인
      const killedEnemies = splash.update(deltaTime, targetEnemies);

      // 처치된 적에 대해 경험치 젬 및 포션 드랍
      for (const enemy of killedEnemies) {
        this.enemiesKilled++;
        console.log(
          `적 처치! (정화수) (남은 적: ${this.enemies.filter((e) => e.isAlive()).length})`
        );

        // 경험치 양에 따라 적절한 스프라이트시트 선택
        let spritesheet: Spritesheet;
        if (enemy.xpDrop >= 100) {
          spritesheet = this.spiritEnergySpritesheet3;
        } else if (enemy.xpDrop >= 25) {
          spritesheet = this.spiritEnergySpritesheet2;
        } else {
          spritesheet = this.spiritEnergySpritesheet1;
        }

        // 경험치 젬 생성
        const gem = new ExperienceGem(enemy.x, enemy.y, enemy.xpDrop, spritesheet);
        this.experienceGems.push(gem);
        this.gameLayer.addChild(gem);

        // 체력 포션 드랍 (확률)
        if (Math.random() < POTION_BALANCE.dropRate) {
          const potion = new HealthPotion(enemy.x, enemy.y);
          this.healthPotions.push(potion);
          this.gameLayer.addChild(potion);
        }
      }

      return true;
    });

    // 7. 근접 휘두르기 업데이트 및 충돌
    for (const swing of this.meleeSwings) {
      swing.update(deltaTime);

      // 보스가 있으면 타겟 배열에 포함
      const boss = this.bossSystem?.getBoss();
      const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;

      // 각도 범위 내 적에게 데미지
      for (const enemy of targetEnemies) {
        if (!enemy.active || !enemy.isAlive()) continue;

        // 이미 이 휘두르기에 맞은 적은 스킵
        const enemyId = `${enemy.x}_${enemy.y}`; // 간단한 ID
        if (swing.hasHitEnemy(enemyId)) continue;

        const dx = enemy.x - swing.x;
        const dy = enemy.y - swing.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (swing.isInRange(angle, distance)) {
          enemy.takeDamage(swing.damage, swing.isCritical);
          swing.markEnemyHit(enemyId);

          // 유물 이벤트 트리거 (Melee)
          this.artifactSystem.triggerHit(enemy, swing.damage, swing.weaponCategories);

          // 넉백 적용 (휘두르기 중심에서 바깥쪽으로)
          enemy.applyKnockback({ x: dx, y: dy }, KNOCKBACK_BALANCE.melee);

          if (!enemy.isAlive()) {
            enemy.active = false;
            this.enemiesKilled++;
            console.log(
              `[Melee] 적 처치! (남은 적: ${this.enemies.filter((e) => e.isAlive()).length})`
            );

            // 체력 포션 드랍 확률
            const dropPotion = Math.random() < POTION_BALANCE.dropRate;

            this.combatSystem.onEnemyKilled?.({
              enemy,
              position: { x: enemy.x, y: enemy.y },
              xpValue: enemy.xpDrop,
              dropPotion,
            });
          }
        }
      }
    }

    // 8. 궤도형 무기 충돌 (DokkaebiFireWeapon)
    for (const weapon of this.weapons) {
      if (weapon instanceof DokkaebiFireWeapon) {
        const orbitals = weapon.getOrbitals();
        for (const orbital of orbitals) {
          if (!orbital.active || !orbital.visible) continue; // 깜박임 중 숨겨졌을 때는 데미지 없음

          // 보스가 있으면 타겟 배열에 포함
          const boss = this.bossSystem?.getBoss();
          const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;

          for (const enemy of targetEnemies) {
            if (!enemy.active || !enemy.isAlive()) continue;

            // 궤도와 적 충돌 체크 (원형 충돌)
            if (checkCircleCollision(orbital, enemy)) {
              // 틱 데미지: 일정 시간마다만 데미지 적용
              if (orbital.canHitEnemy(enemy.id)) {
                // 플레이어 데미지 배율 적용 (치명타 포함)
                const critResult = this.player.rollCritical();
                const finalDamage = orbital.damage * critResult.damageMultiplier;
                enemy.takeDamage(finalDamage, critResult.isCritical);
                orbital.recordEnemyHit(enemy.id);

                // 유물 이벤트 트리거 (Orbital)
                this.artifactSystem.triggerHit(enemy, finalDamage, orbital.weaponCategories);

                // 넉백 적용 (궤도 위치에서 바깥쪽으로)
                const knockbackDir = { x: enemy.x - orbital.x, y: enemy.y - orbital.y };
                enemy.applyKnockback(knockbackDir, KNOCKBACK_BALANCE.orbital);

                if (!enemy.isAlive()) {
                  enemy.active = false;
                  this.enemiesKilled++;
                  console.log(
                    `[Orbital] 적 처치! (남은 적: ${this.enemies.filter((e) => e.isAlive()).length})`
                  );

                  // 체력 포션 드랍 확률
                  const dropPotion = Math.random() < POTION_BALANCE.dropRate;

                  this.combatSystem.onEnemyKilled?.({
                    enemy,
                    position: { x: enemy.x, y: enemy.y },
                    xpValue: enemy.xpDrop,
                    dropPotion,
                  });
                }
              }
            }
          }
        }
      }
    }

    // 9. 고정형 무기 충돌 (JakduBladeWeapon)
    for (const weapon of this.weapons) {
      if (weapon instanceof JakduBladeWeapon) {
        const blades = weapon.getBlades();
        for (const blade of blades) {
          if (!blade.active) continue;

          // 공격 중일 때만 충돌 처리
          if (!blade.isAttackActive()) continue;

          // 보스가 있으면 타겟 배열에 포함
          const boss = this.bossSystem?.getBoss();
          const targetEnemies = boss && boss.active ? [...this.enemies, boss] : this.enemies;

          for (const enemy of targetEnemies) {
            if (!enemy.active || !enemy.isAlive()) continue;

            // 이미 최대 타격 횟수에 도달한 적은 스킵
            if (!blade.canHitEnemy(enemy.id)) continue;

            // 작두와 적 충돌 체크 (타원형 충돌)
            if (
              checkEllipseCircleCollision(
                { x: blade.x, y: blade.y, radiusX: blade.radiusX, radiusY: blade.radiusY },
                { x: enemy.x, y: enemy.y, radius: enemy.radius }
              )
            ) {
              // 플레이어 데미지 배율 적용 (치명타 포함)
              const critResult = this.player.rollCritical();
              const finalDamage = blade.damage * critResult.damageMultiplier;
              enemy.takeDamage(finalDamage, critResult.isCritical);
              blade.recordHit(enemy.id); // 타격 기록

              // 유물 이벤트 트리거 (JakduBlade)
              this.artifactSystem.triggerHit(enemy, finalDamage, blade.weaponCategories);

              // 넉백 적용 (작두 위치에서 바깥쪽으로)
              const knockbackDir = { x: enemy.x - blade.x, y: enemy.y - blade.y };
              enemy.applyKnockback(knockbackDir, KNOCKBACK_BALANCE.jakduBlade);

              if (!enemy.isAlive()) {
                enemy.active = false;
                this.enemiesKilled++;
                console.log(
                  `[Jakdu] 적 처치! (남은 적: ${this.enemies.filter((e) => e.isAlive()).length})`
                );

                // 체력 포션 드랍 확률
                const dropPotion = Math.random() < POTION_BALANCE.dropRate;

                this.combatSystem.onEnemyKilled?.({
                  enemy,
                  position: { x: enemy.x, y: enemy.y },
                  xpValue: enemy.xpDrop,
                  dropPotion,
                });
              }
            }
          }
        }
      }
    }

    // 10. 경험치 젬 업데이트
    for (const gem of this.experienceGems) {
      gem.update(deltaTime, this.player);
    }

    // 9-1. 체력 포션 업데이트
    for (const potion of this.healthPotions) {
      potion.update(deltaTime, this.player);
    }

    // 10. 적 업데이트
    for (const enemy of this.enemies) {
      // 매혹된 적은 플레이어를 타겟으로 하지 않음 (유물 시스템에서 타겟 관리)
      if (!enemy.hasStatusEffect('charmed')) {
        const playerPos = { x: this.player.x, y: this.player.y };
        enemy.setTarget(playerPos);
      }
      enemy.update(deltaTime);
    }

    // 10-1. 보스 스폰 체크 (10분 도달 시)
    if (this.gameTime >= this.BOSS_SPAWN_TIME && !this.bossSpawned) {
      this.spawnBoss();
    }

    // 10-2. 보스 시스템 업데이트 (플레이어 공격과의 충돌 처리)
    if (this.bossSystem) {
      this.bossSystem.update(
        deltaTime,
        this.gameTime,
        this.projectiles,
        this.aoeEffects,
        this.meleeSwings
      );
    }

    // 11. 적 스폰 (보스 전투 중이 아닐 때만)
    const playerPos = { x: this.player.x, y: this.player.y };
    if (!this.bossSystem || !this.bossSystem.active) {
      this.spawnSystem.update(deltaTime, this.enemies, this.gameTime, playerPos);
    }

    // 새로 생성된 적 게임 레이어에 추가
    for (const enemy of this.enemies) {
      if (!enemy.parent) {
        this.gameLayer.addChild(enemy);

        // 처녀귀신이면 투사체 발사 콜백 설정
        if (enemy instanceof MaidenGhostEnemy) {
          enemy.onFireProjectile = (projInfo) => {
            const projectile = new EnemyProjectile(
              `enemy_proj_${Date.now()}`,
              projInfo.startX,
              projInfo.startY,
              projInfo.direction,
              0xff00ff // 마젠타색
            );
            projectile.damage = 8; // 처녀귀신 투사체 데미지
            projectile.speed = 300;
            projectile.radius = 10;

            // woman-ghost-projectile.png 스프라이트 로드 (16x16, 30프레임, 2배 크기)
            projectile.loadSpriteSheet(
              `${CDN_BASE_URL}/assets/enemy/woman-ghost-projectile.png`,
              16,
              16,
              30,
              6,
              2
            );

            this.enemyProjectiles.push(projectile);
            this.gameLayer.addChild(projectile);
          };
        }

        // 악령이면 투사체 발사 콜백 설정
        if (enemy instanceof EvilSpiritEnemy) {
          enemy.onFireProjectile = (projInfo) => {
            const projectile = new EnemyProjectile(
              `enemy_proj_${Date.now()}`,
              projInfo.startX,
              projInfo.startY,
              projInfo.direction,
              0x6600cc // 어두운 보라색 (폴백용)
            );
            projectile.damage = 6; // 악령 투사체 데미지
            projectile.speed = 350;
            projectile.radius = 8;

            // TODO: evil-spirit-projectile.png 스프라이트 사용, 어두운 보라색 틴트
            // 현재는 woman-ghost-projectile.png 사용
            projectile.loadSpriteSheet(
              `${CDN_BASE_URL}/assets/enemy/woman-ghost-projectile.png`,
              16,
              16,
              30,
              6,
              2,
              0x7700dd // 채도 높은 어두운 보라색 틴트
            );

            this.enemyProjectiles.push(projectile);
            this.gameLayer.addChild(projectile);
          };
        }
      }
    }

    // 12. 전투 시스템 (투사체 충돌 및 데미지)
    const killed = this.combatSystem.update(this.player, this.enemies, this.projectiles);
    this.enemiesKilled += killed;

    // 13. 정리 (죽은 엔티티 제거)
    this.cleanup();

    // 11. UI 업데이트
    this.updateUI();

    // 12. 포탈 시스템 업데이트
    this.updatePortal(deltaTime);

    // 13. 난이도 증가 (10초마다)
    if (Math.floor(this.gameTime) % 10 === 0 && this.gameTime > 1) {
      // 스폰 속도 증가 (중복 방지를 위해 소수점 체크)
      if (this.gameTime % 1 < deltaTime * 2) {
        this.spawnSystem.increaseSpawnRate();
      }
    }

    // 14. 게임 오버 체크
    if (!this.player.isAlive() && !this.isGameOver) {
      this.handleGameOver();
    }
  }

  /**
   * 정리 (죽은 엔티티 제거)
   */
  private cleanup(): void {
    // 죽은 적 제거
    const deadEnemies = this.enemies.filter((e) => !e.active || !e.isAlive());
    for (const enemy of deadEnemies) {
      this.gameLayer.removeChild(enemy);
      enemy.destroy();
    }
    this.enemies = this.enemies.filter((e) => e.active && e.isAlive());

    // 비활성 투사체 제거
    const activeProjectiles: Projectile[] = [];
    for (const proj of this.projectiles) {
      if (
        !proj.active ||
        proj.isOutOfBounds(GAME_CONFIG.world.overworld.width, GAME_CONFIG.world.overworld.height)
      ) {
        // 비활성화된 투사체 제거
        this.gameLayer.removeChild(proj);
        proj.destroy();
      } else {
        // 활성 투사체 유지
        activeProjectiles.push(proj);
      }
    }
    this.projectiles = activeProjectiles;

    // 비활성 적 투사체 제거
    const activeEnemyProjectiles: EnemyProjectile[] = [];
    for (const proj of this.enemyProjectiles) {
      if (
        !proj.active ||
        proj.isOutOfBounds(GAME_CONFIG.world.overworld.width, GAME_CONFIG.world.overworld.height)
      ) {
        this.gameLayer.removeChild(proj);
        proj.destroy();
      } else {
        activeEnemyProjectiles.push(proj);
      }
    }
    this.enemyProjectiles = activeEnemyProjectiles;

    // 비활성 AoE 이펙트 제거
    const activeAoE: AoEEffect[] = [];
    for (const aoe of this.aoeEffects) {
      if (!aoe.active) {
        this.gameLayer.removeChild(aoe);
        aoe.destroy();
      } else {
        activeAoE.push(aoe);
      }
    }
    this.aoeEffects = activeAoE;

    // 비활성 근접 휘두르기 제거
    const activeSwings: MeleeSwing[] = [];
    for (const swing of this.meleeSwings) {
      if (!swing.active) {
        this.gameLayer.removeChild(swing);
        swing.destroy();
      } else {
        activeSwings.push(swing);
      }
    }
    this.meleeSwings = activeSwings;

    // 정화수 스플래시 정리
    const activeSplashes: WaterSplash[] = [];
    for (const splash of this.waterSplashes) {
      if (splash.isComplete()) {
        this.gameLayer.removeChild(splash);
        splash.destroy();
      } else {
        activeSplashes.push(splash);
      }
    }
    this.waterSplashes = activeSplashes;

    // 비활성 경험치 젬 제거
    const activeGems: ExperienceGem[] = [];
    for (const gem of this.experienceGems) {
      if (!gem.active) {
        this.gameLayer.removeChild(gem);
        gem.destroy();
      } else {
        activeGems.push(gem);
      }
    }
    this.experienceGems = activeGems;

    // 비활성 체력 포션 제거
    const activePotions: HealthPotion[] = [];
    for (const potion of this.healthPotions) {
      if (!potion.active) {
        this.gameLayer.removeChild(potion);
        potion.destroy();
      } else {
        activePotions.push(potion);
      }
    }
    this.healthPotions = activePotions;
  }

  /**
   * UI 업데이트
   */
  private updateUI(): void {
    // 점수 (아이콘이 있으므로 숫자만 표시)
    if (this.scoreText) {
      this.scoreText.text = `${this.enemiesKilled}`;

      // 킬 아이콘 위치 동적 업데이트 (텍스트 너비 변경 대응)
      if (this.killIcon) {
        this.killIcon.x = this.scoreText.x - this.scoreText.width - this.UI_KILL_ICON_GAP;
      }
    }

    // 시간
    if (this.timeText) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = Math.floor(this.gameTime % 60);
      this.timeText.text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // 레벨
    if (this.levelText) {
      this.levelText.text = `Lv.${this.player.getLevel()}`;
    }

    // 경험치 바
    if (this.xpBarFill) {
      const progress = this.player.getLevelProgress();
      this.xpBarFill.clear();
      this.xpBarFill.rect(0, 0, this.xpBarWidth * progress, this.UI_BAR_HEIGHT);
      this.xpBarFill.fill(0xe39f54);
    }
  }

  /**
   * 보스 처치 이벤트 핸들러
   */
  // private handleBossDefeat(): void {
  //   this.bossDefeated = true;
  //   console.log('보스 처치! 포탈 생성 준비...');
  // }

  /**
   * 포탈 시스템 업데이트
   */
  private updatePortal(deltaTime: number): void {
    // 보스 처치 시 포탈 생성
    if (this.bossDefeated && !this.portalSpawnTriggered) {
      console.log('포탈 생성!');
      const newPortal = this.portalSpawner.triggerSpawn(this.player);
      if (newPortal) {
        this.portal = newPortal;
        this.portal.onEnter = () => {
          console.log('포탈 진입! 경계 맵으로 이동...');
          this.onEnterBoundary?.();
        };
        this.gameLayer.addChild(this.portal);
      }
      this.portalSpawnTriggered = true;
    }

    // 포탈 애니메이션 및 충돌 체크
    if (this.portal) {
      this.portal.update(deltaTime);
      this.portal.checkPlayerCollision(this.player.x, this.player.y);

      // 포탈 인디케이터 업데이트
      this.portalIndicator.update(
        this.player.x,
        this.player.y,
        this.portal.x,
        this.portal.y,
        this.screenWidth,
        this.screenHeight,
        this.gameLayer.x,
        this.gameLayer.y
      );
    }
  }

  /**
   * 레벨업 선택 처리
   */
  private async handleLevelUpChoice(choiceId: string): Promise<void> {
    console.log(`선택됨: ${choiceId}`);

    // Player의 선택 처리 호출 (게임 재개)
    this.player.selectLevelUpChoice(choiceId);
    audioManager.playButtonClickSound();

    // 선택 적용
    if (choiceId.startsWith('weapon_')) {
      // 무기 추가
      await this.addWeapon(choiceId);
    } else if (choiceId.startsWith('stat_')) {
      // 기존 스탯 업그레이드 (무력, 신속, 생명력, 영혼흡인)
      this.player.applyStatUpgrade(choiceId);
    } else if (choiceId.startsWith('powerup_')) {
      // 새로운 파워업 시스템
      this.player.applyPowerup(choiceId);

      // Analytics: 파워업 획득 추적
      GameAnalytics.trackPowerupAcquired(choiceId, this.player.getLevel());
    }

    // 조이스틱 상태 리셋 (레벨업 UI가 닫힌 후)
    if (this.virtualJoystick) {
      this.virtualJoystick.reset();
    }
  }

  /**
   * 리더보드에 점수 제출
   * getUserKeyForGame 성공 시에만 점수를 제출합니다
   */
  private async submitScoreToLeaderboard(score: number): Promise<void> {
    // Check if user key can be obtained
    const userKey = await safeGetUserKeyForGame();
    if (!userKey) {
      console.log('[Leaderboard] Cannot submit score - user key not available');
      return;
    }

    // Submit score to leaderboard
    const success = await safeSubmitGameCenterLeaderBoardScore(Math.floor(score).toString());
    if (success) {
      console.log('[Leaderboard] Score submitted successfully:', Math.floor(score));
    }
  }

  /**
   * 무기 추가
   */
  protected async addWeapon(weaponId: string): Promise<void> {
    console.log(`무기 추가: ${weaponId}`);

    switch (weaponId) {
      case 'weapon_talisman': {
        // 이미 부적이 있으면 업그레이드, 없으면 추가
        const existingTalisman = this.weapons.find((w) => w instanceof TalismanWeapon);
        if (existingTalisman) {
          existingTalisman.levelUp();
          console.log(`부적 레벨업! Lv.${existingTalisman.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingTalisman.level);
        } else {
          const talisman = new TalismanWeapon();
          this.weapons.push(talisman);
          console.log('부적 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, talisman.level);
        }
        break;
      }
      case 'weapon_dokkaebi_fire': {
        // 이미 도깨비불이 있으면 업그레이드, 없으면 추가
        const existingDokkaebi = this.weapons.find((w) => w instanceof DokkaebiFireWeapon);
        if (existingDokkaebi) {
          existingDokkaebi.levelUp();
          // 레벨업 시 궤도 재생성 (소리 없이)
          await (existingDokkaebi as DokkaebiFireWeapon).spawnOrbitals(this.gameLayer);
          console.log(`도깨비불 레벨업! Lv.${existingDokkaebi.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingDokkaebi.level);
        } else {
          const dokkaebi = new DokkaebiFireWeapon();
          this.weapons.push(dokkaebi);
          // 최초 생성 시 궤도 생성 (소리와 함께)
          await dokkaebi.spawnOrbitals(this.gameLayer);
          console.log('도깨비불 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, dokkaebi.level);
        }
        break;
      }
      case 'weapon_moktak': {
        // 이미 목탁이 있으면 업그레이드, 없으면 추가
        const existingMoktak = this.weapons.find((w) => w instanceof MoktakSoundWeapon);
        if (existingMoktak) {
          existingMoktak.levelUp();
          console.log(`목탁 소리 레벨업! Lv.${existingMoktak.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingMoktak.level);
        } else {
          const moktak = new MoktakSoundWeapon();
          this.weapons.push(moktak);
          console.log('목탁 소리 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, moktak.level);
        }
        break;
      }
      case 'weapon_jakdu': {
        // 이미 작두날이 있으면 업그레이드, 없으면 추가
        const existingJakdu = this.weapons.find((w) => w instanceof JakduBladeWeapon);
        if (existingJakdu) {
          existingJakdu.levelUp();
          // 레벨업 시 작두 재생성
          await (existingJakdu as JakduBladeWeapon).spawnBlades(this.gameLayer);
          console.log(`작두날 레벨업! Lv.${existingJakdu.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingJakdu.level);
        } else {
          const jakdu = new JakduBladeWeapon();
          this.weapons.push(jakdu);
          // 최초 생성 시 작두 생성
          await jakdu.spawnBlades(this.gameLayer);
          console.log('작두날 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, jakdu.level);
        }
        break;
      }
      case 'weapon_fan_wind': {
        // 이미 부채바람이 있으면 업그레이드, 없으면 추가
        const existingFanWind = this.weapons.find((w) => w instanceof FanWindWeapon);
        if (existingFanWind) {
          existingFanWind.levelUp();
          console.log(`부채바람 레벨업! Lv.${existingFanWind.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingFanWind.level);
        } else {
          const fanWind = new FanWindWeapon();
          this.weapons.push(fanWind);
          console.log('부채바람 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, fanWind.level);
        }
        break;
      }
      case 'weapon_purifying_water': {
        // 이미 정화수가 있으면 업그레이드, 없으면 추가
        const existingWater = this.weapons.find((w) => w instanceof PurifyingWaterWeapon);
        if (existingWater) {
          existingWater.levelUp();
          console.log(`정화수 레벨업! Lv.${existingWater.level}`);
          this.player.trackWeaponAcquisition(weaponId, existingWater.level);
        } else {
          const water = new PurifyingWaterWeapon();
          this.weapons.push(water);
          console.log('정화수 무기 추가 완료!');
          this.player.trackWeaponAcquisition(weaponId, water.level);
        }
        break;
      }
      default:
        console.warn(`알 수 없는 무기: ${weaponId}`);
    }
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(): void {
    this.isGameOver = true;

    // 플레이어 체력바 숨기기
    this.player.hideHealthBar();

    console.log('=== 게임 오버 ===');
    console.log(`생존 시간: ${Math.floor(this.gameTime)}초`);
    console.log(`처치한 적: ${this.enemiesKilled}마리`);

    // Analytics: 플레이어 사망 원인 추적
    const deathCause = this.player.getLastDamageCause();
    if (deathCause) {
      GameAnalytics.trackPlayerDeath(deathCause, this.player.getLevel(), Math.floor(this.gameTime));
    }

    // Analytics: 최종 빌드 스냅샷
    const weaponIds = this.weapons.map((w) => w.id);
    const acquiredPowerupsMap = this.player.getAcquiredPowerups();
    const powerups = Object.fromEntries(acquiredPowerupsMap);

    GameAnalytics.trackFinalBuild({
      weapons: weaponIds,
      powerups,
      stats: {
        max_health: this.player.maxHealth,
        damage_multiplier: this.player.damageMultiplier,
        cooldown_multiplier: this.player.cooldownMultiplier,
        speed_multiplier: this.player.speedMultiplier,
        pickup_range_multiplier: this.player.pickupRangeMultiplier,
      },
    });

    // Analytics: 게임 종료 추적 (defeat)
    const finalScore = Math.floor(this.player.getTotalXP());
    GameAnalytics.trackGameEnd('defeat', {
      survived_seconds: Math.floor(this.gameTime),
      level: this.player.getLevel(),
      kills: this.enemiesKilled,
      score: finalScore,
    });

    // 게임 통계 저장 (버튼 클릭 시 Analytics용)
    this.lastGameStats = {
      result: 'defeat',
      level: this.player.getLevel(),
      score: finalScore,
    };

    // 토스 리더보드에 점수 제출 (사용자 키 확인 후)
    void this.submitScoreToLeaderboard(finalScore);

    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // 게임 오버 UI 컨테이너 생성 (모달이므로 Scene 루트에 추가하여 safe area 무시)
    const gameOverContainer = new Container();
    gameOverContainer.zIndex = 10000; // 모든 UI보다 위에 표시
    this.addChild(gameOverContainer);

    // 반투명 오버레이 (다른 UI 클릭 차단)
    const overlay = new Graphics();
    overlay.rect(0, 0, this.screenWidth, this.screenHeight);
    overlay.fill({ color: 0x000000, alpha: 0.8 });
    overlay.eventMode = 'static'; // 클릭 차단
    gameOverContainer.addChild(overlay);

    // 게임 오버 타이틀
    const gameOverText = new Text({
      text: i18n.t('gameOver.title'),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 72,
        fill: 0xff0000,
      },
    });
    gameOverText.resolution = 2; // 고해상도 렌더링
    gameOverText.anchor.set(0.5);
    gameOverText.x = centerX;
    gameOverText.y = centerY - 200;
    gameOverContainer.addChild(gameOverText);

    // 생존 시간 표시 (분:초 형식)
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const timeText = new Text({
      text: i18n.t('gameOver.survivalTime', { time: formattedTime }),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 28,
        fill: 0xffffff,
      },
    });
    timeText.resolution = 2; // 고해상도 렌더링
    timeText.anchor.set(0.5);
    timeText.x = centerX;
    timeText.y = centerY - 110;
    gameOverContainer.addChild(timeText);

    // 처치한 적 표시
    const killsText = new Text({
      text: i18n.t('gameOver.enemiesKilled', { count: this.enemiesKilled }),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 28,
        fill: 0xffffff,
      },
    });
    killsText.resolution = 2; // 고해상도 렌더링
    killsText.anchor.set(0.5);
    killsText.x = centerX;
    killsText.y = centerY - 75;
    gameOverContainer.addChild(killsText);

    // 최종 점수 (획득 경험치) 표시
    const scoreText = new Text({
      text: i18n.t('gameOver.finalScore', { score: finalScore.toLocaleString('ko-KR') }),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 36,
        fill: 0xffd700, // 금색
      },
    });
    scoreText.resolution = 2; // 고해상도 렌더링
    scoreText.anchor.set(0.5);
    scoreText.x = centerX;
    scoreText.y = centerY - 30;
    gameOverContainer.addChild(scoreText);

    // 버튼 크기 및 간격 (설정 메뉴와 동일: 184x56)
    const buttonWidth = 184;
    const buttonHeight = 56;
    const buttonGap = buttonHeight + 16;

    // 로비로 돌아가기 버튼 (아이콘과 함께)
    this.createMenuButtonWithIcon(
      gameOverContainer,
      i18n.t('gameOver.returnToLobby'),
      `${CDN_BASE_URL}/assets/gui/back.png`,
      centerX,
      centerY + 60,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('로비로 돌아가기 버튼 클릭!');

        // Analytics: 게임 오버 액션 추적
        if (this.lastGameStats) {
          GameAnalytics.trackGameOverAction('lobby', this.lastGameStats);
        }

        this.onReturnToLobby?.();
      }
    );

    // 게임 다시하기 버튼 (아이콘과 함께)
    this.createMenuButtonWithIcon(
      gameOverContainer,
      i18n.t('gameOver.restart'),
      `${CDN_BASE_URL}/assets/gui/restart.png`,
      centerX,
      centerY + 60 + buttonGap,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('게임 다시하기 버튼 클릭!');

        // Analytics: 게임 오버 액션 추적
        if (this.lastGameStats) {
          GameAnalytics.trackGameOverAction('restart', this.lastGameStats);
        }

        this.onRestartGame?.();
      }
    );

    // 게임 오버 결과 콜백
    if (this.onGameOver) {
      const result: GameResult = {
        score: this.player.getTotalXP(),
        time: Math.floor(this.gameTime),
        enemiesKilled: this.enemiesKilled,
      };
      this.onGameOver(result);
    }
  }

  /**
   * 버튼 생성 헬퍼 함수
   */
  /**
   * 설정 버튼 생성 (좌측 상단)
   */
  private createSettingsButton(): Container {
    const buttonContainer = new Container();
    buttonContainer.x = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    buttonContainer.y = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    buttonContainer.zIndex = 10000; // 설정 모달 오버레이 위에 표시

    // 설정 아이콘 (톱니바퀴 이미지)
    const icon = Sprite.from(`${CDN_BASE_URL}/assets/gui/settings.png`);
    icon.width = this.UI_SETTINGS_SIZE;
    icon.height = this.UI_SETTINGS_SIZE;
    icon.anchor.set(0.5);
    buttonContainer.addChild(icon);

    // 인터랙션 활성화
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    // 호버 효과
    buttonContainer.on('pointerover', () => {
      buttonContainer.scale.set(1.1);
    });

    buttonContainer.on('pointerout', () => {
      buttonContainer.scale.set(1.0);
    });

    // 클릭 시 설정 메뉴 토글
    buttonContainer.on('pointerdown', () => {
      console.log('설정 버튼 클릭!');
      this.toggleSettingsMenu();
    });

    return buttonContainer;
  }

  /**
   * 리더보드 버튼 생성
   */
  private createLeaderboardButton(): Container {
    const buttonContainer = new Container();
    // 설정 버튼 오른쪽에 배치
    buttonContainer.x = this.UI_PADDING + this.UI_SETTINGS_SIZE * 1.5 + 8;
    buttonContainer.y = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    buttonContainer.zIndex = 10000; // 설정 모달 오버레이 위에 표시

    // 토스 환경이 아니면 버튼 숨김
    buttonContainer.visible = isInTossApp();

    // 크라운 아이콘
    const icon = Sprite.from(CDN_ASSETS.gui.crown);
    icon.width = this.UI_SETTINGS_SIZE;
    icon.height = this.UI_SETTINGS_SIZE;
    icon.anchor.set(0.5);
    buttonContainer.addChild(icon);

    // 인터랙션 활성화
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    // 호버 효과
    buttonContainer.on('pointerover', () => {
      buttonContainer.scale.set(1.1);
    });

    buttonContainer.on('pointerout', () => {
      buttonContainer.scale.set(1.0);
    });

    // 클릭 시 리더보드 열기
    buttonContainer.on('pointerdown', () => {
      safeOpenGameCenterLeaderboard();
      // Analytics: 리더보드 버튼 클릭 추적
      safeAnalyticsClick({
        button_name: 'leaderboard',
        screen: 'game',
      });
    });

    return buttonContainer;
  }

  /**
   * 개발 모드: 게임 클리어 테스트 버튼 생성
   */
  private createDevClearButton(): Container {
    const buttonContainer = new Container();

    // 하단 중앙에 배치
    const buttonWidth = 120;
    const buttonHeight = 40;
    buttonContainer.x = this.screenWidth / 2;
    buttonContainer.y = this.screenHeight - 100;
    buttonContainer.zIndex = 10000;

    // 버튼 배경
    const bg = new Graphics();
    bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    bg.fill({ color: 0xff6b00, alpha: 0.9 }); // 주황색
    bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    bg.stroke({ color: 0xffffff, width: 2 });
    buttonContainer.addChild(bg);

    // 텍스트
    const text = new Text({
      text: 'Clear Test',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    text.resolution = 2;
    text.anchor.set(0.5);
    buttonContainer.addChild(text);

    // 인터랙션
    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    // 호버 효과
    buttonContainer.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      bg.fill({ color: 0xff8800, alpha: 1.0 });
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      bg.stroke({ color: 0xffffff, width: 2 });
    });

    buttonContainer.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      bg.fill({ color: 0xff6b00, alpha: 0.9 });
      bg.roundRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
      bg.stroke({ color: 0xffffff, width: 2 });
    });

    // 클릭 시 보스 처치로 게임 클리어
    buttonContainer.on('pointerdown', () => {
      console.log('[DEV] 강제 게임 클리어 실행');
      this.bossDefeated = true;
      this.handleGameOver();
    });

    return buttonContainer;
  }

  /**
   * 설정 메뉴 토글
   */
  private toggleSettingsMenu(): void {
    if (this.settingsMenu) {
      // 메뉴 닫기
      this.removeChild(this.settingsMenu);
      this.settingsMenu.destroy();
      this.settingsMenu = null;
      // BGM 재개
      audioManager.resumeBGM();
    } else {
      // 조이스틱 상태 리셋 (설정 메뉴 열기 전)
      if (this.virtualJoystick) {
        this.virtualJoystick.reset();
      }
      // BGM 일시정지
      audioManager.pauseAllBGM();
      // 메뉴 열기 (root에 추가하여 모든 레이어 위에 표시)
      this.settingsMenu = this.createSettingsMenu();
      this.addChild(this.settingsMenu);

      // Analytics: 설정 모달 접근 추적
      GameAnalytics.trackSettingsModalOpen('game');
    }
  }

  /**
   * 설정 메뉴 생성
   */
  private createSettingsMenu(): Container {
    const menuContainer = new Container();
    menuContainer.zIndex = 9999;

    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // 반투명 오버레이
    const overlay = new Graphics();
    overlay.rect(0, 0, this.screenWidth, this.screenHeight);
    overlay.fill({ color: 0x000000, alpha: 0.7 });
    overlay.eventMode = 'static'; // 클릭 차단
    menuContainer.addChild(overlay);

    // 버튼 크기 및 간격 (디자인 스펙: 184x56, 간격 72px)
    const buttonGap = 72;
    const buttonWidth = 184;
    const buttonHeight = 56;

    // 계속하기 버튼 (아이콘과 함께)
    this.createMenuButtonWithIcon(
      menuContainer,
      '계속하기',
      `${CDN_BASE_URL}/assets/gui/resume.png`,
      centerX,
      centerY - 80,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('설정 메뉴: 게임으로 돌아가기');
        this.toggleSettingsMenu(); // 메뉴 닫기 (게임 재개)
      }
    );

    // 다시하기 버튼
    this.createMenuButtonWithIcon(
      menuContainer,
      '다시하기',
      `${CDN_BASE_URL}/assets/gui/restart.png`,
      centerX,
      centerY - 80 + buttonGap,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('설정 메뉴: 게임 다시하기');
        this.toggleSettingsMenu(); // 메뉴 닫기
        setTimeout(() => {
          this.onRestartGame?.();
        }, 100);
      }
    );

    // TODO: 소리 끄기 구현
    // 소리끄기 버튼
    // this.createMenuButtonWithIcon(
    //   menuContainer,
    //   '소리끄기',
    //   `${CDN_BASE_URL}/assets/gui/sound.png`,
    //   centerX,
    //   centerY - 80 + buttonGap * 2,
    //   buttonWidth,
    //   buttonHeight,
    //   () => {
    //     console.log('설정 메뉴: 소리끄기 (미구현)');
    //     // TODO: 사운드 토글 기능 구현
    //   }
    // );

    // 로비로 가기 버튼
    this.createMenuButtonWithIcon(
      menuContainer,
      '로비로 가기',
      `${CDN_BASE_URL}/assets/gui/back.png`,
      centerX,
      centerY - 80 + buttonGap * 2,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('설정 메뉴: 로비로 돌아가기');
        this.toggleSettingsMenu(); // 메뉴 닫기
        setTimeout(() => {
          this.onReturnToLobby?.();
        }, 100);
      }
    );

    // 오버레이 클릭 시 메뉴 닫기
    overlay.on('pointerdown', () => {
      this.toggleSettingsMenu();
    });

    return menuContainer;
  }

  /**
   * 아이콘이 있는 메뉴 버튼 생성
   */
  private async createMenuButtonWithIcon(
    container: Container,
    text: string,
    iconPath: string,
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: () => void
  ): Promise<void> {
    // 버튼 생성 (텍스트 없이)
    const button = PixelButton.create('', x, y, onClick, false, width, height);
    container.addChild(button);

    // 아이콘 로드 및 버튼 내부에 [아이콘+텍스트] 배치
    try {
      const texture = await Assets.load(iconPath);
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      const icon = new Sprite(texture);
      icon.anchor.set(0.5);

      // 아이콘 크기를 32px로 조정
      const targetSize = 32;
      const scale = targetSize / texture.width;
      icon.scale.set(scale);

      // 텍스트 생성
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);

      // 아이콘과 텍스트 사이 간격 (4px)
      const gap = 4;

      // [아이콘 + 텍스트] 전체 너비 계산
      const totalContentWidth = targetSize + gap + labelText.width;

      // 버튼 중앙에 맞춰 아이콘과 텍스트 배치
      icon.x = -totalContentWidth / 2 + targetSize / 2;
      icon.y = 0;
      button.addChild(icon);

      labelText.x = -totalContentWidth / 2 + targetSize + gap + labelText.width / 2;
      labelText.y = 0;
      button.addChild(labelText);
    } catch (error) {
      console.error(`아이콘 로드 실패: ${iconPath}`, error);

      // 폴백: 텍스트만 표시
      const labelText = new Text({
        text,
        style: {
          fontFamily: 'NeoDunggeunmo',
          fontSize: 16,
          fill: 0x773f16,
        },
      });
      labelText.resolution = 3;
      labelText.anchor.set(0.5);
      labelText.x = 0;
      labelText.y = 0;
      button.addChild(labelText);
    }
  }

  /**
   * 보스 스폰
   */
  private spawnBoss(): void {
    this.bossSpawned = true;

    console.log('보스 스폰! 10분 경과');

    // 보스 BGM으로 전환
    audioManager.playBGMByTrack('boss-01', true);

    // 플레이어 UI 숨기기
    if (this.xpBarContainer) {
      this.xpBarContainer.visible = false;
    }
    if (this.xpBarFill) {
      this.xpBarFill.visible = false;
    }
    if (this.levelText) {
      this.levelText.visible = false;
    }
    if (this.scoreText) {
      this.scoreText.visible = false;
    }
    if (this.killIcon) {
      this.killIcon.visible = false;
    }

    // BossSystem 생성
    // overlayLayer는 Scene 루트 (this)를 전달하여 safe area 무시
    this.bossSystem = new BossSystem(
      this.gameLayer,
      this.uiLayer,
      this, // overlayLayer: Scene 루트
      this.player,
      this.screenWidth,
      this.screenHeight
    );

    // 보스 스폰
    this.bossSystem.spawnBoss();

    // 스테이지 클리어 콜백
    this.bossSystem.onStageClear = () => {
      console.log('스테이지 클리어!');
      this.bossDefeated = true;

      // Analytics: 승리 이벤트 추적
      // 보스 처치 + Soul 획득 = 게임 승리
      const finalScore = Math.floor(this.player.getTotalXP());
      GameAnalytics.trackGameEnd('victory', {
        survived_seconds: Math.floor(this.gameTime),
        level: this.player.getLevel(),
        kills: this.enemiesKilled,
        score: finalScore,
      });

      // 게임 통계 저장 (스테이지 클리어 UI 버튼 클릭 시 Analytics용)
      this.lastGameStats = {
        result: 'victory',
        level: this.player.getLevel(),
        score: finalScore,
      };

      // 토스 리더보드에 점수 제출
      void safeSubmitGameCenterLeaderBoardScore(Math.floor(finalScore).toString());

      // 플레이어 UI 다시 표시
      if (this.xpBarContainer) {
        this.xpBarContainer.visible = true;
      }
      if (this.xpBarFill) {
        this.xpBarFill.visible = true;
      }
      if (this.levelText) {
        this.levelText.visible = true;
      }
      if (this.scoreText) {
        this.scoreText.visible = true;
      }
      if (this.killIcon) {
        this.killIcon.visible = true;
      }
    };

    // 레벨업 UI 콜백 (보상 상자에서 사용)
    // TODO: Epic 파워업 보상 시스템 구현 필요
    // - 보상 상자에서 Epic 등급 파워업 2개를 선택할 수 있어야 함
    // - LevelSystem에서 Epic 파워업만 필터링하는 로직 추가 필요
    // 위 내용은 잘못된 주석 및 TODO! 앱인토스 혼백 +1 업뎃해야함
    // this.bossSystem.onShowLevelUpUI = (choices) => {
    //   console.log('보스 클리어 후 혼백 습득 데이터 저장 필요', choices);
    //   // void this.levelUpUI.show(choices);
    // };

    // 로비 복귀 콜백 (스테이지 클리어 UI에서)
    this.bossSystem.onReturnToLobby = () => {
      console.log('보스 클리어 후 로비로 복귀');

      // Analytics: 게임 오버 액션 추적 (승리 후 로비 복귀)
      if (this.lastGameStats) {
        GameAnalytics.trackGameOverAction('lobby', this.lastGameStats);
      }

      this.onReturnToLobby?.();
    };
  }

  /**
   * 화면 크기 업데이트 오버라이드
   */
  public updateScreenSize(width: number, height: number): void {
    super.updateScreenSize(width, height);

    // 씬별 추가 업데이트
    this.spawnSystem.updateScreenSize(width, height);

    // UI 위치 재계산
    this.xpBarWidth = width - this.UI_PADDING * 2;
    this.xpBarY = this.UI_PADDING + this.UI_SETTINGS_SIZE + this.UI_GAP_SETTINGS_TO_BAR;
    this.levelTextY = this.xpBarY + this.UI_BAR_HEIGHT + this.UI_GAP_BAR_TO_LEVEL;

    // 타이머 중앙 정렬
    if (this.timeText) {
      this.timeText.x = width / 2;
    }

    // 경험치바 재생성 (너비 변경 대응)
    this.createXPBar();

    // 레벨 텍스트 위치 업데이트
    if (this.levelText) {
      this.levelText.y = this.levelTextY;
    }

    // 킬 UI 위치 업데이트
    if (this.scoreText) {
      this.scoreText.x = width - this.UI_PADDING;
      this.scoreText.y = this.levelTextY;
    }
    if (this.killIcon) {
      this.killIcon.x = this.scoreText.x - this.scoreText.width - this.UI_KILL_ICON_GAP;
      this.killIcon.y = this.levelTextY + this.UI_KILL_ICON_OFFSET_Y;
    }

    // 설정 버튼 위치 업데이트
    if (this.settingsButton) {
      this.settingsButton.x = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
      this.settingsButton.y = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    }

    // 리더보드 버튼 위치 업데이트
    if (this.leaderboardButton) {
      this.leaderboardButton.x = this.UI_PADDING + this.UI_SETTINGS_SIZE * 1.5 + 8;
      this.leaderboardButton.y = this.UI_PADDING + this.UI_SETTINGS_SIZE / 2;
    }
  }

  /**
   * 정리
   */
  public async destroy(): Promise<void> {
    if (this.isReady) {
      // 무기 정리 (궤도형 무기 특별 처리)
      for (const weapon of this.weapons) {
        if (weapon instanceof DokkaebiFireWeapon) {
          weapon.destroyOrbitals(this.gameLayer);
        }
      }

      // 엔티티 정리
      for (const enemy of this.enemies) {
        enemy.destroy();
      }
      for (const proj of this.projectiles) {
        proj.destroy();
      }
      for (const enemyProj of this.enemyProjectiles) {
        enemyProj.destroy();
      }
      for (const aoe of this.aoeEffects) {
        aoe.destroy();
      }
      for (const swing of this.meleeSwings) {
        swing.destroy();
      }
      for (const gem of this.experienceGems) {
        gem.destroy();
      }
      for (const potion of this.healthPotions) {
        potion.destroy();
      }

      // 보스 시스템 정리
      if (this.bossSystem) {
        this.bossSystem.cleanup();
        this.bossSystem = undefined;
      }

      // Static 캐시 정리 (게임 종료 시)
      BaseEnemy.clearAllCaches();
    }

    // 전환 씬 정리
    if (this.transitionScene) {
      await this.transitionScene.destroy();
      this.transitionScene = null;
    }

    // BGM 중지
    audioManager.stopBGM();

    // 부모 destroy 호출
    super.destroy();

    console.log('OverworldGameScene 정리 완료');
  }
}
