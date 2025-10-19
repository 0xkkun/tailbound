# 무기 시스템 구현 문서

> 魂录 무기 시스템 설계 및 구현 가이드 (회의 내용 반영)

---

## 목차

1. [개요](#개요)
2. [무기 전체 구조](#무기-전체-구조)
3. [무기별 상세 스펙](#무기별-상세-스펙)
4. [데이터 구조](#데이터-구조)
5. [레벨업 및 업그레이드](#레벨업-및-업그레이드)
6. [구현 예시](#구현-예시)

---

## 개요

### 설계 철학

- **Vampire Survivors 참조**: 각 무기는 원작의 특정 무기를 참고하되, 한국 전통 테마로 재해석
- **자동 공격**: 모든 무기는 플레이어 조작 없이 자동으로 발동
- **다양한 빌드**: 무기 간 조합으로 다양한 플레이 스타일 지원
- **명확한 역할**: 각 무기는 고유한 특성과 역할 보유

### 무기 분류

| 분류 | 특징 | 예시 |
|------|------|------|
| **원거리 투사체형** | 적을 향해 날아가는 발사체 | 부적, 부채바람 |
| **궤도형** | 플레이어 주변을 맴돌며 지속 피해 | 도깨비불 |
| **광역형** | 주기적으로 넓은 범위 공격 | 목탁소리 |
| **근접형** | 플레이어 근처를 휘두르는 근접 공격 | 작두 |
| **설치형** | 바닥에 남아 지속 피해 영역 생성 | 정화수 |

---

## 무기 전체 구조

### 무기 목록 및 원작 대응

| 무기 이름 | 영문 | 원작 참조 | 타입 | 핵심 업그레이드 |
|-----------|------|-----------|------|-----------------|
| 부적 (符籍) | Talisman | Magic Wand | 원거리 투사체 | 🔹투사체 수량 🔹속도 🔹관통 |
| 도깨비불 (도깨비火) | Dokkaebi Fire | King Bible | 궤도형 | 🔹개수 🔹회전 속도 🔹피해 |
| 목탁소리 (木鐸聲) | Moktak Sound | Garlic | 광역 음파 | 🔹범위 🔹피해 🔹쿨타임 |
| 작두 (작두) | Jakdu Blade | Whip | 근접 휘두르기 | 🔹범위 🔹공속 🔹다단 공격 |
| 부채바람 (扇風) | Fan Wind | Axe | 관통형 투사체 | 🔹투사체 수 🔹관통 🔹속도 |
| 정화수 (淨化水) | Purifying Water | Santa Water | 바닥 DOT형 | 🔹개수 🔹범위 🔹지속시간 |

---

## 무기별 상세 스펙

### 1. 부적 (符籍) - Talisman

**원작**: Magic Wand
**분류**: 원거리 투사체형

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 기본 피해 | 15 | 50 | 부적 1개당 피해량 |
| 발사 간격 | 1.2초 | 0.4초 | 쿨타임 |
| 투사체 수량 | 1 | 8 | 동시 발사 개수 |
| 투사체 속도 | 400 | 700 | px/s |
| 관통력 | 0 | 3 | 적 관통 횟수 |
| 탐지 범위 | 무한 | 무한 | 가장 가까운 적 자동 추적 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 기본 부적 (1개 발사) |
| Lv.2 | 투사체 +1 (총 2개) |
| Lv.3 | 피해 +10, 속도 +50 |
| Lv.4 | 투사체 +1 (총 3개) |
| Lv.5 | 관통 +1, 쿨타임 -0.2초 |
| Lv.6 | 투사체 +2 (총 5개) |
| Lv.7 | 피해 +15, 관통 +1 |
| Lv.8 | **진화**: 천부경 (天符經) - 부적이 적을 추적하며 피해 2배 |

#### 구현 특징

- 가장 가까운 적을 자동 추적
- 여러 개 발사 시 각도 분산 (`angleSpread`)
- 관통 시 피해 감소 없음

---

### 2. 도깨비불 (도깨비火) - Dokkaebi Fire

**원작**: King Bible
**분류**: 궤도형 지속 피해

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 기본 피해 | 10 | 40 | 초당 피해 (틱당 아님) |
| 궤도 개수 | 1 | 8 | 불꽃 개수 |
| 회전 반경 | 80px | 150px | 플레이어 중심으로부터 거리 |
| 회전 속도 | 2 rad/s | 4 rad/s | 각속도 |
| 크기 | 15px | 30px | 불꽃 반지름 |
| 피해 간격 | 0.5초 | 0.3초 | 동일 적 재공격 쿨타임 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 도깨비불 1개 |
| Lv.2 | 개수 +1 (총 2개) |
| Lv.3 | 피해 +8, 크기 +3px |
| Lv.4 | 개수 +1 (총 3개) |
| Lv.5 | 회전 속도 +0.5, 반경 +15px |
| Lv.6 | 개수 +2 (총 5개) |
| Lv.7 | 피해 +12, 피해 간격 -0.1초 |
| Lv.8 | **진화**: 야차화염 (夜叉火焰) - 궤도가 2겹으로 증가, 반경 차이 회전 |

#### 구현 특징

- 플레이어 주변을 등간격 각도로 배치
- 접촉 시 지속 피해 (쿨타임으로 중복 방지)
- 레벨업 시 `spawnOrbitals()` 재호출로 재배치

---

### 3. 목탁소리 (木鐸聲) - Moktak Sound

**원작**: Garlic
**분류**: 광역 음파 공격

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 기본 피해 | 25 | 80 | 광역 피해 |
| 범위 반경 | 120px | 300px | 원형 범위 |
| 쿨타임 | 3.0초 | 1.0초 | 발동 간격 |
| 넉백 거리 | 50px | 150px | 적 밀어내기 |
| 지속 시간 | 0.5초 | 0.8초 | 시각 이펙트 지속 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 목탁소리 기본 (120px 범위) |
| Lv.2 | 범위 +30px |
| Lv.3 | 피해 +15, 넉백 +20px |
| Lv.4 | 쿨타임 -0.5초 |
| Lv.5 | 범위 +40px, 피해 +20 |
| Lv.6 | 넉백 +30px, 쿨타임 -0.5초 |
| Lv.7 | 피해 +20, 범위 +50px |
| Lv.8 | **진화**: 범종 (梵鐘) - 범위 2배, 적 5초간 기절 |

#### 구현 특징

- 플레이어 중심 원형 AoE
- 범위 내 모든 적에게 동시 피해
- 넉백 효과로 생존성 향상
- 확장 애니메이션 (0.5→1.0 스케일)

---

### 4. 작두 (작두) - Jakdu Blade

**원작**: Whip
**분류**: 근접 휘두르기

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 기본 피해 | 30 | 100 | 1회 휘두르기 피해 |
| 공격 범위 | 100px | 200px | 부채꼴 반경 |
| 휘두르기 각도 | 120° | 270° | 공격 범위 각도 |
| 공격 속도 | 1.5초 | 0.6초 | 쿨타임 |
| 다단 공격 | 1 | 3 | 연속 휘두르기 횟수 |
| 출혈 피해 | 0 | 5/s | DOT 효과 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 작두 1회 휘두르기 |
| Lv.2 | 범위 +20px, 각도 +20° |
| Lv.3 | 피해 +20, 공속 -0.2초 |
| Lv.4 | **다단 +1** (2회 연속 휘두르기) |
| Lv.5 | 범위 +30px, 피해 +25 |
| Lv.6 | 공속 -0.3초, 출혈 +3/s |
| Lv.7 | **다단 +1** (3회 연속) |
| Lv.8 | **진화**: 무쇠작두 (巫鐵작두) - 범위 확장, 적 관통, 다단 5회 |

#### 구현 특징

- 플레이어 주변 부채꼴 범위 공격
- 다단 공격: 0.15초 간격으로 연속 휘두르기
- 마우스 방향 또는 최근 이동 방향으로 휘두름
- 회전 애니메이션 (startAngle → endAngle)

---

### 5. 부채바람 (扇風) - Fan Wind

**원작**: Axe
**분류**: 관통형 투사체

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 기본 피해 | 25 | 90 | 투사체 1개당 피해 |
| 투사체 수량 | 1 | 6 | 동시 발사 개수 |
| 투사체 속도 | 300 | 600 | px/s |
| 관통력 | 무한 | 무한 | 모든 적 관통 |
| 사거리 | 500px | 800px | 최대 비행 거리 |
| 쿨타임 | 2.0초 | 0.8초 | 발사 간격 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 부채바람 1개 (직선 발사) |
| Lv.2 | 투사체 +1 (총 2개, 좌우 발산) |
| Lv.3 | 피해 +15, 속도 +100 |
| Lv.4 | 투사체 +1 (총 3개) |
| Lv.5 | 사거리 +150px, 쿨타임 -0.3초 |
| Lv.6 | 투사체 +2 (총 5개) |
| Lv.7 | 피해 +30, 속도 +150 |
| Lv.8 | **진화**: 태극선 (太極扇) - 투사체 회전하며 되돌아옴 (부메랑) |

#### 구현 특징

- 플레이어 전방으로 직선 발사
- 무한 관통 (모든 적 통과)
- 여러 개 발사 시 부채꼴 형태 (`Math.PI / 4` 간격)
- 진화 시 부메랑 패턴 (왕복)

---

### 6. 정화수 (淨化水) - Purifying Water

**원작**: Santa Water
**분류**: 바닥 DOT형 (설치형)

#### 기본 스펙

| 속성 | 초기값 | 최대값 | 설명 |
|------|--------|--------|------|
| 초당 피해 | 8 | 35 | DOT 틱 피해 |
| 투사체 수량 | 1 | 5 | 동시 생성 개수 |
| 범위 반경 | 80px | 180px | 물웅덩이 크기 |
| 지속 시간 | 3초 | 6초 | 바닥 유지 시간 |
| 쿨타임 | 4.0초 | 2.0초 | 생성 간격 |
| 슬로우 효과 | 0% | 30% | 적 이동 속도 감소 |

#### 레벨별 업그레이드

| 레벨 | 효과 |
|------|------|
| Lv.1 | 정화수 1개 생성 |
| Lv.2 | 투사체 +1 (총 2개) |
| Lv.3 | 범위 +20px, 피해 +5 |
| Lv.4 | 지속 시간 +1초 |
| Lv.5 | 투사체 +1 (총 3개), 슬로우 +10% |
| Lv.6 | 쿨타임 -0.5초, 피해 +10 |
| Lv.7 | 범위 +40px, 슬로우 +10% |
| Lv.8 | **진화**: 성수 (聖水) - 피해 2배, 적 정화(즉사) 확률 5% |

#### 구현 특징

- 랜덤 위치 또는 적 밀집 지역에 생성
- 바닥에 남아 범위 내 적에게 지속 피해
- 틱 간격: 0.5초 (초당 2회 피해)
- 슬로우 효과로 제압형 역할

---

## 데이터 구조

### 파일 위치
`src/game/data/weapons.ts`

### TypeScript 타입 정의

```typescript
/**
 * 무기 타입
 */
export type WeaponType =
  | 'talisman'      // 부적
  | 'dokkaebi'      // 도깨비불
  | 'moktak'        // 목탁소리
  | 'jakdu'         // 작두
  | 'fan'           // 부채바람
  | 'water';        // 정화수

/**
 * 무기 분류
 */
export type WeaponCategory =
  | 'projectile'    // 투사체형
  | 'orbital'       // 궤도형
  | 'aoe'           // 광역형
  | 'melee'         // 근접형
  | 'ground';       // 설치형

/**
 * 무기 데이터 인터페이스
 */
export interface WeaponData {
  id: string;                   // weapon_talisman 형식
  name: string;                 // 한글 이름
  description: string;          // 설명
  category: WeaponCategory;     // 분류
  icon?: string;                // 아이콘 경로

  // 기본 스탯
  baseDamage: number;           // 기본 피해량
  baseCooldown: number;         // 기본 쿨타임 (초)
  baseSpeed?: number;           // 투사체 속도 (px/s)
  baseRange?: number;           // 사거리 (px)
  baseArea?: number;            // 범위 (px)

  // 특수 속성
  piercing?: number;            // 관통력
  projectileCount?: number;     // 투사체 수량
  orbitalCount?: number;        // 궤도 개수
  duration?: number;            // 지속 시간

  // 레벨 스케일링
  levelScaling: {
    damage: number;             // 레벨당 피해 증가
    cooldownReduction: number;  // 레벨당 쿨타임 감소
    additionalEffects?: Record<string, number>; // 추가 효과
  };

  // 최대 레벨 및 진화
  maxLevel: number;
  evolution?: {
    name: string;               // 진화 이름
    description: string;        // 진화 설명
    bonusEffect: string;        // 특별 효과
  };
}

/**
 * 무기 인스턴스 상태
 */
export interface WeaponInstance {
  type: WeaponType;
  level: number;
  damage: number;
  cooldown: number;
  currentCooldown: number;

  // 타입별 추가 속성
  projectileCount?: number;
  orbitalCount?: number;
  range?: number;
  area?: number;
  piercing?: number;
  duration?: number;
}
```

### 무기 데이터 정의 예시

```typescript
export const WEAPON_DATA: Record<WeaponType, WeaponData> = {
  talisman: {
    id: 'weapon_talisman',
    name: '부적 (符籍)',
    description: '적을 추적하는 마법 부적을 발사합니다.',
    category: 'projectile',

    baseDamage: 15,
    baseCooldown: 1.2,
    baseSpeed: 400,
    baseRange: 600,

    piercing: 0,
    projectileCount: 1,

    levelScaling: {
      damage: 5,
      cooldownReduction: 0.1,
      additionalEffects: {
        projectileCount: 0.25,  // 4레벨마다 +1
        piercing: 0.2,          // 5레벨마다 +1
        speed: 50,
      },
    },

    maxLevel: 8,
    evolution: {
      name: '천부경 (天符經)',
      description: '부적이 적을 강력하게 추적하며 피해가 2배가 됩니다.',
      bonusEffect: '피해 2배, 강력한 추적',
    },
  },

  dokkaebi: {
    id: 'weapon_dokkaebi',
    name: '도깨비불 (도깨비火)',
    description: '플레이어 주변을 맴도는 푸른 불꽃입니다.',
    category: 'orbital',

    baseDamage: 10,
    baseCooldown: 0, // 지속형
    baseSpeed: 2.0,  // 각속도 (rad/s)
    baseRange: 80,   // 궤도 반경

    orbitalCount: 1,

    levelScaling: {
      damage: 5,
      cooldownReduction: 0,
      additionalEffects: {
        orbitalCount: 0.5,  // 2레벨마다 +1
        range: 10,          // 반경 증가
        speed: 0.3,         // 회전 속도
      },
    },

    maxLevel: 8,
    evolution: {
      name: '야차화염 (夜叉火焰)',
      description: '불꽃이 2겹으로 회전하며 더욱 강력해집니다.',
      bonusEffect: '2겹 궤도, 피해 1.5배',
    },
  },

  // 나머지 무기도 동일한 형식으로...
};
```

---

## 레벨업 및 업그레이드

### 레벨업 시스템

```typescript
/**
 * 무기 스탯 계산 함수
 */
export function calculateWeaponStats(
  weaponType: WeaponType,
  level: number
): WeaponInstance {
  const data = WEAPON_DATA[weaponType];
  if (!data) {
    throw new Error(`Unknown weapon type: ${weaponType}`);
  }

  const stats: WeaponInstance = {
    type: weaponType,
    level: level,
    damage: data.baseDamage + data.levelScaling.damage * (level - 1),
    cooldown: Math.max(
      0.3,
      data.baseCooldown - data.levelScaling.cooldownReduction * (level - 1)
    ),
    currentCooldown: 0,
  };

  // 추가 효과 계산
  if (data.levelScaling.additionalEffects) {
    const effects = data.levelScaling.additionalEffects;

    if (effects.projectileCount) {
      stats.projectileCount =
        (data.projectileCount || 1) +
        Math.floor((level - 1) * effects.projectileCount);
    }

    if (effects.orbitalCount) {
      stats.orbitalCount =
        (data.orbitalCount || 1) +
        Math.floor((level - 1) * effects.orbitalCount);
    }

    if (effects.piercing) {
      stats.piercing =
        (data.piercing || 0) + Math.floor((level - 1) * effects.piercing);
    }

    if (effects.range) {
      stats.range = (data.baseRange || 0) + effects.range * (level - 1);
    }

    if (effects.area) {
      stats.area = (data.baseArea || 0) + effects.area * (level - 1);
    }
  }

  return stats;
}
```

### 진화 시스템 (레벨 8)

```typescript
/**
 * 무기 진화 체크 및 적용
 */
export class Weapon {
  protected evolved: boolean = false;

  public levelUp(): void {
    this.level++;

    // 레벨 8 달성 시 진화
    if (this.level === 8 && !this.evolved) {
      this.evolve();
    }

    // 스탯 재계산
    this.updateStats();
  }

  protected evolve(): void {
    const data = WEAPON_DATA[this.type];
    if (!data.evolution) return;

    this.evolved = true;
    console.log(`⭐ ${data.name} → ${data.evolution.name} 진화!`);

    // 무기별 진화 효과 적용
    this.applyEvolutionEffect();
  }

  protected applyEvolutionEffect(): void {
    // 각 무기 클래스에서 오버라이드
    // 예: 부적 - 추적 강화, 피해 2배
  }
}
```

---

## 구현 예시

### 1. 부적 (Talisman) 구현

```typescript
// src/game/weapons/Talisman.ts
import { calculateWeaponStats, WEAPON_DATA } from '@/game/data/weapons';
import type { Enemy } from '@/game/entities/Enemy';
import { Projectile } from '@/game/entities/Projectile';
import { getDirection, getDistance } from '@/utils/math';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class Talisman extends Weapon {
  private projectileCount: number = 1;
  private projectileSpeed: number = 400;
  private piercing: number = 0;

  constructor() {
    const stats = calculateWeaponStats('talisman', 1);
    super('부적', stats.damage, stats.cooldown);
    this.updateFromStats(stats);
  }

  public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    if (!this.canFire()) return [];

    const projectiles: Projectile[] = [];

    // 발사 각도 계산 (여러 개일 경우 분산)
    const angleSpread = Math.PI / 6; // 30도
    const startAngle = -(this.projectileCount - 1) * angleSpread / 2;

    for (let i = 0; i < this.projectileCount; i++) {
      // 가장 가까운 적 찾기
      const target = this.findClosestEnemy(playerPos, enemies);
      if (!target) break;

      // 방향 계산
      const baseDirection = getDirection(playerPos, { x: target.x, y: target.y });
      const angle = Math.atan2(baseDirection.y, baseDirection.x) + startAngle + i * angleSpread;

      const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };

      // 투사체 생성
      const projectile = new Projectile(
        `talisman_${Date.now()}_${i}`,
        playerPos.x,
        playerPos.y,
        direction,
        0xffdd00 // 노란색
      );
      projectile.damage = this.damage;
      projectile.speed = this.projectileSpeed;
      projectile.piercing = this.piercing;

      // 진화 시 추적 강화
      if (this.evolved) {
        projectile.damage *= 2;
        projectile.homing = true; // 추적 활성화
        projectile.homingStrength = 0.05;
      }

      projectiles.push(projectile);
    }

    this.resetCooldown();
    return projectiles;
  }

  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('talisman', this.level);
    this.updateFromStats(stats);

    console.log(`📜 부적 레벨 ${this.level}! (투사체: ${this.projectileCount})`);
  }

  private updateFromStats(stats: any): void {
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
    this.projectileCount = stats.projectileCount || 1;
    this.piercing = stats.piercing || 0;
  }

  private findClosestEnemy(playerPos: Vector2, enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let minDistance = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active || !enemy.isAlive()) continue;

      const distance = getDistance(playerPos, { x: enemy.x, y: enemy.y });
      if (distance < minDistance) {
        minDistance = distance;
        closest = enemy;
      }
    }

    return closest;
  }
}
```

---

### 2. 작두 (Jakdu) 근접 공격 구현

```typescript
// src/game/weapons/JakduBlade.ts
import { calculateWeaponStats } from '@/game/data/weapons';
import type { Enemy } from '@/game/entities/Enemy';
import { MeleeSwing } from '@/game/entities/MeleeSwing';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class JakduBlade extends Weapon {
  private range: number = 100;
  private sweepAngle: number = (120 * Math.PI) / 180; // 120도
  private multiHitCount: number = 1; // 다단 공격 횟수

  constructor() {
    const stats = calculateWeaponStats('jakdu', 1);
    super('작두', stats.damage, stats.cooldown);
    this.range = stats.range || 100;
  }

  public fire(playerPos: Vector2, enemies: Enemy[], playerDirection?: Vector2): MeleeSwing[] {
    if (!this.canFire()) return [];

    const swings: MeleeSwing[] = [];

    // 플레이어 이동 방향 또는 기본 방향
    const baseAngle = playerDirection
      ? Math.atan2(playerDirection.y, playerDirection.x)
      : 0;

    // 다단 공격
    for (let i = 0; i < this.multiHitCount; i++) {
      setTimeout(() => {
        const swing = new MeleeSwing(
          playerPos.x,
          playerPos.y,
          baseAngle,
          this.range,
          this.sweepAngle,
          this.damage
        );

        swings.push(swing);
      }, i * 150); // 0.15초 간격
    }

    this.resetCooldown();
    return swings;
  }

  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('jakdu', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
    this.range = stats.range || 100;

    // 레벨 4, 7에서 다단 공격 증가
    if (this.level === 4) {
      this.multiHitCount = 2;
    } else if (this.level === 7) {
      this.multiHitCount = 3;
    }

    console.log(`⚔️ 작두 레벨 ${this.level}! (다단: ${this.multiHitCount})`);
  }

  protected applyEvolutionEffect(): void {
    // 진화: 무쇠작두
    this.sweepAngle = (270 * Math.PI) / 180; // 270도
    this.range += 50;
    this.multiHitCount = 5;
    console.log('⚒️ 무쇠작두로 진화! 다단 5회 공격!');
  }
}
```

---

### 3. 정화수 (Purifying Water) 설치형 구현

```typescript
// src/game/weapons/PurifyingWater.ts
import { calculateWeaponStats } from '@/game/data/weapons';
import type { Enemy } from '@/game/entities/Enemy';
import { GroundAoE } from '@/game/entities/GroundAoE';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class PurifyingWater extends Weapon {
  private count: number = 1;
  private area: number = 80;
  private duration: number = 3;
  private tickDamage: number = 8;
  private slowPercent: number = 0;

  constructor() {
    const stats = calculateWeaponStats('water', 1);
    super('정화수', stats.damage, stats.cooldown);
    this.updateFromStats(stats);
  }

  public fire(playerPos: Vector2, enemies: Enemy[]): GroundAoE[] {
    if (!this.canFire()) return [];

    const aoes: GroundAoE[] = [];

    for (let i = 0; i < this.count; i++) {
      // 적 밀집 지역 또는 랜덤 위치
      const targetPos = this.findDenseEnemyArea(playerPos, enemies, 200);

      const aoe = new GroundAoE(
        targetPos.x,
        targetPos.y,
        this.area,
        this.tickDamage,
        this.duration
      );

      aoe.slowPercent = this.slowPercent;

      // 진화: 성수 - 즉사 확률
      if (this.evolved) {
        aoe.purifyChance = 0.05; // 5% 즉사
        aoe.tickDamage *= 2;
      }

      aoes.push(aoe);
    }

    this.resetCooldown();
    return aoes;
  }

  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('water', this.level);
    this.updateFromStats(stats);

    console.log(`💧 정화수 레벨 ${this.level}! (개수: ${this.count})`);
  }

  private updateFromStats(stats: any): void {
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;
    this.count = stats.projectileCount || 1;
    this.area = stats.area || 80;
    this.duration = stats.duration || 3;
    this.tickDamage = stats.damage / 2; // 초당 피해 = 총 피해 / 2
  }

  private findDenseEnemyArea(
    playerPos: Vector2,
    enemies: Enemy[],
    searchRadius: number
  ): Vector2 {
    // 플레이어 주변 200px 내 적 밀집 지역 찾기
    // 간단 구현: 적이 3마리 이상인 곳
    // TODO: 더 정교한 밀집도 계산

    const nearbyEnemies = enemies.filter(
      (e) => getDistance(playerPos, { x: e.x, y: e.y }) < searchRadius
    );

    if (nearbyEnemies.length > 0) {
      const randomEnemy =
        nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];
      return { x: randomEnemy.x, y: randomEnemy.y };
    }

    // 적 없으면 플레이어 앞 랜덤 위치
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 100;

    return {
      x: playerPos.x + Math.cos(angle) * distance,
      y: playerPos.y + Math.sin(angle) * distance,
    };
  }
}
```

---

## 통합 및 테스트

### GameScene에 무기 추가

```typescript
// src/game/scenes/GameScene.ts
private addWeapon(weaponId: string): void {
  switch (weaponId) {
    case 'weapon_talisman': {
      const weapon = new Talisman();
      this.weapons.push(weapon);
      console.log('📜 부적 획득!');
      break;
    }

    case 'weapon_dokkaebi': {
      const weapon = new DokkaebiFireWeapon();
      weapon.spawnOrbitals(this.player, this.gameLayer);
      this.dokkaebiWeapon = weapon;
      this.weapons.push(weapon);
      console.log('🔥 도깨비불 획득!');
      break;
    }

    case 'weapon_jakdu': {
      const weapon = new JakduBlade();
      this.weapons.push(weapon);
      console.log('⚔️ 작두 획득!');
      break;
    }

    case 'weapon_water': {
      const weapon = new PurifyingWater();
      this.weapons.push(weapon);
      console.log('💧 정화수 획득!');
      break;
    }

    // 나머지 무기들...
  }
}
```

---

## 다음 단계

1. **i18n 추가**: 무기 이름/설명 다국어 지원
2. **밸런스 조정**: 플레이테스트 후 수치 조정
3. **아트 에셋**: 각 무기별 스프라이트/이펙트 교체
4. **진화 시스템 UI**: 레벨 8 진화 알림 및 이펙트
5. **시너지 시스템**: 무기 조합 시 특별 효과

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-20
**작성자**: 개발팀
