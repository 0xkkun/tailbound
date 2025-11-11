# 구미호의 눈물 (Fox Tear) - 매혹 유물

> Medium 이하 적을 아군으로 전환시키는 유물

---

## 효과

- **확률**: 10%
- **지속시간**: 3초
- **대상**: Medium 티어 이하 (Low, Medium만)
- **제외**: High 티어, 보스

### 매혹 상태

매혹당한 적은:
1. **아군화**: 다른 적들을 공격
2. **무적**: 다른 적들에게 피해를 받지 않음 (플레이어만 공격 가능)
3. **느린 공격**: 1초마다 공격 (원래 공격력 사용)
4. **시각 효과**: 핑크색 틴팅 + 머리 위 하트
5. **3초 후**: 원래대로 복귀 (죽으면 즉시 해제)

---

## 구현

```typescript
// src/game/artifacts/impl/FoxTear.ts

import { BaseArtifact } from '../base/BaseArtifact';
import { Graphics } from 'pixi.js';

export class FoxTear extends BaseArtifact {
  // ====== 밸런스 상수 (여기만 수정!) ======
  private readonly CHARM_CHANCE = 0.1;        // 10% 확률
  private readonly CHARM_DURATION = 3.0;      // 3초
  private readonly ATTACK_INTERVAL = 1.0;     // 1초마다 공격
  private readonly ATTACK_RANGE = 200;        // 200px 범위
  // =====================================

  private charmedEnemies: Map<Enemy, CharmState> = new Map();

  constructor() {
    super({
      id: 'fox_tear',
      name: '구미호의 눈물',
      tier: 2,
      rarity: 'rare',
      description: '공격 시 10% 확률로 중급 이하 적 매혹 (3초간 아군으로 전환)',
      iconPath: 'assets/artifacts/fox_tear.png',
      color: 0xff69b4, // 핑크
    });
  }

  /**
   * 적을 맞출 때마다 호출
   */
  public onHit(enemy: Enemy, damage: number): void {
    // 이미 매혹된 적은 제외
    if (this.charmedEnemies.has(enemy)) return;

    // 확률 체크
    if (Math.random() >= this.CHARM_CHANCE) return;

    // Medium 이하만 매혹 가능
    if (this.canCharm(enemy)) {
      this.applyCharm(enemy);
    }
  }

  /**
   * 매 프레임 업데이트
   */
  public update(delta: number): void {
    for (const [enemy, state] of this.charmedEnemies.entries()) {
      // 타이머 감소
      state.remainingTime -= delta;
      state.attackTimer += delta;

      // 매혹 시간 종료
      if (state.remainingTime <= 0) {
        this.removeCharm(enemy);
        continue;
      }

      // 공격 로직 (1초마다)
      if (state.attackTimer >= this.ATTACK_INTERVAL) {
        this.performCharmAttack(enemy);
        state.attackTimer = 0;
      }
    }
  }

  /**
   * 매혹 가능 여부 체크
   */
  private canCharm(enemy: Enemy): boolean {
    // High 티어 불가
    if (enemy.tier === 'high') return false;

    // 보스 불가
    if (enemy.isBoss) return false;

    // 죽은 적 불가
    if (enemy.hp <= 0) return false;

    return true;
  }

  /**
   * 매혹 적용
   */
  private applyCharm(enemy: Enemy): void {
    // 매혹 상태 저장
    this.charmedEnemies.set(enemy, {
      remainingTime: this.CHARM_DURATION,
      attackTimer: 0,
      originalTeam: enemy.team,
      heartEffect: null,
    });

    // 팀 전환
    enemy.team = 'charmed'; // 특별한 팀
    enemy.isCharmed = true;

    // 시각 효과
    enemy.tint = 0xff69b4; // 핑크색

    // 하트 이펙트 생성
    const heart = this.createHeartEffect(enemy);
    this.charmedEnemies.get(enemy)!.heartEffect = heart;

    console.log(`💕 [Charm] ${enemy.type} is charmed!`);

    // 죽으면 자동 해제
    enemy.once('death', () => {
      this.removeCharm(enemy);
    });
  }

  /**
   * 매혹 해제
   */
  private removeCharm(enemy: Enemy): void {
    const state = this.charmedEnemies.get(enemy);
    if (!state) return;

    // 원래대로 복구
    enemy.team = state.originalTeam;
    enemy.isCharmed = false;
    enemy.tint = 0xffffff;

    // 하트 제거
    if (state.heartEffect && !state.heartEffect.destroyed) {
      state.heartEffect.destroy();
    }

    this.charmedEnemies.delete(enemy);

    console.log(`💔 [Charm] ${enemy.type} released`);
  }

  /**
   * 매혹당한 적의 공격
   */
  private performCharmAttack(charmedEnemy: Enemy): void {
    // 가장 가까운 일반 적 찾기
    const nearbyEnemies = this.scene.enemies.filter(e =>
      e !== charmedEnemy &&          // 자기 자신 제외
      !e.isCharmed &&                // 매혹된 적 제외
      e.hp > 0 &&                    // 살아있는 적
      this.distance(charmedEnemy, e) < this.ATTACK_RANGE
    );

    if (nearbyEnemies.length === 0) return;

    // 가장 가까운 적 공격
    const target = nearbyEnemies.sort((a, b) =>
      this.distance(charmedEnemy, a) - this.distance(charmedEnemy, b)
    )[0];

    // 매혹당한 적의 원래 공격력 사용
    const damage = charmedEnemy.damage || 10;
    target.takeDamage(damage, charmedEnemy);

    // 공격 이펙트
    this.showAttackEffect(charmedEnemy, target);
  }

  /**
   * 하트 이펙트 생성
   */
  private createHeartEffect(enemy: Enemy): Graphics {
    const heart = new Graphics();

    // 하트 모양 그리기
    heart.moveTo(0, -10);
    heart.bezierCurveTo(0, -15, 10, -15, 10, -5);
    heart.bezierCurveTo(10, 0, 0, 5, 0, 10);
    heart.bezierCurveTo(0, 5, -10, 0, -10, -5);
    heart.bezierCurveTo(-10, -15, 0, -15, 0, -10);
    heart.fill(0xff69b4);

    enemy.parent.addChild(heart);

    // 위치 업데이트 루프 (매혹 중 적을 따라다님)
    let time = 0;
    const updateInterval = setInterval(() => {
      if (heart.destroyed || !this.charmedEnemies.has(enemy)) {
        clearInterval(updateInterval);
        heart.destroy();
        return;
      }

      time += 0.016; // ~60fps

      // 적 머리 위에서 맥동하며 떠다님
      heart.x = enemy.x;
      heart.y = enemy.y - enemy.radius - 35 + Math.sin(time * 3) * 5;
      heart.scale.set(0.8 + Math.sin(time * 2) * 0.1);
    }, 16);

    return heart;
  }

  /**
   * 공격 이펙트 (라인)
   */
  private showAttackEffect(from: Enemy, to: Enemy): void {
    const line = new Graphics();
    line.moveTo(from.x, from.y);
    line.lineTo(to.x, to.y);
    line.stroke({ width: 2, color: 0xff69b4, alpha: 0.8 });

    this.scene.addChild(line);

    // 200ms 후 제거
    setTimeout(() => line.destroy(), 200);
  }

  /**
   * 거리 계산 헬퍼
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
    for (const enemy of this.charmedEnemies.keys()) {
      this.removeCharm(enemy);
    }
    this.charmedEnemies.clear();
  }
}

/**
 * 매혹 상태 정보
 */
interface CharmState {
  remainingTime: number;      // 남은 매혹 시간 (초)
  attackTimer: number;        // 다음 공격까지 시간 (초)
  originalTeam: string;       // 원래 팀 (복구용)
  heartEffect: Graphics | null; // 하트 이펙트 참조
}
```

---

## 적 AI 수정 필요

매혹이 제대로 작동하려면 **Enemy 클래스**에서:

```typescript
// src/game/entities/enemies/BaseEnemy.ts

export class BaseEnemy {
  public team: string = 'enemy';
  public isCharmed: boolean = false;

  // AI 로직에서
  update(delta: number) {
    // 매혹된 적은 다른 매혹된 적이나 플레이어를 무시
    if (this.isCharmed) {
      // 일반 적들을 타겟팅
      const target = this.findNearestEnemy((e) => !e.isCharmed && e.hp > 0);
      // ...
    } else {
      // 일반 적: 플레이어 추적 (매혹된 적은 무시)
      const target = this.player;
      // ...
    }
  }

  // 피격 판정에서
  takeDamage(damage: number, source: Entity) {
    // 매혹된 적은 다른 적의 공격을 받지 않음
    if (this.isCharmed && source.team === 'enemy') {
      return; // 피해 무시
    }

    // 일반 피해 처리
    this.hp -= damage;
    // ...
  }
}
```

---

## 밸런스 조정 포인트

```typescript
// 이 값들만 조정하면 됨!

private readonly CHARM_CHANCE = 0.1;        // 10% → 15%로 올리면 더 자주 발동
private readonly CHARM_DURATION = 3.0;      // 3초 → 5초로 늘리면 더 오래 지속
private readonly ATTACK_INTERVAL = 1.0;     // 1초 → 0.5초로 줄이면 더 빠르게 공격
private readonly ATTACK_RANGE = 200;        // 200px → 300px로 늘리면 더 멀리서 공격
```

---

## 테스트 시나리오

1. **기본 작동**: 적 공격 시 가끔 핑크색으로 변하며 하트 뜸
2. **아군 공격**: 매혹된 적이 다른 적을 천천히 때림 (핑크 라인 이펙트)
3. **무적 확인**: 다른 적들이 매혹된 적을 공격하지 않음
4. **시간 종료**: 3초 후 원래대로 돌아옴
5. **죽음 처리**: 매혹 중 죽으면 즉시 해제

---

**작성일**: 2025-11-11
**구현 난이도**: ⭐⭐⭐ (중상)
**필요 수정**: Enemy AI, 충돌 판정
