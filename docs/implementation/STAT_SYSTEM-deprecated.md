# 파워업 시스템 구현 문서

> 레벨업 시 선택 가능한 모든 스탯 강화 옵션 (무기 제외)

---

## 목차

1. [개요](#개요)
2. [파워업 분류](#파워업-분류)
3. [데이터 구조](#데이터-구조)
4. [구현 가이드](#구현-가이드)
5. [파워업 적용 메커니즘](#파워업-적용-메커니즘)

---

## 개요

### 설계 철학

- **통합된 파워업 시스템**: 모든 스탯 강화를 단일 `powerup_*` 체계로 관리
- **등급 시스템**: Common, Rare, Epic 세 단계로 명확한 효과 차별화
- **카테고리별 분류**: 공격(⚔️), 방어(💪), 유틸리티(⚙️)
- **밸런스**: 최대치 제한과 등급별 수치로 밸런스 유지
- **i18n 대응**: 이름/설명은 다국어 지원

### 파워업 등급 시스템

| 등급          | 색상   | 효과           | 예시             |
| ------------- | ------ | -------------- | ---------------- |
| Common (일반) | 흰색   | 기본적인 강화  | 치명타 확률 +5%  |
| Rare (고급)   | 파란색 | 중간 단계 강화 | 치명타 확률 +10% |
| Epic (전설)   | 보라색 | 강력한 강화    | 치명타 확률 +20% |

---

## 파워업 분류

**전체 10종** (카테고리별 분류)

### 1. 공격 강화 파워업 (⚔️)

#### 치명타 확률 (필살)

| 파워업 ID                  | 이름        | 효과             | 최대치 |
| -------------------------- | ----------- | ---------------- | ------ |
| `powerup_crit_rate_common` | 필살 (일반) | 치명타 확률 +5%  | 100%   |
| `powerup_crit_rate_rare`   | 필살 (고급) | 치명타 확률 +10% | 100%   |
| `powerup_crit_rate_epic`   | 필살 (전설) | 치명타 확률 +20% | 100%   |

**구현**:

```typescript
this.criticalRate += increment; // 0.05, 0.10, 0.20
this.criticalRate = Math.min(this.criticalRate, 1.0); // 최대 100%
```

#### 치명타 피해량 (극살)

| 파워업 ID                    | 이름        | 효과              | 최대치           |
| ---------------------------- | ----------- | ----------------- | ---------------- |
| `powerup_crit_damage_common` | 극살 (일반) | 치명타 피해 +20%  | 650% (1.5 + 5.0) |
| `powerup_crit_damage_rare`   | 극살 (고급) | 치명타 피해 +50%  | 650%             |
| `powerup_crit_damage_epic`   | 극살 (전설) | 치명타 피해 +100% | 650%             |

**구현**:

```typescript
this.criticalDamage += increment; // 0.20, 0.50, 1.00
this.criticalDamage = Math.min(this.criticalDamage, 6.5); // 최대 650%
```

---

### 2. 생존 / 방어 파워업 (💪)

#### 피해 감소 (강체)

| 파워업 ID                         | 이름        | 효과           | 최대치 |
| --------------------------------- | ----------- | -------------- | ------ |
| `powerup_damage_reduction_common` | 강체 (일반) | 받는 피해 -3%  | 80%    |
| `powerup_damage_reduction_rare`   | 강체 (고급) | 받는 피해 -8%  | 80%    |
| `powerup_damage_reduction_epic`   | 강체 (전설) | 받는 피해 -15% | 80%    |

**구현**:

```typescript
this.damageReduction += increment; // 0.03, 0.08, 0.15
this.damageReduction = Math.min(this.damageReduction, 0.8); // 최대 80%

// 피해 적용
const actualDamage = damage * (1 - this.damageReduction);
```

#### 호흡 (呼吸) - 주기적 체력 회복

| 파워업 ID                  | 이름        | 주기 | 회복량 |
| -------------------------- | ----------- | ---- | ------ |
| `powerup_breathing_common` | 호흡 (일반) | 8초  | 5 HP   |
| `powerup_breathing_rare`   | 호흡 (고급) | 6초  | 8 HP   |
| `powerup_breathing_epic`   | 호흡 (전설) | 4초  | 12 HP  |

**특징**: 더 높은 등급 획득 시 자동 업그레이드 (낮은 등급은 무시)

**구현**:

```typescript
// 타이머 업데이트 (Player.update)
this.breathingTimer += deltaTime;
if (this.breathingTimer >= this.breathingInterval) {
  this.heal(this.breathingHealAmount);
  this.breathingTimer = 0;
}
```

---

### 3. 유틸리티 파워업 (⚙️)

#### 경험치 획득량 (수련)

| 파워업 ID                | 이름        | 효과        | 최대치 |
| ------------------------ | ----------- | ----------- | ------ |
| `powerup_xp_gain_common` | 수련 (일반) | 경험치 +5%  | 300%   |
| `powerup_xp_gain_rare`   | 수련 (고급) | 경험치 +12% | 300%   |
| `powerup_xp_gain_epic`   | 수련 (전설) | 경험치 +25% | 300%   |

**구현**:

```typescript
this.xpMultiplier += increment; // 0.05, 0.12, 0.25
this.xpMultiplier = Math.min(this.xpMultiplier, 3.0); // 최대 300%

// 경험치 획득 시
const earnedXp = baseXp * this.xpMultiplier;
```

---

### 4. 유틸리티 파워업 (⚙️) - 추가

#### 이동 속도 (경신)

| 파워업 ID              | 이름        | 효과           | 최대치 |
| ---------------------- | ----------- | -------------- | ------ |
| `powerup_speed_common` | 경신 (일반) | 이동 속도 +3%  | 200%   |
| `powerup_speed_rare`   | 경신 (고급) | 이동 속도 +7%  | 200%   |
| `powerup_speed_epic`   | 경신 (전설) | 이동 속도 +15% | 200%   |

#### 획득 범위 (영혼 흡인)

| 파워업 ID               | 이름             | 효과           | 최대치 |
| ----------------------- | ---------------- | -------------- | ------ |
| `powerup_pickup_common` | 영혼 흡인 (일반) | 획득 범위 +5%  | 500%   |
| `powerup_pickup_rare`   | 영혼 흡인 (고급) | 획득 범위 +15% | 500%   |
| `powerup_pickup_epic`   | 영혼 흡인 (전설) | 획득 범위 +30% | 500%   |

---

### 5. 공격 파워업 (⚔️) - 추가

#### 공격력 (무력)

| 파워업 ID               | 이름        | 효과        | 최대치 |
| ----------------------- | ----------- | ----------- | ------ |
| `powerup_damage_common` | 무력 (일반) | 공격력 +2%  | 500%   |
| `powerup_damage_rare`   | 무력 (고급) | 공격력 +5%  | 500%   |
| `powerup_damage_epic`   | 무력 (전설) | 공격력 +10% | 500%   |

#### 쿨타임 감소 (신속)

| 파워업 ID                 | 이름        | 효과        | 최대치   |
| ------------------------- | ----------- | ----------- | -------- |
| `powerup_cooldown_common` | 신속 (일반) | 쿨타임 -2%  | 70% 감소 |
| `powerup_cooldown_rare`   | 신속 (고급) | 쿨타임 -5%  | 70% 감소 |
| `powerup_cooldown_epic`   | 신속 (전설) | 쿨타임 -10% | 70% 감소 |

#### 체력 증가 (생명력)

| 파워업 ID               | 이름          | 효과             | 최대치 |
| ----------------------- | ------------- | ---------------- | ------ |
| `powerup_health_common` | 생명력 (일반) | 최대 체력 +5 HP  | 500 HP |
| `powerup_health_rare`   | 생명력 (고급) | 최대 체력 +15 HP | 500 HP |
| `powerup_health_epic`   | 생명력 (전설) | 최대 체력 +30 HP | 500 HP |

---

### 6. 특수 드롭 아이템 (🎁)

#### 혼백 (魂魄) - 부활

| 아이템 ID     | 이름        | 효과                             | 드롭 확률 |
| ------------- | ----------- | -------------------------------- | --------- |
| `drop_revive` | 혼백 (魂魄) | 사망 시 1회 부활 (최대 체력 50%) | 보스 10%  |

**구현**:

```typescript
// 사망 시 체크 (Player.takeDamage)
if (this.health <= 0) {
  if (this.hasRevive && !this.reviveUsed) {
    this.health = this.maxHealth * 0.5;
    this.reviveUsed = true;
    this.invincibleTimer = 2.0; // 2초 무적
    console.log('💫 혼백 발동! 부활!');
    return;
  }
  // 실제 사망 처리
}
```

---

## 데이터 구조

### 파일 구조

```
src/
├── config/
│   ├── levelup.config.ts      # 파워업 ID 정의 및 아이콘 매핑
│   └── balance.config.ts      # 파워업 밸런스 수치
├── game/
│   └── entities/
│       └── Player.ts          # applyPowerup(), applyStatUpgrade() 구현
└── systems/
    └── LevelSystem.ts         # 레벨업 선택지 생성
```

### TypeScript 타입 정의

```typescript
/**
 * 파워업 ID 타입
 */
export type PowerupId =
  // 공격
  | 'powerup_crit_rate_common'
  | 'powerup_crit_rate_rare'
  | 'powerup_crit_rate_epic'
  | 'powerup_crit_damage_common'
  | 'powerup_crit_damage_rare'
  | 'powerup_crit_damage_epic'
  // 방어
  | 'powerup_damage_reduction_common'
  | 'powerup_damage_reduction_rare'
  | 'powerup_damage_reduction_epic'
  | 'powerup_breathing_common'
  | 'powerup_breathing_rare'
  | 'powerup_breathing_epic'
  // 유틸리티
  | 'powerup_xp_gain_common'
  | 'powerup_xp_gain_rare'
  | 'powerup_xp_gain_epic';

/**
 * 기본 스탯 ID 타입 (기존 호환)
 */
export type StatId = 'stat_damage' | 'stat_cooldown' | 'stat_health' | 'stat_speed' | 'stat_pickup';

/**
 * 파워업 등급
 */
export type PowerupRarity = 'common' | 'rare' | 'epic';

/**
 * 플레이어 파워업 상태
 */
export interface PlayerPowerupState {
  // 공격
  criticalRate: number; // 치명타 확률 (0.0 ~ 1.0)
  criticalDamage: number; // 치명타 배율 (1.5 ~ 6.5)

  // 방어
  damageReduction: number; // 피해 감소 (0.0 ~ 0.8)
  breathingInterval: number; // 호흡 주기 (초, 0 = 비활성)
  breathingHealAmount: number; // 호흡 회복량

  // 유틸리티
  xpMultiplier: number; // 경험치 배수 (1.0 ~ 3.0)

  // 기본 스탯 (기존 호환)
  damageMultiplier: number; // 공격력 배수
  cooldownMultiplier: number; // 쿨타임 배수
  speedMultiplier: number; // 이동속도 배수
  pickupRangeMultiplier: number; // 획득 범위 배수

  // 특수
  hasRevive: boolean; // 혼백 보유 여부
  reviveUsed: boolean; // 혼백 사용 여부
}
```

### 밸런스 설정 (balance.config.ts)

```typescript
export const POWERUP_BALANCE = {
  // ⚔️ 공격 강화 파워업
  combat: {
    criticalRate: {
      common: 0.05, // +5%
      rare: 0.1, // +10%
      epic: 0.2, // +20%
      max: 1.0, // 100% 최대
    },
    criticalDamage: {
      common: 0.2, // +20%
      rare: 0.5, // +50%
      epic: 1.0, // +100%
      max: 5.0, // 기본 150% -> 최대 650%
    },
  },

  // 💪 생존/방어 파워업
  defense: {
    damageReduction: {
      common: 0.03, // -3% 피해
      rare: 0.08, // -8% 피해
      epic: 0.15, // -15% 피해
      max: 0.8, // 최대 -80%
    },
    breathing: {
      common: { interval: 8, healAmount: 5 },
      rare: { interval: 6, healAmount: 8 },
      epic: { interval: 4, healAmount: 12 },
    },
  },

  // ⚙️ 유틸리티 파워업
  utility: {
    xpGain: {
      common: 0.05, // +5%
      rare: 0.12, // +12%
      epic: 0.25, // +25%
      max: 2.0, // 최대 +200%
    },
  },

  // 🎁 특수 드롭
  specialDrop: {
    revive: {
      dropRate: 0.1, // 보스 10%
      reviveHealthPercent: 0.5, // 50% 체력 부활
      invincibleDuration: 2.0, // 2초 무적
    },
  },

  // 기본 치명타 배율
  baseCriticalMultiplier: 1.5, // 150%
} as const;
```

---

## 구현 가이드

### 1단계: Player 클래스에 파워업 상태 추가

**파일**: `src/game/entities/Player.ts`

```typescript
export class Player extends Container {
  // 기본 속성
  public health: number = 100;
  public maxHealth: number = 100;
  public moveSpeed: number = 250;

  // 파워업 상태
  public criticalRate: number = 0.05; // 기본 5%
  public criticalDamage: number = 1.5; // 기본 150%
  public damageReduction: number = 0; // 기본 0%
  public breathingInterval: number = 0; // 비활성
  public breathingHealAmount: number = 0;
  public xpMultiplier: number = 1.0; // 기본 100%

  // 기본 스탯 (기존 호환)
  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public speedMultiplier: number = 1.0;
  public pickupRangeMultiplier: number = 1.0;

  // 특수
  public hasRevive: boolean = false;
  public reviveUsed: boolean = false;

  // 최대치
  private readonly MAX_CRITICAL_RATE = 1.0;
  private readonly MAX_CRITICAL_DAMAGE = 6.5;
  private readonly MAX_DAMAGE_REDUCTION = 0.8;
  private readonly MAX_XP_MULTIPLIER = 3.0;
}
```

---

### 2단계: 파워업 적용 시스템

**파일**: `src/game/entities/Player.ts`

```typescript
/**
 * 파워업 적용
 */
public applyPowerup(powerupId: string): void {
  const parts = powerupId.split('_');
  if (parts.length < 2 || parts[0] !== 'powerup') {
    console.warn(`Invalid powerup ID: ${powerupId}`);
    return;
  }

  const type = parts[1]; // crit, damage, breathing, xp
  const subtype = parts[2]; // rate, damage, reduction, gain
  const rarity = parts[3]; // common, rare, epic

  // ⚔️ 공격 강화
  if (type === 'crit') {
    if (subtype === 'rate') {
      // 치명타 확률
      const increments = { common: 0.05, rare: 0.1, epic: 0.2 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      this.criticalRate = Math.min(this.criticalRate + increment, this.MAX_CRITICAL_RATE);
      console.log(`💥 치명타 확률 증가! ${(this.criticalRate * 100).toFixed(0)}%`);
    } else if (subtype === 'damage') {
      // 치명타 피해량
      const increments = { common: 0.2, rare: 0.5, epic: 1.0 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      this.criticalDamage = Math.min(this.criticalDamage + increment, this.MAX_CRITICAL_DAMAGE);
      console.log(`💢 치명타 피해량 증가! ${(this.criticalDamage * 100).toFixed(0)}%`);
    }
  }
  // 💪 생존/방어
  else if (type === 'damage' && subtype === 'reduction') {
    const increments = { common: 0.03, rare: 0.08, epic: 0.15 };
    const increment = increments[rarity as keyof typeof increments];
    if (!increment) return;

    this.damageReduction = Math.min(this.damageReduction + increment, this.MAX_DAMAGE_REDUCTION);
    console.log(`🛡️ 피해 감소 증가! ${(this.damageReduction * 100).toFixed(0)}%`);
  } else if (type === 'breathing') {
    const configs = {
      common: { interval: 8, healAmount: 5 },
      rare: { interval: 6, healAmount: 8 },
      epic: { interval: 4, healAmount: 12 },
    };
    const config = configs[rarity as keyof typeof configs];
    if (!config) return;

    // 더 나은 등급으로만 업그레이드
    if (this.breathingInterval === 0 || config.interval < this.breathingInterval) {
      this.breathingInterval = config.interval;
      this.breathingHealAmount = config.healAmount;
      console.log(`🌬️ 호흡법 습득! ${config.interval}초마다 ${config.healAmount} 회복`);
    }
  }
  // ⚙️ 유틸리티
  else if (type === 'xp' && subtype === 'gain') {
    const increments = { common: 0.05, rare: 0.12, epic: 0.25 };
    const increment = increments[rarity as keyof typeof increments];
    if (!increment) return;

    this.xpMultiplier = Math.min(this.xpMultiplier + increment, this.MAX_XP_MULTIPLIER);
    console.log(`📚 경험치 획득량 증가! ${(this.xpMultiplier * 100).toFixed(0)}%`);
  }
}
```

---

### 3단계: 레벨업 선택지에 파워업 추가

**파일**: `src/systems/LevelSystem.ts`

```typescript
/**
 * 파워업 선택지 생성
 */
private generatePowerupChoices(): LevelUpChoice[] {
  const choices: LevelUpChoice[] = [];

  // 공격 파워업
  const critRateChoices = [
    { id: 'powerup_crit_rate_common', rarity: 'common' },
    { id: 'powerup_crit_rate_rare', rarity: 'rare' },
    { id: 'powerup_crit_rate_epic', rarity: 'epic' },
  ];

  // 방어 파워업
  const damageReductionChoices = [
    { id: 'powerup_damage_reduction_common', rarity: 'common' },
    { id: 'powerup_damage_reduction_rare', rarity: 'rare' },
    { id: 'powerup_damage_reduction_epic', rarity: 'epic' },
  ];

  // 호흡 파워업
  const breathingChoices = [
    { id: 'powerup_breathing_common', rarity: 'common' },
    { id: 'powerup_breathing_rare', rarity: 'rare' },
    { id: 'powerup_breathing_epic', rarity: 'epic' },
  ];

  // 등급별 가중치 적용하여 선택
  // ...
}
```

---

## 파워업 적용 메커니즘

### 치명타 시스템

```typescript
// Player.ts - 치명타 판정
public rollCritical(): { isCritical: boolean; damageMultiplier: number } {
  const isCritical = Math.random() < this.criticalRate;
  return {
    isCritical,
    damageMultiplier: isCritical ? this.criticalDamage : 1.0,
  };
}

// 사용 예시 (CombatSystem.ts)
const critResult = player.rollCritical();
const finalDamage = baseDamage * player.damageMultiplier * critResult.damageMultiplier;
if (critResult.isCritical) {
  console.log('💥 치명타!');
}
```

### 피해 감소

```typescript
// Player.ts
public takeDamage(amount: number): void {
  // 피해 감소 적용
  const reducedDamage = amount * (1 - this.damageReduction);

  // 무적 시간 체크
  if (this.invincibleTimer > 0) {
    return;
  }

  this.health -= reducedDamage;

  if (this.health <= 0) {
    this.handleDeath();
  }
}
```

### 호흡 (주기적 회복)

```typescript
// Player.ts - update 메서드
update(deltaTime: number): void {
  // 호흡 타이머
  if (this.breathingInterval > 0) {
    this.breathingTimer += deltaTime;
    if (this.breathingTimer >= this.breathingInterval) {
      this.heal(this.breathingHealAmount);
      this.breathingTimer = 0;
      console.log(`🌬️ 호흡 회복! +${this.breathingHealAmount} HP`);
    }
  }
}
```

### 경험치 배수

```typescript
// ExperienceGem.ts - 플레이어가 획득 시
onPickup(player: Player): void {
  const earnedXp = this.xpValue * player.xpMultiplier;
  player.gainExperience(earnedXp);
}
```

### 부활 시스템

```typescript
// Player.ts
private handleDeath(): void {
  // 혼백 부활 체크
  if (this.hasRevive && !this.reviveUsed) {
    this.health = this.maxHealth * 0.5;
    this.reviveUsed = true;
    this.invincibleTimer = 2.0; // 2초 무적
    console.log('💫 혼백 발동! 부활!');
    // 부활 이펙트 표시
    this.playReviveEffect();
    return;
  }

  // 실제 사망
  this.die();
}
```

---

## 다음 단계

1. **i18n 추가**: 파워업 이름/설명 다국어 지원
2. **UI 개선**: 레벨업 창에 파워업 등급 표시 (색상 구분)
3. **밸런스 조정**: 플레이테스트 후 수치 미세 조정
4. **추가 파워업**: 새로운 카테고리 추가 (예: 복합 파워업)

---

**문서 버전**: 2.0
**최종 수정일**: 2025-10-26
**작성자**: 개발팀
