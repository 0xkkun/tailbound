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
  dropRate: 0.1, // 10% 확률로 드랍
  healAmount: 0.5, // 최대 체력의 50% 회복
  attractRadius: 80, // 플레이어 근처에서 자동으로 끌려옴
  attractSpeed: 300, // 끌려오는 속도
  radius: 12, // 포션 크기
} as const;
