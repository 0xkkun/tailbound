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
  // 도깨비불
  dokkaebi_fire: {
    name: '도깨비불',
    baseDamage: 8,
    baseCooldown: 0.5,
    projectileSpeed: 300,
    projectileRadius: 12,
    projectileLifetime: 2,
    piercing: 0,
    projectileCount: 3,
    // 궤도 설정
    orbitalRadius: 80, // 기본 궤도 반경
    baseAngularSpeed: 3.5, // 기본 회전 속도 (rad/s)
    maxAngularSpeed: 5.5, // 최대 회전 속도
    maxOrbitalCount: 5, // 최대 궤도 개수
    // 깜박임 설정
    blinkOnDurationBase: 5.0, // 켜짐 시간 기본값
    blinkOnDurationMin: 2.0, // 켜짐 시간 최소값
    blinkOffDurationBase: 3.0, // 꺼짐 시간 기본값
    blinkOffDurationMin: 1.2, // 꺼짐 시간 최소값
    levelScaling: {
      damage: 3,
      cooldownReduction: 0.03,
      piercingPerLevel: 0,
      angularSpeedPerLevel: 0.1, // 레벨당 회전속도 증가
      radiusPerLevel: 10, // 3레벨마다 반경 증가량
      radiusIncreaseInterval: 3, // 반경 증가 주기
      blinkOnReductionPerLevel: 1.0, // 레벨당 켜짐 시간 감소
      blinkOffReductionPerLevel: 0.6, // 레벨당 꺼짐 시간 감소
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
  // 작두날
  jakdu_blade: {
    name: '작두날',
    baseDamage: 18,
    baseCooldown: 3.0,
    projectileSpeed: 400,
    projectileRadius: 20,
    projectileLifetime: 5,
    piercing: 5,
    projectileCount: 1,
    attackRadius: 80, // 작두날 공격 범위 (기본 64 -> 80으로 증가)
    offsetDistance: 60, // 플레이어로부터의 거리
    levelScaling: {
      damage: 6,
      cooldownReduction: 0.1,
      piercingPerLevel: 1,
      radiusPerLevel: 8, // 레벨당 범위 +8
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
    damageDecayMin: 0.33, // 관통 시 최소 데미지 (33%)
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
 */
export const POWERUP_BALANCE = {
  // ⚔️ 공격 강화 파워업
  combat: {
    // 치명타 확률 (필살)
    criticalRate: {
      common: 0.05, // +5%
      rare: 0.1, // +10%
      epic: 0.2, // +20%
      max: 1.0, // 100% (항상 치명타)
    },
    // 치명타 피해량 (극살)
    criticalDamage: {
      common: 0.2, // +20%
      rare: 0.5, // +50%
      epic: 1.0, // +100%
      max: 5.0, // 기본 150% -> 최대 650% (1.5 + 5.0)
    },
  },

  // 💪 생존/방어 파워업
  defense: {
    // 피해 감소 (강체)
    damageReduction: {
      common: 0.03, // -3% 피해
      rare: 0.08, // -8% 피해
      epic: 0.15, // -15% 피해
      max: 0.8, // 최대 -80% (거의 무적 방지)
    },
    // 호흡 (呼吸): 주기적 체력 회복
    breathing: {
      common: { interval: 8, healAmount: 5 }, // 8초마다 5 회복
      rare: { interval: 6, healAmount: 8 }, // 6초마다 8 회복
      epic: { interval: 4, healAmount: 12 }, // 4초마다 12 회복
    },
  },

  // ⚙️ 유틸리티 파워업
  utility: {
    // 경험치 획득량 (수련)
    xpGain: {
      common: 0.05, // +5%
      rare: 0.12, // +12%
      epic: 0.25, // +25%
      max: 2.0, // 최대 +200%
    },
  },

  // 🎁 특수 드롭 아이템
  specialDrop: {
    // 혼백 (魂魄): 사망 시 1회 부활 (보스 드롭)
    revive: {
      dropRate: 0.1, // 보스 처치 시 10% 확률
      reviveHealthPercent: 0.5, // 최대 체력의 50%로 부활
      invincibleDuration: 2.0, // 부활 후 2초 무적
    },
  },

  // 기본 치명타 배율 (치명타 발동 시 기본 데미지)
  baseCriticalMultiplier: 1.5, // 기본 150% 피해
} as const;
