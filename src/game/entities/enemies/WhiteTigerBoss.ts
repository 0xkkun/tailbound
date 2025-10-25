/**
 * 백호 보스 - 10분 시점 등장
 *
 * 패턴:
 * 1. 번개 탄막 발사 (8방향 → 12방향)
 * 2. 번개 돌진 (경고선 → 돌진)
 */

import type { BossProjectile } from '../BossProjectile';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class WhiteTigerBoss extends BaseEnemy {
  // 백호 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/boss/wt.png',
    totalWidth: 768, // 16프레임 × 48px
    height: 48,
    frameCount: 16,
    scale: 3.0, // 보스는 크게
  };

  // 패턴 1: 번개 탄막 발사
  private bulletCooldown: number = 3.0; // 3초마다
  private bulletTimer: number = 0;
  public onFireProjectile?: (projectile: BossProjectile) => void;

  // 패턴 2: 번개 돌진
  private dashCooldown: number = 6.0; // 6초마다
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

  constructor(id: string, x: number, y: number) {
    // 보스는 항상 'boss' 티어
    super(id, x, y, 'boss');

    // 보스 고유 스탯은 ENEMY_BALANCE.boss에서 자동으로 적용됨
    // 넉백 저항 설정
    this.knockbackResistance = 0.2; // 80% 저항
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return WhiteTigerBoss.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'white_tiger_boss';
  }

  /**
   * 백호 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('white_tiger_boss', WhiteTigerBoss.SPRITE_CONFIG);
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
   * 업데이트 (패턴 실행)
   */
  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) {
      return;
    }

    // 넉백 처리
    if (this.updateKnockback(deltaTime)) {
      this.render();
      return;
    }

    // 돌진 중이면 돌진 로직 처리
    if (this.isDashing) {
      this.updateDash(deltaTime);
      this.render();
      return;
    }

    // 기본 추적 AI
    const currentPos = { x: this.x, y: this.y };
    const dx = this.targetPosition.x - currentPos.x;
    const dy = this.targetPosition.y - currentPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 플레이어에게 이동
    if (distance > 0) {
      const directionX = dx / distance;
      const directionY = dy / distance;

      this.x += directionX * this.speed * deltaTime;
      this.y += directionY * this.speed * deltaTime;

      // 스프라이트 좌우 반전
      if (this.sprite && directionX !== 0) {
        if (directionX < 0) {
          this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        } else {
          this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        }
      }
    }

    // 패턴 1: 탄막 발사
    this.bulletTimer += deltaTime;
    if (this.bulletTimer >= this.bulletCooldown) {
      this.fireLightningBullets();
      this.bulletTimer = 0;
    }

    // 패턴 2: 돌진
    this.dashTimer += deltaTime;
    const currentDashCooldown = this.health / this.maxHealth > 0.5 ? 6.0 : 4.0;
    if (this.dashTimer >= currentDashCooldown) {
      this.startDash();
      this.dashTimer = 0;
    }

    this.render();
  }

  /**
   * 패턴 1: 번개 탄막 발사
   */
  private fireLightningBullets(): void {
    if (!this.onFireProjectile) {
      return;
    }

    // Phase에 따라 탄막 개수 결정
    const bulletCount = this.health / this.maxHealth > 0.5 ? 8 : 12;
    const angleStep = (Math.PI * 2) / bulletCount;
    const speed = this.health / this.maxHealth > 0.5 ? 250 : 300;

    // BossProjectile을 동적으로 import하여 생성
    import('../BossProjectile').then(({ BossProjectile }) => {
      for (let i = 0; i < bulletCount; i++) {
        const angle = angleStep * i;
        const direction = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };

        const projectile = new BossProjectile(
          `boss_bullet_${Date.now()}_${i}`,
          this.x,
          this.y,
          direction,
          40, // damage
          speed
        );

        // GameScene에 추가
        this.onFireProjectile?.(projectile);
      }
    });
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
        }
        break;

      case 'dashing':
        // 돌진 단계 (0.8초)
        this.x += this.dashVelocity.x * deltaTime;
        this.y += this.dashVelocity.y * deltaTime;

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
        }
        break;

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
}
