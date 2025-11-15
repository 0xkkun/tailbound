# 유물 구현 가이드

> 새로운 유물을 추가하는 방법과 무기 진화 시스템 연동 가이드

---

## 목차

1. [개요](#개요)
2. [유물 추가 체크리스트](#유물-추가-체크리스트)
3. [단계별 구현 가이드](#단계별-구현-가이드)
4. [유물 타입별 구현 방법](#유물-타입별-구현-방법)
5. [무기 진화 유물 구현](#무기-진화-유물-구현)
6. [예제 코드](#예제-코드)

---

## 개요

### 유물 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│   game/artifacts/base/IArtifact.ts      │
│   - 유물 인터페이스 정의                 │
│   - 이벤트 훅 시그니처                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   game/artifacts/base/BaseArtifact.ts   │
│   - 공통 로직 구현                       │
│   - activate/deactivate                  │
│   - 기본 update 루프                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   game/artifacts/list/[Name].ts         │
│   - 개별 유물 로직 구현                  │
│   - 이벤트 훅 오버라이드                 │
│   - 밸런스 상수 정의                     │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   systems/ArtifactSystem.ts             │
│   - 유물 생명주기 관리                   │
│   - 이벤트 트리거링                      │
│   - 플레이어/씬 연동                     │
└─────────────────────────────────────────┘
```

### 설계 원칙

1. **이벤트 기반 설계**: 게임 이벤트에 반응하는 훅(hook) 패턴 사용
2. **상태 캡슐화**: 유물 내부 상태는 private으로 관리
3. **메모리 안전**: cleanup() 메서드로 리소스 정리 보장
4. **확장 가능**: 새 유물 추가 시 기존 코드 수정 최소화

---

## 유물 추가 체크리스트

### 1. 파일 생성
- [ ] `src/game/artifacts/list/[YourArtifact].ts` 생성
- [ ] `src/config/assets.config.ts`에 아이콘 경로 추가
- [ ] `public/assets/artifacts/[artifact-icon].png` 추가 (32x32 권장)

### 2. 데이터 정의
- [ ] `ArtifactData` 메타데이터 작성 (id, name, tier, rarity, description)
- [ ] 밸런스 상수 정의 (private readonly)
- [ ] 카테고리 설정 (offensive, defensive, utility, debuff)

### 3. 로직 구현
- [ ] 필요한 이벤트 훅 구현 (onHit, onKill, update 등)
- [ ] 이펙트/시각 효과 추가
- [ ] cleanup() 메서드로 리소스 정리

### 4. 게임 씬 등록
- [ ] `OverworldGameScene.ts`에 유물 클래스 import
- [ ] `initializeArtifacts()` 메서드에 인스턴스 추가
- [ ] 디버그용 즉시 획득 코드 추가 (선택)

### 5. 테스트
- [ ] 유물 획득 시 activate 동작 확인
- [ ] 이벤트 트리거 정상 작동 확인
- [ ] cleanup 시 메모리 누수 없는지 확인
- [ ] 게임 밸런스 테스트

---

## 단계별 구현 가이드

### Step 1: 파일 생성 및 기본 구조

```typescript
/**
 * [유물 이름] 유물
 * [간단한 설명 - 한 줄]
 */

import { LOCAL_ASSETS } from '@config/assets.config';
import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';

import { BaseArtifact } from '../base/BaseArtifact';

export class YourArtifactName extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly SOME_VALUE = 10;

  constructor() {
    super({
      id: 'your_artifact_id',
      name: '유물 이름',
      tier: 2,
      rarity: 'rare',
      category: 'offensive',
      description: '유물 설명 (효과, 수치 포함)',
      iconPath: LOCAL_ASSETS.yourArtifactIcon,
      color: 0xff0000, // 시각 효과 색상 (hex)
    });
  }
}
```

### Step 2: 밸런스 상수 정의

**권장 패턴**: 상수는 `private readonly`로 선언하여 불변성 보장

```typescript
export class YourArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly DAMAGE_MULTIPLIER = 1.5;  // 150% 데미지
  private readonly TRIGGER_CHANCE = 0.1;     // 10% 확률
  private readonly DURATION = 3.0;           // 3초 지속
  private readonly MAX_TARGETS = 5;          // 최대 5개 대상

  // ... 생성자
}
```

### Step 3: 이벤트 훅 구현

#### 사용 가능한 이벤트 훅

| 훅 | 호출 시점 | 사용 예시 |
|---|---|---|
| `onHit(enemy, damage, weaponCategories?)` | 적을 공격할 때마다 | 디버프, 추가 피해, 확률 효과 |
| `onKill(enemy)` | 적을 처치했을 때 | 체력 회복, 버프, 폭발 효과 |
| `onTakeDamage(damage, source)` | 플레이어가 피격당할 때 | 방어막, 피해 감소, 반사 |
| `onLevelUp(level)` | 플레이어 레벨업 시 | 스탯 증가, 특수 능력 해금 |
| `update(delta)` | 매 프레임 (60fps) | 지속 효과, 타이머, 쿨다운 |

#### onHit 구현 예시 (조건부 효과)

```typescript
public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
  // 1. 무기 카테고리 필터링 (투사체만 발동)
  if (!weaponCategories || !weaponCategories.includes('projectile')) {
    return;
  }

  // 2. 대상 검증 (보스는 제외)
  if (enemy.category === 'boss') return;

  // 3. 확률 체크
  if (Math.random() >= this.TRIGGER_CHANCE) return;

  // 4. 효과 적용
  this.applyEffect(enemy);
}
```

#### update 구현 예시 (지속 효과)

```typescript
export class YourArtifact extends BaseArtifact {
  private activeEffects: Map<BaseEnemy, number> = new Map();

  public update(delta: number): void {
    const toRemove: BaseEnemy[] = [];

    for (const [enemy, remainingTime] of this.activeEffects.entries()) {
      // 타이머 감소
      const newTime = remainingTime - delta;

      if (newTime <= 0 || !enemy.isAlive()) {
        toRemove.push(enemy);
      } else {
        this.activeEffects.set(enemy, newTime);
        // 매 프레임 효과 적용
        this.applyPerFrameEffect(enemy, delta);
      }
    }

    // 만료된 효과 정리
    for (const enemy of toRemove) {
      this.removeEffect(enemy);
    }
  }
}
```

### Step 4: cleanup() 구현 (메모리 안전)

**필수**: 모든 내부 상태를 정리하여 메모리 누수 방지

```typescript
public cleanup(): void {
  super.cleanup(); // 부모 클래스 cleanup 호출

  // 타이머 정리
  if (this.intervalId !== null) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  // 시각 효과 제거
  for (const effect of this.activeEffects.values()) {
    if (!effect.destroyed) {
      effect.destroy();
    }
  }

  // 컬렉션 비우기
  this.activeEffects.clear();
}
```

### Step 5: 게임 씬에 등록

**파일**: `src/game/scenes/game/OverworldGameScene.ts`

```typescript
// 1. Import 추가
import { YourArtifact } from '@game/artifacts/list/YourArtifact';

// 2. initializeArtifacts() 메서드에 추가
private initializeArtifacts(): void {
  this.artifactSystem.registerArtifact(new YourArtifact());
  // ... 기존 유물들
}

// 3. 디버그용 즉시 획득 (선택)
if (DEBUG_MODE) {
  this.artifactSystem.grantArtifact('your_artifact_id', this.player, this);
}
```

---

## 유물 타입별 구현 방법

### 1. Offensive (공격형)

**특징**: 데미지 증가, 치명타, 추가 효과

**예시**: 처형인의 도끼 (체력 낮은 적 즉사)

```typescript
export class ExecutionerAxeArtifact extends BaseArtifact {
  private readonly EXECUTE_THRESHOLD = 0.2; // 20% 이하

  public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
    // 근접 무기만
    if (!weaponCategories?.includes('melee')) return;

    // 필드몹만 (보스 제외)
    if (enemy.category !== 'field') return;

    // 체력 체크
    const healthRatio = enemy.health / enemy.maxHealth;
    if (healthRatio > this.EXECUTE_THRESHOLD) return;

    // 즉사 처리
    enemy.takeDamage(enemy.health, true);
    this.showExecuteEffect(enemy);
  }
}
```

### 2. Debuff (디버프형)

**특징**: 적 약화, 상태 이상, 군중 제어

**예시**: 구미호의 눈물 (매혹 효과)

```typescript
export class FoxTearArtifact extends BaseArtifact {
  private readonly CHARM_DURATION = 5.0;
  private readonly CHARM_CHANCE = 0.1;
  private charmedEnemies: Map<BaseEnemy, CharmData> = new Map();

  public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
    // 투사체만
    if (!weaponCategories?.includes('projectile')) return;

    // 확률 체크
    if (Math.random() >= this.CHARM_CHANCE) return;

    // 상태 이상 적용
    const statusEffect: StatusEffect = {
      type: 'charmed',
      duration: this.CHARM_DURATION,
      startTime: performance.now(),
      source: this.data.id,
    };

    enemy.addStatusEffect(statusEffect);
    enemy.team = 'charmed'; // 팀 전환

    this.charmedEnemies.set(enemy, {...});
  }

  public update(delta: number): void {
    // 매혹된 적들의 행동 제어
    for (const [enemy, data] of this.charmedEnemies.entries()) {
      if (!enemy.hasStatusEffect('charmed')) {
        this.removeCharm(enemy);
        continue;
      }

      // 아군으로 전환된 적이 다른 적 공격
      this.updateCharmedBehavior(enemy, data, delta);
    }
  }
}
```

### 3. Defensive (방어형)

**특징**: 피해 감소, 방어막, 회복

**예시**: 탈령 마스크 (피해 감소)

```typescript
export class DefensiveArtifact extends BaseArtifact {
  private readonly DAMAGE_REDUCTION = 0.15; // 15% 감소

  public onTakeDamage(damage: number, source: Container): number {
    const reducedDamage = damage * (1 - this.DAMAGE_REDUCTION);

    // 방어 이펙트 표시
    this.showShieldEffect();

    // 감소된 데미지 반환
    return reducedDamage;
  }
}
```

### 4. Utility (유틸리티형)

**특징**: 이동속도, 경험치, 골드, 범위

**예시**: 스탯 증가 유물

```typescript
export class UtilityArtifact extends BaseArtifact {
  private readonly SPEED_BONUS = 1.2; // 20% 증가

  public activate(player: Player, scene: IGameScene): void {
    super.activate(player, scene);

    // 플레이어 스탯 증가
    player.moveSpeed *= this.SPEED_BONUS;
  }

  public deactivate(player: Player, scene: IGameScene): void {
    // 스탯 복구
    if (this.player) {
      this.player.moveSpeed /= this.SPEED_BONUS;
    }

    super.deactivate(player, scene);
  }
}
```

---

## 무기 진화 유물 구현

### 개요

특정 무기를 진화시키는 유물은 다음 두 가지 역할을 합니다:

1. **진화 조건 충족**: 무기 레벨 7 + 유물 보유
2. **진화 트리거**: `weaponEvolution.ts`의 진화 맵에 등록

### 진화 유물 구현 체크리스트

- [ ] 유물 클래스 생성 (`src/game/artifacts/list/[Name].ts`)
- [ ] 에셋 추가 (`LOCAL_ASSETS`에 아이콘, 진화 무기 스프라이트)
- [ ] 진화 맵 등록 (`src/game/data/weaponEvolution.ts`)
- [ ] 진화 무기 클래스 생성 (`src/game/weapons/evolved/[Name].ts`)
- [ ] 밸런스 설정 (`config/balance.config.ts` - WEAPON_EVOLUTION_BALANCE)

### Step 1: 진화 유물 클래스 생성

```typescript
/**
 * 청자 상감운학문 매병 유물
 * 정화수 무기 진화 조건
 */

import { LOCAL_ASSETS } from '@config/assets.config';

import { BaseArtifact } from '../base/BaseArtifact';

export class CeladonCraneVaseArtifact extends BaseArtifact {
  constructor() {
    super({
      id: 'celadon_crane_vase',
      name: '청자 상감운학문 매병',
      tier: 3,
      rarity: 'epic',
      category: 'offensive',
      description: '정화수 무기를 진화시킵니다 (레벨 7 필요)',
      iconPath: LOCAL_ASSETS.celadonCraneVaseArtifact,
      color: 0x87ceeb, // 하늘색
    });
  }

  // 진화 유물은 별도 로직이 필요 없음
  // weaponEvolution.ts에서 자동으로 처리됨
}
```

### Step 2: 에셋 등록

**파일**: `src/config/assets.config.ts`

```typescript
export const LOCAL_ASSETS = {
  // 유물 아이콘 (32x32)
  celadonCraneVaseArtifact: '/assets/artifacts/celadon-crane-vase.png',

  // ... 기타 에셋
} as const;
```

### Step 3: 진화 맵 등록

**파일**: `src/game/data/weaponEvolution.ts`

```typescript
import { PurifyingWaterEvolvedWeapon } from '@game/weapons/evolved/PurifyingWaterEvolvedWeapon';

export const WEAPON_EVOLUTION_MAP: Record<string, WeaponEvolutionData> = {
  weapon_purifying_water: {
    weaponId: 'weapon_purifying_water',
    requiredLevel: 7,
    requiredArtifactId: 'celadon_crane_vase', // 유물 ID와 일치!
    evolvedWeaponName: '청자 상감운학문 매병',
    evolvedWeaponFactory: PurifyingWaterEvolvedWeapon,
    enabled: true,
  },
};
```

### Step 4: 진화 무기 클래스 생성

**파일**: `src/game/weapons/evolved/PurifyingWaterEvolvedWeapon.ts`

```typescript
/**
 * 정화수 진화 무기 - 청자 상감운학문 매병
 *
 * 타입: 투척형 (Throwable)
 * 진화 조건: 정화수 레벨 7 + 청자 상감운학문 매병 유물 보유
 * 강화 효과: 데미지 140%, 범위 증가, 투척 개수 증가, 지속시간 증가, 플레이어 귀환
 */
import { LOCAL_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE, WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import type { WaterBottle } from '@game/entities/WaterBottle';
import type { WaterSplash } from '@game/entities/WaterSplash';
import type { Vector2 } from '@type/game.types';

import { PurifyingWaterWeapon } from '../PurifyingWaterWeapon';

export class PurifyingWaterEvolvedWeapon extends PurifyingWaterWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.purifying_water;

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '청자 상감운학문 매병';

    console.log(
      `✨ [PurifyingWaterEvolved] 정화수 진화! Lv.${this.level}`
    );
  }

  /**
   * 진화 무기 스탯 업데이트
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('purifying_water', this.level);
    const config = WEAPON_BALANCE.purifying_water;

    // 데미지 증가
    this.damage = stats.damage * this.balance.damageMultiplier;

    // 범위 증가
    const aoeSteps = Math.floor((this.level - 1) / config.levelScaling.aoeRadiusIncreaseInterval);
    const baseRadius = config.aoeRadius + aoeSteps * config.levelScaling.aoeRadiusPerLevel;
    this.aoeRadius = baseRadius * this.balance.aoeMultiplier;
  }

  /**
   * 물병 발사 (진화 에셋 적용)
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<WaterBottle[]> {
    // 부모 클래스의 fire 호출
    const bottles = await super.fire(playerPos, enemies, player);

    // 진화 에셋으로 교체 (매병 에셋)
    for (const bottle of bottles) {
      await bottle.loadSprite(LOCAL_ASSETS.celadonCraneVaseArtifact);
    }

    return bottles;
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;
    this.updateEvolvedStats();

    console.log(
      `✨ [PurifyingWaterEvolved] 레벨 ${this.level}!`
    );
  }
}
```

### Step 5: 밸런스 설정

**파일**: `src/config/balance.config.ts`

```typescript
export const WEAPON_EVOLUTION_BALANCE = {
  purifying_water: {
    damageMultiplier: 1.4,        // 140% 데미지
    aoeMultiplier: 1.2,           // 120% 범위
    throwIncrease: 1,             // +1 투척
    maxThrowIncrease: 1,          // 최대 +1
    lifetimeMultiplier: 1.5,      // 150% 지속시간
    returnSpeed: 200,             // 귀환 속도 (px/s)
  },
  // ... 다른 진화 무기들
} as const;
```

### 진화 시스템 동작 흐름

```
1. 플레이어가 유물 획득
   └─> artifactSystem.grantArtifact('celadon_crane_vase')

2. 무기가 레벨 7 도달
   └─> weapon.levelUp() -> level = 7

3. 진화 조건 체크 (매 프레임)
   └─> canEvolve(weaponId, level, artifactIds)
       └─> level >= 7 && artifactIds.includes('celadon_crane_vase')

4. 진화 트리거
   └─> evolveWeapon(weapon, player)
       └─> weapon.onBeforeEvolution?.() // 정리
       └─> new PurifyingWaterEvolvedWeapon(weapon.level)
       └─> weapon.onAfterEvolution?.() // 초기화

5. 진화 완료
   └─> 무기 교체, 에셋 변경, 스탯 증가
```

---

## 예제 코드

### 예제 1: 간단한 공격형 유물 (확률 효과)

```typescript
/**
 * 불꽃의 인장 유물
 * 10% 확률로 적 점화 (3초간 DoT)
 */

import { LOCAL_ASSETS } from '@config/assets.config';
import type { WeaponCategory } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { StatusEffect } from '@type/status-effect.types';

import { BaseArtifact } from '../base/BaseArtifact';

export class FireSealArtifact extends BaseArtifact {
  // 밸런스 상수
  private readonly IGNITE_CHANCE = 0.1;     // 10%
  private readonly IGNITE_DURATION = 3.0;   // 3초
  private readonly IGNITE_DPS = 20;         // 초당 20 피해

  constructor() {
    super({
      id: 'fire_seal',
      name: '불꽃의 인장',
      tier: 2,
      rarity: 'rare',
      category: 'offensive',
      description: '적을 맞출 때 10% 확률로 3초간 점화 (초당 20 피해)',
      iconPath: LOCAL_ASSETS.fireSealArtifact,
      color: 0xff4500,
    });
  }

  public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
    // 확률 체크
    if (Math.random() >= this.IGNITE_CHANCE) return;

    // 상태 이상 적용
    const statusEffect: StatusEffect = {
      type: 'ignited',
      duration: this.IGNITE_DURATION,
      startTime: performance.now(),
      source: this.data.id,
      data: { dps: this.IGNITE_DPS },
    };

    enemy.addStatusEffect(statusEffect);

    console.log(`🔥 [FireSeal] Enemy ignited!`);
  }
}
```

### 예제 2: 복잡한 디버프 유물 (매혹 + AI 제어)

구미호의 눈물 전체 코드 참조:
- [FoxTearArtifact.ts](../../src/game/artifacts/list/FoxTearArtifact.ts)

**핵심 패턴**:
1. `Map<BaseEnemy, Data>` 구조로 다중 대상 추적
2. `update(delta)` 루프에서 AI 행동 제어
3. `cleanup()` 메서드로 interval, 시각 효과 정리
4. 상태 이상 시스템 연동 (`addStatusEffect`, `hasStatusEffect`)

### 예제 3: 시각 효과가 있는 유물 (처형 이펙트)

```typescript
/**
 * 처형 이펙트 (AnimatedSprite)
 */
private async showExecuteEffect(x: number, y: number, parent: Container): Promise<void> {
  try {
    // 스프라이트시트 로드
    const texture = await Assets.load(LOCAL_ASSETS.executionEffect);

    // 프레임 생성 (69x60, 30프레임, 6열)
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

    // 애니메이션 생성
    const executionEffect = new AnimatedSprite(frames);
    executionEffect.anchor.set(0.5);
    executionEffect.x = x;
    executionEffect.y = y;
    executionEffect.scale.set(2.0);
    executionEffect.animationSpeed = 0.5;
    executionEffect.loop = false;
    executionEffect.zIndex = 1000;

    parent.addChild(executionEffect);
    executionEffect.play();

    // 애니메이션 종료 후 정리
    executionEffect.onComplete = () => {
      if (!executionEffect.destroyed) {
        executionEffect.destroy({ children: true });
      }
    };
  } catch (error) {
    console.error('[ExecuteEffect] Load failed:', error);
  }
}
```

---

## 베스트 프랙티스

### 1. 밸런스 상수 관리

```typescript
// ✅ Good: private readonly로 불변성 보장
export class GoodArtifact extends BaseArtifact {
  private readonly DAMAGE_BONUS = 1.5;
  private readonly TRIGGER_CHANCE = 0.1;
}

// ❌ Bad: 매직 넘버, 변경 가능
export class BadArtifact extends BaseArtifact {
  public onHit(enemy: BaseEnemy) {
    if (Math.random() < 0.1) { // 매직 넘버
      enemy.takeDamage(damage * 1.5);
    }
  }
}
```

### 2. 메모리 관리

```typescript
// ✅ Good: cleanup에서 모든 리소스 정리
public cleanup(): void {
  super.cleanup();

  // 타이머 정리
  if (this.interval) clearInterval(this.interval);

  // 시각 효과 제거
  this.effects.forEach(e => e.destroy());

  // 컬렉션 비우기
  this.activeTargets.clear();
}

// ❌ Bad: 리소스 누수
public cleanup(): void {
  super.cleanup();
  // interval, effects가 정리되지 않음!
}
```

### 3. 조건 검증 순서

```typescript
// ✅ Good: 빠른 체크를 먼저 (Early Return)
public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
  // 1. 가장 빠른 체크: 카테고리
  if (!weaponCategories?.includes('projectile')) return;

  // 2. 확률 체크 (Math.random은 저렴)
  if (Math.random() >= this.CHANCE) return;

  // 3. 비용 높은 체크: 적 상태
  if (enemy.hasStatusEffect('immune')) return;

  // 4. 실제 로직 (무거운 연산)
  this.applyComplexEffect(enemy);
}
```

### 4. 타입 안전성

```typescript
// ✅ Good: 옵셔널 파라미터 검증
public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
  if (!weaponCategories) return;

  if (weaponCategories.includes('projectile')) {
    // 안전하게 사용
  }
}

// ❌ Bad: 검증 없이 사용 (런타임 에러 위험)
public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
  if (weaponCategories.includes('projectile')) { // weaponCategories가 undefined면 에러!
    // ...
  }
}
```

---

## 트러블슈팅

### 문제 1: 유물이 활성화되지 않음

**원인**: `initializeArtifacts()`에 등록 안됨

**해결**:
```typescript
// OverworldGameScene.ts
private initializeArtifacts(): void {
  this.artifactSystem.registerArtifact(new YourArtifact()); // 추가!
}
```

### 문제 2: 진화가 트리거되지 않음

**원인**: 진화 맵의 ID가 유물 ID와 불일치

**해결**:
```typescript
// weaponEvolution.ts
weapon_purifying_water: {
  requiredArtifactId: 'celadon_crane_vase', // 유물 constructor의 id와 일치해야 함!
}

// CeladonCraneVaseArtifact.ts
constructor() {
  super({
    id: 'celadon_crane_vase', // 여기와 일치!
  });
}
```

### 문제 3: 메모리 누수 (FPS 저하)

**원인**: cleanup()에서 interval, 시각 효과 정리 안됨

**해결**:
```typescript
public cleanup(): void {
  super.cleanup();

  // interval 정리
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }

  // 시각 효과 정리
  this.visualEffects.forEach(effect => {
    if (!effect.destroyed) {
      effect.destroy({ children: true });
    }
  });
  this.visualEffects.clear();
}
```

### 문제 4: onHit이 너무 자주 호출됨 (성능 저하)

**원인**: 조건 검증 순서가 비효율적

**해결**:
```typescript
// ✅ Good: 빠른 체크를 먼저
public onHit(enemy: BaseEnemy, damage: number, weaponCategories?: WeaponCategory[]): void {
  // 1. 가장 빠른 체크
  if (!weaponCategories?.includes('melee')) return;

  // 2. 확률 체크
  if (Math.random() >= 0.1) return;

  // 3. 무거운 로직 (위 조건을 통과한 경우만)
  this.expensiveOperation(enemy);
}
```

---

## 참고 자료

- [무기 구현 가이드](./weapon-implementation-guide.md)
- [상태 이상 시스템](../../src/type/status-effect.types.ts)
- [BaseArtifact 소스코드](../../src/game/artifacts/base/BaseArtifact.ts)
- [IArtifact 인터페이스](../../src/game/artifacts/base/IArtifact.ts)
- [진화 시스템 데이터](../../src/game/data/weaponEvolution.ts)

---

**작성일**: 2025-01-XX
**버전**: 1.0
**작성자**: Claude Code
