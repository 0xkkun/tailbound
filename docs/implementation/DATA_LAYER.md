# 데이터 레이어 구현 가이드

> 설화(Talebound)의 데이터 중심 아키텍처 가이드

## 목차

1. [개요](#개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [Config 파일](#config-파일)
4. [Data 파일](#data-파일)
5. [엔티티에서 사용하기](#엔티티에서-사용하기)
6. [새 콘텐츠 추가하기](#새-콘텐츠-추가하기)
7. [밸런스 조정 워크플로우](#밸런스-조정-워크플로우)

---

## 개요

설화는 **데이터 중심(Data-Driven) 아키텍처**를 사용합니다. 모든 게임 밸런스 값과 콘텐츠 정의는 코드와 분리되어 있어, 코드 수정 없이 게임 밸런스를 조정할 수 있습니다.

### 핵심 원칙

- ✅ **코드와 데이터 분리**: 로직은 `src/game/`, 데이터는 `src/config/`와 `src/game/data/`
- ✅ **단일 진실 공급원**: 각 값은 한 곳에만 정의됨
- ✅ **타입 안정성**: 모든 데이터는 TypeScript 인터페이스로 타입 체크됨
- ✅ **확장성**: 새 무기/적 추가 시 데이터만 추가하면 됨

---

## 디렉토리 구조

```
src/
├── config/                    # 전역 설정 및 밸런스
│   ├── game.config.ts        # 게임 시스템 설정
│   └── balance.config.ts     # 밸런스 수치
│
└── game/
    └── data/                  # 게임 콘텐츠 데이터
        ├── weapons.ts         # 무기 데이터베이스
        └── enemies.ts         # 적 데이터베이스
```

---

## Config 파일

### 1. `config/game.config.ts`

게임 시스템 설정 (변경 빈도 낮음)

```typescript
export const GAME_CONFIG = {
  screen: {
    width: 1280,
    height: 720,
  },
  time: {
    victoryTime: 600, // 10분 생존 = 승리
    difficultyIncreaseInterval: 10, // 10초마다 난이도 증가
  },
  levelUp: {
    baseXpRequired: 100, // 첫 레벨업 필요 경험치
    xpScaling: 1.2, // 레벨당 1.2배 증가
  },
  // ...
};
```

**사용 예시:**

```typescript
import { GAME_CONFIG } from '@/config/game.config';

if (gameTime >= GAME_CONFIG.time.victoryTime) {
  showVictoryScreen();
}
```

### 2. `config/balance.config.ts`

게임 밸런스 수치 (자주 조정됨)

#### 플레이어 밸런스

```typescript
export const PLAYER_BALANCE = {
  health: 100,
  speed: 250,
  radius: 40,
  invincibleDuration: 0.5,
  baseStats: {
    strength: 0,
    agility: 0,
    intelligence: 0,
  },
};
```

#### 적 밸런스 (티어별)

```typescript
export const ENEMY_BALANCE = {
  normal: {
    health: 30,
    speed: 100,
    damage: 10,
    radius: 30,
    xpDrop: 5,
  },
  elite: {
    health: 100,
    speed: 80,
    damage: 20,
    radius: 40,
    xpDrop: 25,
  },
  boss: {
    health: 500,
    speed: 60,
    damage: 30,
    radius: 60,
    xpDrop: 100,
  },
};
```

#### 무기 밸런스

```typescript
export const WEAPON_BALANCE = {
  talisman: {
    name: '부적',
    baseDamage: 15,
    baseCooldown: 1.0,
    projectileSpeed: 500,
    // ...
    levelScaling: {
      damage: 5, // 레벨당 +5 데미지
      cooldownReduction: 0.05, // 레벨당 -0.05초
      piercingPerLevel: 0, // 5레벨마다 +1 관통
    },
  },
  // dokkaebi_fire, moktak_sound, jakdu_blade...
};
```

#### 스탯 효과

```typescript
export const STAT_EFFECTS = {
  strength: {
    damagePerPoint: 0.05, // 힘 1당 데미지 +5%
  },
  agility: {
    moveSpeedPerPoint: 0.02, // 민첩 1당 이속 +2%
    attackSpeedPerPoint: 0.03, // 민첩 1당 공속 +3%
  },
  intelligence: {
    projectileCountThreshold: 10, // 지능 10당 투사체 +1
    areaPerPoint: 0.02, // 지능 1당 범위 +2%
  },
};
```

---

## Data 파일

### 1. `game/data/weapons.ts`

무기 콘텐츠 데이터베이스

#### 타입 정의

```typescript
export type WeaponType = 'talisman' | 'dokkaebi_fire' | 'moktak_sound' | 'jakdu_blade';

export interface WeaponData {
  id: WeaponType;
  name: string;
  description: string;
  baseDamage: number;
  baseCooldown: number;
  projectileSpeed?: number;
  projectileCount: number;
  piercing: number;
  aoeRadius?: number; // 범위 공격용
  levelScaling: {
    damage: number;
    cooldownReduction: number;
    piercingPerLevel: number;
  };
}
```

#### 데이터베이스

```typescript
export const WEAPON_DATA: Record<WeaponType, WeaponData> = {
  talisman: {
    id: 'talisman',
    name: '부적',
    description: '가장 가까운 적을 자동으로 추적하는 부적',
    baseDamage: WEAPON_BALANCE.talisman.baseDamage,
    // ...
  },
  // 다른 무기들...
};
```

#### 유틸리티 함수

```typescript
// 무기 데이터 가져오기
export function getWeaponData(weaponType: WeaponType): WeaponData;

// 레벨별 스탯 계산
export function calculateWeaponStats(
  weaponType: WeaponType,
  level: number
): { damage: number; cooldown: number; piercing: number };
```

**사용 예시:**

```typescript
import { calculateWeaponStats } from '@/game/data/weapons';

const level5Stats = calculateWeaponStats('talisman', 5);
// { damage: 35, cooldown: 0.75, piercing: 2 }
```

### 2. `game/data/enemies.ts`

적 콘텐츠 데이터베이스

#### 타입 정의

```typescript
export type EnemyTier = 'normal' | 'elite' | 'boss';

export interface EnemyData {
  id: string;
  name: string;
  tier: EnemyTier;
  health: number;
  speed: number;
  damage: number;
  radius: number;
  xpDrop: number;
  color: number;
  description?: string;
}
```

#### 유틸리티 함수

```typescript
// 티어로 적 데이터 가져오기
export function getEnemyDataByTier(tier: EnemyTier): EnemyData;

// 게임 시간에 따른 스탯 스케일링
export function scaleEnemyStats(
  baseData: EnemyData,
  gameTime: number
): { health: number; damage: number; speed: number };

// 게임 시간에 따른 적 등장 확률
export function getEnemyTierProbability(gameTime: number): {
  normal: number;
  elite: number;
  boss: number;
};

// 확률 기반 적 티어 선택
export function selectEnemyTier(gameTime: number): EnemyTier;
```

**사용 예시:**

```typescript
import { selectEnemyTier, scaleEnemyStats, getEnemyDataByTier } from '@/game/data/enemies';

// 게임 시간에 따라 적 티어 선택
const tier = selectEnemyTier(gameTime); // 'normal' | 'elite' | 'boss'

// 기본 데이터 가져오기
const baseData = getEnemyDataByTier(tier);

// 게임 시간에 따라 스탯 조정
const scaledStats = scaleEnemyStats(baseData, gameTime);
// 5분 경과 시: health, damage, speed 모두 증가
```

---

## 엔티티에서 사용하기

### Player 엔티티

```typescript
import { PLAYER_BALANCE } from '@/config/balance.config';

export class Player extends Container {
  public radius: number = PLAYER_BALANCE.radius;
  public health: number = PLAYER_BALANCE.health;
  public maxHealth: number = PLAYER_BALANCE.health;
  public speed: number = PLAYER_BALANCE.speed;
  private invincibleDuration: number = PLAYER_BALANCE.invincibleDuration;

  // ...
}
```

### Enemy 엔티티

```typescript
import { ENEMY_BALANCE } from '@/config/balance.config';
import type { EnemyTier } from '@/game/data/enemies';

export class Enemy extends Container {
  constructor(id: string, x: number, y: number, tier: EnemyTier = 'normal') {
    super();

    // 티어에 따른 스탯 설정
    const stats = ENEMY_BALANCE[tier];
    this.radius = stats.radius;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpDrop = stats.xpDrop;
  }
}
```

### Weapon 구현

```typescript
import { calculateWeaponStats } from '@/game/data/weapons';

export class Talisman extends Weapon {
  constructor() {
    const stats = calculateWeaponStats('talisman', 1);
    super('부적', stats.damage, stats.cooldown);
  }

  public levelUp(): void {
    super.levelUp();

    // 레벨에 따른 스탯 재계산
    const stats = calculateWeaponStats('talisman', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
  }
}
```

### SpawnSystem

```typescript
import { SPAWN_BALANCE } from '@/config/balance.config';
import { selectEnemyTier } from '@/game/data/enemies';

export class SpawnSystem {
  private spawnInterval: number = SPAWN_BALANCE.initialInterval;

  private spawnEnemy(gameTime: number): Enemy {
    const tier = selectEnemyTier(gameTime);
    return new Enemy(`enemy_${this.count++}`, x, y, tier);
  }

  public increaseSpawnRate(): void {
    this.spawnInterval = Math.max(
      SPAWN_BALANCE.minInterval,
      this.spawnInterval - SPAWN_BALANCE.intervalReduction
    );
  }
}
```

---

## 새 콘텐츠 추가하기

### 새 무기 추가 체크리스트

#### 1. `balance.config.ts`에 밸런스 추가

```typescript
export const WEAPON_BALANCE = {
  // 기존 무기들...

  my_new_weapon: {
    name: '새로운 무기',
    baseDamage: 20,
    baseCooldown: 1.5,
    projectileSpeed: 400,
    projectileRadius: 10,
    projectileLifetime: 4,
    piercing: 2,
    projectileCount: 1,
    levelScaling: {
      damage: 7,
      cooldownReduction: 0.08,
      piercingPerLevel: 1,
    },
  },
};
```

#### 2. `game/data/weapons.ts`에 타입 및 데이터 추가

```typescript
// 타입에 추가
export type WeaponType =
  | 'talisman'
  | 'dokkaebi_fire'
  | 'moktak_sound'
  | 'jakdu_blade'
  | 'my_new_weapon';

// 데이터베이스에 추가
export const WEAPON_DATA: Record<WeaponType, WeaponData> = {
  // 기존 무기들...

  my_new_weapon: {
    id: 'my_new_weapon',
    name: '새로운 무기',
    description: '무기 설명',
    baseDamage: WEAPON_BALANCE.my_new_weapon.baseDamage,
    baseCooldown: WEAPON_BALANCE.my_new_weapon.baseCooldown,
    // ...
    levelScaling: WEAPON_BALANCE.my_new_weapon.levelScaling,
  },
};
```

#### 3. `game/weapons/MyNewWeapon.ts` 구현 파일 생성

```typescript
import { calculateWeaponStats } from '@/game/data/weapons';
import { Weapon } from './Weapon';

export class MyNewWeapon extends Weapon {
  constructor() {
    const stats = calculateWeaponStats('my_new_weapon', 1);
    super('새로운 무기', stats.damage, stats.cooldown);
  }

  public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    if (!this.canFire()) return [];

    // 발사 로직 구현
    // ...

    this.resetCooldown();
    return projectiles;
  }

  public levelUp(): void {
    super.levelUp();
    const stats = calculateWeaponStats('my_new_weapon', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
  }
}
```

### 새 적 타입 추가 (예: 중간 티어)

#### 1. `balance.config.ts`에 밸런스 추가

```typescript
export const ENEMY_BALANCE = {
  normal: {
    /* ... */
  },
  champion: {
    // 새 티어
    health: 60,
    speed: 90,
    damage: 15,
    radius: 35,
    xpDrop: 15,
  },
  elite: {
    /* ... */
  },
  boss: {
    /* ... */
  },
};
```

#### 2. `game/data/enemies.ts` 업데이트

```typescript
export type EnemyTier = 'normal' | 'champion' | 'elite' | 'boss';

export const ENEMY_DATA: Record<EnemyTier, EnemyData> = {
  // ...
  champion: {
    id: 'champion',
    name: '챔피언',
    tier: 'champion',
    health: ENEMY_BALANCE.champion.health,
    speed: ENEMY_BALANCE.champion.speed,
    damage: ENEMY_BALANCE.champion.damage,
    radius: ENEMY_BALANCE.champion.radius,
    xpDrop: ENEMY_BALANCE.champion.xpDrop,
    color: 0xffcc55,
  },
};

// getEnemyTierProbability 함수에 확률 추가
export function getEnemyTierProbability(gameTime: number) {
  // champion 확률 추가
  // ...
}
```

#### 3. Enemy.ts의 색상 매핑 업데이트

```typescript
switch (tier) {
  case 'champion':
    this.color = 0xffcc55;
    break;
  case 'elite':
    this.color = 0xff8855;
    break;
  // ...
}
```

---

## 밸런스 조정 워크플로우

### 1. 간단한 수치 조정

**시나리오**: "플레이어가 너무 약해요"

```typescript
// config/balance.config.ts
export const PLAYER_BALANCE = {
  health: 100, // 100 → 150으로 변경
  speed: 250, // 250 → 300으로 변경
  // ...
};
```

✅ 코드 수정 없음
✅ 즉시 반영
✅ 타입 안정성 유지

### 2. 무기 밸런스 조정

**시나리오**: "부적이 너무 약해요"

```typescript
// config/balance.config.ts
export const WEAPON_BALANCE = {
  talisman: {
    baseDamage: 15, // 15 → 20으로 증가
    baseCooldown: 1.0, // 1.0 → 0.8로 감소 (더 빠르게)
    levelScaling: {
      damage: 5, // 5 → 7로 증가 (레벨업 효과 증가)
      // ...
    },
  },
};
```

✅ 레벨별 데미지가 자동으로 재계산됨
✅ 모든 Talisman 인스턴스에 자동 적용

### 3. 난이도 곡선 조정

**시나리오**: "적이 너무 빨리 강해져요"

```typescript
// game/data/enemies.ts
export function scaleEnemyStats(baseData: EnemyData, gameTime: number) {
  // 1분마다 10% → 5%로 변경
  const scalingFactor = 1 + Math.floor(gameTime / 60) * 0.05; // 0.1 → 0.05

  return {
    health: Math.floor(baseData.health * scalingFactor),
    damage: Math.floor(baseData.damage * scalingFactor),
    speed: baseData.speed * Math.min(1.3, scalingFactor),
  };
}
```

### 4. 테스트용 치트 설정

개발 중 빠른 테스트를 위해:

```typescript
// config/balance.config.ts (개발 모드)
export const PLAYER_BALANCE = {
  health: 9999, // 무적 모드
  speed: 1000, // 고속 이동
  // ...
};

export const ENEMY_BALANCE = {
  normal: {
    health: 1, // 원샷 원킬
    damage: 0, // 데미지 없음
    // ...
  },
};
```

> ⚠️ **주의**: 커밋 전에 원래 값으로 되돌리기!

---

## 모범 사례

### ✅ DO

- **설정 파일에서 값 가져오기**

  ```typescript
  const health = PLAYER_BALANCE.health;
  ```

- **유틸리티 함수 사용**

  ```typescript
  const stats = calculateWeaponStats('talisman', level);
  ```

- **타입 안정성 활용**

  ```typescript
  const weaponType: WeaponType = 'talisman'; // 자동완성 지원
  ```

- **밸런스 조정은 config 파일에서만**
  ```typescript
  // balance.config.ts
  baseDamage: 20,  // 여기서 수정
  ```

### ❌ DON'T

- **하드코딩하지 않기**

  ```typescript
  // ❌ 나쁜 예
  this.health = 100;

  // ✅ 좋은 예
  this.health = PLAYER_BALANCE.health;
  ```

- **매직 넘버 사용하지 않기**

  ```typescript
  // ❌ 나쁜 예
  if (level % 5 === 0) damage += 10;

  // ✅ 좋은 예
  const stats = calculateWeaponStats(weaponType, level);
  ```

- **로직에 밸런스 값 섞지 않기**

  ```typescript
  // ❌ 나쁜 예
  class Player {
    levelUp() {
      if (this.level === 2) this.damage += 5;
      if (this.level === 3) this.speed += 10;
    }
  }

  // ✅ 좋은 예: StatSystem에서 계산
  const bonusStats = StatSystem.calculateLevelBonus(level);
  ```

---

## 다음 단계

이 데이터 레이어 위에 구현할 시스템들:

1. **LevelSystem** - `GAME_CONFIG.levelUp`과 `XP_BALANCE` 사용
2. **StatSystem** - `STAT_EFFECTS` 공식 적용
3. **EquipmentSystem** - 장비별 스탯 보너스 관리
4. **PickupSystem** - `XP_BALANCE` 기반 경험치 젬 드랍

모든 시스템은 이 데이터 레이어를 기반으로 구축되어야 합니다.

---

## 참고 문서

- [FOLDER_STRUCTURE.md](../FOLDER_STRUCTURE.md) - 전체 프로젝트 구조
- [architecture.md](../architecture.md) - 아키텍처 설계
- [CORE_DESIGN.md](../CORE_DESIGN.md) - 게임 디자인 문서

---

**작성일**: 2025-01-XX
**작성자**: Claude Code
**버전**: 1.0
