/**
 * 구미호의 눈물 유물
 * 필드몹 매혹 (10% 확률, 최대 10마리, 5초간 아군으로 전환)
 */

import { CDN_ASSETS } from '@config/assets.config';
import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { StatusEffect } from '@type/status-effect.types';
import type { Team } from '@type/team.types';
import { Graphics } from 'pixi.js';

import { BaseArtifact } from '../base/BaseArtifact';

interface CharmData {
  attackTimer: number;
  originalTeam: Team;
  heartEffect: Graphics | null;
  heartInterval: ReturnType<typeof setInterval> | null;
}

export class FoxTearArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly CHARM_DURATION = 5.0; // 5초
  private readonly ATTACK_INTERVAL = 1.0; // 1초마다 공격
  private readonly ATTACK_RANGE = 200; // 200px 범위
  private readonly MAX_CHARMED = 10; // 최대 10마리까지 매혹 가능
  private readonly CHARM_CHANCE = 0.1; // 10% 확률 (모든 티어 동일)

  private charmedEnemies: Map<BaseEnemy, CharmData> = new Map();

  constructor() {
    super({
      id: 'fox_tear',
      name: '구미호의 눈물',
      tier: 2,
      rarity: 'rare',
      category: 'debuff',
      description: '[투사체 무기] 적을 맞출 때 10% 확률로 일반 요괴를 5초간 매혹 (최대 10마리)',
      iconPath: CDN_ASSETS.artifact.foxTear,
      color: 0xff69b4,
      weaponCategories: ['projectile'], // 투사체 무기만
    });
  }

  /**
   * 적을 맞을 때마다 호출
   */
  public onHit(enemy: BaseEnemy, _damage: number, weaponCategories?: WeaponCategory[]): void {
    console.log(`💕 [FoxTear] Enemy hit: ${enemy.id} (damage: ${_damage})`);

    // 투사체 무기만 매혹 발동
    if (!weaponCategories || !weaponCategories.includes('projectile')) {
      return;
    }

    // 이미 매혹된 적은 제외
    if (enemy.hasStatusEffect('charmed')) return;

    // 최대 매혹 수 체크
    if (this.charmedEnemies.size >= this.MAX_CHARMED) return;

    // 매혹 가능 여부 체크
    if (!this.canCharm(enemy)) return;

    // 확률 체크
    if (Math.random() >= this.CHARM_CHANCE) return;

    // 매혹 적용
    this.applyCharm(enemy);
  }

  /**
   * 매 프레임 업데이트
   */
  public update(delta: number): void {
    const toRemove: BaseEnemy[] = [];

    for (const [enemy, data] of this.charmedEnemies.entries()) {
      // 상태 이상 효과가 만료되었는지 체크
      if (!enemy.hasStatusEffect('charmed')) {
        toRemove.push(enemy);
        continue;
      }

      // 매혹된 적이 공격할 대상 찾기 및 타겟 설정
      this.updateCharmedTarget(enemy);

      // 공격 타이머 업데이트
      data.attackTimer += delta;

      // 공격 로직 (1초마다)
      if (data.attackTimer >= this.ATTACK_INTERVAL) {
        this.performCharmAttack(enemy);
        data.attackTimer = 0;
      }
    }

    // 매혹 해제된 적들 정리
    for (const enemy of toRemove) {
      this.removeCharm(enemy);
    }
  }

  /**
   * 매혹 가능 여부 체크
   * - field 카테고리면 모두 매혹 가능
   */
  private canCharm(enemy: BaseEnemy): boolean {
    // 죽은 적은 매혹 불가
    if (!enemy.isAlive()) return false;

    // field 카테고리만 매혹 가능 (named, boss 제외)
    if (enemy.category !== 'field') return false;

    return true;
  }

  /**
   * 매혹 적용
   */
  private applyCharm(enemy: BaseEnemy): void {
    // 상태 이상 효과 추가
    const statusEffect: StatusEffect = {
      type: 'charmed',
      duration: this.CHARM_DURATION,
      startTime: performance.now(),
      source: this.data.id,
      data: {},
    };

    enemy.addStatusEffect(statusEffect);

    // 매혹 데이터 저장
    const charmData: CharmData = {
      attackTimer: 0,
      originalTeam: enemy.team,
      heartEffect: null,
      heartInterval: null,
    };

    this.charmedEnemies.set(enemy, charmData);

    // 팀 전환
    enemy.team = 'charmed';

    // 시각 효과
    enemy.tint = 0xff69b4;

    // 하트 이펙트 생성
    const { heart, interval } = this.createHeartEffect(enemy);
    charmData.heartEffect = heart;
    charmData.heartInterval = interval;

    console.log(`💕 [FoxTear] Enemy is charmed!`);

    // 죽으면 자동 해제
    enemy.once('destroyed', () => {
      this.removeCharm(enemy);
    });
  }

  /**
   * 매혹 해제
   */
  private removeCharm(enemy: BaseEnemy): void {
    const data = this.charmedEnemies.get(enemy);
    if (!data) return;

    // 상태 이상 제거
    enemy.removeStatusEffect('charmed');

    // 원래대로 복구
    enemy.team = data.originalTeam;
    enemy.tint = 0xffffff;

    // 하트 인터벌 정리 (메모리 누수 방지)
    if (data.heartInterval !== null) {
      clearInterval(data.heartInterval);
    }

    // 하트 제거
    if (data.heartEffect && !data.heartEffect.destroyed) {
      data.heartEffect.destroy();
    }

    this.charmedEnemies.delete(enemy);

    console.log(`💔 [FoxTear] Charm released`);
  }

  /**
   * 매혹된 적의 타겟 업데이트 (가까운 적을 향해 이동)
   */
  private updateCharmedTarget(charmedEnemy: BaseEnemy): void {
    if (!this.scene) return;

    // 가장 가까운 일반 적 찾기
    const nearestEnemy = this.findNearestHostileEnemy(charmedEnemy);

    if (nearestEnemy) {
      // 타겟 설정 (적을 향해 이동)
      charmedEnemy.setTarget({ x: nearestEnemy.x, y: nearestEnemy.y });
    }
  }

  /**
   * 가장 가까운 적대적인 적 찾기
   */
  private findNearestHostileEnemy(charmedEnemy: BaseEnemy): BaseEnemy | null {
    if (!this.scene) return null;

    // 매혹되지 않은 살아있는 적들 필터링
    const hostileEnemies = this.scene.enemies.filter((e) => {
      return e !== charmedEnemy && !e.hasStatusEffect('charmed') && e.isAlive();
    });

    if (hostileEnemies.length === 0) return null;

    // 가장 가까운 적 찾기
    return hostileEnemies.sort(
      (a, b) => this.distance(charmedEnemy, a) - this.distance(charmedEnemy, b)
    )[0];
  }

  /**
   * 매혹당한 적의 공격
   */
  private performCharmAttack(charmedEnemy: BaseEnemy): void {
    if (!this.scene) return;

    // 공격 범위 내 적 찾기
    const nearbyEnemies = this.scene.enemies.filter((e) => {
      return (
        e !== charmedEnemy &&
        !e.hasStatusEffect('charmed') &&
        e.isAlive() &&
        this.distance(charmedEnemy, e) < this.ATTACK_RANGE
      );
    });

    if (nearbyEnemies.length === 0) return;

    // 가장 가까운 적 공격
    const target = nearbyEnemies.sort(
      (a, b) => this.distance(charmedEnemy, a) - this.distance(charmedEnemy, b)
    )[0];

    // 매혹당한 적의 원래 공격력 사용
    const damage = charmedEnemy.damage || 10;
    target.takeDamage(damage, false);

    // 공격 이펙트
    this.showAttackEffect(charmedEnemy, target);
  }

  /**
   * 하트 이펙트 생성
   */
  private createHeartEffect(enemy: BaseEnemy): {
    heart: Graphics;
    interval: ReturnType<typeof setInterval>;
  } {
    const heart = new Graphics();

    // 하트 모양 그리기
    heart.moveTo(0, -10);
    heart.bezierCurveTo(0, -15, 10, -15, 10, -5);
    heart.bezierCurveTo(10, 0, 0, 5, 0, 10);
    heart.bezierCurveTo(0, 5, -10, 0, -10, -5);
    heart.bezierCurveTo(-10, -15, 0, -15, 0, -10);
    heart.fill(0xff69b4);

    if (enemy.parent) {
      enemy.parent.addChild(heart);
    }

    // 위치 업데이트 루프
    let time = 0;
    const updateInterval = setInterval(() => {
      if (heart.destroyed || !this.charmedEnemies.has(enemy)) {
        clearInterval(updateInterval);
        if (!heart.destroyed) heart.destroy();
        return;
      }

      time += 0.016;

      // 적 머리 위에서 맥동
      const radius = enemy.radius || 30;
      heart.x = enemy.x;
      heart.y = enemy.y - radius - 35 + Math.sin(time * 3) * 5;
      heart.scale.set(0.8 + Math.sin(time * 2) * 0.1);
    }, 16);

    return { heart, interval: updateInterval };
  }

  /**
   * 공격 이펙트 (라인)
   */
  private showAttackEffect(from: BaseEnemy, to: BaseEnemy): void {
    if (!this.scene) return;

    const line = new Graphics();
    line.moveTo(from.x, from.y);
    line.lineTo(to.x, to.y);
    line.stroke({ width: 2, color: 0xff69b4, alpha: 0.8 });

    this.scene.addChild(line);

    setTimeout(() => {
      if (!line.destroyed) line.destroy();
    }, 200);
  }

  /**
   * 거리 계산
   */
  private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 정리
   */
  public cleanup(): void {
    super.cleanup();

    // 모든 매혹 해제
    for (const enemy of Array.from(this.charmedEnemies.keys())) {
      this.removeCharm(enemy);
    }
    this.charmedEnemies.clear();
  }
}
