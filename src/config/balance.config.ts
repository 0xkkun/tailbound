/**
 * 게임 밸런스 설정 (플레이어, 적, 무기 등)
 */

/**
 * 플레이어 밸런스
 */
export const PLAYER_BALANCE = {
  // 기본 스탯
  health: 100,
  speed: 250,
  radius: 40,
  invincibleDuration: 0.5, // 피격 후 무적 시간
  baseStats: {
    strength: 0, // 공격력
    agility: 0, // 이동속도, 공격속도
    intelligence: 0, // 투사체 수, 범위
  },

  // 파워업 초기값
  initialStats: {
    criticalRate: 0.05, // 치명타 확률 기본 5%
    criticalDamage: 1.5, // 치명타 피해 기본 150%
    damageReduction: 0, // 피해 감소 기본 0%
    xpMultiplier: 1.0, // 경험치 배수 기본 100%
    damageMultiplier: 1.0, // 공격력 배수 기본 100%
    speedMultiplier: 1.0, // 이동속도 배수 기본 100%
    cooldownMultiplier: 1.0, // 쿨타임 배수 기본 100%
    pickupRangeMultiplier: 1.0, // 획득 범위 배수 기본 100%
  },

  // 파워업 최대/최소치
  maxStats: {
    damageMultiplier: 5.0, // 500%
    speedMultiplier: 2.0, // 200%
    pickupRangeMultiplier: 5.0, // 500%
    maxHealth: 500, // 최대 체력
    criticalRate: 1.0, // 100%
    criticalDamage: 6.5, // 650% (기본 1.5 + 최대 5.0)
    damageReduction: 0.8, // 80%
    xpMultiplier: 3.0, // 300%
  },

  minStats: {
    cooldownMultiplier: 0.3, // 30% (70% 감소)
  },
} as const;

/**
 * 필드몹 밸런스 (low/medium/high)
 * 티어별 기본 배율: 1.0 / 3.5 / 15.0
 */
export const FIELD_ENEMY_BALANCE = {
  low: {
    health: 30,
    speed: 100,
    damage: 10,
    radius: 30,
    xpDrop: 5,
    animationSpeed: 0.15,
  },
  medium: {
    health: 105, // 30 * 3.5
    speed: 100,
    damage: 35, // 10 * 3.5
    radius: 30,
    xpDrop: 25,
    animationSpeed: 0.15,
  },
  high: {
    health: 450, // 30 * 15
    speed: 100,
    damage: 150, // 10 * 15
    radius: 30,
    xpDrop: 100,
    animationSpeed: 0.2,
  },
} as const;

/**
 * 네임드 밸런스 (향후 구현)
 */
export const NAMED_ENEMY_BALANCE = {
  dokkaebi_captain: {
    health: 500,
    speed: 95,
    damage: 35,
    radius: 50,
    xpDrop: 200,
    animationSpeed: 0.18,
    knockbackResistance: 0.5,
  },
  ghost_general: {
    health: 600,
    speed: 80,
    damage: 40,
    radius: 48,
    xpDrop: 250,
    animationSpeed: 0.15,
    knockbackResistance: 0.6,
  },
  fox_elder: {
    health: 550,
    speed: 90,
    damage: 38,
    radius: 46,
    xpDrop: 220,
    animationSpeed: 0.17,
    knockbackResistance: 0.55,
  },
  reaper_commander: {
    health: 700,
    speed: 120,
    damage: 45,
    radius: 52,
    xpDrop: 300,
    animationSpeed: 0.2,
    knockbackResistance: 0.7,
  },
} as const;

/**
 * 보스 밸런스
 */
export const BOSS_BALANCE = {
  white_tiger: {
    health: 75000, // 2.5분 전투 목표 (평균 DPS 500 기준, 150초)
    speed: 90, // 플레이어보다 느리지만 위협적
    damage: 60, // 접촉 데미지 (플레이어 체력의 1/3~1/2)
    radius: 110, // 보스 히트박스 (스프라이트 288px의 약 40% 크기)
    xpDrop: 0, // 보스는 경험치를 주지 않음 (특별 보상 제공)
    animationSpeed: 0.15,
    knockbackResistance: 0.2, // 넉백 80% 저항
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
    baseDamage: 4, // 틱 데미지가 빨라지므로 데미지 감소 (8 -> 4)
    baseCooldown: 0.5,
    projectileSpeed: 300,
    projectileRadius: 36, // 도깨비불 크기 증가 (12 -> 36, 3배)
    projectileLifetime: 2,
    piercing: 0,
    projectileCount: 3,
    // 궤도 설정
    orbitalRadius: 120, // 기본 궤도 반경 (80 -> 120)
    baseAngularSpeed: 5.0, // 기본 회전 속도 증가 (3.5 -> 5.0)
    maxAngularSpeed: 7.5, // 최대 회전 속도 증가 (5.5 -> 7.5)
    maxOrbitalCount: 5, // 최대 궤도 개수
    // 깜박임 설정
    blinkOnDurationBase: 5.0, // 켜짐 시간 기본값
    blinkOnDurationMin: 2.0, // 켜짐 시간 최소값
    blinkOffDurationBase: 3.0, // 꺼짐 시간 기본값
    blinkOffDurationMin: 1.2, // 꺼짐 시간 최소값
    levelScaling: {
      damage: 2, // 레벨당 데미지 증가량 감소 (3 -> 2)
      cooldownReduction: 0.03,
      piercingPerLevel: 0,
      angularSpeedPerLevel: 0.15, // 레벨당 회전속도 증가량 상승 (0.1 -> 0.15)
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
    aoeRadius: 200, // 범위 공격 (150 -> 200)
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
    projectileLifetime: 7, // 사거리 증가 (5 -> 7, 2000px -> 2800px)
    piercing: 5,
    projectileCount: 1,
    attackRadius: 80, // 작두날 공격 범위 (실제 날 부분만 맞도록 축소)
    offsetDistance: 60, // 플레이어로부터의 거리
    levelScaling: {
      damage: 6,
      cooldownReduction: 0.1,
      piercingPerLevel: 1,
      radiusPerLevel: 5, // 레벨당 범위 +5 (8에서 감소)
    },
  },
  // 부채바람
  fan_wind: {
    name: '부채바람',
    baseDamage: 12,
    baseCooldown: 2.0,
    projectileSpeed: 300,
    projectileRadius: 15,
    projectileLifetime: 2.0, // 최대 사거리 600픽셀 (300 * 2.0)
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
  maxActiveEnemies: 150, // 최대 활성 적 개체 수 (성능 최적화)

  // 적 스폰 확률 (합계 1.0)
  enemySpawnRates: {
    skeleton: 0.15, // 해골 15%
    dokkaebi: 0.14, // 도깨비 14%
    mask: 0.15, // 탈령 15%
    maidenGhost: 0.1, // 처녀귀신 10% (원거리)
    evilSpirit: 0.06, // 악령 6% (원거리)
    fox: 0.14, // 여우 14%
    grimReaper: 0.05, // 저승사자 5% (암살자)
    totem: 0.13, // 토템 13% (느린 탱커)
    waterGhost: 0.08, // 수귀 8% (빠른 약체)
  },
} as const;

/**
 * 적 타입별 고유 밸런스 설정
 */
export const ENEMY_TYPE_BALANCE = {
  // 스켈레톤 (근접 - 유리대포)
  skeleton: {
    healthMultiplier: 0.67, // 기본 체력의 67%
    damageMultiplier: 0.8, // 기본 데미지의 80%
    speed: 130, // 빠른 속도
    radius: 25, // 작은 히트박스
  },
  // 도깨비 (근접 - 탱커)
  dokkaebi: {
    healthMultiplier: 1.67, // 기본 체력의 167%
    damageMultiplier: 1.2, // 기본 데미지의 120%
    speed: 75, // 느린 속도
    radius: 35, // 큰 히트박스
  },
  // 탈령 (근접 - 암살자)
  mask: {
    healthMultiplier: 0.6, // 기본 체력의 60%
    damageMultiplier: 1.5, // 기본 데미지의 150%
    speed: 150, // 매우 빠른 속도
    radius: 28, // 작은 히트박스
  },
  // 여우 (근접 - 균형형)
  fox: {
    healthMultiplier: 1.17, // 기본 체력의 117% (35 / 30 * 1.0)
    damageMultiplier: 1.0, // 기본 데미지
    speed: 120, // 빠른 속도
    radius: 30, // 기본 히트박스
  },
  // 저승사자 (근접 - 암살자)
  grimReaper: {
    healthMultiplier: 0.73, // 기본 체력의 73% (22 / 30 * 1.0)
    damageMultiplier: 1.6, // 기본 데미지의 160%
    speed: 140, // 매우 빠른 속도
    radius: 28, // 작은 히트박스
  },
  // 토템 (근접 - 탱커)
  totem: {
    healthMultiplier: 2.0, // 기본 체력의 200%
    damageMultiplier: 1.1, // 기본 데미지의 110%
    speed: 50, // 매우 느린 속도
    radius: 32, // 큰 히트박스
  },
  // 수귀 (근접 - 균형형)
  waterGhost: {
    healthMultiplier: 0.83, // 기본 체력의 83% (25 / 30 * 1.0)
    damageMultiplier: 0.9, // 기본 데미지의 90%
    speed: 110, // 빠른 속도
    radius: 27, // 작은 히트박스
  },
  // 악령 (원거리)
  evilSpirit: {
    healthMultiplier: 0.8, // 기본 체력의 80%
    damageMultiplier: 0.8, // 기본 데미지의 80%
    speed: 110, // 빠른 속도
    radius: 28, // 작은 히트박스
    attackCooldown: 1.5, // 공격 쿨타임
    attackRange: 280, // 공격 사거리
    keepDistance: 200, // 유지 거리
  },
  // 처녀귀신 (원거리)
  maidenGhost: {
    healthMultiplier: 0.9, // 기본 체력의 90%
    damageMultiplier: 1.0, // 기본 데미지
    speed: 85, // 느린 속도
    radius: 30, // 기본 히트박스
    attackCooldown: 2.0, // 공격 쿨타임
    attackRange: 250, // 공격 사거리
    keepDistance: 180, // 유지 거리
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

  // 넉백 무적 시간 (초)
  immunityDuration: 2.0, // 넉백 후 2초 동안 다시 넉백되지 않음
} as const;

/**
 * 틱 데미지 밸런스 (지속 데미지용)
 */
export const TICK_DAMAGE_BALANCE = {
  orbital: 0.15, // 궤도 무기 (0.15초 = 초당 약 6.7회, 더 빠르게)
  aoe: 0.0, // AoE는 일회성 (틱 없음)
} as const;

/**
 * 파워업 밸런스 설정
 *
 * 전체 10종 파워업의 등급별 증가량 정의
 * - 공격: damage, cooldown, crit_rate, crit_damage
 * - 방어: health, damage_reduction, breathing
 * - 유틸: speed, pickup, xp_gain
 */
export const POWERUP_BALANCE = {
  // ⚔️ 공격 파워업
  damage: {
    common: 0.02, // +2%
    rare: 0.05, // +5%
    epic: 0.1, // +10%
  },
  cooldown: {
    common: 0.02, // -2%
    rare: 0.05, // -5%
    epic: 0.1, // -10%
  },
  crit_rate: {
    common: 0.05, // +5%
    rare: 0.1, // +10%
    epic: 0.2, // +20%
  },
  crit_damage: {
    common: 0.2, // +20%
    rare: 0.5, // +50%
    epic: 1.0, // +100%
  },

  // 💪 방어 파워업
  health: {
    common: 5, // +5 HP
    rare: 15, // +15 HP
    epic: 30, // +30 HP
  },
  damage_reduction: {
    common: 0.03, // -3%
    rare: 0.08, // -8%
    epic: 0.15, // -15%
  },
  breathing: {
    common: 0.005, // 0.5%/초
    rare: 0.012, // 1.2%/초
    epic: 0.025, // 2.5%/초
  },

  // ⚙️ 유틸리티 파워업
  speed: {
    common: 0.03, // +3%
    rare: 0.07, // +7%
    epic: 0.15, // +15%
  },
  pickup: {
    common: 0.05, // +5%
    rare: 0.15, // +15%
    epic: 0.3, // +30%
  },
  xp_gain: {
    common: 0.05, // +5%
    rare: 0.12, // +12%
    epic: 0.25, // +25%
  },
} as const;
