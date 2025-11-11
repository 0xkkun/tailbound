/**
 * BaseGameScene - 모든 씬의 공통 기반 클래스
 * Player, Camera, Input 시스템을 공통으로 관리
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { GAME_CONFIG } from '@config/game.config';
import { Player } from '@game/entities/Player';
import { VirtualJoystick } from '@game/ui/VirtualJoystick';
import type { PlayerSnapshot } from '@hooks/useGameState';
import { CameraSystem } from '@systems/CameraSystem';
import type { InputState } from '@type/game.types';
import { platform } from '@utils/platform';
import { Assets, Container } from 'pixi.js';

export interface BaseGameSceneConfig {
  screenWidth: number;
  screenHeight: number;
  worldWidth: number;
  worldHeight: number;
  playerSnapshot?: PlayerSnapshot | null;
}

export abstract class BaseGameScene extends Container {
  protected screenWidth: number;
  protected screenHeight: number;
  protected worldWidth: number;
  protected worldHeight: number;

  // 줌 레벨
  protected zoomLevel: number = 0.6;

  // 레이어
  protected gameLayer: Container;
  protected uiLayer: Container;

  // 플레이어
  public player!: Player;

  // 시스템
  protected cameraSystem: CameraSystem;
  protected virtualJoystick?: VirtualJoystick;

  // 입력 상태
  protected keys: Set<string> = new Set();

  // 게임 루프
  private gameLoopId?: number;
  private lastTime: number = 0;

  // 준비 상태
  protected isReady: boolean = false;

  constructor(config: BaseGameSceneConfig) {
    super();

    this.screenWidth = config.screenWidth;
    this.screenHeight = config.screenHeight;
    this.worldWidth = config.worldWidth;
    this.worldHeight = config.worldHeight;

    // 레이어 초기화 (z-index 설정)
    this.gameLayer = new Container();
    this.gameLayer.zIndex = GAME_CONFIG.layers.game; // 게임 월드 (최하위)
    this.gameLayer.sortableChildren = true; // gameLayer 내부에서도 zIndex 작동

    this.uiLayer = new Container();
    this.uiLayer.zIndex = GAME_CONFIG.layers.ui; // UI 레이어 (조이스틱보다 위)

    this.addChild(this.gameLayer);
    this.addChild(this.uiLayer);

    // sortableChildren 활성화 (z-index가 작동하도록)
    this.sortableChildren = true;

    // 게임 레이어 줌 아웃 (더 넓은 시야)
    this.gameLayer.scale.set(this.zoomLevel);

    // 카메라 시스템 초기화 (줌 레벨을 고려한 화면 크기)
    this.cameraSystem = new CameraSystem({
      screenWidth: this.screenWidth / this.zoomLevel,
      screenHeight: this.screenHeight / this.zoomLevel,
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
    });

    // 비동기 초기화
    this.initAsync(config.playerSnapshot);
  }

  /**
   * 비동기 초기화 (에셋 로딩)
   */
  private async initAsync(playerSnapshot?: PlayerSnapshot | null): Promise<void> {
    try {
      // 공통 에셋 로딩
      await this.loadAssets();

      // 플레이어 생성 (자식 클래스가 위치 지정)
      this.createPlayer();

      // 플레이어 상태 복원
      if (playerSnapshot) {
        this.restorePlayerState(playerSnapshot);
      }

      // 자식 클래스별 초기화
      await this.initScene();

      // 공통 UI 초기화
      this.initCommonUI();

      // 입력 설정
      this.setupInput();

      this.isReady = true;

      // 게임 루프 시작
      this.startGameLoop();
    } catch (error) {
      console.error('[BaseGameScene] 초기화 실패:', error);
    }
  }

  /**
   * 에셋 로딩 (자식 클래스에서 오버라이드 가능)
   */
  protected async loadAssets(): Promise<void> {
    // 공통 에셋 로딩
    await Assets.load([
      `${CDN_BASE_URL}/assets/npc/monk.png`,
      `${CDN_BASE_URL}/assets/player/shaman.png`,
      `${CDN_BASE_URL}/assets/weapon/talisman.png`, // 부적용
      `${CDN_BASE_URL}/assets/weapon/dokkabi-fire.png`, // 도깨비불용
      `${CDN_BASE_URL}/assets/weapon/mocktak.png`,
      `${CDN_BASE_URL}/assets/weapon/jakdu.png`,
      `${CDN_BASE_URL}/assets/gui/settings.png`, // 설정 버튼용
    ]);
  }

  /**
   * 플레이어 생성 (자식 클래스가 위치를 지정해야 함)
   */
  protected abstract createPlayer(): void;

  /**
   * 플레이어 상태 복원
   */
  protected restorePlayerState(snapshot: PlayerSnapshot): void {
    this.player.health = snapshot.health;
    this.player.maxHealth = snapshot.maxHealth;
    this.player.damageMultiplier = snapshot.damageMultiplier;
    this.player.cooldownMultiplier = snapshot.cooldownMultiplier;
    this.player.speedMultiplier = snapshot.speedMultiplier;
    this.player.pickupRangeMultiplier = snapshot.pickupRangeMultiplier;

    // LevelSystem 복원
    this.player.getLevelSystem().setTotalXP(snapshot.totalXP);

    console.log('[BaseGameScene] 플레이어 상태 복원됨');
  }

  /**
   * 씬별 초기화 (자식 클래스에서 구현)
   */
  protected abstract initScene(): Promise<void>;

  /**
   * 공통 UI 초기화
   */
  protected initCommonUI(): void {
    // 모바일 환경이면 가상 조이스틱 생성
    if (platform.isMobileDevice()) {
      this.virtualJoystick = new VirtualJoystick(this.screenWidth, this.screenHeight);
      this.uiLayer.addChild(this.virtualJoystick.getContainer());
    }
  }

  /**
   * 입력 설정
   */
  protected setupInput(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  protected handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
  };

  protected handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  /**
   * 입력 상태 가져오기
   */
  protected getInputState(): InputState {
    // 가상 조이스틱 우선
    if (this.virtualJoystick) {
      const joystickState = this.virtualJoystick.getState();
      if (joystickState.active) {
        return { x: joystickState.x, y: joystickState.y };
      }
    }

    // 키보드 입력
    let x = 0;
    let y = 0;

    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;

    // 정규화
    if (x !== 0 || y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }

    return { x, y };
  }

  /**
   * 게임 루프 시작
   */
  private startGameLoop(): void {
    this.lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.update(deltaTime);

      this.gameLoopId = requestAnimationFrame(gameLoop);
    };

    this.gameLoopId = requestAnimationFrame(gameLoop);
  }

  /**
   * 업데이트 (공통 + 씬별)
   */
  protected async update(deltaTime: number): Promise<void> {
    if (!this.isReady) return;

    // 씬별 업데이트 (플레이어 이동 제어 포함)
    await this.updateScene(deltaTime);

    // 카메라는 항상 업데이트
    this.cameraSystem.followTarget(this.player.x, this.player.y);
    this.cameraSystem.applyToContainer(this.gameLayer);
  }

  /**
   * 플레이어 업데이트 (자식 클래스에서 호출)
   */
  protected updatePlayer(deltaTime: number): void {
    // 조이스틱 스무딩 업데이트
    if (this.virtualJoystick) {
      this.virtualJoystick.update();
    }

    const input = this.getInputState();
    this.player.setInput(input);
    this.player.update(deltaTime);

    // 월드 경계 제한
    this.player.x = Math.max(
      this.player.radius,
      Math.min(this.worldWidth - this.player.radius, this.player.x)
    );
    this.player.y = Math.max(
      this.player.radius,
      Math.min(this.worldHeight - this.player.radius, this.player.y)
    );
  }

  /**
   * 씬별 업데이트 (자식 클래스에서 구현)
   */
  protected abstract updateScene(deltaTime: number): void | Promise<void>;

  /**
   * 화면 크기 업데이트
   */
  public updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // 줌 레벨을 고려한 화면 크기로 카메라 시스템 업데이트
    this.cameraSystem.updateScreenSize(width / this.zoomLevel, height / this.zoomLevel);
    this.virtualJoystick?.updateScreenSize(width, height);
  }

  /**
   * 플레이어 가져오기
   */
  public getPlayer(): Player {
    return this.player;
  }

  /**
   * 씬 정리
   */
  public destroy(): void {
    // 게임 루프 중지
    if (this.gameLoopId !== undefined) {
      cancelAnimationFrame(this.gameLoopId);
    }

    // 이벤트 리스너 제거
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    // 엔티티 정리
    if (this.isReady) {
      this.player?.destroy();
      this.virtualJoystick?.destroy();
    }

    super.destroy({ children: true });
  }
}
