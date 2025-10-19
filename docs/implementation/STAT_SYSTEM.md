# 스탯(파워업) 시스템 구현 문서

> 플레이어 스탯 강화 및 파워업 시스템 설계 및 구현 가이드

---

## 목차

1. [개요](#개요)
2. [스탯 분류 체계](#스탯-분류-체계)
3. [데이터 구조](#데이터-구조)
4. [구현 가이드](#구현-가이드)
5. [레벨업 시스템 통합](#레벨업-시스템-통합)
6. [스탯 적용 메커니즘](#스탯-적용-메커니즘)

---

## 개요

### 설계 철학

- **한자 기반 네이밍**: 동양 무협/선협 느낌의 한자 이름 사용
- **계층적 구조**: 기본 스탯 → 복합 스탯 → 전설 스탯
- **시너지 효과**: 특정 스탯 조합 시 추가 효과 발동
- **밸런스**: 공격/방어/유틸리티 균형 유지

### 스탯 등급 시스템

| 등급 | 색상 | 설명 | 예시 |
|------|------|------|------|
| 일반 (Common) | 흰색 | 단일 효과, 기본적인 강화 | 무력, 생명력 |
| 고급 (Rare) | 파란색 | 2-3개 효과 조합 | 내공, 심법 |
| 전설 (Epic) | 보라색 | 강력한 고유 효과 | 혼백 (부활) |

---

## 스탯 분류 체계

### 1. 공격 강화 파워업 (⚔️)

| 스탯 ID | 이름 | 효과 | 증가량 (레벨당) | 최대 레벨 |
|---------|------|------|-----------------|-----------|
| `stat_power` | 무력 (武力) | 모든 무기 피해량 증가 | +10% | 10 |
| `stat_speed` | 신속 (迅速) | 공격 속도 증가 | +8% | 8 |
| `stat_crit_chance` | 필살 (必殺) | 치명타 확률 증가 | +5% | 10 |
| `stat_crit_damage` | 극살 (極殺) | 치명타 피해량 증가 | +15% | 7 |
| `stat_area` | 기류 확산 (氣流 擴散) | 공격 범위/폭발 반경 증가 | +12% | 8 |

**구현 예시**:
```typescript
// 무력 (공격력 증가)
player.stats.damageMultiplier += 0.10; // +10%

// 신속 (공격 속도)
weapon.cooldown *= (1 - player.stats.attackSpeedBonus);

// 필살 (치명타)
if (Math.random() < player.stats.critChance) {
  damage *= (1 + player.stats.critDamage);
}
```

---

### 2. 생존 / 방어 파워업 (💪)

| 스탯 ID | 이름 | 효과 | 증가량 (레벨당) | 최대 레벨 |
|---------|------|------|-----------------|-----------|
| `stat_health` | 생명력 (生命力) | 최대 체력 증가 | +20 HP | 15 |
| `stat_defense` | 강체 (剛體) | 받는 피해 감소 | +5% | 10 |
| `stat_regen` | 회복 (回復) | 초당 체력 재생 | +0.5 HP/s | 8 |
| `stat_lifesteal` | 흡혈 (吸血) | 피해량의 % 체력 흡수 | +3% | 8 |
| `stat_shield` | 호신부 (護身符) | 주기적 보호막 생성 | +10 Shield | 5 |
| `stat_dodge` | 회피 (回避) | 공격 회피 확률 | +4% | 6 |

**구현 예시**:
```typescript
// 생명력
player.maxHealth += 20;
player.health = Math.min(player.health, player.maxHealth);

// 강체 (방어력)
const actualDamage = incomingDamage * (1 - player.stats.defenseReduction);

// 회복 (재생)
player.health += player.stats.healthRegen * deltaTime;

// 흡혈
const healAmount = damageDealt * player.stats.lifestealPercent;
player.heal(healAmount);
```

---

### 3. 유틸리티 / 성장 파워업 (⚙️)

| 스탯 ID | 이름 | 효과 | 증가량 (레벨당) | 최대 레벨 |
|---------|------|------|-----------------|-----------|
| `stat_cooldown` | 시간 왜곡 (時間 歪曲) | 모든 무기 쿨타임 감소 | +6% | 10 |
| `stat_move_speed` | 신족 (神足) | 이동 속도 증가 | +8% | 8 |
| `stat_pickup_range` | 영혼 흡인 (靈魂 吸引) | 경험치 흡입 범위 증가 | +15% | 8 |
| `stat_exp_gain` | 수련 (修鍊) | 경험치 획득량 증가 | +10% | 6 |
| `stat_item_drop` | 복덕 (福德) | 아이템 드롭률 증가 | +8% | 6 |
| `stat_luck` | 인연 (因緣) | 높은 등급 선택지 확률 상승 | +5% | 5 |

**구현 예시**:
```typescript
// 시간 왜곡 (쿨타임 감소)
weapon.cooldown *= (1 - player.stats.cooldownReduction);

// 신족 (이동 속도)
player.moveSpeed *= (1 + player.stats.moveSpeedBonus);

// 영혼 흡인 (흡입 범위)
const pickupRadius = BASE_PICKUP_RADIUS * (1 + player.stats.pickupRangeBonus);

// 수련 (경험치)
const earnedExp = baseExp * (1 + player.stats.expGainBonus);
```

---

### 4. 정신 / 기(氣) 계열 파워업 (🧿 고급 등급)

| 스탯 ID | 이름 | 효과 | 증가량 | 최대 레벨 |
|---------|------|------|--------|-----------|
| `stat_inner_power` | 내공 (內功) | 공격력 +8%, 흡혈 +2% | 복합 | 6 |
| `stat_mental_art` | 심법 (心法) | 치명타 확률 +4%, 쿨타임 -5% | 복합 | 6 |
| `stat_vital_energy` | 정기 (精氣) | 체력 +15, 재생 +0.3 HP/s | 복합 | 6 |
| `stat_fortune` | 운기 (運氣) | 드롭률 +6%, 치명타 +3%, 흡입 +10% | 복합 | 5 |
| `stat_breathing` | 호흡 (呼吸) | 5초마다 체력 5 회복 | 고정 | 5 |
| `stat_meditation` | 선정 (禪定) | 정지 시 재생 2배, 쿨타임 -10% | 조건부 | 3 |
| `stat_soul` | 혼백 (魂魄) | 사망 시 1회 부활 (50% HP) | 전설 | 1 |

**복합 스탯 구현**:
```typescript
// 내공 (內功) - 공격력 + 흡혈
applyInnerPower(level: number): void {
  this.stats.damageMultiplier += 0.08 * level;
  this.stats.lifestealPercent += 0.02 * level;
}

// 심법 (心法) - 치명타 + 쿨타임
applyMentalArt(level: number): void {
  this.stats.critChance += 0.04 * level;
  this.stats.cooldownReduction += 0.05 * level;
}

// 혼백 (魂魄) - 부활
onDeath(): void {
  if (this.stats.hasRevive && this.stats.reviveUsed === false) {
    this.health = this.maxHealth * 0.5;
    this.stats.reviveUsed = true;
    this.triggerReviveEffect(); // 이펙트 표시
  }
}
```

---

## 데이터 구조

### 파일 위치
`src/game/data/stats.ts`

### TypeScript 타입 정의

```typescript
/**
 * 스탯 타입 정의
 */
export type StatType =
  // 공격
  | 'stat_power'
  | 'stat_speed'
  | 'stat_crit_chance'
  | 'stat_crit_damage'
  | 'stat_area'
  // 방어
  | 'stat_health'
  | 'stat_defense'
  | 'stat_regen'
  | 'stat_lifesteal'
  | 'stat_shield'
  | 'stat_dodge'
  // 유틸리티
  | 'stat_cooldown'
  | 'stat_move_speed'
  | 'stat_pickup_range'
  | 'stat_exp_gain'
  | 'stat_item_drop'
  | 'stat_luck'
  // 복합 스탯
  | 'stat_inner_power'
  | 'stat_mental_art'
  | 'stat_vital_energy'
  | 'stat_fortune'
  | 'stat_breathing'
  | 'stat_meditation'
  | 'stat_soul';

/**
 * 스탯 등급
 */
export type StatRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * 스탯 카테고리
 */
export type StatCategory = 'attack' | 'defense' | 'utility' | 'hybrid';

/**
 * 스탯 데이터 인터페이스
 */
export interface StatData {
  id: StatType;
  name: string;              // 한자 이름
  description: string;       // 효과 설명
  icon?: string;             // 아이콘 경로
  rarity: StatRarity;        // 등급
  category: StatCategory;    // 카테고리
  maxLevel: number;          // 최대 레벨

  // 효과 수치
  baseValue: number;         // 기본값
  valuePerLevel: number;     // 레벨당 증가량

  // 복합 스탯인 경우 여러 효과
  effects?: StatEffect[];

  // 조건부 효과
  condition?: StatCondition;
}

/**
 * 스탯 효과 (복합 스탯용)
 */
export interface StatEffect {
  type: 'damage' | 'attackSpeed' | 'critChance' | 'critDamage' | 'area'
      | 'health' | 'defense' | 'regen' | 'lifesteal' | 'shield' | 'dodge'
      | 'cooldown' | 'moveSpeed' | 'pickupRange' | 'expGain' | 'itemDrop' | 'luck';
  value: number;             // 증가값
  isPercentage: boolean;     // % 여부
}

/**
 * 조건부 효과 (선정 등)
 */
export interface StatCondition {
  type: 'onDeath' | 'onIdle' | 'onHit' | 'periodic';
  value?: number;
}

/**
 * 플레이어 스탯 상태
 */
export interface PlayerStats {
  // 공격 ���련
  damageMultiplier: number;      // 1.0 = 100%
  attackSpeedBonus: number;      // 0.0 ~ 1.0
  critChance: number;            // 0.0 ~ 1.0
  critDamage: number;            // 1.5 = 150%
  areaBonus: number;             // 1.0 = 100%

  // 방어 관련
  maxHealth: number;
  defenseReduction: number;      // 0.0 ~ 1.0
  healthRegen: number;           // HP/s
  lifestealPercent: number;      // 0.0 ~ 1.0
  shieldAmount: number;
  shieldCooldown: number;
  dodgeChance: number;           // 0.0 ~ 1.0

  // 유틸리티
  cooldownReduction: number;     // 0.0 ~ 1.0
  moveSpeedBonus: number;        // 1.0 = 100%
  pickupRangeBonus: number;      // 1.0 = 100%
  expGainBonus: number;          // 1.0 = 100%
  itemDropBonus: number;         // 1.0 = 100%
  luckBonus: number;             // 0.0 ~ 1.0

  // 특수
  hasRevive: boolean;
  reviveUsed: boolean;
}
```

### 스탯 데이터 정의

```typescript
export const STAT_DATA: Record<StatType, StatData> = {
  // ⚔️ 공격 강화
  stat_power: {
    id: 'stat_power',
    name: '무력 (武力)',
    description: '모든 무기의 피해량이 증가합니다.',
    rarity: 'common',
    category: 'attack',
    maxLevel: 10,
    baseValue: 0.10,
    valuePerLevel: 0.10,
  },

  stat_speed: {
    id: 'stat_speed',
    name: '신속 (迅速)',
    description: '공격 발동 속도가 빨라집니다.',
    rarity: 'common',
    category: 'attack',
    maxLevel: 8,
    baseValue: 0.08,
    valuePerLevel: 0.08,
  },

  stat_crit_chance: {
    id: 'stat_crit_chance',
    name: '필살 (必殺)',
    description: '일정 확률로 치명적인 일격을 가합니다.',
    rarity: 'common',
    category: 'attack',
    maxLevel: 10,
    baseValue: 0.05,
    valuePerLevel: 0.05,
  },

  stat_crit_damage: {
    id: 'stat_crit_damage',
    name: '극살 (極殺)',
    description: '치명타 피해량이 더욱 강력해집니다.',
    rarity: 'common',
    category: 'attack',
    maxLevel: 7,
    baseValue: 0.15,
    valuePerLevel: 0.15,
  },

  stat_area: {
    id: 'stat_area',
    name: '기류 확산 (氣流 擴散)',
    description: '공격의 범위나 폭발 반경이 넓어집니다.',
    rarity: 'common',
    category: 'attack',
    maxLevel: 8,
    baseValue: 0.12,
    valuePerLevel: 0.12,
  },

  // 💪 생존 / 방어
  stat_health: {
    id: 'stat_health',
    name: '생명력 (生命力)',
    description: '최대 체력이 증가합니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 15,
    baseValue: 20,
    valuePerLevel: 20,
  },

  stat_defense: {
    id: 'stat_defense',
    name: '강체 (剛體)',
    description: '받는 피해가 줄어듭니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 10,
    baseValue: 0.05,
    valuePerLevel: 0.05,
  },

  stat_regen: {
    id: 'stat_regen',
    name: '회복 (回復)',
    description: '시간이 지날수록 체력이 서서히 회복됩니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 8,
    baseValue: 0.5,
    valuePerLevel: 0.5,
  },

  stat_lifesteal: {
    id: 'stat_lifesteal',
    name: '흡혈 (吸血)',
    description: '적을 공격할 때 생명력을 일부 흡수합니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 8,
    baseValue: 0.03,
    valuePerLevel: 0.03,
  },

  stat_shield: {
    id: 'stat_shield',
    name: '호신부 (護身符)',
    description: '일정 주기로 보호막이 생성됩니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 5,
    baseValue: 10,
    valuePerLevel: 10,
  },

  stat_dodge: {
    id: 'stat_dodge',
    name: '회피 (回避)',
    description: '일정 확률로 적의 공격을 완전히 피합니다.',
    rarity: 'common',
    category: 'defense',
    maxLevel: 6,
    baseValue: 0.04,
    valuePerLevel: 0.04,
  },

  // ⚙️ 유틸리티
  stat_cooldown: {
    id: 'stat_cooldown',
    name: '시간 왜곡 (時間 歪曲)',
    description: '모든 무기의 재사용 대기시간이 줄어듭니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 10,
    baseValue: 0.06,
    valuePerLevel: 0.06,
  },

  stat_move_speed: {
    id: 'stat_move_speed',
    name: '신족 (神足)',
    description: '이동 속도가 상승합니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 8,
    baseValue: 0.08,
    valuePerLevel: 0.08,
  },

  stat_pickup_range: {
    id: 'stat_pickup_range',
    name: '영혼 흡인 (靈魂 吸引)',
    description: '주변의 정기를 더 멀리서 끌어당깁니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 8,
    baseValue: 0.15,
    valuePerLevel: 0.15,
  },

  stat_exp_gain: {
    id: 'stat_exp_gain',
    name: '수련 (修鍊)',
    description: '얻는 경험이 증가합니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 6,
    baseValue: 0.10,
    valuePerLevel: 0.10,
  },

  stat_item_drop: {
    id: 'stat_item_drop',
    name: '복덕 (福德)',
    description: '적이 아이템을 떨어뜨릴 확률이 높아집니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 6,
    baseValue: 0.08,
    valuePerLevel: 0.08,
  },

  stat_luck: {
    id: 'stat_luck',
    name: '인연 (因緣)',
    description: '등급이 높은 선택지가 나타날 확률이 상승합니다.',
    rarity: 'common',
    category: 'utility',
    maxLevel: 5,
    baseValue: 0.05,
    valuePerLevel: 0.05,
  },

  // 🧿 복합 / 고급 스탯
  stat_inner_power: {
    id: 'stat_inner_power',
    name: '내공 (內功)',
    description: '공격력과 생명 흡수력이 동시에 상승합니다.',
    rarity: 'rare',
    category: 'hybrid',
    maxLevel: 6,
    baseValue: 0,
    valuePerLevel: 1,
    effects: [
      { type: 'damage', value: 0.08, isPercentage: true },
      { type: 'lifesteal', value: 0.02, isPercentage: true },
    ],
  },

  stat_mental_art: {
    id: 'stat_mental_art',
    name: '심법 (心法)',
    description: '정신을 집중하여 치명타 확률과 쿨타임이 개선됩니다.',
    rarity: 'rare',
    category: 'hybrid',
    maxLevel: 6,
    baseValue: 0,
    valuePerLevel: 1,
    effects: [
      { type: 'critChance', value: 0.04, isPercentage: true },
      { type: 'cooldown', value: 0.05, isPercentage: true },
    ],
  },

  stat_vital_energy: {
    id: 'stat_vital_energy',
    name: '정기 (精氣)',
    description: '체력과 회복력이 함께 증가합니다.',
    rarity: 'rare',
    category: 'hybrid',
    maxLevel: 6,
    baseValue: 0,
    valuePerLevel: 1,
    effects: [
      { type: 'health', value: 15, isPercentage: false },
      { type: 'regen', value: 0.3, isPercentage: false },
    ],
  },

  stat_fortune: {
    id: 'stat_fortune',
    name: '운기 (運氣)',
    description: '운이 트이며 드롭률, 치명타, 흡입 범위가 상승합니다.',
    rarity: 'rare',
    category: 'hybrid',
    maxLevel: 5,
    baseValue: 0,
    valuePerLevel: 1,
    effects: [
      { type: 'itemDrop', value: 0.06, isPercentage: true },
      { type: 'critChance', value: 0.03, isPercentage: true },
      { type: 'pickupRange', value: 0.10, isPercentage: true },
    ],
  },

  stat_breathing: {
    id: 'stat_breathing',
    name: '호흡 (呼吸)',
    description: '일정 시간마다 생명력이 회복됩니다.',
    rarity: 'rare',
    category: 'defense',
    maxLevel: 5,
    baseValue: 5,
    valuePerLevel: 2,
    condition: { type: 'periodic', value: 5 },
  },

  stat_meditation: {
    id: 'stat_meditation',
    name: '선정 (禪定)',
    description: '가만히 있으면 체력이 회복되고 쿨타임이 줄어듭니다.',
    rarity: 'epic',
    category: 'hybrid',
    maxLevel: 3,
    baseValue: 0,
    valuePerLevel: 1,
    condition: { type: 'onIdle' },
    effects: [
      { type: 'regen', value: 2.0, isPercentage: false },
      { type: 'cooldown', value: 0.10, isPercentage: true },
    ],
  },

  stat_soul: {
    id: 'stat_soul',
    name: '혼백 (魂魄)',
    description: '사망 시 한 번 부활할 수 있습니다.',
    rarity: 'legendary',
    category: 'defense',
    maxLevel: 1,
    baseValue: 1,
    valuePerLevel: 0,
    condition: { type: 'onDeath', value: 0.5 },
  },
};
```

---

## 구현 가이드

### 1단계: Player 클래스에 스탯 추가

**파일**: `src/game/entities/Player.ts`

```typescript
export class Player extends Container {
  // 기존 속성
  public health: number = 100;
  public maxHealth: number = 100;
  public moveSpeed: number = 200;

  // 스탯 시스템
  public stats: PlayerStats = {
    // 공격
    damageMultiplier: 1.0,
    attackSpeedBonus: 0,
    critChance: 0.05,
    critDamage: 1.5,
    areaBonus: 1.0,

    // 방어
    maxHealth: 100,
    defenseReduction: 0,
    healthRegen: 0,
    lifestealPercent: 0,
    shieldAmount: 0,
    shieldCooldown: 0,
    dodgeChance: 0,

    // 유틸리티
    cooldownReduction: 0,
    moveSpeedBonus: 1.0,
    pickupRangeBonus: 1.0,
    expGainBonus: 1.0,
    itemDropBonus: 1.0,
    luckBonus: 0,

    // 특수
    hasRevive: false,
    reviveUsed: false,
  };

  // 스탯 레벨 추적
  public statLevels: Map<StatType, number> = new Map();
}
```

---

### 2단계: 스탯 적용 시스템

**파일**: `src/game/systems/StatSystem.ts`

```typescript
import type { Player } from '@/game/entities/Player';
import { STAT_DATA, type StatType } from '@/game/data/stats';

export class StatSystem {
  /**
   * 플레이어에게 스탯 적용
   */
  public static applyStat(player: Player, statId: StatType): void {
    const statData = STAT_DATA[statId];
    if (!statData) {
      console.warn(`Unknown stat: ${statId}`);
      return;
    }

    // 현재 레벨 가져오기
    const currentLevel = player.statLevels.get(statId) || 0;

    // 최대 레벨 체크
    if (currentLevel >= statData.maxLevel) {
      console.warn(`${statData.name} already at max level`);
      return;
    }

    // 레벨 증가
    const newLevel = currentLevel + 1;
    player.statLevels.set(statId, newLevel);

    // 효과 적용
    if (statData.effects) {
      // 복합 스탯
      this.applyComplexStat(player, statData, newLevel);
    } else {
      // 단일 스탯
      this.applySimpleStat(player, statId, statData, newLevel);
    }

    console.log(`✨ ${statData.name} 레벨 ${newLevel} 획득!`);
  }

  /**
   * 단일 스탯 적용
   */
  private static applySimpleStat(
    player: Player,
    statId: StatType,
    statData: any,
    level: number
  ): void {
    const totalValue = statData.baseValue * level;

    switch (statId) {
      // 공격
      case 'stat_power':
        player.stats.damageMultiplier += statData.valuePerLevel;
        break;
      case 'stat_speed':
        player.stats.attackSpeedBonus += statData.valuePerLevel;
        break;
      case 'stat_crit_chance':
        player.stats.critChance += statData.valuePerLevel;
        break;
      case 'stat_crit_damage':
        player.stats.critDamage += statData.valuePerLevel;
        break;
      case 'stat_area':
        player.stats.areaBonus += statData.valuePerLevel;
        break;

      // 방어
      case 'stat_health':
        player.stats.maxHealth += statData.valuePerLevel;
        player.maxHealth = player.stats.maxHealth;
        player.health = Math.min(player.health, player.maxHealth);
        break;
      case 'stat_defense':
        player.stats.defenseReduction += statData.valuePerLevel;
        break;
      case 'stat_regen':
        player.stats.healthRegen += statData.valuePerLevel;
        break;
      case 'stat_lifesteal':
        player.stats.lifestealPercent += statData.valuePerLevel;
        break;
      case 'stat_shield':
        player.stats.shieldAmount += statData.valuePerLevel;
        break;
      case 'stat_dodge':
        player.stats.dodgeChance += statData.valuePerLevel;
        break;

      // 유틸리티
      case 'stat_cooldown':
        player.stats.cooldownReduction += statData.valuePerLevel;
        break;
      case 'stat_move_speed':
        player.stats.moveSpeedBonus += statData.valuePerLevel;
        break;
      case 'stat_pickup_range':
        player.stats.pickupRangeBonus += statData.valuePerLevel;
        break;
      case 'stat_exp_gain':
        player.stats.expGainBonus += statData.valuePerLevel;
        break;
      case 'stat_item_drop':
        player.stats.itemDropBonus += statData.valuePerLevel;
        break;
      case 'stat_luck':
        player.stats.luckBonus += statData.valuePerLevel;
        break;

      // 특수
      case 'stat_soul':
        player.stats.hasRevive = true;
        player.stats.reviveUsed = false;
        break;
    }
  }

  /**
   * 복합 스탯 적용
   */
  private static applyComplexStat(player: Player, statData: any, level: number): void {
    if (!statData.effects) return;

    for (const effect of statData.effects) {
      const value = effect.value * level;

      switch (effect.type) {
        case 'damage':
          player.stats.damageMultiplier += value;
          break;
        case 'attackSpeed':
          player.stats.attackSpeedBonus += value;
          break;
        case 'critChance':
          player.stats.critChance += value;
          break;
        case 'critDamage':
          player.stats.critDamage += value;
          break;
        case 'area':
          player.stats.areaBonus += value;
          break;
        case 'health':
          player.stats.maxHealth += value;
          player.maxHealth = player.stats.maxHealth;
          break;
        case 'defense':
          player.stats.defenseReduction += value;
          break;
        case 'regen':
          player.stats.healthRegen += value;
          break;
        case 'lifesteal':
          player.stats.lifestealPercent += value;
          break;
        case 'cooldown':
          player.stats.cooldownReduction += value;
          break;
        case 'moveSpeed':
          player.stats.moveSpeedBonus += value;
          break;
        case 'pickupRange':
          player.stats.pickupRangeBonus += value;
          break;
        case 'expGain':
          player.stats.expGainBonus += value;
          break;
        case 'itemDrop':
          player.stats.itemDropBonus += value;
          break;
      }
    }
  }

  /**
   * 스탯 수치 계산 (표시용)
   */
  public static calculateStatValue(statId: StatType, level: number): string {
    const statData = STAT_DATA[statId];
    if (!statData) return '???';

    const totalValue = statData.baseValue * level;

    // % 스탯인지 확인
    if (statData.baseValue < 1) {
      return `${(totalValue * 100).toFixed(0)}%`;
    } else {
      return `+${totalValue.toFixed(0)}`;
    }
  }
}
```

---

### 3단계: 레벨업 선택지에 스탯 추가

**파일**: `src/game/systems/LevelSystem.ts`

```typescript
import { STAT_DATA, type StatType } from '@/game/data/stats';
import type { Player } from '@/game/entities/Player';

export interface LevelUpChoice {
  type: 'weapon' | 'stat';
  id: string;
  name: string;
  description: string;
  rarity: string;
  currentLevel?: number;
}

export class LevelSystem {
  /**
   * 레벨업 선택지 생성 (무기 + 스탯)
   */
  public generateChoices(player: Player): LevelUpChoice[] {
    const choices: LevelUpChoice[] = [];

    // 무기 선택지 (기존 로직)
    // ...

    // 스탯 선택지 추가
    const statChoices = this.generateStatChoices(player);
    choices.push(...statChoices);

    // 랜덤 셔플 후 3-4개 선택
    return this.shuffleAndPick(choices, 3);
  }

  /**
   * 스탯 선택지 생성
   */
  private generateStatChoices(player: Player): LevelUpChoice[] {
    const choices: LevelUpChoice[] = [];

    // 모든 스��� 중 최대 레벨 안 된 것만
    for (const [statId, statData] of Object.entries(STAT_DATA)) {
      const currentLevel = player.statLevels.get(statId as StatType) || 0;

      if (currentLevel < statData.maxLevel) {
        choices.push({
          type: 'stat',
          id: statId,
          name: statData.name,
          description: statData.description,
          rarity: statData.rarity,
          currentLevel: currentLevel,
        });
      }
    }

    return choices;
  }

  /**
   * 등급 기반 가중치 적용
   */
  private shuffleAndPick(choices: LevelUpChoice[], count: number): LevelUpChoice[] {
    // 행운 스탯 반영
    const luckBonus = 0; // player.stats.luckBonus

    // 가중치 계산
    const weighted = choices.map(choice => {
      let weight = 1.0;

      switch (choice.rarity) {
        case 'common':
          weight = 1.0;
          break;
        case 'rare':
          weight = 0.5 + luckBonus;
          break;
        case 'epic':
          weight = 0.2 + luckBonus;
          break;
        case 'legendary':
          weight = 0.05 + luckBonus;
          break;
      }

      return { choice, weight };
    });

    // 가중치 기반 랜덤 선택
    // ... (구현 생략)

    return choices.slice(0, count);
  }
}
```

---

## 스탯 적용 메커니즘

### 공격력 증폭

```typescript
// Weapon.ts 또는 CombatSystem.ts
calculateDamage(baseDamage: number, player: Player): number {
  let damage = baseDamage;

  // 무력 스탯 적용
  damage *= player.stats.damageMultiplier;

  // 치명타 판정
  if (Math.random() < player.stats.critChance) {
    damage *= player.stats.critDamage;
    console.log('💥 치명타!');
  }

  return Math.floor(damage);
}
```

### 방어력 및 피해 감소

```typescript
// Player.ts
takeDamage(amount: number): void {
  // 회피 판정
  if (Math.random() < this.stats.dodgeChance) {
    console.log('⚡ 회피!');
    return;
  }

  // 방어력 적용
  let damage = amount * (1 - this.stats.defenseReduction);

  // 보호막 먼저 소진
  if (this.currentShield > 0) {
    if (damage <= this.currentShield) {
      this.currentShield -= damage;
      damage = 0;
    } else {
      damage -= this.currentShield;
      this.currentShield = 0;
    }
  }

  // 체력 감소
  this.health -= damage;

  if (this.health <= 0) {
    this.onDeath();
  }
}

onDeath(): void {
  // 혼백 (부활) 판정
  if (this.stats.hasRevive && !this.stats.reviveUsed) {
    this.health = this.maxHealth * 0.5;
    this.stats.reviveUsed = true;
    console.log('💫 혼백 발동! 부활!');
    return;
  }

  // 실제 사망
  this.die();
}
```

### 체력 재생

```typescript
// Player.ts - update 메서드
update(deltaTime: number): void {
  // 기본 재생
  if (this.stats.healthRegen > 0) {
    this.health += this.stats.healthRegen * deltaTime;
    this.health = Math.min(this.health, this.maxHealth);
  }

  // 호흡 (주기적 회복)
  const breathingLevel = this.statLevels.get('stat_breathing') || 0;
  if (breathingLevel > 0) {
    this.breathingTimer += deltaTime;
    if (this.breathingTimer >= 5) {
      const healAmount = 5 + (breathingLevel - 1) * 2;
      this.heal(healAmount);
      this.breathingTimer = 0;
    }
  }

  // 선정 (정지 시 회복)
  const meditationLevel = this.statLevels.get('stat_meditation') || 0;
  if (meditationLevel > 0 && this.isIdle()) {
    this.health += 2.0 * meditationLevel * deltaTime;
    this.health = Math.min(this.health, this.maxHealth);
  }
}
```

### 흡혈

```typescript
// CombatSystem.ts
applyDamage(enemy: Enemy, damage: number, player: Player): void {
  enemy.takeDamage(damage);

  // 흡혈 적용
  if (player.stats.lifestealPercent > 0) {
    const healAmount = damage * player.stats.lifestealPercent;
    player.heal(healAmount);
  }
}
```

---

## 다음 단계

1. **i18n 추가**: `src/i18n/locales/ko.json`에 스탯 이름/설명 추가
2. **UI 구현**: 레벨업 선택창에 스탯 표시
3. **밸런스 조정**: 플레이테스트 후 수치 조정
4. **시너지 시스템**: 특정 스탯 조합 시 보너스 추가

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-20
**작성자**: 개발팀
