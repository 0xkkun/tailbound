/**
 * 처형인의 도끼 유물
 * 체력이 낮은 적 즉시 처형 (체력 20% 이하 시 즉사)
 */

import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import gsap from 'gsap';
import { Graphics } from 'pixi.js';

import { BaseArtifact } from '../base/BaseArtifact';

export class ExecutionerAxeArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly EXECUTE_THRESHOLD = 0.2; // 체력 20% 이하
  private readonly EXECUTE_CHANCE = 1.0; // 100% 확률

  constructor() {
    super({
      id: 'executioner_axe',
      name: '처형인의 도끼',
      tier: 3,
      rarity: 'epic',
      category: 'offensive',
      description: '[근접 무기] 일반 요괴의 체력이 20% 이하일 때 즉시 처형',
      iconPath: 'assets/artifacts/executioner-axe.png',
      color: 0x8b0000, // 다크 레드
    });
  }

  /**
   * 적을 맞을 때마다 호출
   */
  public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
    // 근접 무기만 처형 발동
    if (!weaponCategories || !weaponCategories.includes('melee')) {
      return;
    }

    // 이미 죽은 적은 제외
    if (!enemy.isAlive()) return;

    // 필드몹만 처형 가능 (named, boss 제외)
    if (enemy.category !== 'field') return;

    // 현재 체력 비율 계산
    const healthRatio = enemy.health / enemy.maxHealth;

    // 체력이 임계값 이하인지 체크
    if (healthRatio > this.EXECUTE_THRESHOLD) return;

    // 확률 체크
    if (Math.random() >= this.EXECUTE_CHANCE) return;

    // 처형 실행
    this.executeEnemy(enemy, damage);
  }

  /**
   * 적 처형 (즉사)
   */
  private executeEnemy(enemy: BaseEnemy, originalDamage: number): void {
    // 남은 체력만큼 추가 데미지 (즉사 처리)
    const executeDamage = enemy.health;
    enemy.takeDamage(executeDamage, true);

    console.log(
      `⚔️ [ExecutionerAxe] EXECUTED! (Original: ${originalDamage.toFixed(1)}, Execute: ${executeDamage.toFixed(1)})`
    );

    // 처형 이펙트
    this.showExecuteEffect(enemy);
  }

  /**
   * 처형 이펙트 (빨간 X 표시)
   */
  private showExecuteEffect(enemy: BaseEnemy): void {
    if (!enemy.parent) return;

    // 빨간 X 표시
    const xMark = new Graphics();
    const size = 40;
    xMark.moveTo(-size, -size);
    xMark.lineTo(size, size);
    xMark.moveTo(size, -size);
    xMark.lineTo(-size, size);
    xMark.stroke({ width: 10, color: 0xff0000, alpha: 1 });

    // 외곽선 추가
    xMark.moveTo(-size, -size);
    xMark.lineTo(size, size);
    xMark.moveTo(size, -size);
    xMark.lineTo(-size, size);
    xMark.stroke({ width: 14, color: 0x000000, alpha: 0.5 });

    xMark.x = enemy.x;
    xMark.y = enemy.y;
    xMark.scale.set(0);
    xMark.zIndex = 1000;

    enemy.parent.addChild(xMark);

    // X 표시 애니메이션
    gsap.to(xMark.scale, {
      x: 1.5,
      y: 1.5,
      duration: 0.2,
      ease: 'back.out(2)',
    });

    gsap.to(xMark, {
      rotation: Math.PI / 2, // 90도 회전
      duration: 0.2,
      ease: 'power2.out',
    });

    gsap.to(xMark, {
      alpha: 0,
      duration: 0.3,
      delay: 0.2,
      onComplete: () => {
        if (!xMark.destroyed) {
          gsap.killTweensOf(xMark);
          gsap.killTweensOf(xMark.scale);
          xMark.destroy();
        }
      },
    });
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
