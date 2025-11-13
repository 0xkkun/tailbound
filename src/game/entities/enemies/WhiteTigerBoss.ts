/**
 * 백호 보스 - 10분 시점 등장
 *
 * 패턴:
 * 1. 번개 탄막 발사 (8방향 → 12방향)
 * 2. 번개 돌진 (경고선 → 돌진)
 */
import { AUDIO_COOLDOWNS, CDN_BASE_URL } from '@config/assets.config';
import { GAME_CONFIG } from '@config/game.config';
import { audioManager } from '@services/audioManager';
import { AnimatedSprite, Assets, Rectangle, Texture } from 'pixi.js';

import type { BossProjectile } from '../BossProjectile';
import { FireballProjectile } from '../FireballProjectile';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class WhiteTigerBoss extends BaseEnemy {
  // 백호 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: `${CDN_BASE_URL}/assets/boss/wt.png`,
    totalWidth: 768, // 16프레임 × 48px
    height: 48,
    frameCount: 16,
    scale: 6.0, // 보스 크기 2배로 증가 (3.0 → 6.0)
  };

  // Idle 스프라이트 설정
  private static readonly IDLE_SPRITE_CONFIG = {
    assetPath: `${CDN_BASE_URL}/assets/boss/wt-idle.png`,
    totalWidth: 336, // 7프레임 × 48px
    height: 48,
    frameCount: 7,
    scale: 6.0,
    animationSpeed: 0.1,
  };

  // 애니메이션 상태
  private isMoving: boolean = false;
  private idleSprite?: AnimatedSprite;
  private walkSprite?: AnimatedSprite;
  private static idleFrames: Texture[] | null = null;
  private static walkFrames: Texture[] | null = null;

  // 패턴 1: 번개 탄막 발사
  private bulletCooldown: number = 5.0; // 5초마다
  private bulletTimer: number = 0;
  public onFireProjectile?: (projectile: BossProjectile) => void;

  // 패턴 추가: 기본 불꽃 공격
  private fireballCooldown: number = 4.0; // 4초마다
  private fireballTimer: number = 0;
  public onFireFireball?: (projectile: FireballProjectile) => void;

  // 패턴 추가: 나선형 불꽃 공격
  private hitCount: number = 0; // 피격 횟수 카운터
  private isChargingSpiral: boolean = false; // 차징 중 여부
  private spiralChargeTimer: number = 0; // 차징 타이머
  private spiralFireTimer: number = 0; // 발사 타이머
  private spiralFireIndex: number = 0; // 나선형 발사 인덱스
  private isFiringSpiral: boolean = false; // 발사 중 여부
  public onCreateChargeEffect?: (boss: WhiteTigerBoss) => void;
  public onRemoveChargeEffect?: () => void;

  // 패턴 추가: 장판 공격
  private hitCountForAOE: number = 0; // 장판 공격용 피격 카운터
  public onCreateAOEWarning?: (x: number, y: number, radius: number) => void;

  // 패턴 2: 번개 돌진
  private dashTimer: number = 0;
  private isDashing: boolean = false;
  private dashState: 'warning' | 'dashing' | 'recovery' | null = null;
  private dashDirection: { x: number; y: number } = { x: 0, y: 0 };
  private dashVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private dashStateTimer: number = 0;
  private lightningTrailTimer: number = 0;
  public onCreateWarningLine?: (x: number, y: number, direction: { x: number; y: number }) => void;
  public onCreateLightningEffect?: (x: number, y: number, rotation: number) => void;
  public onDashCollision?: (damage: number) => void;

  // 초기 진입 방향 (위에서/아래에서)
  private entryDirection: 'fromTop' | 'fromBottom' | null = null;
  private entryTimer: number = 0;
  private readonly ENTRY_DURATION: number = 3.0; // 3초간 진입 (천천히 등장)

  // 피격 효과음 쿨다운
  private lastInjurySoundTime: number = 0;
  private readonly injurySoundCooldown = AUDIO_COOLDOWNS.BOSS_INJURY;

  constructor(id: string, x: number, y: number) {
    // 보스 카테고리로 생성 (initBoss()가 자동 호출됨)
    super(id, x, y, 'boss');

    // idle과 walk 스프라이트 로드
    this.loadBothSprites();
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return WhiteTigerBoss.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'white_tiger_boss';
  }

  /**
   * 진입 방향 설정
   */
  public setEntryDirection(direction: 'fromTop' | 'fromBottom'): void {
    this.entryDirection = direction;
    this.entryTimer = 0;

    // 보스 등장 효과음
    audioManager.playBossWhiteTigerAttackSound();
  }

  /**
   * 백호 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    // Walk 스프라이트 로드
    await BaseEnemy.preloadSpriteType('white_tiger_boss', WhiteTigerBoss.SPRITE_CONFIG);

    // Idle 스프라이트도 로드
    try {
      const baseTexture = await Assets.load(WhiteTigerBoss.IDLE_SPRITE_CONFIG.assetPath);
      baseTexture.source.scaleMode = 'nearest';

      const frames: Texture[] = [];
      const frameWidth =
        WhiteTigerBoss.IDLE_SPRITE_CONFIG.totalWidth / WhiteTigerBoss.IDLE_SPRITE_CONFIG.frameCount;

      for (let i = 0; i < WhiteTigerBoss.IDLE_SPRITE_CONFIG.frameCount; i++) {
        const rect = new Rectangle(
          i * frameWidth,
          0,
          frameWidth,
          WhiteTigerBoss.IDLE_SPRITE_CONFIG.height
        );
        frames.push(new Texture({ source: baseTexture.source, frame: rect }));
      }

      WhiteTigerBoss.idleFrames = frames;
      console.log('[WhiteTigerBoss] Idle sprites preloaded');
    } catch (error) {
      console.error('[WhiteTigerBoss] Failed to preload idle sprites:', error);
    }
  }

  /**
   * 두 스프라이트 모두 로드
   */
  private async loadBothSprites(): Promise<void> {
    // Walk 스프라이트 로드 (BaseEnemy의 sprite 사용)
    // 이미 부모 클래스에서 로드됨

    // Idle 스프라이트 로드
    if (WhiteTigerBoss.idleFrames) {
      this.idleSprite = new AnimatedSprite(WhiteTigerBoss.idleFrames);
      this.idleSprite.anchor.set(0.5);
      this.idleSprite.scale.set(WhiteTigerBoss.IDLE_SPRITE_CONFIG.scale);
      this.idleSprite.animationSpeed = WhiteTigerBoss.IDLE_SPRITE_CONFIG.animationSpeed;
      this.idleSprite.loop = true;
      this.idleSprite.play();
      this.idleSprite.visible = true; // 처음에는 idle 표시

      // 기존 sprite를 walkSprite로 참조
      this.walkSprite = this.sprite;
      if (this.walkSprite) {
        this.walkSprite.visible = false; // 처음에는 walk 숨김
      }

      // idle 스프라이트 추가
      const graphicsIndex = this.getChildIndex(this.graphics);
      this.addChildAt(this.idleSprite, Math.max(0, graphicsIndex));
    }
  }

  /**
   * 애니메이션 상태 전환
   */
  private switchAnimation(moving: boolean): void {
    if (this.isMoving === moving) return; // 이미 같은 상태면 무시

    this.isMoving = moving;

    if (this.idleSprite && this.walkSprite) {
      if (moving) {
        // Walk 애니메이션으로 전환
        this.idleSprite.visible = false;
        this.walkSprite.visible = true;
        this.walkSprite.play();
      } else {
        // Idle 애니메이션으로 전환
        this.walkSprite.visible = false;
        this.idleSprite.visible = true;
        this.idleSprite.play();
      }
    }
  }

  /**
   * 그림자 커스터마이즈 - 보스는 큰 그림자
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.8, this.radius * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.4 });
  }

  /**
   * 스프라이트 tint 설정 (차징 효과용)
   */
  public setSpriteTint(color: number): void {
    if (this.sprite) {
      this.sprite.tint = color;
    }
    if (this.idleSprite) {
      this.idleSprite.tint = color;
    }
    if (this.walkSprite) {
      this.walkSprite.tint = color;
    }
  }

  /**
   * 데미지 받기 오버라이드 (피격 카운터)
   */
  public takeDamage(amount: number, isCritical: boolean = false): void {
    super.takeDamage(amount, isCritical);

    console.log(`[Boss] Taking damage: ${amount}, Health: ${this.health}/${this.maxHealth}`);

    // 피격 효과음 재생 (쿨다운 체크)
    const currentTime = performance.now() / 1000;
    if (currentTime - this.lastInjurySoundTime >= this.injurySoundCooldown) {
      audioManager.playBossWhiteTigerInjurySound();
      this.lastInjurySoundTime = currentTime;
    }

    // 보스가 죽은 경우 패턴을 실행하지 않음
    if (this.health <= 0) {
      console.log('[Boss] Health is 0 or below, skipping patterns');
      return;
    }

    // 나선형 공격 카운터 (30회)
    this.hitCount++;
    if (this.hitCount >= 30 && !this.isChargingSpiral && !this.isFiringSpiral && !this.isDashing) {
      this.startSpiralAttack();
      this.hitCount = 0;
    }

    // 장판 공격 카운터 (60회)
    this.hitCountForAOE++;
    if (this.hitCountForAOE >= 60 && !this.isDashing) {
      this.startAOEAttack();
      this.hitCountForAOE = 0;
    }
  }

  /**
   * 업데이트 (패턴 실행)
   */
  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) {
      return;
    }

    // 체력이 0 이하면 업데이트 중지
    if (this.health <= 0) {
      return;
    }

    // 초기 진입 처리
    if (this.entryDirection !== null) {
      this.entryTimer += deltaTime;

      // 진입 방향에 따른 이동
      const entrySpeed = 150; // 진입 속도 (느리게 등장)
      if (this.entryDirection === 'fromTop') {
        // 위에서 아래로
        this.y += entrySpeed * deltaTime;
      } else {
        // 아래에서 위로
        this.y -= entrySpeed * deltaTime;
      }

      // Walk 애니메이션 사용
      this.switchAnimation(true);

      // 진입 완료
      if (this.entryTimer >= this.ENTRY_DURATION) {
        this.entryDirection = null;
      }

      this.render();
      return;
    }

    // 넉백 처리
    if (this.updateKnockback(deltaTime)) {
      this.render();
      return;
    }

    // 패턴 타이머는 항상 업데이트 (특수 패턴 중에도 계속 카운트)
    this.fireballTimer += deltaTime;
    this.bulletTimer += deltaTime;
    this.dashTimer += deltaTime;

    // 나선형 공격 차징 중
    if (this.isChargingSpiral) {
      this.updateSpiralCharge(deltaTime);
      this.render();
      return;
    }

    // 나선형 공격 발사 중
    if (this.isFiringSpiral) {
      this.updateSpiralFire(deltaTime);
      this.render();
      return;
    }

    // 돌진 중이면 돌진 로직 처리
    if (this.isDashing) {
      this.updateDash(deltaTime);
      this.render();
      return;
    }

    // === 일반 상태 (특수 패턴이 아닐 때) ===

    // 기본 추적 AI
    const currentPos = { x: this.x, y: this.y };
    const dx = this.targetPosition.x - currentPos.x;
    const dy = this.targetPosition.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 이동 거리 임계값 (이 거리 이상일 때만 이동)
    const moveThreshold = 50;
    const isMoving = distance > moveThreshold;

    // 플레이어에게 이동
    if (isMoving) {
      const directionX = dx / distance;
      const directionY = dy / distance;

      this.x += directionX * this.speed * deltaTime;
      this.y += directionY * this.speed * deltaTime;

      // 맵 경계 제한 (보스 반지름만큼 여유)
      const WORLD_WIDTH = GAME_CONFIG.world.overworld.width;
      const WORLD_HEIGHT = GAME_CONFIG.world.overworld.height;
      const margin = this.radius + 50; // 보스 반지름 + 추가 여유 50px

      this.x = Math.max(margin, Math.min(WORLD_WIDTH - margin, this.x));
      this.y = Math.max(margin, Math.min(WORLD_HEIGHT - margin, this.y));

      // 스프라이트 좌우 반전 (idle과 walk 모두)
      const scaleX =
        directionX < 0
          ? -Math.abs(WhiteTigerBoss.IDLE_SPRITE_CONFIG.scale)
          : Math.abs(WhiteTigerBoss.IDLE_SPRITE_CONFIG.scale);

      if (this.sprite) {
        this.sprite.scale.x = scaleX;
      }
      if (this.idleSprite) {
        this.idleSprite.scale.x = scaleX;
      }
      if (this.walkSprite) {
        this.walkSprite.scale.x = scaleX;
      }
    }

    // 애니메이션 상태 전환
    this.switchAnimation(isMoving);

    // 패턴 추가: 기본 불꽃 공격 (일반 이동 중에만)
    if (this.fireballTimer >= this.fireballCooldown) {
      this.fireBasicFireball();
      this.fireballTimer = 0;
    }

    // 패턴 1: 탄막 발사
    if (this.bulletTimer >= this.bulletCooldown) {
      this.fireLightningBullets();
      this.bulletTimer = 0;
    }

    // 패턴 2: 돌진
    const currentDashCooldown = this.health / this.maxHealth > 0.5 ? 8.0 : 6.0;
    if (this.dashTimer >= currentDashCooldown) {
      this.startDash();
      this.dashTimer = 0;
    }

    this.render();
  }

  /**
   * 패턴 추가: 기본 불꽃 공격
   */
  private fireBasicFireball(): void {
    if (!this.onFireFireball || !this.targetPosition) {
      return;
    }

    // 플레이어 방향 계산
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return;
    }

    const direction = {
      x: dx / distance,
      y: dy / distance,
    };

    // FireballProjectile 직접 생성
    const projectile = new FireballProjectile(
      `boss_fireball_${Date.now()}`,
      this.x,
      this.y,
      direction,
      25, // damage
      200, // speed
      20 // radius - 히트박스 크기
    );

    // GameScene에 추가
    this.onFireFireball(projectile);
  }

  /**
   * 패턴 1: 번개 탄막 발사 (불꽃으로 변경)
   */
  private fireLightningBullets(): void {
    if (!this.onFireFireball) {
      return;
    }

    // 공격 효과음 재생
    audioManager.playBossWhiteTigerAttackSound();

    // Phase에 따라 탄막 개수 결정
    const bulletCount = this.health / this.maxHealth > 0.5 ? 8 : 12;
    const angleStep = (Math.PI * 2) / bulletCount;
    const speed = this.health / this.maxHealth > 0.5 ? 250 : 300;

    for (let i = 0; i < bulletCount; i++) {
      const angle = angleStep * i;
      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      // FireballProjectile로 변경
      const projectile = new FireballProjectile(
        `boss_bullet_${Date.now()}_${i}`,
        this.x,
        this.y,
        direction,
        35, // damage
        speed,
        18, // radius - 히트박스 크기
        4 // lifetime
      );

      // GameScene에 추가
      this.onFireFireball(projectile);
    }
  }

  /**
   * 패턴 2: 돌진 시작
   */
  private startDash(): void {
    if (!this.targetPosition) {
      return;
    }

    this.isDashing = true;
    this.dashState = 'warning';
    this.dashStateTimer = 0;

    // 플레이어 방향 계산 및 고정
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.dashDirection = {
      x: dx / distance,
      y: dy / distance,
    };

    // 경고선 생성
    if (this.onCreateWarningLine) {
      this.onCreateWarningLine(this.x, this.y, this.dashDirection);
    }

    // 돌진 준비 중에는 idle 애니메이션
    this.switchAnimation(false);
  }

  /**
   * 돌진 업데이트
   */
  private updateDash(deltaTime: number): void {
    this.dashStateTimer += deltaTime;

    switch (this.dashState) {
      case 'warning':
        // 경고 단계 (1.5초)
        if (this.dashStateTimer >= 1.5) {
          this.dashState = 'dashing';
          this.dashStateTimer = 0;
          this.dashVelocity = {
            x: this.dashDirection.x * 800,
            y: this.dashDirection.y * 800,
          };
          this.lightningTrailTimer = 0;

          // 실제 돌진 시작 시 효과음 재생
          audioManager.playBossWhiteTigerAttackSound();
        }
        break;

      case 'dashing': {
        // 돌진 단계 (0.8초)
        this.x += this.dashVelocity.x * deltaTime;
        this.y += this.dashVelocity.y * deltaTime;

        // 맵 경계 제한
        const WORLD_WIDTH = GAME_CONFIG.world.overworld.width;
        const WORLD_HEIGHT = GAME_CONFIG.world.overworld.height;
        const margin = this.radius + 50; // 보스 반지름 + 추가 여유 50px

        // 경계에 닿으면 돌진 즉시 종료
        if (
          this.x <= margin ||
          this.x >= WORLD_WIDTH - margin ||
          this.y <= margin ||
          this.y >= WORLD_HEIGHT - margin
        ) {
          // 경계 안쪽으로 위치 고정
          this.x = Math.max(margin, Math.min(WORLD_WIDTH - margin, this.x));
          this.y = Math.max(margin, Math.min(WORLD_HEIGHT - margin, this.y));
          // 돌진 종료
          this.dashState = 'recovery';
          this.dashStateTimer = 0;
          this.dashVelocity = { x: 0, y: 0 };
          this.switchAnimation(false);
          break;
        }

        // 돌진 중에는 walk 애니메이션
        this.switchAnimation(true);

        // 번개 잔상 생성 (0.1초마다)
        this.lightningTrailTimer += deltaTime;
        if (this.lightningTrailTimer >= 0.1) {
          this.lightningTrailTimer = 0;
          const rotation = Math.atan2(this.dashDirection.y, this.dashDirection.x);
          this.onCreateLightningEffect?.(this.x, this.y, rotation);
        }

        // 충돌 판정 (GameScene에서 처리하도록 콜백 호출)
        this.onDashCollision?.(100);

        if (this.dashStateTimer >= 0.8) {
          this.dashState = 'recovery';
          this.dashStateTimer = 0;
          this.dashVelocity = { x: 0, y: 0 };
          // 돌진 끝나면 idle로 전환
          this.switchAnimation(false);
        }
        break;
      }

      case 'recovery':
        // 후딜레이 (0.5초)
        if (this.dashStateTimer >= 0.5) {
          this.isDashing = false;
          this.dashState = null;
        }
        break;
    }
  }

  /**
   * 돌진 중인지 확인
   */
  public isDashingState(): boolean {
    return this.isDashing && this.dashState === 'dashing';
  }

  /**
   * 원형 불꽃 공격 시작 (50회 피격 시)
   */
  private startSpiralAttack(): void {
    this.isChargingSpiral = true;
    this.spiralChargeTimer = 0;

    console.log('[Boss] Starting spiral attack - Creating charge effect');

    // 차징 중에는 idle 애니메이션
    this.switchAnimation(false);

    // 차징 이펙트 생성 콜백
    if (this.onCreateChargeEffect) {
      this.onCreateChargeEffect(this);
    } else {
      console.error('[Boss] onCreateChargeEffect callback not set!');
    }
  }

  /**
   * 원형 불꽃 공격 차징 업데이트
   */
  private updateSpiralCharge(deltaTime: number): void {
    this.spiralChargeTimer += deltaTime;

    // 차징 중에는 계속 idle 유지
    this.switchAnimation(false);

    // 2초 차징 완료 후 발사 시작
    if (this.spiralChargeTimer >= 2.0) {
      this.isChargingSpiral = false;
      this.isFiringSpiral = true;
      this.spiralFireTimer = 0;
      this.spiralFireIndex = 0;
      // 차징 이펙트는 발사가 끝날 때까지 유지
    }
  }

  /**
   * 나선형 공격 발사 업데이트
   */
  private updateSpiralFire(deltaTime: number): void {
    this.spiralFireTimer += deltaTime;

    // 발사 중에도 idle 애니메이션 유지
    this.switchAnimation(false);

    // 0.1초마다 불꽃 발사 (나선형)
    const fireInterval = 0.1;
    const totalShots = 96; // 48발 → 96발로 증가

    if (this.spiralFireTimer >= fireInterval) {
      this.spiralFireTimer = 0;

      // 발사
      this.fireSpiralBullet(this.spiralFireIndex);
      this.spiralFireIndex++;

      // 96발 모두 발사 완료
      if (this.spiralFireIndex >= totalShots) {
        this.isFiringSpiral = false;
        this.spiralFireIndex = 0;

        // 차징 이펙트 제거
        if (this.onRemoveChargeEffect) {
          this.onRemoveChargeEffect();
        }

        // 보스 색상 원래대로
        this.setSpriteTint(0xffffff);
      }
    }
  }

  /**
   * 나선형 불꽃 발사 (단일)
   */
  private fireSpiralBullet(index: number): void {
    if (!this.onFireFireball) {
      return;
    }

    // 나선형 계산
    const baseAngle = 0; // 시작 각도
    const angleIncrement = Math.PI / 12; // 15도씩 회전 (더 촘촘한 나선)

    // 각 회전마다 각도 오프셋 추가 (24발씩 4회전)
    const shotsPerRotation = 24; // 한 바퀴당 24발
    const rotationNumber = Math.floor(index / shotsPerRotation); // 현재 회전 번호 (0, 1, 2, 3)
    const rotationOffset = (Math.PI / 24) * rotationNumber; // 각 회전마다 7.5도씩 추가 오프셋

    const angle = baseAngle + angleIncrement * index + rotationOffset;

    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    // 속도는 점진적으로 증가 (150 → 630px/s)
    const speed = 150 + index * 5;

    // FireballProjectile 생성
    const projectile = new FireballProjectile(
      `boss_spiral_${Date.now()}_${index}`,
      this.x,
      this.y,
      direction,
      30, // damage
      speed, // 속도 변화
      18, // radius - 히트박스 크기
      4 // lifeTime
    );

    // GameScene에 추가
    this.onFireFireball(projectile);
  }

  /**
   * 원형 불꽃 공격 (48발 한번에 발사) - 향후 다른 패턴에 사용 가능
   */
  private fireCircularBurst(): void {
    if (!this.onFireFireball) {
      return;
    }

    const totalShots = 48; // 총 48발
    const angleStep = (Math.PI * 2) / totalShots; // 360도를 48개로 나눔

    for (let i = 0; i < totalShots; i++) {
      const angle = angleStep * i;

      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      // 모든 불꽃이 같은 속도로 발사
      const speed = 250; // 고정 속도

      // FireballProjectile 생성
      const projectile = new FireballProjectile(
        `boss_circular_${Date.now()}_${i}`,
        this.x,
        this.y,
        direction,
        30, // damage
        speed,
        20, // radius - 히트박스 크기
        4 // lifeTime (4초)
      );

      // GameScene에 추가
      this.onFireFireball(projectile);
    }
  }

  /**
   * 장판 공격 시작
   */
  private startAOEAttack(): void {
    if (!this.onCreateAOEWarning || !this.targetPosition) {
      return;
    }

    // 장판 공격 시작 시 idle 애니메이션
    this.switchAnimation(false);

    // 플레이어 반지름을 모르므로 고정값 사용 (일반적으로 24)
    const playerRadius = 24;
    const aoeRadius = playerRadius * 5; // 플레이어 반지름 기준 5배 (히트박스 크기)

    // 보스 주변 2개
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200; // 100~300px
      const x = this.x + Math.cos(angle) * distance;
      const y = this.y + Math.sin(angle) * distance;

      this.onCreateAOEWarning(x, y, aoeRadius);
    }

    // 플레이어 주변 3개
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 150; // 50~200px
      const x = this.targetPosition.x + Math.cos(angle) * distance;
      const y = this.targetPosition.y + Math.sin(angle) * distance;

      this.onCreateAOEWarning(x, y, aoeRadius);
    }
  }
}
