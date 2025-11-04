/**
 * 악령 적 (원거리 공격) - 낮은 체력, 빠른 속도, 빠른 공격
 *
 * 플레이어와 일정 거리를 유지하며 투사체를 발사
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { ENEMY_TYPE_BALANCE, FIELD_ENEMY_BALANCE } from '@config/balance.config';
import type { FieldEnemyTier } from '@game/data/enemies';
import { AnimatedSprite, Assets, Rectangle, Texture } from 'pixi.js';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class EvilSpiritEnemy extends BaseEnemy {
  // 악령 스프라이트 설정 (티어별 - 크기만 변경)
  private static readonly SPRITE_CONFIGS: Record<FieldEnemyTier, EnemySpriteConfig> = {
    low: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/evil-spirit.png`,
      totalWidth: 192, // 32 * 6 frames
      height: 32,
      frameCount: 6,
      scale: 2.5, // 기본 크기
    },
    medium: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/evil-spirit.png`,
      totalWidth: 192, // 32 * 6 frames
      height: 32,
      frameCount: 6,
      scale: 3.0, // 20% 크게
    },
    high: {
      assetPath: `${CDN_BASE_URL}/assets/enemy/evil-spirit.png`,
      totalWidth: 192, // 32 * 6 frames
      height: 32,
      frameCount: 6,
      scale: 3.5, // 40% 크게
    },
  };

  // 공격 애니메이션 스프라이트
  private attackSprite: AnimatedSprite | null = null;
  private isAttacking: boolean = false;
  private hasProjectileFired: boolean = false; // 공격 중 발사체 발사 여부

  // 원거리 공격 설정
  private attackCooldown: number = ENEMY_TYPE_BALANCE.evilSpirit.attackCooldown;
  private attackTimer: number = 0;
  private attackRange: number = ENEMY_TYPE_BALANCE.evilSpirit.attackRange;
  private keepDistance: number = ENEMY_TYPE_BALANCE.evilSpirit.keepDistance;

  // 투사체 생성 콜백
  public onFireProjectile?: (projInfo: {
    startX: number;
    startY: number;
    direction: { x: number; y: number };
  }) => void;

  constructor(id: string, x: number, y: number, tier: FieldEnemyTier = 'medium') {
    super(id, x, y, 'field', tier);

    // 악령 고유 스탯: 낮은 체력, 빠름, 원거리 공격
    const baseStats = FIELD_ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.evilSpirit;
    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);

    // 티어에 따라 히트박스도 증가
    const radiusMultiplier = tier === 'medium' ? 1.2 : tier === 'high' ? 1.4 : 1;
    this.radius = typeConfig.radius * radiusMultiplier;

    this.loadAttackAnimation();
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return EvilSpiritEnemy.SPRITE_CONFIGS[this.getFieldTier()];
  }

  protected getEnemyType(): string {
    return `evil_spirit_${this.getFieldTier()}`;
  }

  /**
   * 그림자 커스터마이즈 - 악령이므로 그림자를 흐릿하고 작게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.6, this.radius * 0.2);
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
  }

  /**
   * 악령 스프라이트 preload (모든 티어)
   */
  public static async preloadSprites(): Promise<void> {
    await Promise.all([
      BaseEnemy.preloadSpriteType('evil_spirit_low', EvilSpiritEnemy.SPRITE_CONFIGS.low),
      BaseEnemy.preloadSpriteType('evil_spirit_medium', EvilSpiritEnemy.SPRITE_CONFIGS.medium),
      BaseEnemy.preloadSpriteType('evil_spirit_high', EvilSpiritEnemy.SPRITE_CONFIGS.high),
    ]);
  }

  /**
   * 공격 애니메이션 로드
   */
  private async loadAttackAnimation(): Promise<void> {
    const assetPath = `${CDN_BASE_URL}/assets/enemy/evil-spirit-attack.png`;

    // 텍스처 로드
    const texture = await Assets.load(assetPath);

    // 프레임 생성 (32x32, 6프레임)
    const frameWidth = 32;
    const frameHeight = 32;
    const totalFrames = 6;
    const frames: Texture[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const x = i * frameWidth;
      const rect = new Rectangle(x, 0, frameWidth, frameHeight);
      frames.push(new Texture({ source: texture.source, frame: rect }));
    }

    // 티어에 따른 스케일 설정
    const tier = this.getFieldTier();
    const spriteScale = tier === 'low' ? 2.5 : tier === 'medium' ? 3.0 : 3.5;

    // AnimatedSprite 생성
    this.attackSprite = new AnimatedSprite(frames);
    this.attackSprite.anchor.set(0.5);
    this.attackSprite.scale.set(spriteScale); // 티어에 맞는 스케일 적용
    this.attackSprite.animationSpeed = 0.3; // 애니메이션 속도
    this.attackSprite.loop = false; // 한 번만 재생
    this.attackSprite.visible = false;

    // 프레임 변경 이벤트 - 3프레임(중간)에서 발사
    this.attackSprite.onFrameChange = (currentFrame: number) => {
      if (!this.hasProjectileFired && currentFrame === 3) {
        this.hasProjectileFired = true;
        this.actualFireProjectile();
      }
    };

    // 애니메이션 완료 이벤트
    this.attackSprite.onComplete = () => {
      this.isAttacking = false;
      this.attackSprite!.visible = false;
      this.attackSprite!.gotoAndStop(0);
      if (this.sprite) {
        this.sprite.visible = true;
      }
    };

    this.addChild(this.attackSprite);
  }

  /**
   * 업데이트 (원거리 공격 AI)
   */
  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) {
      return;
    }

    // 넉백 처리
    if (this.updateKnockback(deltaTime)) {
      this.render();
      return; // 넉백 중에는 AI 동작 안 함
    }

    const currentPos = { x: this.x, y: this.y };
    const dx = this.targetPosition.x - currentPos.x;
    const dy = this.targetPosition.y - currentPos.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

    // 방향 계산
    const directionX = dx / distanceToPlayer;
    const directionY = dy / distanceToPlayer;

    // 공격 중이 아닐 때만 이동
    if (!this.isAttacking) {
      // AI: 일정 거리 유지
      if (distanceToPlayer > this.keepDistance + 40) {
        // 너무 멀면 플레이어에게 접근
        this.x += directionX * this.speed * deltaTime;
        this.y += directionY * this.speed * deltaTime;
      } else if (distanceToPlayer < this.keepDistance - 40) {
        // 너무 가까우면 후퇴
        this.x -= directionX * this.speed * deltaTime;
        this.y -= directionY * this.speed * deltaTime;
      }
      // keepDistance ±40 범위 내면 정지 (원거리 유지)

      // 스프라이트 좌우 반전
      if (this.sprite && directionX !== 0) {
        if (directionX < 0) {
          this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        } else {
          this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        }
      }

      // 공격 스프라이트도 방향 맞춤
      if (this.attackSprite && directionX !== 0) {
        if (directionX < 0) {
          this.attackSprite.scale.x = -Math.abs(this.attackSprite.scale.x);
        } else {
          this.attackSprite.scale.x = Math.abs(this.attackSprite.scale.x);
        }
      }
    }

    // 공격 쿨타임 업데이트
    this.attackTimer += deltaTime;

    // 공격 범위 내에 있고 쿨타임이 다 되면 공격
    if (
      !this.isAttacking &&
      distanceToPlayer <= this.attackRange &&
      this.attackTimer >= this.attackCooldown
    ) {
      this.startAttackAnimation();
      this.attackTimer = 0;
    }

    this.render();
  }

  /**
   * 공격 애니메이션 시작
   */
  private startAttackAnimation(): void {
    if (!this.attackSprite) {
      return;
    }

    this.isAttacking = true;
    this.hasProjectileFired = false;

    // 일반 스프라이트 숨기고 공격 스프라이트 표시
    if (this.sprite) {
      this.sprite.visible = false;
    }

    this.attackSprite.visible = true;
    this.attackSprite.gotoAndPlay(0);
  }

  /**
   * 실제 투사체 발사 (2~4프레임에서 호출됨)
   */
  private actualFireProjectile(): void {
    if (!this.targetPosition || !this.onFireProjectile) {
      return;
    }

    // 투사체 발사는 GameScene에서 처리하도록 콜백으로 전달
    const dx = this.targetPosition.x - this.x;
    const dy = this.targetPosition.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 방향 정규화
    const direction = {
      x: dx / distance,
      y: dy / distance,
    };

    // 투사체 생성 정보를 콜백으로 전달
    this.onFireProjectile({
      startX: this.x,
      startY: this.y,
      direction,
    });
  }

  /**
   * 공격 쿨타임 설정 (난이도 조절용)
   */
  public setAttackCooldown(cooldown: number): void {
    this.attackCooldown = cooldown;
  }

  /**
   * 공격 범위 설정
   */
  public setAttackRange(range: number): void {
    this.attackRange = range;
  }
}
