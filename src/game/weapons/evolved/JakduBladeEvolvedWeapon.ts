/**
 * 작두날 진화 무기 - 백제 금동대향로
 *
 * 타입: 고정형 (Attached) + 투사체 (Projectile)
 * 진화 조건: 작두날 레벨 7 + 백제 금동대향로 유물 보유
 * 강화 효과: 데미지 150% → 200%, 양쪽 작두 + 참격파 투사체 추가
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE, WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, WEAPON_DATA } from '@game/data/weapons';
import { AttachedEntity } from '@game/entities/AttachedEntity';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import { Projectile } from '@game/entities/Projectile';
import { audioManager } from '@services/audioManager';
import type { Vector2 } from '@type/game.types';
import type { Container } from 'pixi.js';

import { JakduBladeWeapon } from '../JakduBladeWeapon';

export class JakduBladeEvolvedWeapon extends JakduBladeWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.jakdu_blade;

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '백제 금동대향로';

    console.log(
      `✨ [JakduEvolved] 작두 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 쿨다운: ${this.cooldown.toFixed(2)}s)`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('jakdu_blade', this.level);
    const config = WEAPON_BALANCE.jakdu_blade;

    // 데미지
    this.damage = stats.damage * this.balance.damageMultiplier;
    this.cooldown = stats.cooldown * this.balance.cooldownMultiplier;

    // 공격 범위: 레벨당 +5px
    const radiusPerLevel = config.levelScaling.radiusPerLevel || 5;
    this.attackRadius = config.attackRadius + radiusPerLevel * (this.level - 1);
  }

  /**
   * 작두 생성 (진화 에셋 사용)
   */
  public async spawnBlades(gameLayer: Container): Promise<void> {
    // 기존 작두 제거
    for (const blade of this.blades) {
      gameLayer.removeChild(blade);
      blade.destroy();
    }
    this.blades = [];

    // 새 작두 생성
    const positions: Array<'left' | 'right' | 'forward'> =
      this.bladeCount >= 2 ? ['right', 'left'] : ['forward'];

    for (const position of positions) {
      const blade = new AttachedEntity({
        position,
        offsetDistance: this.offsetDistance,
        damage: this.damage,
        radiusX: this.attackRadius * 1.5, // 가로로 1.5배 더 길게
        radiusY: this.attackRadius * 1.0, // 세로는 기본 크기 (하단 포함)
        color: 0xff0000,
      });

      // 무기 카테고리 설정 (유물 시스템용)
      blade.weaponCategories = WEAPON_DATA.jakdu_blade.categories;

      // 진화 에셋 사용
      await blade.loadSpriteSheet(CDN_ASSETS.weapon.jakdu_evolved, 128, 128, 9, 3, {
        animationSpeed: 0.2,
        loop: false, // 한 번만 재생
        flipX: position === 'right', // 오른쪽은 좌우 반전
        rotation:
          position === 'right'
            ? Math.PI / 2 // 오른쪽 90도
            : position === 'left'
              ? -Math.PI / 2 // 왼쪽 -90도
              : 0, // forward는 방향에 따라 동적으로 회전 (나중에 업데이트에서 처리)
        scale: 2, // 스프라이트 크기 2배
      });

      this.blades.push(blade);
      gameLayer.addChild(blade);
    }

    console.log(
      `🔪 [JakduEvolved] 진화 작두 x${this.blades.length} 생성 (범위: ${this.attackRadius})`
    );
  }

  /**
   * 공격 (양쪽 작두 애니메이션 + 참격파 투사체 발사)
   */
  public fire(playerPos: Vector2, _enemies: BaseEnemy[], player?: Player): Projectile[] {
    if (!this.canFire()) {
      return [];
    }

    // 양쪽 작두 애니메이션 재생 (부모 클래스 로직)
    for (let i = 0; i < this.blades.length; i++) {
      const blade = this.blades[i];
      setTimeout(() => {
        audioManager.playJakduBladeSound();
      }, i * 50);
      blade.startAttack(1.0);
    }

    // 진화 특수 능력: 참격파 투사체 발사
    const slashProjectiles: Projectile[] = [];
    const slashCount = 8; // 8방향으로 방사형 발사

    // 360도를 8등분하여 방사형으로 발사
    const angleStep = (Math.PI * 2) / slashCount;

    for (let i = 0; i < slashCount; i++) {
      const angle = angleStep * i;
      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      const projectile = new Projectile(
        `jakdu_slash_${Date.now()}_${i}`,
        playerPos.x,
        playerPos.y,
        direction,
        0xff6600 // 주황색 참격
      );

      projectile.weaponCategories = WEAPON_DATA.jakdu_blade.categories;
      projectile.speed = 600; // 빠른 속도
      projectile.lifeTime = 1.5; // 1.5초 후 소멸
      projectile.piercing = 3; // 3명 관통

      if (player) {
        const critResult = player.rollCritical();
        projectile.isCritical = critResult.isCritical;
        projectile.damage = this.damage * 0.7 * critResult.damageMultiplier; // 작두 데미지의 70%
        projectile.playerRef = player;
      } else {
        projectile.damage = this.damage * 0.7;
      }

      // 참격 스프라이트 로드 (진화 에셋 재사용) - 크기 증가
      projectile.loadSpriteSheet(CDN_ASSETS.weapon.jakdu_evolved, 128, 128, 9, 3).then(() => {
        // 스프라이트가 로드되면 크기 조정 (1.5배로 증가)
        projectile.scale.set(1.5);
        // 날아가는 방향으로 회전
        projectile.rotation = angle + Math.PI / 2; // 90도 보정 (스프라이트 기본 방향)
      });

      slashProjectiles.push(projectile);
    }

    this.resetCooldown(player);
    return slashProjectiles;
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    // 모든 작두의 데미지와 범위 업데이트
    for (const blade of this.getBlades()) {
      blade.damage = this.damage;
      blade.radiusX = this.attackRadius * 1.5;
      blade.radiusY = this.attackRadius * 1.0;
      blade.radius = Math.max(blade.radiusX, blade.radiusY);
    }

    console.log(
      `✨ [JakduEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 범위: ${this.attackRadius}, 참격파 x8)`
    );
  }

  /**
   * 진화 후 초기화 작업 (WeaponLifecycle 인터페이스 구현)
   */
  public async onAfterEvolution(gameLayer: Container): Promise<void> {
    await this.spawnBlades(gameLayer);
  }
}
