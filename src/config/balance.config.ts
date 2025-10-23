/**
 * 게임 밸런스 설정 (플레이어, 적, 무기 등)
 */

/**
 * 플레이어 밸런스
 */
export const PLAYER_BALANCE = {
  health: 100,
  speed: 250,
  radius: 40,
  invincibleDuration: 0.5, // 피격 후 무적 시간
  baseStats: {
    strength: 0, // 공격력
    agility: 0, // 이동속도, 공격속도
    intelligence: 0, // 투사체 수, 범위
  },
} as const;

/**
 * 적 밸런스 (티어별)
 */
export const ENEMY_BALANCE = {
  // 일반 적
  normal: {
    health: 30,
    speed: 100,
    damage: 10,
    radius: 30,
    xpDrop: 5,
    animationSpeed: 0.15,
  },
  // 정예 적 (추후 구현)
  elite: {
    health: 100,
    speed: 80,
    damage: 20,
    radius: 40,
    xpDrop: 25,
    animationSpeed: 0.2,
  },
  // 보스 적 (추후 구현)
  boss: {
    health: 500,
    speed: 60,
    damage: 30,
    radius: 60,
    xpDrop: 100,
    animationSpeed: 0.25,
  },
} as const;

/**
 * 무기 밸런스
 */
export const WEAPON_BALANCE = {
  // 부적 (Talisman)
  talisman: {
    name: '부적',
    baseDamage: 15,
    baseCooldown: 1.0, // 초
    projectileSpeed: 500,
    projectileRadius: 8,
    projectileLifetime: 3,
    piercing: 1, // 관통 횟수
    projectileCount: 1, // 동시 발사 수
    // 레벨별 강화
    levelScaling: {
      damage: 5, // 레벨당 데미지 증가
      cooldownReduction: 0.05, // 레벨당 쿨타임 감소
      piercingPerLevel: 0, // 레벨 5마다 관통 +1
    },
  },
  // 도깨비불 (추후 구현)
  dokkaebi_fire: {
    name: '도깨비불',
    baseDamage: 8,
    baseCooldown: 0.5,
    projectileSpeed: 300,
    projectileRadius: 12,
    projectileLifetime: 2,
    piercing: 0,
    projectileCount: 3,
    levelScaling: {
      damage: 3,
      cooldownReduction: 0.03,
      piercingPerLevel: 0,
    },
  },
  // 목탁 소리
  moktak_sound: {
    name: '목탁 소리',
    baseDamage: 12, // 지속 데미지로 변경되어 감소
    baseCooldown: 2.0,
    aoeRadius: 150, // 범위 공격
    piercing: 999, // 모든 적 관통
    projectileCount: 1,
    levelScaling: {
      damage: 5, // 레벨당 +5로 감소
      cooldownReduction: 0.1,
      piercingPerLevel: 0,
    },
  },
  // 작두날 (추후 구현)
  jakdu_blade: {
    name: '작두날',
    baseDamage: 30,
    baseCooldown: 3.0,
    projectileSpeed: 400,
    projectileRadius: 20,
    projectileLifetime: 5,
    piercing: 5,
    projectileCount: 1,
    levelScaling: {
      damage: 10,
      cooldownReduction: 0.1,
      piercingPerLevel: 1,
    },
  },
  // 부채바람
  fan_wind: {
    name: '부채바람',
    baseDamage: 25,
    baseCooldown: 2.0,
    projectileSpeed: 350,
    projectileRadius: 15,
    projectileLifetime: 1.2, // 최대 사거리 420픽셀 (350 * 1.2)
    piercing: Infinity, // 무제한 관통
    projectileCount: 1,
    levelScaling: {
      damage: 8, // 레벨당 데미지 +8
      cooldownReduction: 0.15, // 레벨당 쿨타임 -0.15초
      piercingPerLevel: 0, // 무제한 관통이므로 0
    },
  },
} as const;

/**
 * 스폰 밸런스
 */
export const SPAWN_BALANCE = {
  initialInterval: 3.0, // 초기 웨이브 간격 (초)
  minInterval: 1.0, // 최소 웨이브 간격
  intervalReduction: 0.15, // 난이도 증가 시 감소량
  spawnMargin: 100, // 화면 밖 스폰 마진

  // 그룹 스폰 설정
  minGroupSize: 1, // 그룹당 최소 적 수
  maxGroupSize: 2, // 그룹당 최대 적 수
  minGroups: 1, // 최소 그룹 수
  maxGroups: 2, // 최대 그룹 수
  clusterRadius: 200, // 그룹 내 적들의 퍼짐 정도
  groupIncreaseInterval: 60, // 초 단위, 그룹 수 증가 주기

  // 적 스폰 확률 (합계 1.0)
  enemySpawnRates: {
    skeleton: 0.22, // 해골 22%
    dokkaebi: 0.22, // 도깨비 22%
    mask: 0.22, // 탈령 22%
    maidenGhost: 0.22, // 처녀귀신 22%
    evilSpirit: 0.12, // 악령 12%
  },
} as const;

/**
 * 스탯 효과 계산
 */
export const STAT_EFFECTS = {
  // 힘 (Strength) - 공격력
  strength: {
    damagePerPoint: 0.05, // 1 힘당 5% 데미지 증가
  },
  // 민첩 (Agility) - 이동/공격속도
  agility: {
    moveSpeedPerPoint: 0.02, // 1 민첩당 2% 이동속도 증가
    attackSpeedPerPoint: 0.03, // 1 민첩당 3% 공격속도 증가
  },
  // 지능 (Intelligence) - 투사체/범위
  intelligence: {
    projectileCountThreshold: 10, // 10 지능당 투사체 +1
    areaPerPoint: 0.02, // 1 지능당 2% 범위 증가
  },
} as const;

/**
 * 경험치 드랍 밸런스
 */
export const XP_BALANCE = {
  gemRadius: 10,
  gemSpeed: 500, // 최대 속도 (200 -> 500으로 증가)
  gemLifetime: 120, // 120초(2분) 후 사라짐 - 충분한 시간 제공
  pickupRadius: 80, // 플레이어 근처에서 자동 획득 (50 -> 80으로 증가)
} as const;

/**
 * 체력 포션 드랍 밸런스
 */
export const POTION_BALANCE = {
  dropRate: 0.05, // 5% 확률로 드랍
  healAmount: 0.5, // 최대 체력의 50% 회복
  attractRadius: 80, // 플레이어 근처에서 자동으로 끌려옴
  attractSpeed: 300, // 끌려오는 속도
  radius: 12, // 포션 크기
} as const;

/**
 * 넉백 밸런스
 */
export const KNOCKBACK_BALANCE = {
  // 무기별 넉백 힘 (픽셀/초)
  projectile: 150, // 투사체 (부적, 부채바람 등)
  aoe: 100, // 범위 공격 (목탁 소리)
  melee: 120, // 근접 공격 (추후 구현)
  orbital: 80, // 궤도 공격 (도깨비불)
  jakduBlade: 200, // 작두날 (강력한 넉백)

  // 넉백 물리
  friction: 8.0, // 감속 속도
  minVelocity: 1.0, // 이 값 이하면 완전히 정지
} as const;

/**
 * 틱 데미지 밸런스 (지속 데미지용)
 */
export const TICK_DAMAGE_BALANCE = {
  orbital: 0.25, // 궤도 무기 (0.25초 = 초당 4회)
  aoe: 0.0, // AoE는 일회성 (틱 없음)
} as const;

/**
 * 파워업 밸런스 설정
 *
 * 카테고리:
 * - combat: 공격 강화 (⚔️)
 * - defense: 생존/방어 (💪)
 * - utility: 유틸리티 (⚙️)
 * - hybrid: 복합 파워업 (🧿)
 */
export const POWERUP_BALANCE = {
  // ⚔️ 공격 강화 파워업
  combat: {
    // 치명타 확률 (필살)
    criticalRate: {
      common: 0.05,    // +5%
      rare: 0.10,      // +10%
      epic: 0.20,      // +20%
      max: 1.0,        // 100% (항상 치명타)
    },
    // 치명타 피해량 (극살)
    criticalDamage: {
      common: 0.20,    // +20%
      rare: 0.50,      // +50%
      epic: 1.00,      // +100%
      max: 5.0,        // 기본 150% -> 최대 650% (1.5 + 5.0)
    },
    // 공격 범위/폭발 반경 (기류확산)
    area: {
      common: 0.05,    // +5%
      rare: 0.12,      // +12%
      epic: 0.25,      // +25%
      max: 2.0,        // 200% (3배 크기)
    },
  },

  // 💪 생존/방어 파워업
  defense: {
    // 피해 감소 (강체)
    damageReduction: {
      common: 0.03,    // -3% 피해
      rare: 0.08,      // -8% 피해
      epic: 0.15,      // -15% 피해
      max: 0.80,       // 최대 -80% (거의 무적 방지)
    },
    // 초당 체력 재생 (회복)
    healthRegen: {
      common: 0.2,     // +0.2 HP/s
      rare: 0.5,       // +0.5 HP/s
      epic: 1.0,       // +1.0 HP/s
      max: 10.0,       // 최대 10 HP/s
    },
    // 흡혈 (吸血)
    lifeSteal: {
      common: 0.02,    // 피해량의 2%
      rare: 0.05,      // 피해량의 5%
      epic: 0.10,      // 피해량의 10%
      max: 0.50,       // 최대 50% (밸런스 고려)
    },
    // 보호막 쿨타임 (호신부) - 값이 작을수록 자주 발동
    shield: {
      common: 30,      // 30초마다 보호막
      rare: 20,        // 20초마다
      epic: 10,        // 10초마다
      min: 5,          // 최소 5초 쿨타임
      blockCount: 1,   // 1회 피해 완전 흡수
    },
    // 회피 확률 (回避)
    dodgeRate: {
      common: 0.03,    // +3% 회피
      rare: 0.07,      // +7% 회피
      epic: 0.15,      // +15% 회피
      max: 0.75,       // 최대 75% (100% 회피는 밸런스 붕괴)
    },
  },

  // ⚙️ 유틸리티 파워업
  utility: {
    // 경험치 획득량 (수련)
    xpGain: {
      common: 0.05,    // +5%
      rare: 0.12,      // +12%
      epic: 0.25,      // +25%
      max: 2.0,        // 최대 +200%
    },
    // 아이템 드롭률 (복덕)
    dropRate: {
      common: 0.05,    // +5%
      rare: 0.12,      // +12%
      epic: 0.25,      // +25%
      max: 2.0,        // 최대 +200%
    },
    // 높은 등급 선택지 확률 (인연)
    luck: {
      common: 0.10,    // +10% 가중치
      rare: 0.20,      // +20% 가중치
      epic: 0.40,      // +40% 가중치
      max: 1.0,        // 최대 +100%
    },
  },

  // 🧿 복합 파워업 (여러 효과 동시 적용)
  hybrid: {
    // 내공 (內功): 공격력 + 흡혈
    innerPower: {
      rarity: 'rare' as const,
      damageBonus: 0.03,     // +3% 공격력
      lifeStealBonus: 0.03,  // +3% 흡혈
    },
    // 심법 (心法): 치명타 확률 + 쿨타임 감소
    mentalTechnique: {
      rarity: 'rare' as const,
      critRateBonus: 0.07,      // +7% 치명타
      cooldownBonus: 0.05,      // -5% 쿨타임
    },
    // 정기 (精氣): 체력 + 재생
    vitality: {
      rarity: 'rare' as const,
      healthBonus: 10,          // +10 최대 체력
      regenBonus: 0.3,          // +0.3 HP/s
    },
    // 운기 (運氣): 드롭률 + 치명타 + 흡입 범위
    fortune: {
      rarity: 'epic' as const,
      dropRateBonus: 0.15,      // +15% 드롭
      critRateBonus: 0.05,      // +5% 치명타
      pickupBonus: 0.10,        // +10% 흡입 범위
    },
    // 호흡 (呼吸): 주기적 체력 회복
    breathing: {
      rarity: 'epic' as const,
      interval: 5,              // 5초마다
      healAmount: 10,           // 체력 10 회복
    },
    // 선정 (禪定): 정지 시 재생 및 쿨타임 감소
    meditation: {
      rarity: 'epic' as const,
      stillTimeRequired: 1.0,   // 1초 이상 정지 시
      regenBonus: 2.0,          // +2 HP/s
      cooldownBonus: 0.20,      // -20% 쿨타임
    },
    // 혼백 (魂魄): 사망 시 1회 부활
    revive: {
      rarity: 'legendary' as const,
      reviveHealthPercent: 0.5, // 최대 체력의 50%로 부활
      invincibleDuration: 2.0,  // 부활 후 2초 무적
    },
  },

  // 기본 치명타 배율 (치명타 발동 시 기본 데미지)
  baseCriticalMultiplier: 1.5, // 기본 150% 피해
} as const;
