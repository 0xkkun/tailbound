/**
 * 보스 전투 시스템
 *
 * 보스 스폰, 전투, 보상 처리를 담당
 */

import { BossProjectile } from '@game/entities/BossProjectile';
import { BossSoul } from '@game/entities/BossSoul';
import { WhiteTigerBoss } from '@game/entities/enemies/WhiteTigerBoss';
import { FireAOE } from '@game/entities/FireAOE';
import { FireballProjectile } from '@game/entities/FireballProjectile';
import { LightningEffect } from '@game/entities/LightningEffect';
import type { Player } from '@game/entities/Player';
import { SpiralChargeEffect } from '@game/entities/SpiralChargeEffect';
import { AOEWarning } from '@game/entities/warnings/AOEWarning';
import { WarningLine } from '@game/entities/warnings/WarningLine';
import { BossHealthBar } from '@game/ui/BossHealthBar';
import { StageClearUI } from '@game/ui/StageClearUI';
import { checkCircleCollision } from '@game/utils/collision';
import { audioManager } from '@services/audioManager';
import type { LevelUpChoice } from '@systems/LevelSystem';
import { Container, type Spritesheet } from 'pixi.js';

export class BossSystem {
  // 엔티티
  private boss: WhiteTigerBoss | null = null;
  private bossProjectiles: BossProjectile[] = [];
  private fireballProjectiles: FireballProjectile[] = [];
  private spiralChargeEffect: SpiralChargeEffect | null = null;
  private aoeWarnings: AOEWarning[] = [];
  private fireAOEs: FireAOE[] = [];
  private warningLines: WarningLine[] = [];
  private lightningEffects: LightningEffect[] = [];
  private bossSoul: BossSoul | null = null;

  // UI
  private bossHealthBar: BossHealthBar | null = null;
  private stageClearUI: StageClearUI | null = null;

  // 레이어 참조
  private gameLayer: Container;
  private uiLayer: Container;

  // 플레이어 참조
  private player: Player;

  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  // 게임 시간
  private gameTime: number = 0;

  // 상태
  private isActive: boolean = false;
  private isBossDefeated: boolean = false;
  private isSoulCollected: boolean = false;

  // spritesheet (경험치 젬용)
  private spiritEnergySpritesheet: Spritesheet | null = null;

  // 콜백
  public onStageClear?: () => void;
  public onShowLevelUpUI?: (choices: LevelUpChoice[]) => void;
  public onReturnToLobby?: () => void;

  constructor(
    gameLayer: Container,
    uiLayer: Container,
    player: Player,
    screenWidth: number,
    screenHeight: number,
    spiritEnergySpritesheet?: Spritesheet
  ) {
    this.gameLayer = gameLayer;
    this.uiLayer = uiLayer;
    this.player = player;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.spiritEnergySpritesheet = spiritEnergySpritesheet || null;
  }

  /**
   * 보스 스폰
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async spawnBoss(_x: number, _y: number): Promise<void> {
    // 맵 경계 정의 (월드 크기: 3200x2400)
    const WORLD_HEIGHT = 2400;
    const MAP_TOP = 0;
    const MAP_BOTTOM = WORLD_HEIGHT;
    const MAP_EDGE_THRESHOLD = 600; // 맵 끝으로부터 600px 이내면 "끝"으로 간주

    const spawnX = this.player.x;
    let spawnY: number;
    let entryDirection: 'fromTop' | 'fromBottom';

    // 플레이어가 맵 상단 근처에 있는지 체크
    const isPlayerNearTop = this.player.y < MAP_TOP + MAP_EDGE_THRESHOLD;
    // 플레이어가 맵 하단 근처에 있는지 체크
    const isPlayerNearBottom = this.player.y > MAP_BOTTOM - MAP_EDGE_THRESHOLD;

    // 디버그 로그
    console.log('[BossSystem] Spawn calculation:', {
      playerY: this.player.y,
      mapTop: MAP_TOP,
      mapBottom: MAP_BOTTOM,
      isPlayerNearTop,
      isPlayerNearBottom,
      screenHeight: this.screenHeight,
    });

    // 플레이어 위치에 따라 스폰 위치 결정
    if (isPlayerNearTop) {
      // 플레이어가 상단 근처 -> 아래에서 스폰
      spawnY = this.player.y + this.screenHeight;
      entryDirection = 'fromBottom';
      console.log('[BossSystem] Player near top, spawning from bottom');
    } else if (isPlayerNearBottom) {
      // 플레이어가 하단 근처 -> 위에서 스폰
      spawnY = this.player.y - this.screenHeight;
      entryDirection = 'fromTop';
      console.log('[BossSystem] Player near bottom, spawning from top');
    } else {
      // 플레이어가 중앙 -> 위에서 스폰 (기본값)
      spawnY = this.player.y - this.screenHeight;
      entryDirection = 'fromTop';
      console.log('[BossSystem] Player in center, spawning from top');
    }

    console.log('[BossSystem] Final spawn position:', {
      spawnX,
      spawnY,
      entryDirection,
      playerY: this.player.y,
    });

    this.isActive = true;

    // 보스 생성
    this.boss = new WhiteTigerBoss(`boss_white_tiger`, spawnX, spawnY);
    this.boss.setTarget({ x: this.player.x, y: this.player.y });
    this.boss.setEntryDirection(entryDirection); // 진입 방향 설정
    console.log('[BossSystem] Boss created with entry direction:', entryDirection);

    // 보스 투사체 발사 콜백
    this.boss.onFireProjectile = (projectile: BossProjectile) => {
      this.bossProjectiles.push(projectile);
      this.gameLayer.addChild(projectile);
    };

    // 보스 불꽃 발사 콜백
    this.boss.onFireFireball = (projectile: FireballProjectile) => {
      this.fireballProjectiles.push(projectile);
      this.gameLayer.addChild(projectile);
      // z-index를 위해 최상단으로 이동
      projectile.zIndex = 1000;
    };

    // 보스 나선형 차징 이펙트 생성 콜백
    this.boss.onCreateChargeEffect = (boss: WhiteTigerBoss) => {
      // 기존 이펙트 제거 (안전장치)
      if (this.spiralChargeEffect) {
        this.gameLayer.removeChild(this.spiralChargeEffect);
        this.spiralChargeEffect.destroy();
      }

      this.spiralChargeEffect = new SpiralChargeEffect(boss);
      this.gameLayer.addChild(this.spiralChargeEffect);
      // 차징 이펙트를 보스보다 위에 표시
      this.spiralChargeEffect.zIndex = boss.zIndex + 100;
    };

    // 차징 이펙트 제거 콜백
    this.boss.onRemoveChargeEffect = () => {
      if (this.spiralChargeEffect) {
        this.gameLayer.removeChild(this.spiralChargeEffect);
        this.spiralChargeEffect.destroy();
        this.spiralChargeEffect = null;
      }
    };

    // 보스 AOE 경고 생성 콜백
    this.boss.onCreateAOEWarning = (x: number, y: number, radius: number) => {
      const warning = new AOEWarning(x, y, radius);

      // 경고 완료 시 장판 생성
      warning.onSpawnAOE = () => {
        const aoe = new FireAOE(
          `fire_aoe_${Date.now()}_${Math.random()}`,
          x,
          y,
          radius,
          40,
          () => audioManager.playBossWhiteTigerFireSound() // 의존성 주입
        );
        this.fireAOEs.push(aoe);
        this.gameLayer.addChild(aoe);
      };

      this.aoeWarnings.push(warning);
      this.gameLayer.addChild(warning);
    };

    // 보스 경고선 생성 콜백
    this.boss.onCreateWarningLine = (x: number, y: number, direction: { x: number; y: number }) => {
      const warningLine = new WarningLine(x, y, direction, 1500);
      this.warningLines.push(warningLine);
      this.gameLayer.addChild(warningLine);
    };

    // 보스 번개 이펙트 생성 콜백
    this.boss.onCreateLightningEffect = (x: number, y: number, rotation: number) => {
      const effect = new LightningEffect(x, y, rotation);
      this.lightningEffects.push(effect);
      this.gameLayer.addChild(effect);
    };

    // 보스 돌진 충돌 콜백
    this.boss.onDashCollision = (damage: number) => {
      if (this.boss?.isDashingState()) {
        this.handleBossDashCollision(damage);
      }
    };

    this.gameLayer.addChild(this.boss);

    // 보스 체력바 생성
    this.bossHealthBar = new BossHealthBar('흑혈백호', this.boss.maxHealth, this.screenWidth);
    this.uiLayer.addChild(this.bossHealthBar);

    console.log('보스 스폰 완료');
  }

  /**
   * 업데이트
   */
  public update(
    deltaTime: number,
    gameTime?: number,
    playerProjectiles?: Array<{
      active: boolean;
      damage: number;
      piercing: number;
      x: number;
      y: number;
      radius: number;
      hasHitEnemy?: (id: string) => boolean;
      hitEnemy?: (id: string) => void;
    }>,
    aoeEffects?: Array<{
      active: boolean;
      damage: number;
      x: number;
      y: number;
      radius: number;
      isEffectStarted?: () => boolean;
      canHitEnemyThisTick?: (id: string) => boolean;
      recordEnemyHit?: (id: string) => void;
    }>,
    meleeSwings?: Array<{
      active: boolean;
      damage: number;
      x: number;
      y: number;
      radius: number;
      hasHitEnemy?: (id: string) => boolean;
      hitEnemy?: (id: string) => void;
    }>
  ): void {
    if (!this.isActive) {
      return;
    }

    // 게임 시간 업데이트
    if (gameTime !== undefined) {
      this.gameTime = gameTime;
    }

    // 보스 업데이트
    if (this.boss && this.boss.active) {
      this.boss.setTarget({ x: this.player.x, y: this.player.y });
      this.boss.update(deltaTime);

      // 체력바 업데이트
      if (this.bossHealthBar) {
        this.bossHealthBar.updateHealth(this.boss.health);
      }

      // 플레이어 투사체와 보스 충돌 처리
      if (playerProjectiles) {
        for (const projectile of playerProjectiles) {
          if (!projectile.active || projectile.hasHitEnemy?.(this.boss.id)) {
            continue;
          }

          if (checkCircleCollision(projectile, this.boss)) {
            // 보스에게 데미지
            this.boss.takeDamage(projectile.damage);

            // 투사체 히트 처리 (중복 피해 방지)
            if (projectile.hitEnemy) {
              projectile.hitEnemy(this.boss.id);
            }

            // 관통 없으면 투사체 제거
            if (projectile.piercing === 0) {
              projectile.active = false;
            }
          }
        }
      }

      // AoE 이펙트와 보스 충돌 처리
      if (aoeEffects) {
        for (const aoe of aoeEffects) {
          if (!aoe.active || !aoe.isEffectStarted?.()) {
            continue;
          }

          // 틱 데미지 체크 (목탁 소리 등)
          if (!aoe.canHitEnemyThisTick?.(this.boss.id)) {
            continue;
          }

          if (checkCircleCollision(aoe, this.boss)) {
            // 보스에게 데미지
            this.boss.takeDamage(aoe.damage);

            // AoE 히트 처리 (틱 데미지 기록)
            if (aoe.recordEnemyHit) {
              aoe.recordEnemyHit(this.boss.id);
            }
          }
        }
      }

      // 근접 공격과 보스 충돌 처리
      if (meleeSwings) {
        for (const melee of meleeSwings) {
          if (!melee.active || melee.hasHitEnemy?.(this.boss.id)) {
            continue;
          }

          if (checkCircleCollision(melee, this.boss)) {
            // 보스에게 데미지
            this.boss.takeDamage(melee.damage);

            // 근접 히트 처리
            if (melee.hitEnemy) {
              melee.hitEnemy(this.boss.id);
            }
          }
        }
      }

      // 보스 체력 0 이하 시 처리
      if (this.boss.health <= 0) {
        console.log(
          `[BossSystem] Boss health: ${this.boss.health}, isBossDefeated: ${this.isBossDefeated}`
        );
        if (!this.isBossDefeated) {
          console.log('[BossSystem] Calling handleBossDefeat()');
          this.handleBossDefeat();
        }
      }

      // 보스와 플레이어 충돌
      if (checkCircleCollision(this.boss, this.player)) {
        this.player.takeDamage(this.boss.damage);
      }
    }

    // 보스 투사체 업데이트
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.bossProjectiles[i];
      projectile.update(deltaTime);

      // 플레이어 충돌
      if (projectile.checkPlayerCollision(this.player)) {
        this.player.takeDamage(projectile.damage);
        projectile.active = false;
      }

      // 비활성화 또는 화면 밖
      if (!projectile.active || projectile.isOutOfBounds(this.screenWidth, this.screenHeight)) {
        this.gameLayer.removeChild(projectile);
        projectile.destroy();
        this.bossProjectiles.splice(i, 1);
      }
    }

    // 불꽃 투사체 업데이트
    for (let i = this.fireballProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.fireballProjectiles[i];

      projectile.update(deltaTime);

      // 플레이어 충돌
      if (projectile.checkPlayerCollision(this.player)) {
        this.player.takeDamage(projectile.damage);
        projectile.active = false;
      }

      // 비활성화 또는 화면 밖
      const isOutOfBounds = projectile.isOutOfBounds(this.screenWidth, this.screenHeight);
      if (!projectile.active || isOutOfBounds) {
        this.gameLayer.removeChild(projectile);
        projectile.destroy();
        this.fireballProjectiles.splice(i, 1);
      }
    }

    // 경고선 업데이트
    for (let i = this.warningLines.length - 1; i >= 0; i--) {
      const line = this.warningLines[i];
      line.update(deltaTime);

      if (line.destroyed) {
        this.gameLayer.removeChild(line);
        this.warningLines.splice(i, 1);
      }
    }

    // 번개 이펙트 업데이트
    for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
      const effect = this.lightningEffects[i];
      effect.update(deltaTime);

      if (effect.destroyed) {
        this.gameLayer.removeChild(effect);
        this.lightningEffects.splice(i, 1);
      }
    }

    // 나선형 차징 이펙트 업데이트
    if (this.spiralChargeEffect) {
      const shouldRemove = this.spiralChargeEffect.update(deltaTime);

      // 보스가 죽었거나 이펙트가 제거 신호를 보내면 제거
      if (shouldRemove || !this.boss || this.boss.destroyed) {
        this.gameLayer.removeChild(this.spiralChargeEffect);
        this.spiralChargeEffect.destroy();
        this.spiralChargeEffect = null;
      }
    }

    // AOE 경고 업데이트
    for (let i = this.aoeWarnings.length - 1; i >= 0; i--) {
      const warning = this.aoeWarnings[i];
      warning.update(deltaTime);

      if (warning.destroyed) {
        this.gameLayer.removeChild(warning);
        warning.destroy();
        this.aoeWarnings.splice(i, 1);
      }
    }

    // 불 장판 업데이트
    for (let i = this.fireAOEs.length - 1; i >= 0; i--) {
      const aoe = this.fireAOEs[i];
      aoe.update(deltaTime);

      // 플레이어 충돌 (1회만 데미지)
      if (aoe.checkPlayerCollision(this.player)) {
        this.player.takeDamage(aoe.damage);
      }

      // 비활성화 시 제거
      if (!aoe.active) {
        this.gameLayer.removeChild(aoe);
        aoe.destroy();
        this.fireAOEs.splice(i, 1);
      }
    }

    // Soul 업데이트 및 획득 체크
    if (this.bossSoul && !this.isSoulCollected) {
      this.bossSoul.update(deltaTime, this.player);

      // Soul이 비활성화되면 (플레이어가 획득함) 제거
      if (!this.bossSoul.active) {
        this.isSoulCollected = true;
        this.gameLayer.removeChild(this.bossSoul);
        this.bossSoul = null;

        // 스테이지 클리어 처리
        this.handleStageClear();
      }
    }

    // 스테이지 클리어 UI 업데이트
    if (this.stageClearUI) {
      this.stageClearUI.update(deltaTime);
    }
  }

  /**
   * 보스 돌진 충돌 처리
   */
  private handleBossDashCollision(damage: number): void {
    if (!this.boss) {
      return;
    }

    // 보스와 플레이어 충돌 체크
    if (checkCircleCollision(this.boss, this.player)) {
      this.player.takeDamage(damage);
    }
  }

  /**
   * 보스 처치 처리
   */
  private handleBossDefeat(): void {
    if (!this.boss) {
      return;
    }

    this.isBossDefeated = true;

    console.log('보스 처치!');

    // 진행 중인 이펙트 모두 정리
    if (this.spiralChargeEffect) {
      this.gameLayer.removeChild(this.spiralChargeEffect);
      this.spiralChargeEffect.destroy();
      this.spiralChargeEffect = null;
    }

    // 경고 이펙트 모두 제거
    for (const warning of this.aoeWarnings) {
      this.gameLayer.removeChild(warning);
      warning.destroy();
    }
    this.aoeWarnings = [];

    // 번개 이펙트 모두 제거
    for (const effect of this.lightningEffects) {
      this.gameLayer.removeChild(effect);
      effect.destroy();
    }
    this.lightningEffects = [];

    // 보스 위치 저장
    const bossX = this.boss.x;
    const bossY = this.boss.y;

    // 보스 제거
    this.gameLayer.removeChild(this.boss);
    this.boss.destroy();
    this.boss = null;

    // 체력바 제거
    if (this.bossHealthBar) {
      this.uiLayer.removeChild(this.bossHealthBar);
      this.bossHealthBar.destroy();
      this.bossHealthBar = null;
    }

    // Soul 드랍
    this.bossSoul = new BossSoul(bossX, bossY);
    this.gameLayer.addChild(this.bossSoul);
    console.log('[BossSystem] Boss soul dropped');
  }

  /**
   * 스테이지 클리어 처리
   */
  private handleStageClear(): void {
    console.log('[BossSystem] Stage cleared!');

    // TODO: Epic 파워업 2개 지급 (LevelSystem을 통해)
    // 현재는 미구현 상태로, 추후 다음 기능 추가 필요:
    // 1. LevelSystem에서 Epic 등급 파워업만 필터링하는 메서드 추가
    // 2. 보상 상자에서 레벨업 UI를 2회 연속으로 표시
    // 3. 각 레벨업 UI에서 Epic 파워업 중 하나를 선택할 수 있도록
    // if (this.onShowLevelUpUI) {
    //   const epicChoices = this.player.getLevelSystem().getEpicChoices();
    //   this.onShowLevelUpUI(epicChoices); // 첫 번째 선택
    //   this.onShowLevelUpUI(epicChoices); // 두 번째 선택
    // }

    // 스테이지 클리어 UI 표시
    this.showStageClearUI();
  }

  /**
   * 스테이지 클리어 UI 표시
   */
  private showStageClearUI(): void {
    // 통계 계산
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const clearTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.stageClearUI = new StageClearUI(
      {
        clearTime,
        totalXP: this.player.getLevelSystem().getTotalXP(),
        level: this.player.getLevel(),
      },
      this.screenWidth,
      this.screenHeight
    );

    // 로비 복귀 콜백 연결
    this.stageClearUI.onReturnToLobby = () => {
      console.log('스테이지 클리어 UI에서 로비 복귀');
      this.onReturnToLobby?.();
    };

    // uiLayer sortableChildren 활성화 및 최상위 zIndex 설정
    this.uiLayer.sortableChildren = true;
    this.stageClearUI.zIndex = 20000; // 모든 UI보다 위에
    this.uiLayer.addChild(this.stageClearUI);

    // 콜백 호출
    this.onStageClear?.();
  }

  /**
   * 활성화 여부
   */
  public get active(): boolean {
    return this.isActive;
  }

  /**
   * 보스 생존 여부
   */
  public get isBossAlive(): boolean {
    return this.boss !== null && this.boss.active;
  }

  /**
   * 보스 인스턴스 가져오기 (무기 타겟팅용)
   */
  public getBoss(): WhiteTigerBoss | null {
    return this.boss;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    // 보스
    if (this.boss) {
      this.gameLayer.removeChild(this.boss);
      this.boss.destroy();
      this.boss = null;
    }

    // 투사체
    for (const projectile of this.bossProjectiles) {
      this.gameLayer.removeChild(projectile);
      projectile.destroy();
    }
    this.bossProjectiles = [];

    // 불꽃 투사체
    for (const projectile of this.fireballProjectiles) {
      this.gameLayer.removeChild(projectile);
      projectile.destroy();
    }
    this.fireballProjectiles = [];

    // 경고선
    for (const line of this.warningLines) {
      this.gameLayer.removeChild(line);
      line.destroy();
    }
    this.warningLines = [];

    // 번개 이펙트
    for (const effect of this.lightningEffects) {
      this.gameLayer.removeChild(effect);
      effect.destroy();
    }
    this.lightningEffects = [];

    // 나선형 차징 이펙트
    if (this.spiralChargeEffect) {
      this.gameLayer.removeChild(this.spiralChargeEffect);
      this.spiralChargeEffect.destroy();
      this.spiralChargeEffect = null;
    }

    // AOE 경고
    for (const warning of this.aoeWarnings) {
      this.gameLayer.removeChild(warning);
      warning.destroy();
    }
    this.aoeWarnings = [];

    // 불 장판
    for (const aoe of this.fireAOEs) {
      this.gameLayer.removeChild(aoe);
      aoe.destroy();
    }
    this.fireAOEs = [];

    // Soul
    if (this.bossSoul) {
      this.gameLayer.removeChild(this.bossSoul);
      this.bossSoul.destroy();
      this.bossSoul = null;
    }

    // UI
    if (this.bossHealthBar) {
      this.uiLayer.removeChild(this.bossHealthBar);
      this.bossHealthBar.destroy();
      this.bossHealthBar = null;
    }

    if (this.stageClearUI) {
      this.uiLayer.removeChild(this.stageClearUI);
      this.stageClearUI.destroy();
      this.stageClearUI = null;
    }

    this.isActive = false;
  }
}
