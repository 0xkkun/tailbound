/**
 * 게임 전역 설정
 */

export const GAME_CONFIG = {
  // 화면 설정
  screen: {
    width: 1280,
    height: 720,
    backgroundColor: 0x0a0a15,
  },

  // 월드(맵) 설정
  world: {
    // 상계 (Overworld) - 전투 맵
    overworld: {
      width: 3200, // 맵 너비 (화면의 약 2.5배)
      height: 2400, // 맵 높이 (화면의 약 3.3배)
    },
    // 경계 (Boundary) - NPC 상호작용 맵
    boundary: {
      width: 1200,
      height: 900,
    },
    // 하계 (Underworld) - 추후 구현
    underworld: {
      width: 3200,
      height: 2400,
    },
  },

  // 게임 시간
  time: {
    victoryTime: 600, // 10분 생존 시 승리
    difficultyIncreaseInterval: 10, // 10초마다 난이도 증가
  },

  // 레벨업 설정
  levelUp: {
    baseXpRequired: 100, // 첫 레벨업 필요 경험치
    xpScaling: 1.2, // 레벨당 경험치 증가율
    maxLevel: 99,
  },

  // 투사체 제한
  projectile: {
    maxCount: 500, // 최대 투사체 수
    outOfBoundsMargin: 100, // 화면 밖 마진
  },

  // 적 제한
  enemy: {
    maxCount: 200, // 최대 적 수
  },

  // UI 설정
  ui: {
    healthBarHeight: 6,
    healthBarOffset: 10,
  },

  // 레이어 z-index 설정
  layers: {
    game: 0, // 게임 월드 (배경, 엔티티 등)
    joystick: 10, // 조이스틱 터치 영역
    ui: 20, // 일반 UI (체력바, 경험치바, 대화창 등)
    topUI: 30, // 최상위 UI (설정 버튼 등, 모든 터치 이벤트보다 위)
  },

  // 엔티티 z-index 설정 (gameLayer 내부)
  entities: {
    background: 0, // 배경 타일
    aoeEffect: 90, // AoE 이펙트 (목탁 소리 등)
    enemy: 100, // 적
    player: 100, // 플레이어
    projectile: 100, // 투사체
  },

  // 인터랙션 설정
  interaction: {
    npcProximityRadius: 100, // NPC와의 상호작용 거리
    portalCollisionRadius: 80, // 포탈 충돌 감지 거리
  },

  // 포탈 설정
  portal: {
    spawnDistanceMin: 400, // 플레이어로부터 최소 거리
    spawnDistanceMax: 600, // 플레이어로부터 최대 거리
    radius: 80, // 포탈 크기
    animationSpeed: 2.0, // 회전 속도
    pulseSpeed: 3.0, // 펄스 속도
  },
} as const;
