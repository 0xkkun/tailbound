/**
 * 게임 씬 - 메인 게임 로직
 */

import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { KNOCKBACK_BALANCE, POTION_BALANCE } from '@/config/balance.config';
import { GAME_CONFIG } from '@/config/game.config';
import { AoEEffect } from '@/game/entities/AoEEffect';
import {
  BaseEnemy,
  DokkaebiEnemy,
  EvilSpiritEnemy,
  MaidenGhostEnemy,
  MaskEnemy,
  SkeletonEnemy,
} from '@/game/entities/enemies';
import { EnemyProjectile } from '@/game/entities/EnemyProjectile';
import { ExperienceGem } from '@/game/entities/ExperienceGem';
import { HealthPotion } from '@/game/entities/HealthPotion';
import { MeleeSwing } from '@/game/entities/MeleeSwing';
import { Player } from '@/game/entities/Player';
import { Portal } from '@/game/entities/Portal';
import { Projectile } from '@/game/entities/Projectile';
import { LevelUpUI } from '@/game/ui/LevelUpUI';
import { PixelButton } from '@/game/ui/PixelButton';
import { PortalIndicator } from '@/game/ui/PortalIndicator';
import { checkCircleCollision } from '@/game/utils/collision';
import { DokkaebiFireWeapon } from '@/game/weapons/DokkaebiFireWeapon';
import { FanWindWeapon } from '@/game/weapons/FanWindWeapon';
import { JakduBladeWeapon } from '@/game/weapons/JakduBladeWeapon';
import { MoktakSoundWeapon } from '@/game/weapons/MoktakSoundWeapon';
import { TalismanWeapon } from '@/game/weapons/TalismanWeapon';
import type { Weapon } from '@/game/weapons/Weapon';
import type { PlayerSnapshot } from '@/hooks/useGameState';
import i18n from '@/i18n/config';
import { CombatSystem } from '@/systems/CombatSystem';
import { PortalSpawner } from '@/systems/PortalSpawner';
import { SpawnSystem } from '@/systems/SpawnSystem';
import type { GameResult } from '@/types/game.types';

import { BaseGameScene } from './BaseGameScene';

export class OverworldGameScene extends BaseGameScene {
  // 엔티티
  private enemies: BaseEnemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private experienceGems: ExperienceGem[] = [];
  private healthPotions: HealthPotion[] = [];
  private aoeEffects: AoEEffect[] = [];
  private meleeSwings: MeleeSwing[] = [];

  // 무기
  private weapons: Weapon[] = [];

  // 시스템
  private combatSystem: CombatSystem;
  private spawnSystem: SpawnSystem;
  private portalSpawner: PortalSpawner;

  // 포탈
  private portal: Portal | null = null;
  private portalSpawnTriggered: boolean = false;

  // 게임 상태
  private gameTime: number = 0;
  private enemiesKilled: number = 0;
  private isGameOver: boolean = false;
  private bossDefeated: boolean = false; // 보스 처치 여부

  // UI 요소
  private scoreText!: Text;
  private killIcon!: Sprite;
  private timeText!: Text;
  private levelText!: Text;
  private xpBarBg!: Graphics;
  private xpBarFill!: Graphics;
  private levelUpUI!: LevelUpUI;
  private portalIndicator!: PortalIndicator;
  private settingsButton!: Container;
  private settingsMenu: Container | null = null;

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
      Assets.load('/assets/tile/tile1.png'), // 바닥 타일 1 (32x48)
      Assets.load('/assets/tile/tile2.png'), // 바닥 타일 2 (32x48)
      Assets.load('/assets/tile/tile3.png'), // 바닥 타일 3 (32x32)
    ]);
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
    const tile1Texture = Assets.get('/assets/tile/tile1.png');
    const tile2Texture = Assets.get('/assets/tile/tile2.png');
    const tile3Texture = Assets.get('/assets/tile/tile3.png');

    // 픽셀 아트 렌더링 설정
    tile1Texture.source.scaleMode = 'nearest';
    tile2Texture.source.scaleMode = 'nearest';
    tile3Texture.source.scaleMode = 'nearest';

    const worldWidth = GAME_CONFIG.world.overworld.width;
    const worldHeight = GAME_CONFIG.world.overworld.height;
    const tileWidth = 32;
    const tileHeight = 32; // 기본 높이

    // 타일 타입별 가중치 (자연스러운 분포를 위해)
    const tileWeights = [
      { texture: tile1Texture, weight: 4, height: 48 }, // 40%
      { texture: tile2Texture, weight: 4, height: 48 }, // 40%
      { texture: tile3Texture, weight: 2, height: 32 }, // 20%
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
        tile.x = x;
        tile.y = y + (tileHeight - selectedTile.height); // 하단 정렬
        tile.anchor.set(0, 0);
        this.gameLayer.addChild(tile);
      }
    }

    console.log('무작위 타일 배경 생성 완료');
  }

  /**
   * 풀 장식 무작위 배치
   */
  // private createGrassDecorations(): void {
  //   const grassTexture = Assets.get('/assets/tile/tile_deco.png');
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
    // 플레이어 레벨업 콜백 설정
    this.player.onLevelUp = (level, choices) => {
      console.log(`플레이어가 레벨 ${level}에 도달했습니다!`);
      // 조이스틱 상태 리셋 (레벨업 UI 표시 전)
      if (this.virtualJoystick) {
        this.virtualJoystick.reset();
      }
      // await는 콜백 함수를 async로 만들어야 하지만, 레벨업 UI는 비동기로 로드해도 무방
      void this.levelUpUI.show(choices);
    };

    // 초기 무기: 부적
    const talisman = new TalismanWeapon();
    this.weapons.push(talisman);

    // 적 처치 시 경험치 젬 및 포션 드롭 콜백 설정
    this.combatSystem.onEnemyKilled = (result) => {
      // 경험치 젬 드롭
      const gem = new ExperienceGem(result.position.x, result.position.y, result.xpValue);
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

    // 개발 환경: 5초 후 자동으로 보스 처치 이벤트 발생
    if (import.meta.env.DEV) {
      setTimeout(() => {
        console.log('[DEV] 자동 보스 처치 (5초 후)');
        this.handleBossDefeat();
      }, 5000);
    }

    console.log('게임 시작!');
  }

  /**
   * UI 초기화
   */
  private initUI(): void {
    // zIndex 정렬 활성화
    this.uiLayer.sortableChildren = true;

    // 처치 아이콘 및 텍스트
    this.loadAndCreateKillUI();

    // 시간 텍스트
    this.timeText = new Text('0:00', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.timeText.resolution = 2; // 고해상도 렌더링
    this.timeText.anchor.set(0.5, 0);
    this.timeText.x = this.screenWidth / 2;
    this.timeText.y = 20;
    this.uiLayer.addChild(this.timeText);

    // 레벨 텍스트
    this.levelText = new Text('Lv.1', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 32,
      fill: 0xffff00,
      fontWeight: 'bold',
    });
    this.levelText.resolution = 2; // 고해상도 렌더링
    this.levelText.x = 20;
    this.levelText.y = 88; // 위로 이동 (110 -> 75)
    this.uiLayer.addChild(this.levelText);

    // 경험치 바 배경
    this.xpBarBg = new Graphics();
    this.xpBarBg.rect(0, 0, 300, 15);
    this.xpBarBg.fill(0x333333);
    this.xpBarBg.x = 20;
    this.xpBarBg.y = 120; // 위로 이동 (145 -> 110)
    this.uiLayer.addChild(this.xpBarBg);

    // 경험치 바 채우기
    this.xpBarFill = new Graphics();
    this.xpBarFill.x = 20;
    this.xpBarFill.y = 120; // 위로 이동 (145 -> 110)
    this.uiLayer.addChild(this.xpBarFill);

    // 레벨업 UI
    this.levelUpUI = new LevelUpUI();
    this.uiLayer.addChild(this.levelUpUI);

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
  }

  /**
   * 처치 아이콘 및 텍스트 로드 및 생성
   */
  private async loadAndCreateKillUI(): Promise<void> {
    try {
      // 해골 아이콘 로드
      const texture = await Assets.load('/assets/power-up/kill.png');

      // 픽셀 아트 렌더링 설정
      if (texture.baseTexture) {
        texture.baseTexture.scaleMode = 'nearest';
      }

      // 해골 아이콘 생성
      this.killIcon = new Sprite(texture);
      this.killIcon.anchor.set(0, 0.5);
      this.killIcon.scale.set(0.5); // 크기 조정
      this.killIcon.x = 10;
      this.killIcon.y = 60 + 12; // 텍스트 중앙에 맞춤
      this.uiLayer.addChild(this.killIcon);

      // 점수 텍스트 (아이콘 오른쪽에 배치)
      this.scoreText = new Text('0', {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 32,
        fill: 0xffffff,
      });
      this.scoreText.resolution = 2; // 고해상도 렌더링
      this.scoreText.x = 4 + this.killIcon.width + 10; // 아이콘 너비 + 간격
      this.scoreText.y = 60;
      this.uiLayer.addChild(this.scoreText);
    } catch (error) {
      console.error('해골 아이콘 로드 실패:', error);

      // 폴백: 텍스트만 표시
      this.scoreText = new Text('처치: 0', {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 32,
        fill: 0xffffff,
      });
      this.scoreText.resolution = 2;
      this.scoreText.x = 20;
      this.scoreText.y = 50;
      this.uiLayer.addChild(this.scoreText);
    }
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

    // 게임 시간 증가
    this.gameTime += deltaTime;

    // 1. 플레이어 업데이트 (BaseGameScene의 메서드 사용)
    this.updatePlayer(deltaTime);

    // 4. 무기 업데이트 및 발사
    for (const weapon of this.weapons) {
      // 쿨다운 배율 적용 (쿨타임이 낮을수록 빠르게 발사)
      const effectiveDeltaTime = deltaTime / this.player.cooldownMultiplier;
      weapon.update(effectiveDeltaTime, this.player);

      // 궤도형 무기 (DokkaebiFireWeapon) 업데이트
      if (weapon instanceof DokkaebiFireWeapon) {
        weapon.updateOrbitals(deltaTime, this.player);
      }

      // 고정형 무기 (JakduBladeWeapon) 업데이트
      if (weapon instanceof JakduBladeWeapon) {
        weapon.updateBlades(deltaTime, this.player);
      }

      // 발사 (투사체형, AoE형, 근접형)
      const playerPos = { x: this.player.x, y: this.player.y };
      const fireResult = await Promise.resolve(weapon.fire(playerPos, this.enemies, this.player));

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
        this.player.takeDamage(enemyProj.damage);
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
        for (const enemy of this.enemies) {
          // 죽은 적이거나 이미 이 AoE에 맞은 적은 스킵
          if (!enemy.active || !enemy.isAlive() || aoe.hasHitEnemy(enemy.id)) {
            continue;
          }

          const dx = enemy.x - aoe.x;
          const dy = enemy.y - aoe.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= aoe.radius) {
            enemy.takeDamage(aoe.damage);
            aoe.markEnemyHit(enemy.id); // 이 적을 맞힌 것으로 기록

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

    // 7. 근접 휘두르기 업데이트 및 충돌
    for (const swing of this.meleeSwings) {
      swing.update(deltaTime);

      // 각도 범위 내 적에게 데미지
      for (const enemy of this.enemies) {
        if (!enemy.active || !enemy.isAlive()) continue;

        // 이미 이 휘두르기에 맞은 적은 스킵
        const enemyId = `${enemy.x}_${enemy.y}`; // 간단한 ID
        if (swing.hasHitEnemy(enemyId)) continue;

        const dx = enemy.x - swing.x;
        const dy = enemy.y - swing.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (swing.isInRange(angle, distance)) {
          enemy.takeDamage(swing.damage);
          swing.markEnemyHit(enemyId);

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
          if (!orbital.active) continue;

          for (const enemy of this.enemies) {
            if (!enemy.active || !enemy.isAlive()) continue;

            // 궤도와 적 충돌 체크 (원형 충돌)
            if (checkCircleCollision(orbital, enemy)) {
              // 틱 데미지: 일정 시간마다만 데미지 적용
              if (orbital.canHitEnemy(enemy.id)) {
                enemy.takeDamage(orbital.damage);
                orbital.recordEnemyHit(enemy.id);

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

          for (const enemy of this.enemies) {
            if (!enemy.active || !enemy.isAlive()) continue;

            // 이미 최대 타격 횟수에 도달한 적은 스킵
            if (!blade.canHitEnemy(enemy.id)) continue;

            // 작두와 적 충돌 체크 (원형 충돌)
            if (checkCircleCollision(blade, enemy)) {
              enemy.takeDamage(blade.damage);
              blade.recordHit(enemy.id); // 타격 기록

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
      const playerPos = { x: this.player.x, y: this.player.y };
      enemy.setTarget(playerPos);
      enemy.update(deltaTime);
    }

    // 11. 적 스폰 (플레이어 위치 기준)
    const playerPos = { x: this.player.x, y: this.player.y };
    this.spawnSystem.update(deltaTime, this.enemies, this.gameTime, playerPos);

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
              '/assets/enemy/woman-ghost-projectile.png',
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
              '/assets/enemy/woman-ghost-projectile.png',
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
    this.scoreText.text = `${this.enemiesKilled}`;

    // 시간
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    this.timeText.text = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // 레벨
    this.levelText.text = `Lv.${this.player.getLevel()}`;

    // 경험치 바
    const progress = this.player.getLevelProgress();
    this.xpBarFill.clear();
    this.xpBarFill.rect(0, 0, 300 * progress, 15);
    this.xpBarFill.fill(0x00ff00);
  }

  /**
   * 보스 처치 이벤트 핸들러
   */
  private handleBossDefeat(): void {
    this.bossDefeated = true;
    console.log('보스 처치! 포탈 생성 준비...');
  }

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
    }

    // 조이스틱 상태 리셋 (레벨업 UI가 닫힌 후)
    if (this.virtualJoystick) {
      this.virtualJoystick.reset();
    }
  }

  /**
   * 무기 추가
   */
  private async addWeapon(weaponId: string): Promise<void> {
    console.log(`무기 추가: ${weaponId}`);

    switch (weaponId) {
      case 'weapon_talisman': {
        // 이미 부적이 있으면 업그레이드, 없으면 추가
        const existingTalisman = this.weapons.find((w) => w instanceof TalismanWeapon);
        if (existingTalisman) {
          existingTalisman.levelUp();
          console.log(`부적 레벨업! Lv.${existingTalisman.level}`);
        } else {
          const talisman = new TalismanWeapon();
          this.weapons.push(talisman);
          console.log('부적 무기 추가 완료!');
        }
        break;
      }
      case 'weapon_dokkaebi_fire': {
        // 이미 도깨비불이 있으면 업그레이드, 없으면 추가
        const existingDokkaebi = this.weapons.find((w) => w instanceof DokkaebiFireWeapon);
        if (existingDokkaebi) {
          existingDokkaebi.levelUp();
          // 레벨업 시 궤도 재생성
          await (existingDokkaebi as DokkaebiFireWeapon).spawnOrbitals(this.player, this.gameLayer);
          console.log(`도깨비불 레벨업! Lv.${existingDokkaebi.level}`);
        } else {
          const dokkaebi = new DokkaebiFireWeapon();
          this.weapons.push(dokkaebi);
          // 최초 생성 시 궤도 생성
          await dokkaebi.spawnOrbitals(this.player, this.gameLayer);
          console.log('도깨비불 무기 추가 완료!');
        }
        break;
      }
      case 'weapon_moktak': {
        // 이미 목탁이 있으면 업그레이드, 없으면 추가
        const existingMoktak = this.weapons.find((w) => w instanceof MoktakSoundWeapon);
        if (existingMoktak) {
          existingMoktak.levelUp();
          console.log(`목탁 소리 레벨업! Lv.${existingMoktak.level}`);
        } else {
          const moktak = new MoktakSoundWeapon();
          this.weapons.push(moktak);
          console.log('목탁 소리 무기 추가 완료!');
        }
        break;
      }
      case 'weapon_jakdu': {
        // 이미 작두날이 있으면 업그레이드, 없으면 추가
        const existingJakdu = this.weapons.find((w) => w instanceof JakduBladeWeapon);
        if (existingJakdu) {
          existingJakdu.levelUp();
          // 레벨업 시 작두 재생성
          await (existingJakdu as JakduBladeWeapon).spawnBlades(this.player, this.gameLayer);
          console.log(`작두날 레벨업! Lv.${existingJakdu.level}`);
        } else {
          const jakdu = new JakduBladeWeapon();
          this.weapons.push(jakdu);
          // 최초 생성 시 작두 생성
          await jakdu.spawnBlades(this.player, this.gameLayer);
          console.log('작두날 무기 추가 완료!');
        }
        break;
      }
      case 'weapon_fan_wind': {
        // 이미 부채바람이 있으면 업그레이드, 없으면 추가
        const existingFanWind = this.weapons.find((w) => w instanceof FanWindWeapon);
        if (existingFanWind) {
          existingFanWind.levelUp();
          console.log(`부채바람 레벨업! Lv.${existingFanWind.level}`);
        } else {
          const fanWind = new FanWindWeapon();
          this.weapons.push(fanWind);
          console.log('부채바람 무기 추가 완료!');
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

    const centerX = this.screenWidth / 2;
    const centerY = this.screenHeight / 2;

    // 게임 오버 UI 컨테이너 생성 (최상위 레이어)
    const gameOverContainer = new Container();
    gameOverContainer.zIndex = 10000; // 모든 UI보다 위에 표시
    this.uiLayer.addChild(gameOverContainer);

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
        fontSize: 64,
        fill: 0xff0000,
      },
    });
    gameOverText.resolution = 2; // 고해상도 렌더링
    gameOverText.anchor.set(0.5);
    gameOverText.x = centerX;
    gameOverText.y = centerY - 150;
    gameOverContainer.addChild(gameOverText);

    // 생존 시간 표시 (분:초 형식)
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const timeText = new Text({
      text: i18n.t('gameOver.survivalTime', { time: formattedTime }),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 32,
        fill: 0xffffff,
      },
    });
    timeText.resolution = 2; // 고해상도 렌더링
    timeText.anchor.set(0.5);
    timeText.x = centerX;
    timeText.y = centerY - 80;
    gameOverContainer.addChild(timeText);

    // 처치한 적 표시
    const killsText = new Text({
      text: i18n.t('gameOver.enemiesKilled', { count: this.enemiesKilled }),
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 32,
        fill: 0xffffff,
      },
    });
    killsText.resolution = 2; // 고해상도 렌더링
    killsText.anchor.set(0.5);
    killsText.x = centerX;
    killsText.y = centerY - 40;
    gameOverContainer.addChild(killsText);

    // 버튼 크기 및 간격 (설정 메뉴와 동일: 184x56)
    const buttonWidth = 184;
    const buttonHeight = 56;
    const buttonGap = buttonHeight + 12;

    // 로비로 돌아가기 버튼 (아이콘과 함께)
    this.createMenuButtonWithIcon(
      gameOverContainer,
      i18n.t('gameOver.returnToLobby'),
      '/assets/gui/back.png',
      centerX,
      centerY + 40,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('로비로 돌아가기 버튼 클릭!');
        this.onReturnToLobby?.();
      }
    );

    // 게임 다시하기 버튼 (아이콘과 함께)
    this.createMenuButtonWithIcon(
      gameOverContainer,
      i18n.t('gameOver.restart'),
      '/assets/gui/restart.png',
      centerX,
      centerY + 40 + buttonGap,
      buttonWidth,
      buttonHeight,
      () => {
        console.log('게임 다시하기 버튼 클릭!');
        this.onRestartGame?.();
      }
    );

    // 게임 오버 결과 콜백
    if (this.onGameOver) {
      const result: GameResult = {
        score: this.enemiesKilled * 100,
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
    buttonContainer.x = 30; // 왼쪽 상단 (경험치 바 옆)
    buttonContainer.y = 30;
    buttonContainer.zIndex = 1000; // 다른 UI보다 위에

    // 설정 아이콘 (톱니바퀴 이미지)
    const icon = Sprite.from('/assets/gui/settings.png');
    icon.width = 40;
    icon.height = 40;
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
   * 설정 메뉴 토글
   */
  private toggleSettingsMenu(): void {
    if (this.settingsMenu) {
      // 메뉴 닫기
      this.uiLayer.removeChild(this.settingsMenu);
      this.settingsMenu.destroy();
      this.settingsMenu = null;
    } else {
      // 조이스틱 상태 리셋 (설정 메뉴 열기 전)
      if (this.virtualJoystick) {
        this.virtualJoystick.reset();
      }
      // 메뉴 열기
      this.settingsMenu = this.createSettingsMenu();
      this.uiLayer.addChild(this.settingsMenu);
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
      '/assets/gui/resume.png',
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
      '/assets/gui/restart.png',
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
    //   '/assets/gui/sound.png',
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
      '/assets/gui/back.png',
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
   * 화면 크기 업데이트 오버라이드
   */
  public updateScreenSize(width: number, height: number): void {
    super.updateScreenSize(width, height);

    // 씬별 추가 업데이트
    this.spawnSystem.updateScreenSize(width, height);
    this.timeText.x = width / 2;

    // 설정 버튼 위치 업데이트 (왼쪽 상단 고정)
    if (this.settingsButton) {
      this.settingsButton.x = 350;
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
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

      // Static 캐시 정리 (게임 종료 시)
      BaseEnemy.clearAllCaches();
    }

    // 부모 destroy 호출
    super.destroy();

    console.log('OverworldGameScene 정리 완료');
  }
}
