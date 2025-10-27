/**
 * 처녀귀신 적 (원거리 공격) - 중간 체력, 원거리 유틸형
 *
 * 플레이어와 일정 거리를 유지하며 투사체를 발사
 */

import { AnimatedSprite, Assets, Rectangle, Texture } from 'pixi.js';

import { ENEMY_BALANCE, ENEMY_TYPE_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

export class MaidenGhostEnemy extends BaseEnemy {
  // 처녀귀신 스프라이트 설정
  private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
    assetPath: '/assets/enemy/woman-ghost.png',
    totalWidth: 224,
    height: 32,
    frameCount: 7,
    scale: 2.5,
  };

  // 공격 애니메이션 스프라이트
  private attackSprite: AnimatedSprite | null = null;
  private isAttacking: boolean = false;
  private hasProjectileFired: boolean = false; // 공격 중 발사체 발사 여부

  // 원거리 공격 설정
  private attackCooldown: number = ENEMY_TYPE_BALANCE.maidenGhost.attackCooldown;
  private attackTimer: number = 0;
  private attackRange: number = ENEMY_TYPE_BALANCE.maidenGhost.attackRange;
  private keepDistance: number = ENEMY_TYPE_BALANCE.maidenGhost.keepDistance;

  // 투사체 생성 콜백
  public onFireProjectile?: (projInfo: {
    startX: number;
    startY: number;
    direction: { x: number; y: number };
  }) => void;

  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super(id, x, y, tier);

    // 처녀귀신 고유 스탯: 중간 체력, 느림, 원거리 공격
    const baseStats = ENEMY_BALANCE[tier];
    const typeConfig = ENEMY_TYPE_BALANCE.maidenGhost;
    this.health = Math.floor(baseStats.health * typeConfig.healthMultiplier);
    this.maxHealth = this.health;
    this.speed = typeConfig.speed;
    this.damage = Math.floor(baseStats.damage * typeConfig.damageMultiplier);
    this.radius = typeConfig.radius;

    this.loadAttackAnimation();
  }

  protected getSpriteConfig(): EnemySpriteConfig {
    return MaidenGhostEnemy.SPRITE_CONFIG;
  }

  protected getEnemyType(): string {
    return 'maiden_ghost';
  }

  /**
   * 그림자 커스터마이즈 - 유령이므로 그림자를 흐릿하게
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.65, this.radius * 0.22);
    this.shadow.fill({ color: 0x000000, alpha: 0.2 });
  }

  /**
   * 처녀귀신 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    return BaseEnemy.preloadSpriteType('maiden_ghost', MaidenGhostEnemy.SPRITE_CONFIG);
  }

  /**
   * 공격 애니메이션 로드
   */
  private async loadAttackAnimation(): Promise<void> {
    const assetPath = '/assets/enemy/woman-ghost-attack.png';

    // 텍스처 로드
    const texture = await Assets.load(assetPath);

    // 프레임 생성 (32x32, 14프레임)
    const frameWidth = 32;
    const frameHeight = 32;
    const totalFrames = 14;
    const frames: Texture[] = [];

    for (let i = 0; i < totalFrames; i++) {
      const x = i * frameWidth;
      const rect = new Rectangle(x, 0, frameWidth, frameHeight);
      frames.push(new Texture({ source: texture.source, frame: rect }));
    }

    // AnimatedSprite 생성
    this.attackSprite = new AnimatedSprite(frames);
    this.attackSprite.anchor.set(0.5);
    this.attackSprite.scale.set(2.5); // 처녀귀신 기본 스케일과 동일
    this.attackSprite.animationSpeed = 0.4; // 애니메이션 속도
    this.attackSprite.loop = false; // 한 번만 재생
    this.attackSprite.visible = false;

    // 프레임 변경 이벤트 - 7~10프레임에서 발사
    this.attackSprite.onFrameChange = (currentFrame: number) => {
      if (!this.hasProjectileFired && currentFrame >= 7 && currentFrame <= 10) {
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
      if (distanceToPlayer > this.keepDistance + 30) {
        // 너무 멀면 플레이어에게 접근
        this.x += directionX * this.speed * deltaTime;
        this.y += directionY * this.speed * deltaTime;
      } else if (distanceToPlayer < this.keepDistance - 30) {
        // 너무 가까우면 후퇴
        this.x -= directionX * this.speed * deltaTime;
        this.y -= directionY * this.speed * deltaTime;
      }
      // keepDistance ±30 범위 내면 정지 (원거리 유지)

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
   * 실제 투사체 발사 (7~10프레임에서 호출됨)
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
