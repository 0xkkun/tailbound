/**
 * 처형인의 도끼 유물
 * 체력이 낮은 적 즉시 처형 (체력 20% 이하 시 즉사)
 */

import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import { AnimatedSprite, Assets, type Container, Rectangle, Texture } from 'pixi.js';

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
    console.log(
      `⚔️ [ExecutionerAxe] EXECUTED! (Original: ${originalDamage.toFixed(1)}, Execute: ${enemy.health.toFixed(1)})`
    );

    // 처형 이펙트 (적이 죽기 전에 위치와 parent 저장)
    const enemyX = enemy.x;
    const enemyY = enemy.y;
    const enemyParent = enemy.parent;

    // 남은 체력만큼 추가 데미지 (즉사 처리)
    const executeDamage = enemy.health;
    enemy.takeDamage(executeDamage, true);

    // 이펙트 표시 (저장된 위치 사용)
    if (enemyParent) {
      this.showExecuteEffect(enemyX, enemyY, enemyParent);
    }
  }

  /**
   * 처형 이펙트 (스프라이트시트 애니메이션)
   */
  private async showExecuteEffect(x: number, y: number, parent: Container): Promise<void> {
    try {
      // 스프라이트시트 로드 (로컬 경로)
      const texture = await Assets.load('/assets/effects/execution.png');

      // 프레임 생성 (69x60, 30프레임, 6열 x 5행)
      const frameWidth = 69;
      const frameHeight = 60;
      const totalFrames = 30;
      const columns = 6;

      const frames: Texture[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const frameX = col * frameWidth;
        const frameY = row * frameHeight;

        const frame = new Texture({
          source: texture.source,
          frame: new Rectangle(frameX, frameY, frameWidth, frameHeight),
        });
        frames.push(frame);
      }

      // 애니메이션 스프라이트 생성
      const executionEffect = new AnimatedSprite(frames);
      executionEffect.anchor.set(0.5);
      executionEffect.x = x;
      executionEffect.y = y;
      executionEffect.scale.set(2.0); // 2배 크기
      executionEffect.animationSpeed = 0.5; // 30fps 기준 (0.5 = 15fps)
      executionEffect.loop = false;
      executionEffect.zIndex = 1000;

      parent.addChild(executionEffect);

      // 애니메이션 재생
      executionEffect.play();

      // 애니메이션 종료 후 정리
      executionEffect.onComplete = () => {
        if (!executionEffect.destroyed) {
          executionEffect.destroy({ children: true });
        }
      };
    } catch (error) {
      console.error('[ExecutionerAxe] Failed to load execution effect:', error);
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();
  }
}
