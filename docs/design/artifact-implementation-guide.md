# 유물 시스템 구현 가이드

> 플러그인 방식의 모듈화된 유물 시스템 - 쉬운 추가/제거/수정

**작성일**: 2025-11-11
**목적**: 엘리트와 독립적인 유물 시스템 구축

---

## 핵심 설계 원칙

1. **독립성**: 각 유물은 자신만의 파일
2. **플러그인**: 배열에 추가/삭제만 하면 끝
3. **명확성**: 수정 포인트가 한 곳에 모여있음
4. **타입 안전**: TypeScript로 실수 방지

---

## 파일 구조

```
src/game/artifacts/
├── base/
│   ├── IArtifact.ts          # 인터페이스
│   └── BaseArtifact.ts       # 베이스 클래스
├── impl/
│   ├── FoxTear.ts            # 구미호의 눈물
│   ├── ExecutionerAxe.ts     # 망나니의 도끼
│   ├── MaskBerserk.ts        # 탈령의 가면
│   └── ...                   # 각 유물별 파일
└── registry.ts               # 유물 등록 (여기만 수정!)
```

---

## Step 1: 인터페이스 정의

```typescript
// src/game/artifacts/base/IArtifact.ts

export interface ArtifactData {
  id: string;              // 'fox_tear'
  name: string;            // '구미호의 눈물'
  tier: 1 | 2 | 3 | 4;    // 등장 시기
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'cursed';
  description: string;     // 효과 설명
  iconPath: string;        // 아이콘 경로
  color: number;           // 테마 색상 (0xff69b4)
}

export interface IArtifact {
  readonly data: ArtifactData;
  active: boolean;

  // 라이프사이클
  activate(player: Player): void;
  deactivate(player: Player): void;
  update(delta: number): void;

  // 이벤트 훅 (필요한 것만 구현)
  onKill?(enemy: Enemy): void;
  onHit?(enemy: Enemy, damage: number): void;
  onTakeDamage?(damage: number): number; // 수정된 피해 반환
  onLevelUp?(level: number): void;

  // 정리
  cleanup(): void;
}
```

---

## Step 2: 베이스 클래스

```typescript
// src/game/artifacts/base/BaseArtifact.ts

export abstract class BaseArtifact implements IArtifact {
  public active: boolean = false;
  protected player?: Player;

  constructor(public readonly data: ArtifactData) {}

  public activate(player: Player): void {
    if (this.active) return;

    this.player = player;
    this.active = true;

    console.log(`✅ [Artifact] ${this.data.name} activated`);
  }

  public deactivate(player: Player): void {
    if (!this.active) return;

    this.cleanup();
    this.active = false;

    console.log(`❌ [Artifact] ${this.data.name} deactivated`);
  }

  public update(delta: number): void {
    // 기본 구현: 아무것도 안함
    // 필요한 유물만 오버라이드
  }

  public cleanup(): void {
    this.player = undefined;
  }
}
```

---

## Step 3: 유물 구현 예시

### 🦊 구미호의 눈물 (매혹)

```typescript
// src/game/artifacts/list/FoxTear.ts

import { BaseArtifact } from '../base/BaseArtifact';

export class FoxTear extends BaseArtifact {
  private readonly CHARM_CHANCE = 0.1; // 10% 확률
  private readonly CHARM_DURATION = 3.0; // 3초
  private readonly SLOW_AMOUNT = 0.5; // 50% 감속

  constructor() {
    super({
      id: 'fox_tear',
      name: '구미호의 눈물',
      tier: 2,
      rarity: 'rare',
      description: '공격 시 10% 확률로 적 매혹 (3초간 이동속도 -50%)',
      iconPath: 'assets/artifacts/fox_tear.png',
      color: 0xff69b4, // 핑크
    });
  }

  // 적을 맞출 때마다 호출됨
  public onHit(enemy: Enemy, damage: number): void {
    if (Math.random() < this.CHARM_CHANCE) {
      this.applyCharm(enemy);
    }
  }

  private applyCharm(enemy: Enemy): void {
    // 적에게 매혹 상태 추가
    enemy.addStatusEffect({
      type: 'charm',
      duration: this.CHARM_DURATION,
      speedMultiplier: this.SLOW_AMOUNT,
    });

    // 하트 이펙트
    this.showHeartEffect(enemy);
  }

  private showHeartEffect(enemy: Enemy): void {
    // 적 머리 위에 하트 (Graphics로 간단하게)
    const heart = new Graphics();
    heart.moveTo(0, -10);
    heart.bezierCurveTo(0, -15, 10, -15, 10, -5);
    heart.bezierCurveTo(10, 0, 0, 5, 0, 10);
    heart.bezierCurveTo(0, 5, -10, 0, -10, -5);
    heart.bezierCurveTo(-10, -15, 0, -15, 0, -10);
    heart.fill(0xff69b4);

    heart.x = enemy.x;
    heart.y = enemy.y - enemy.radius - 30;
    enemy.parent.addChild(heart);

    // 3초 후 제거
    setTimeout(() => heart.destroy(), 3000);
  }
}
```

### 🪓 망나니의 도끼 (처형)

```typescript
// src/game/artifacts/list/ExecutionerAxe.ts

import { BaseArtifact } from '../base/BaseArtifact';

export class ExecutionerAxe extends BaseArtifact {
  private readonly EXECUTE_THRESHOLD = 0.05; // 5% 이하

  constructor() {
    super({
      id: 'executioner_axe',
      name: '망나니의 도끼',
      tier: 2,
      rarity: 'epic',
      description: '체력 5% 이하 적 즉시 처형',
      iconPath: 'assets/artifacts/executioner_axe.png',
      color: 0x8b0000, // 진한 빨강
    });
  }

  public onHit(enemy: Enemy, damage: number): void {
    const hpPercent = enemy.hp / enemy.maxHp;

    if (hpPercent > 0 && hpPercent <= this.EXECUTE_THRESHOLD) {
      this.execute(enemy);
    }
  }

  private execute(enemy: Enemy): void {
    // 즉사
    enemy.hp = 0;
    enemy.die();

    // X자 이펙트
    this.showExecuteEffect(enemy);
  }

  private showExecuteEffect(enemy: Enemy): void {
    const x = new Graphics();

    // 왼쪽 위 → 오른쪽 아래
    x.moveTo(-30, -30);
    x.lineTo(30, 30);

    // 오른쪽 위 → 왼쪽 아래
    x.moveTo(30, -30);
    x.lineTo(-30, 30);

    x.stroke({ width: 5, color: 0xff0000 });

    x.x = enemy.x;
    x.y = enemy.y;
    enemy.parent.addChild(x);

    // 애니메이션: 확대 + 페이드
    const startTime = Date.now();
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        x.destroy();
        return;
      }

      x.scale.set(1 + progress * 0.5);
      x.alpha = 1 - progress;

      requestAnimationFrame(animate);
    };

    animate();
  }
}
```

### 😈 탈령의 가면 (버서커)

```typescript
// src/game/artifacts/list/MaskBerserk.ts

import { BaseArtifact } from '../base/BaseArtifact';

export class MaskBerserk extends BaseArtifact {
  private killCount: number = 0;
  private readonly KILL_THRESHOLD = 50; // 50킬

  private berserkActive: boolean = false;
  private berserkTimer: number = 0;
  private readonly BERSERK_DURATION = 5.0; // 5초
  private readonly DAMAGE_BOOST = 3.0; // 3배

  private originalDamageMultiplier: number = 1.0;
  private originalControlsLocked: boolean = false;

  constructor() {
    super({
      id: 'mask_berserk',
      name: '탈령의 가면',
      tier: 3,
      rarity: 'legendary',
      description: '적 50마리 처치 시 5초간 버서커 (조작 불가, 공격력 3배)',
      iconPath: 'assets/artifacts/mask_berserk.png',
      color: 0xff0000,
    });
  }

  public onKill(enemy: Enemy): void {
    if (this.berserkActive) return;

    this.killCount++;

    if (this.killCount >= this.KILL_THRESHOLD) {
      this.activateBerserk();
      this.killCount = 0;
    }
  }

  public update(delta: number): void {
    if (!this.berserkActive || !this.player) return;

    this.berserkTimer += delta;

    if (this.berserkTimer >= this.BERSERK_DURATION) {
      this.deactivateBerserk();
    }
  }

  private activateBerserk(): void {
    if (!this.player) return;

    this.berserkActive = true;
    this.berserkTimer = 0;

    // 공격력 증가
    this.originalDamageMultiplier = this.player.damageMultiplier;
    this.player.damageMultiplier *= this.DAMAGE_BOOST;

    // 조작 불가
    this.originalControlsLocked = this.player.controlsLocked || false;
    this.player.controlsLocked = true;

    // 시각 효과
    this.player.tint = 0xff0000;

    console.log('🔴 [Berserk] ACTIVATED!');
  }

  private deactivateBerserk(): void {
    if (!this.player) return;

    this.berserkActive = false;

    // 복구
    this.player.damageMultiplier = this.originalDamageMultiplier;
    this.player.controlsLocked = this.originalControlsLocked;
    this.player.tint = 0xffffff;

    console.log('⚪ [Berserk] Deactivated');
  }

  public cleanup(): void {
    super.cleanup();
    this.killCount = 0;
    this.berserkActive = false;
    this.berserkTimer = 0;
  }
}
```

### 📈 척살 (스택)

```typescript
// src/game/artifacts/list/KillStack.ts

import { BaseArtifact } from '../base/BaseArtifact';

export class KillStack extends BaseArtifact {
  private stacks: number = 0;
  private readonly MAX_STACKS = 100;
  private readonly DAMAGE_PER_STACK = 0.01; // 1%

  constructor() {
    super({
      id: 'kill_stack',
      name: '척살',
      tier: 2,
      rarity: 'epic',
      description: '적 처치 시 공격력 +1% (최대 100%). 피격 시 모든 스택 손실',
      iconPath: 'assets/artifacts/kill_stack.png',
      color: 0x8b0000,
    });
  }

  public activate(player: Player): void {
    super.activate(player);

    // 스탯 증가 적용
    this.updateDamage();
  }

  public onKill(enemy: Enemy): void {
    this.stacks = Math.min(this.MAX_STACKS, this.stacks + 1);
    this.updateDamage();
  }

  public onTakeDamage(damage: number): number {
    // 스택 초기화
    this.stacks = 0;
    this.updateDamage();

    return damage; // 피해는 그대로
  }

  private updateDamage(): void {
    if (!this.player) return;

    // 기존 보너스 제거
    const currentBonus = (this.stacks - 1) * this.DAMAGE_PER_STACK;
    this.player.damageMultiplier -= currentBonus;

    // 새 보너스 적용
    const newBonus = this.stacks * this.DAMAGE_PER_STACK;
    this.player.damageMultiplier += newBonus;

    // UI 업데이트 (있다면)
    // this.scene.artifactUI.updateStack(this.data.id, this.stacks);
  }

  public cleanup(): void {
    super.cleanup();

    // 보너스 제거
    if (this.player) {
      const bonus = this.stacks * this.DAMAGE_PER_STACK;
      this.player.damageMultiplier -= bonus;
    }

    this.stacks = 0;
  }
}
```

### 🗿 마석 (이동 금지 → 공격력 2배)

```typescript
// src/game/artifacts/list/MagicStone.ts

import { BaseArtifact } from '../base/BaseArtifact';

export class MagicStone extends BaseArtifact {
  private readonly STATIONARY_DURATION = 2.0; // 2초
  private readonly DAMAGE_BOOST = 2.0; // 2배

  private stationaryTimer: number = 0;
  private isStationary: boolean = false;
  private boosted: boolean = false;

  constructor() {
    super({
      id: 'magic_stone',
      name: '마석',
      tier: 3,
      rarity: 'epic',
      description: '이동속도 -50%. 2초 정지 시 공격력 2배',
      iconPath: 'assets/artifacts/magic_stone.png',
      color: 0x8a2be2, // 보라
    });
  }

  public activate(player: Player): void {
    super.activate(player);

    // 이동속도 감소
    player.speedMultiplier *= 0.5;
  }

  public update(delta: number): void {
    if (!this.player) return;

    // 이동 중인지 체크
    const isMoving = this.player.currentInput.x !== 0 || this.player.currentInput.y !== 0;

    if (isMoving) {
      // 이동 중이면 타이머 리셋
      this.stationaryTimer = 0;
      this.isStationary = false;

      if (this.boosted) {
        this.removeDamageBoost();
      }
    } else {
      // 정지 중
      this.stationaryTimer += delta;

      if (this.stationaryTimer >= this.STATIONARY_DURATION && !this.boosted) {
        this.applyDamageBoost();
      }
    }
  }

  private applyDamageBoost(): void {
    if (!this.player || this.boosted) return;

    this.player.damageMultiplier *= this.DAMAGE_BOOST;
    this.boosted = true;

    // 시각 효과 (보라색 아우라)
    this.player.tint = 0x8a2be2;

    console.log('💎 [Magic Stone] Boosted!');
  }

  private removeDamageBoost(): void {
    if (!this.player || !this.boosted) return;

    this.player.damageMultiplier /= this.DAMAGE_BOOST;
    this.boosted = false;

    // 원래대로
    this.player.tint = 0xffffff;

    console.log('⚪ [Magic Stone] Boost removed');
  }

  public cleanup(): void {
    super.cleanup();

    if (this.player) {
      // 이동속도 복구
      this.player.speedMultiplier /= 0.5;

      // 공격력 복구
      if (this.boosted) {
        this.player.damageMultiplier /= this.DAMAGE_BOOST;
      }
    }

    this.stationaryTimer = 0;
    this.boosted = false;
  }
}
```

---

## Step 4: 유물 등록소

```typescript
// src/game/artifacts/registry.ts

import { FoxTear } from './impl/FoxTear';
import { ExecutionerAxe } from './impl/ExecutionerAxe';
import { MaskBerserk } from './impl/MaskBerserk';
import { KillStack } from './impl/KillStack';
import { MagicStone } from './impl/MagicStone';
// ... 나머지 임포트

import type { IArtifact } from './base/IArtifact';

/**
 * 🎯 유물 등록소
 *
 * ✅ 새 유물 추가:
 * 1. impl/ 폴더에 새 유물 클래스 작성
 * 2. 이 파일에서 임포트
 * 3. ARTIFACTS 배열에 추가
 *
 * ❌ 유물 제거:
 * 1. ARTIFACTS 배열에서 삭제 (또는 주석)
 *
 * 🔧 유물 수정:
 * 1. impl/ 파일에서 직접 수정
 */
export const ARTIFACTS: Array<new () => IArtifact> = [
  // Tier 1 (2분)
  // ... (기본 유물들)

  // Tier 2 (4분)
  FoxTear,              // 구미호의 눈물
  ExecutionerAxe,       // 망나니의 도끼
  KillStack,            // 척살

  // Tier 3 (6분)
  MaskBerserk,          // 탈령의 가면
  MagicStone,           // 마석

  // Tier 4 (8분)
  // ... (최종 유물들)
];

/**
 * 티어별 유물 필터링
 */
export function getArtifactsByTier(tier: number): IArtifact[] {
  return ARTIFACTS
    .map(ArtifactClass => new ArtifactClass())
    .filter(artifact => artifact.data.tier === tier);
}

/**
 * 랜덤 선택 (중복 제외)
 */
export function selectRandomArtifacts(
  tier: number,
  count: number,
  excludeIds: string[] = []
): IArtifact[] {
  const pool = getArtifactsByTier(tier)
    .filter(a => !excludeIds.includes(a.data.id));

  // 셔플
  const shuffled = pool.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, Math.min(count, pool.length));
}
```

---

## Step 5: 간단한 관리 시스템

```typescript
// src/systems/ArtifactSystem.ts

import type { IArtifact } from '@artifacts/base/IArtifact';
import type { Player } from '@entities/Player';

/**
 * 유물 관리 (간단 버전)
 */
export class ArtifactSystem {
  private artifacts: IArtifact[] = [];
  private maxArtifacts: number = 4;

  constructor(private player: Player) {}

  /**
   * 유물 추가
   */
  public add(artifact: IArtifact): boolean {
    // 최대 개수 체크
    if (this.artifacts.length >= this.maxArtifacts) {
      console.warn('❌ Max artifacts reached');
      return false;
    }

    // 중복 체크
    if (this.has(artifact.data.id)) {
      console.warn('❌ Artifact already active');
      return false;
    }

    // 활성화
    artifact.activate(this.player);
    this.artifacts.push(artifact);

    return true;
  }

  /**
   * 유물 제거
   */
  public remove(artifactId: string): boolean {
    const index = this.artifacts.findIndex(a => a.data.id === artifactId);
    if (index === -1) return false;

    const artifact = this.artifacts[index];
    artifact.deactivate(this.player);
    this.artifacts.splice(index, 1);

    return true;
  }

  /**
   * 보유 여부
   */
  public has(artifactId: string): boolean {
    return this.artifacts.some(a => a.data.id === artifactId);
  }

  /**
   * 업데이트
   */
  public update(delta: number): void {
    for (const artifact of this.artifacts) {
      artifact.update(delta);
    }
  }

  /**
   * 이벤트 발행
   */
  public triggerKill(enemy: Enemy): void {
    for (const artifact of this.artifacts) {
      artifact.onKill?.(enemy);
    }
  }

  public triggerHit(enemy: Enemy, damage: number): void {
    for (const artifact of this.artifacts) {
      artifact.onHit?.(enemy, damage);
    }
  }

  public triggerTakeDamage(damage: number): number {
    let finalDamage = damage;

    for (const artifact of this.artifacts) {
      if (artifact.onTakeDamage) {
        finalDamage = artifact.onTakeDamage(finalDamage);
      }
    }

    return finalDamage;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    for (const artifact of this.artifacts) {
      artifact.deactivate(this.player);
    }
    this.artifacts = [];
  }
}
```

---

## 사용 예시

```typescript
// 게임 씬에서

class GameScene {
  private artifactSystem!: ArtifactSystem;

  create() {
    // 매니저 생성
    this.artifactSystem = new ArtifactSystem(this.player);

    // 플레이어 이벤트에 연결
    this.player.on('kill', (enemy) => {
      this.artifactSystem.triggerKill(enemy);
    });

    this.player.on('hit', (enemy, damage) => {
      this.artifactSystem.triggerHit(enemy, damage);
    });

    this.player.on('takeDamage', (damage) => {
      const finalDamage = this.artifactSystem.triggerTakeDamage(damage);
      // ... 실제 피해 적용
    });
  }

  update(delta: number) {
    // 유물 업데이트
    this.artifactSystem.update(delta);
  }

  // 엘리트 처치 시 호출 (엘리트 시스템에서)
  onEliteKilled(tier: number) {
    // 3개 랜덤 선택
    const excludeIds = this.artifactSystem.getActiveIds();
    const choices = selectRandomArtifacts(tier, 3, excludeIds);

    // UI 표시
    this.showArtifactSelectionUI(choices, (selected) => {
      this.artifactSystem.add(selected);
    });
  }
}
```

---

## 추가/제거/수정 플로우

### ✅ 새 유물 추가

1. **파일 작성**: `src/game/artifacts/list/MyArtifact.ts`
2. **클래스 작성**: `BaseArtifact` 상속
3. **등록**: `registry.ts`에 임포트 + 배열 추가

### ❌ 유물 제거

1. `registry.ts`에서 배열에서 삭제 (또는 주석)

### 🔧 유물 수정

1. 해당 유물 파일(`impl/XXX.ts`)에서 직접 수정
2. 상수 값만 바꾸면 밸런스 조정 끝!

---

## 체크리스트

구현 순서:

- [ ] Phase 1: 타입 & 인터페이스 (`IArtifact.ts`)
- [ ] Phase 2: 베이스 클래스 (`BaseArtifact.ts`)
- [ ] Phase 3: 등록소 (`registry.ts`)
- [ ] Phase 4: 매니저 (`ArtifactSystem.ts`)
- [ ] Phase 5: 유물 3개 구현 (프로토타입)
- [ ] Phase 6: 플레이어 이벤트 연결
- [ ] Phase 7: 나머지 유물 구현

---

**작성자**: 개발팀
**버전**: 1.0
**최종 수정**: 2025-11-11
