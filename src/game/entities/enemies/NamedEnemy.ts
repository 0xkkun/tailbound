/**
 * 네임드 몬스터 적 (원거리 공격)
 *
 * 3분/6분/9분에 2마리씩 스폰되는 중간보스급 적
 * 기존 몬스터 타입의 상급령 스프라이트를 1.5배 확대하여 사용
 * 3가지 원거리 공격 패턴을 가짐
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { getNamedBalancePhase, NAMED_ENEMY_BALANCE } from '@config/balance.config';
import { NAMED_ENEMY_META, type NamedEnemyType } from '@game/data/enemies';
import { Text } from 'pixi.js';

import { BaseEnemy } from './BaseEnemy';
import type { EnemySpriteConfig } from './EnemySprite';

// 스프라이트 매핑 (getSpriteConfig, preloadSprites에서 공유)
const SPRITE_PATH_MAP: Record<string, string> = {
  dokkaebi: 'enemy/dokkebi-walk.png',
  maidenGhost: 'enemy/woman-ghost-red-walk.png',
  evilSpirit: 'enemy/fire-spirit-red-walk.png',
  mask: 'enemy/mask-walk.png',
  fox: 'enemy/fox-walk.png',
  totem: 'enemy/totem-walk.png',
  waterGhost: 'enemy/water-ghost-walk.png',
};

const FRAME_COUNT_MAP: Record<string, number> = {
  dokkaebi: 8,
  maidenGhost: 7,
  evilSpirit: 5,
  mask: 6,
  fox: 6,
  totem: 10,
  waterGhost: 9,
};

const FRAME_WIDTH_MAP: Record<string, number> = {
  dokkaebi: 32,
  maidenGhost: 32,
  evilSpirit: 32,
  mask: 32,
  fox: 32,
  totem: 32,
  waterGhost: 32,
};

export class NamedEnemy extends BaseEnemy {
  // 공격 타이머
  private attackTimer: number = 0;
  private burstTimer: number = 0;
  private radialTimer: number = 0;

  // 투사체 생성 콜백
  public onFireProjectile?: (projInfo: {
    startX: number;
    startY: number;
    direction: { x: number; y: number };
    damage: number;
  }) => void;

  // 밸런스 페이즈
  private balancePhase: 'low' | 'medium' | 'high';

  // 이름 텍스트
  private nameText?: Text;

  constructor(id: string, x: number, y: number, namedType: NamedEnemyType, gameTime: number) {
    super(id, x, y, 'named', namedType);

    // 게임 시간에 따라 밸런스 페이즈 결정
    this.balancePhase = getNamedBalancePhase(gameTime);
    const balance = NAMED_ENEMY_BALANCE[this.balancePhase];

    // 네임드 몬스터 스탯 설정
    this.health = balance.health;
    this.maxHealth = balance.health;
    this.speed = balance.speed;
    this.damage = balance.damage;
    this.radius = balance.radius;
    this.xpDrop = balance.xpDrop;
    this.knockbackResistance = balance.knockbackResistance;

    // 공격 타이머 초기화 (약간의 랜덤 오프셋으로 패턴 다양화)
    this.attackTimer = Math.random() * 2;
    this.burstTimer = Math.random() * 3;
    this.radialTimer = Math.random() * 4;

    // 이름 표시 생성
    this.createNameLabel();
  }

  /**
   * 빨간색 이름 라벨 생성
   */
  private createNameLabel(): void {
    if (!this.namedType) return;

    const meta = NAMED_ENEMY_META[this.namedType];
    this.nameText = new Text({
      text: meta.displayName,
      style: {
        fontFamily: 'Noto Sans KR, Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fill: 0xff0000, // 빨간색
        stroke: { color: 0x000000, width: 3 },
        align: 'center',
      },
    });

    this.nameText.anchor.set(0.5, 1);
    this.nameText.y = -this.radius - 20; // 몬스터 위에 표시
    this.addChild(this.nameText);
  }

  /**
   * 스프라이트 설정 (기존 몬스터의 상급령 스프라이트 1.5배)
   */
  protected getSpriteConfig(): EnemySpriteConfig {
    if (!this.namedType) {
      throw new Error('NamedEnemy must have namedType');
    }

    const meta = NAMED_ENEMY_META[this.namedType];
    const baseType = meta.baseEnemyType;

    const frameCount = FRAME_COUNT_MAP[baseType] || 8;
    const frameWidth = FRAME_WIDTH_MAP[baseType] || 32;
    const frameHeight = 32;

    // 상급령 스프라이트를 1.5배 확대
    const highTierScale = 3.5; // 상급령 기본 스케일
    const namedScale = highTierScale * 1.5; // 1.5배 확대

    return {
      assetPath: `${CDN_BASE_URL}/assets/${SPRITE_PATH_MAP[baseType]}`,
      totalWidth: frameWidth * frameCount,
      height: frameHeight,
      frameCount: frameCount,
      scale: namedScale,
    };
  }

  protected getEnemyType(): string {
    return `named_${this.namedType}`;
  }

  /**
   * 그림자 생성 (크기 증가)
   */
  protected createShadow(): void {
    this.shadow.clear();
    this.shadow.ellipse(0, this.radius * 0.85, this.radius * 0.8, this.radius * 0.3);
    this.shadow.fill({ color: 0x000000, alpha: 0.35 });
  }

  /**
   * AI 업데이트 - 원거리 공격 패턴
   */
  public override update(deltaTime: number): void {
    console.log('[NamedEnemy] update 호출됨', {
      active: this.active,
      hasTarget: !!this.targetPosition,
    });

    super.update(deltaTime);

    // 타겟 위치가 없으면 공격 패턴 업데이트 안 함
    if (!this.targetPosition) {
      console.warn('[NamedEnemy] targetPosition이 없습니다!');
      return;
    }

    console.log('[NamedEnemy] 공격 패턴 업데이트 시작');

    // 공격 패턴 업데이트
    this.updateAttackPatterns(deltaTime, this.targetPosition.x, this.targetPosition.y);
  }

  /**
   * 공격 패턴 업데이트
   */
  private updateAttackPatterns(deltaTime: number, playerX: number, playerY: number): void {
    const balance = NAMED_ENEMY_BALANCE[this.balancePhase];
    const distanceToPlayer = Math.hypot(playerX - this.x, playerY - this.y);

    // 타이머 업데이트
    this.attackTimer += deltaTime;
    this.burstTimer += deltaTime;
    this.radialTimer += deltaTime;

    console.log('[NamedEnemy] 공격 패턴 체크', {
      distance: distanceToPlayer,
      attackTimer: this.attackTimer,
      attackCooldown: balance.attackCooldown,
      burstTimer: this.burstTimer,
      radialTimer: this.radialTimer,
    });

    // 패턴 3: 원형 방사형 발사 (최우선 - 가장 긴 쿨타임)
    if (this.radialTimer >= balance.radialCooldown && distanceToPlayer < 500) {
      this.fireRadialPattern();
      this.radialTimer = 0;
      return;
    }

    // 패턴 2: 5연발 난사 (중간 우선순위)
    if (this.burstTimer >= balance.burstCooldown && distanceToPlayer < 400) {
      this.fireBurstPattern(playerX, playerY);
      this.burstTimer = 0;
      return;
    }

    // 패턴 1: 기본 공격 (가장 빈번)
    if (this.attackTimer >= balance.attackCooldown && distanceToPlayer < 450) {
      this.fireBasicAttack(playerX, playerY);
      this.attackTimer = 0;
    }
  }

  /**
   * 패턴 1: 기본 공격 - 플레이어에게 불꽃 단발 발사
   */
  private fireBasicAttack(playerX: number, playerY: number): void {
    if (!this.onFireProjectile) {
      console.warn('[NamedEnemy] onFireProjectile 콜백이 없습니다!');
      return;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) return;

    const balance = NAMED_ENEMY_BALANCE[this.balancePhase];

    console.log('[NamedEnemy] 기본 공격 발사!', {
      x: this.x,
      y: this.y,
      damage: balance.projectileDamage,
    });

    this.onFireProjectile({
      startX: this.x,
      startY: this.y,
      direction: { x: dx / distance, y: dy / distance },
      damage: balance.projectileDamage,
    });
  }

  /**
   * 패턴 2: 5연발 난사 - 플레이어에게 불꽃 5발 연속 발사
   */
  private fireBurstPattern(playerX: number, playerY: number): void {
    if (!this.onFireProjectile) return;

    const balance = NAMED_ENEMY_BALANCE[this.balancePhase];
    const burstCount = 5;
    const burstInterval = 0.15; // 0.15초 간격

    // 5발을 순차적으로 발사
    for (let i = 0; i < burstCount; i++) {
      setTimeout(
        () => {
          if (!this.active || !this.onFireProjectile) return;

          const dx = playerX - this.x;
          const dy = playerY - this.y;
          const distance = Math.hypot(dx, dy);

          if (distance === 0) return;

          // 약간의 랜덤 각도 추가 (± 5도)
          const angle = Math.atan2(dy, dx);
          const randomAngle = angle + (Math.random() - 0.5) * 0.17; // ± 5도 (0.087 rad)

          this.onFireProjectile({
            startX: this.x,
            startY: this.y,
            direction: {
              x: Math.cos(randomAngle),
              y: Math.sin(randomAngle),
            },
            damage: balance.projectileDamage,
          });
        },
        i * burstInterval * 1000
      );
    }
  }

  /**
   * 패턴 3: 원형 방사형 발사 - 12방향으로 불꽃 발사
   */
  private fireRadialPattern(): void {
    if (!this.onFireProjectile) return;

    const balance = NAMED_ENEMY_BALANCE[this.balancePhase];
    const projectileCount = 12; // 12방향
    const angleStep = (Math.PI * 2) / projectileCount;

    for (let i = 0; i < projectileCount; i++) {
      const angle = angleStep * i;
      this.onFireProjectile({
        startX: this.x,
        startY: this.y,
        direction: {
          x: Math.cos(angle),
          y: Math.sin(angle),
        },
        damage: balance.projectileDamage,
      });
    }
  }

  /**
   * 이름 라벨 위치 업데이트
   */
  protected render(): void {
    super.render();

    // 이름 라벨 위치 업데이트
    if (this.nameText) {
      this.nameText.y = -this.radius - 20;
    }
  }

  /**
   * 네임드 몬스터 스프라이트 preload
   */
  public static async preloadSprites(): Promise<void> {
    // 모든 네임드 타입에 대해 스프라이트 로드
    const namedTypes: NamedEnemyType[] = [
      'hongkakchu',
      'hanwolryeong',
      'amhonryeong',
      'heuiguryeong',
      'hyeolmihowang',
      'gomokjang',
      'simyeongaek',
    ];

    // 임시 인스턴스를 생성하여 스프라이트 설정 가져오기
    const preloadPromises = namedTypes.map(async (type) => {
      const meta = NAMED_ENEMY_META[type];
      const baseType = meta.baseEnemyType;

      const frameCount = FRAME_COUNT_MAP[baseType] || 8;
      const frameWidth = FRAME_WIDTH_MAP[baseType] || 32;

      const config: EnemySpriteConfig = {
        assetPath: `${CDN_BASE_URL}/assets/${SPRITE_PATH_MAP[baseType]}`,
        totalWidth: frameWidth * frameCount,
        height: 32,
        frameCount: frameCount,
        scale: 5.25, // 3.5 * 1.5
      };

      return BaseEnemy.preloadSpriteType(`named_${type}`, config);
    });

    await Promise.all(preloadPromises);
  }

  /**
   * 클린업
   */
  public destroy(): void {
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = undefined;
    }
    super.destroy();
  }
}
