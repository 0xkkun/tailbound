# 코드 아키텍처

> 설화(Talebound) - 한국 전통 설화 기반 로그라이트 액션 게임의 코드 아키텍처 문서

---

## 목차

1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [아키텍처 설계 원칙](#아키텍처-설계-원칙)
5. [레이어별 상세 설명](#레이어별-상세-설명)
6. [주요 시스템 설계](#주요-시스템-설계)
7. [데이터 흐름](#데이터-흐름)
8. [확장 가이드](#확장-가이드)

---

## 개요

**설화(Talebound)**는 React + PixiJS 기반의 2D 웹 로그라이트 게임으로, **레이어 기반 아키텍처**를 채택했습니다.

### 게임 특징 (아키텍처 관점)

- **스텟 기반 시스템**: 힘/민첩/지능 3가지 주요 스텟
- **장비 랜덤 생성**: 접두사/접미사 조합 시스템
- **사신기(四神器)**: 4가지 장비 슬롯 (주작/현무/청룡/백호)
- **2 스테이지 구조**: 상계(현세) → 하계(저승)
- **메타 진행**: 영구 업그레이드 시스템

### 핵심 설계 원칙

1. **레이어 기반 아키텍처**: 명확한 책임 분리 및 단방향 의존성
2. **모듈화**: 무기, 적, 장비 등을 독립적인 모듈로 관리
3. **확장 가능성**: 새로운 무기/적/장비 추가 용이
4. **타입 안전성**: TypeScript를 통한 컴파일 타임 오류 방지
5. **데이터 중심 설계**: 밸런스 수치를 config로 분리

---

## 기술 스택

### 코어 기술

- **React 19** - UI 관리 및 상태 관리
- **PixiJS 8** - 2D 렌더링 엔진
- **TypeScript 5.7** - 타입 안전성

### 개발 도구

- **Vite 6** - 빌드 도구 및 개발 서버 (HMR)
- **ESLint + Prettier** - 코드 품질 및 포맷팅
- **pnpm** - 패키지 매니저 (빠른 의존성 설치)

### 향후 추가 예정

- **Howler.js** - 오디오 관리 (배경 음악, 효과음)
- **matter.js** 또는 **box2d** - 물리 엔진 (필요시)

### 의도적으로 제거된 기술

- ❌ **bitECS** - 프로토타입 단계에서 개발 속도 우선
  - 제거 사유: 학습 곡선, 디버깅 난이도, 엔티티 규모(<1000개)

---

## 프로젝트 구조

```
src/
├── main.tsx                     # 애플리케이션 진입점
├── App.tsx                      # 루트 컴포넌트 (게임 페이즈 관리)
│
├── config/                      # 게임 설정 및 밸런스
│   ├── game.config.ts           # 게임 상수 (맵 크기, 스테이지 시간 등)
│   ├── balance.config.ts        # 밸런스 수치 (무기, 적, 스텟 배율)
│   └── render.config.ts         # 렌더링 설정 (해상도, FPS)
│
├── types/                       # 전역 타입 정의
│   ├── game.types.ts            # 게임 오브젝트 타입
│   ├── equipment.types.ts       # 장비 시스템 타입
│   ├── stat.types.ts            # 스텟 시스템 타입
│   └── index.ts                 # 타입 재export
│
├── hooks/                       # 커스텀 React Hooks
│   ├── useGameState.ts          # 게임 페이즈 및 상태 관리
│   ├── useGameLoop.ts           # 게임 루프 폴링
│   ├── useKeyboard.ts           # 키보드 입력
│   ├── useMeta.ts               # 메타 진행 데이터 접근
│   └── useEquipment.ts          # 장비 관리
│
├── components/                  # 재사용 가능한 UI 컴포넌트
│   ├── common/                  # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Card.tsx
│   │
│   └── game/                    # 게임 특화 컴포넌트
│       ├── StatBar.tsx          # 체력/경험치바
│       ├── StatDisplay.tsx      # 스텟 표시 (힘/민첩/지능)
│       ├── EquipmentSlot.tsx    # 장비 슬롯 UI
│       └── Timer.tsx            # 게임 타이머
│
├── ui/                          # 화면 단위 UI (페이지/뷰)
│   ├── layouts/
│   │   ├── MainLayout.tsx       # 메인 메뉴 레이아웃
│   │   └── GameLayout.tsx       # 게임 레이아웃
│   │
│   ├── screens/                 # 전체 화면
│   │   ├── MainMenu.tsx         # 메인 메뉴
│   │   ├── CharacterSelect.tsx  # 캐릭터 선택 (향후)
│   │   ├── MetaUpgrade.tsx      # 메타 업그레이드 화면
│   │   └── GameOver.tsx         # 게임 오버 / 승리
│   │
│   └── overlays/                # 게임 중 오버레이
│       ├── HUD.tsx              # 게임 HUD (체력, 경험치, 타이머)
│       ├── PauseMenu.tsx        # 일시정지 메뉴
│       ├── LevelUpSelection.tsx # 레벨업 선택 (무기/패시브)
│       ├── EquipmentInventory.tsx # 장비 인벤토리
│       └── StageTransition.tsx  # 스테이지 전환 화면
│
├── game/                        # 게임 로직 레이어
│   ├── core/                    # 핵심 게임 시스템
│   │   ├── GameScene.ts         # 메인 게임 씬 (오케스트레이터)
│   │   ├── GameLoop.ts          # 게임 루프 관리
│   │   ├── InputManager.ts      # 입력 관리
│   │   └── StageManager.ts      # 스테이지 전환 관리
│   │
│   ├── entities/                # 게임 엔티티 (클래스 기반)
│   │   ├── Player.ts            # 플레이어
│   │   ├── Enemy.ts             # 적 베이스 클래스
│   │   ├── Projectile.ts        # 투사체
│   │   └── Pickup.ts            # 경험치/골드 픽업
│   │
│   ├── weapons/                 # 무기 시스템
│   │   ├── Weapon.ts            # 무기 베이스 클래스
│   │   ├── Talisman.ts          # 부적
│   │   ├── DokkaebiFire.ts      # 도깨비불
│   │   ├── MoktakSound.ts       # 목탁 소리
│   │   └── JakduBlade.ts        # 작두
│   │
│   ├── enemies/                 # 적 종류
│   │   ├── BasicGoblin.ts       # 하급 도깨비
│   │   ├── VengefulSpirit.ts    # 원한 맺힌 영혼
│   │   ├── WanderingGhost.ts    # 방황하는 귀신
│   │   └── Boss.ts              # 보스 베이스 클래스
│   │
│   ├── equipment/               # 장비 시스템
│   │   ├── Equipment.ts         # 장비 베이스 클래스
│   │   ├── EquipmentGenerator.ts # 랜덤 생성 로직
│   │   └── AffixSystem.ts       # 접두사/접미사 시스템
│   │
│   ├── data/                    # 게임 데이터
│   │   ├── weapons.ts           # 무기 데이터
│   │   ├── enemies.ts           # 적 데이터
│   │   ├── affixes.ts           # 접두사/접미사 데이터
│   │   ├── passives.ts          # 패시브 스킬 데이터
│   │   └── stages.ts            # 스테이지 데이터
│   │
│   └── utils/                   # 게임 유틸리티
│       ├── collision.ts         # 충돌 감지
│       ├── pathfinding.ts       # 길찾기 (적 AI)
│       └── random.ts            # 랜덤 유틸 (가중치 등)
│
├── systems/                     # 크로스 컨셔닝 시스템
│   ├── CombatSystem.ts          # 전투 시스템 (데미지 계산, 충돌)
│   ├── LevelSystem.ts           # 레벨 시스템 (경험치, 레벨업)
│   ├── StatSystem.ts            # 스텟 시스템 (힘/민첩/지능 효과)
│   ├── SpawnSystem.ts           # 스폰 시스템 (적 생성 로직)
│   ├── PickupSystem.ts          # 픽업 시스템 (자석, 획득)
│   └── EquipmentSystem.ts       # 장비 시스템 (장착, 효과 적용)
│
├── meta/                        # 메타 진행 시스템
│   ├── MetaProgressionManager.ts # 메타 진행 관리 (싱글톤)
│   ├── types.ts                  # 메타 타입 정의
│   ├── data.ts                   # 업그레이드 데이터
│   └── storage.ts                # LocalStorage 래퍼
│
└── render/                      # 렌더링 레이어
    ├── PixiApp.ts               # PixiJS Application 래퍼
    ├── Camera.ts                # 카메라 시스템 (플레이어 추적)
    ├── SpriteFactory.ts         # 스프라이트 생성 팩토리
    ├── ParticleManager.ts       # 파티클 관리 (향후)
    └── VFXManager.ts            # 시각 효과 관리
```

---

## 아키텍처 설계 원칙

### 1. 레이어 기반 아키텍처

```
┌───────────────────────────────────────┐
│  Presentation Layer (React UI)       │  ← 화면, 사용자 이벤트
├───────────────────────────────────────┤
│  Application Layer (Hooks/State)     │  ← 상태 관리, 게임-UI 연결
├───────────────────────────────────────┤
│  Domain Layer (Game Logic/Systems)   │  ← 게임 로직, 규칙
├───────────────────────────────────────┤
│  Infrastructure Layer (Render/IO)    │  ← PixiJS, LocalStorage
└───────────────────────────────────────┘
```

#### 의존성 방향 (단방향)

```
UI → Hooks → Game Logic → Render/Storage
```

**핵심 규칙**:

- 하위 레이어는 상위 레이어를 알지 못함
- 콜백/인터페이스를 통한 역방향 통신

---

### 2. 디렉토리별 책임

| 디렉토리      | 책임                     | 의존 대상               | 예시            |
| ------------- | ------------------------ | ----------------------- | --------------- |
| `ui/`         | 화면 렌더링, 이벤트 처리 | `components/`, `hooks/` | 메인 메뉴, HUD  |
| `components/` | 재사용 UI 컴포넌트       | `types/`                | 버튼, 모달      |
| `hooks/`      | 상태 관리, UI-게임 연결  | `game/`, `meta/`        | useGameState    |
| `game/`       | 게임 로직, 엔티티        | `systems/`, `render/`   | Player, Enemy   |
| `systems/`    | 시스템 로직              | `config/`, `types/`     | CombatSystem    |
| `meta/`       | 메타 진행 관리           | `types/`                | 업그레이드      |
| `render/`     | PixiJS 렌더링            | `types/`                | PixiApp, Camera |
| `config/`     | 설정 데이터              | 없음                    | 밸런스 수치     |
| `types/`      | 타입 정의                | 없음                    | 인터페이스      |

---

## 레이어별 상세 설명

### 1. Config Layer (`config/`)

**목적**: 게임의 모든 설정 값을 중앙화하여 밸런스 조정 용이

```typescript
// config/game.config.ts
export const GAME_CONFIG = {
  // 맵 설정
  MAP_SIZE: 3000,

  // 플레이어 기본 스텟
  PLAYER_BASE_HEALTH: 100,
  PLAYER_BASE_SPEED: 250,

  // 스테이지 설정
  STAGE_1_DURATION: 600, // 10분
  STAGE_2_DURATION: 600,

  // 레벨 시스템
  XP_BASE: 10,
  XP_MULTIPLIER: 1.5,
} as const;

// config/balance.config.ts
export const BALANCE = {
  // 스텟 효과
  stats: {
    strength: {
      healthPerPoint: 10, // 힘 1당 체력 +10
      healthRegenPerPoint: 0.1, // 힘 1당 재생 +0.1/s
    },
    agility: {
      attackSpeedPerPoint: 0.02, // 민첩 1당 공속 +2%
      defensePerPoint: 1, // 민첩 1당 방어력 +1
    },
    intelligence: {
      cooldownReductionPerPoint: 0.01, // 지능 1당 쿨감 +1%
      skillEfficiencyPerPoint: 0.02, // 지능 1당 스킬 효율 +2%
    },
  },

  // 무기 밸런스
  weapons: {
    talisman: {
      baseDamage: 15,
      cooldown: 1.0,
      speed: 500,
    },
    dokkaebiFire: {
      baseDamage: 8,
      tickRate: 0.5,
      orbitRadius: 100,
    },
    // ...
  },

  // 적 밸런스
  enemies: {
    basicGoblin: {
      health: 30,
      speed: 100,
      damage: 10,
      xpDrop: 5,
    },
    // ...
  },
} as const;
```

**장점**:

- 밸런스 조정 시 한 곳만 수정
- 타입 안전성 (`as const` 활용)
- 환경별 설정 분리 가능

---

### 2. Types Layer (`types/`)

```typescript
// types/stat.types.ts
export type StatType = 'strength' | 'agility' | 'intelligence';

export interface PlayerStats {
  // 주요 스텟
  strength: number;
  agility: number;
  intelligence: number;

  // 파생 스텟
  health: number;
  maxHealth: number;
  attackSpeed: number;
  defense: number;
  cooldownReduction: number;
}

// types/equipment.types.ts
export type GuardianType = 'suzaku' | 'genbu' | 'seiryuu' | 'byakko';

export interface Equipment {
  id: string;
  guardian: GuardianType;
  prefix?: AffixData;
  suffix?: AffixData;
  rarity: 'common' | 'rare' | 'epic' | 'legend';
}

export interface AffixData {
  id: string;
  name: string;
  statBonus: Partial<PlayerStats>;
}

// types/game.types.ts
export interface Vector2 {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2;
  active: boolean;
  update(dt: number): void;
  render(renderer: PixiApp): void;
}
```

---

### 3. Systems Layer (`systems/`)

**목적**: 엔티티 간 상호작용 로직 (도메인 규칙)

```typescript
// systems/StatSystem.ts
export class StatSystem {
  /**
   * 플레이어의 모든 스텟을 계산 (기본 + 장비 + 메타 업그레이드)
   */
  calculatePlayerStats(
    player: Player,
    equipment: Equipment[],
    metaBonuses: Partial<PlayerStats>
  ): PlayerStats {
    const base = player.baseStats;

    // 1. 기본 스텟
    const stats: PlayerStats = { ...base };

    // 2. 주요 스텟 효과 적용 (힘 → 체력, 민첩 → 공속 등)
    stats.maxHealth += stats.strength * BALANCE.stats.strength.healthPerPoint;
    stats.attackSpeed += stats.agility * BALANCE.stats.agility.attackSpeedPerPoint;
    stats.cooldownReduction +=
      stats.intelligence * BALANCE.stats.intelligence.cooldownReductionPerPoint;

    // 3. 장비 효과 적용
    equipment.forEach((eq) => {
      if (eq.prefix) this.applyAffix(stats, eq.prefix);
      if (eq.suffix) this.applyAffix(stats, eq.suffix);
    });

    // 4. 메타 업그레이드 적용
    Object.entries(metaBonuses).forEach(([key, value]) => {
      stats[key as keyof PlayerStats] += value;
    });

    return stats;
  }

  private applyAffix(stats: PlayerStats, affix: AffixData): void {
    Object.entries(affix.statBonus).forEach(([key, value]) => {
      stats[key as keyof PlayerStats] += value;
    });
  }
}

// systems/CombatSystem.ts
export class CombatSystem {
  update(player: Player, enemies: Enemy[], projectiles: Projectile[]): void {
    // 투사체 vs 적
    projectiles.forEach((proj) => {
      enemies.forEach((enemy) => {
        if (this.checkCollision(proj, enemy)) {
          const damage = this.calculateDamage(proj.baseDamage, player.stats);
          enemy.takeDamage(damage);
          proj.onHit();
        }
      });
    });

    // 적 vs 플레이어
    enemies.forEach((enemy) => {
      if (this.checkCollision(enemy, player)) {
        const damageReduction = player.stats.defense * 0.01; // 방어력 1당 1% 감소
        const finalDamage = enemy.damage * (1 - damageReduction);
        player.takeDamage(finalDamage);
      }
    });
  }

  private calculateDamage(baseDamage: number, stats: PlayerStats): number {
    // 지능에 따른 스킬 효율 증가
    const efficiency = 1 + stats.intelligence * BALANCE.stats.intelligence.skillEfficiencyPerPoint;
    return baseDamage * efficiency;
  }

  private checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    // AABB 또는 원형 충돌 감지
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
  }
}

// systems/EquipmentSystem.ts
export class EquipmentSystem {
  /**
   * 사신기 세트 효과 확인
   */
  checkSetBonus(equipment: Equipment[]): {
    suzaku: number;
    genbu: number;
    seiryuu: number;
    byakko: number;
  } {
    const counts = {
      suzaku: 0,
      genbu: 0,
      seiryuu: 0,
      byakko: 0,
    };

    equipment.forEach((eq) => {
      counts[eq.guardian]++;
    });

    return counts;
  }

  /**
   * 세트 효과 적용 (2세트, 4세트 보너스)
   */
  applySetBonuses(stats: PlayerStats, equipment: Equipment[]): void {
    const setCounts = this.checkSetBonus(equipment);

    // 주작 2세트: 공격력 +10%
    if (setCounts.suzaku >= 2) {
      stats.damage *= 1.1;
    }

    // 현무 2세트: 최대 체력 +20%
    if (setCounts.genbu >= 2) {
      stats.maxHealth *= 1.2;
    }

    // ... 나머지 세트 효과
  }
}
```

---

### 4. Game Layer (`game/`)

```typescript
// game/core/GameScene.ts
export class GameScene {
  private player: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private equipment: Equipment[] = [];

  private renderer: PixiApp;
  private inputManager: InputManager;
  private stageManager: StageManager;

  private systems: {
    combat: CombatSystem;
    level: LevelSystem;
    stat: StatSystem;
    spawn: SpawnSystem;
    pickup: PickupSystem;
    equipment: EquipmentSystem;
  };

  // 콜백 (React UI 연결)
  public onLevelUp?: (cards: CardData[]) => void;
  public onEquipmentDrop?: (equipment: Equipment) => void;
  public onStageChange?: (stage: number) => void;

  constructor() {
    this.renderer = new PixiApp();
    this.inputManager = new InputManager();
    this.stageManager = new StageManager();

    this.systems = {
      combat: new CombatSystem(),
      level: new LevelSystem(),
      stat: new StatSystem(),
      spawn: new SpawnSystem(),
      pickup: new PickupSystem(),
      equipment: new EquipmentSystem(),
    };
  }

  async init(container: HTMLElement): Promise<void> {
    await this.renderer.init(container);

    // 플레이어 생성 (메타 업그레이드 적용)
    const metaBonuses = metaManager.getStatBonuses();
    this.player = new Player({ x: 0, y: 0 }, metaBonuses);

    // 레벨 시스템 콜백 연결
    this.systems.level.setLevelUpCallback((cards) => {
      this.onLevelUp?.(cards);
    });

    this.startGameLoop();
  }

  private startGameLoop(): void {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private update(dt: number): void {
    // 1. 입력 처리
    const input = this.inputManager.getInput();
    this.player.handleInput(input, dt);

    // 2. 스텟 재계산 (장비 변경 시)
    const stats = this.systems.stat.calculatePlayerStats(
      this.player,
      this.equipment,
      metaManager.getStatBonuses()
    );
    this.player.updateStats(stats);

    // 3. 엔티티 업데이트
    this.player.update(dt);
    this.enemies.forEach((e) => e.update(dt, this.player.position));
    this.projectiles.forEach((p) => p.update(dt));
    this.pickups.forEach((p) => p.update(dt, this.player.position));

    // 4. 무기 발사
    this.player.weapons.forEach((weapon) => {
      const newProjectiles = weapon.fire(this.player.position, this.enemies);
      this.projectiles.push(...newProjectiles);
    });

    // 5. 시스템 실행
    this.systems.combat.update(this.player, this.enemies, this.projectiles);
    this.systems.level.update(this.player);
    this.systems.spawn.update(this.enemies, this.stageManager.getCurrentStage());
    this.systems.pickup.update(this.player, this.pickups);

    // 6. 스테이지 관리
    if (this.stageManager.shouldTransition()) {
      this.onStageChange?.(this.stageManager.nextStage());
    }

    // 7. 정리 (죽은 엔티티 제거)
    this.cleanup();
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.updateCamera(this.player.position);

    this.pickups.forEach((p) => p.render(this.renderer));
    this.enemies.forEach((e) => e.render(this.renderer));
    this.player.render(this.renderer);
    this.projectiles.forEach((p) => p.render(this.renderer));
  }

  private cleanup(): void {
    this.enemies = this.enemies.filter((e) => e.isAlive());
    this.projectiles = this.projectiles.filter((p) => p.isActive());
    this.pickups = this.pickups.filter((p) => !p.isCollected());
  }

  // UI 연결 메서드
  getPlayerStats(): PlayerStats {
    return this.player.stats;
  }

  equipItem(equipment: Equipment): void {
    this.equipment.push(equipment);
    // 스텟 즉시 재계산은 다음 프레임 update에서
  }

  applyCard(card: CardData): void {
    if (card.type === 'weapon') {
      this.player.addWeapon(card.weaponId);
    } else if (card.type === 'passive') {
      this.player.addPassive(card.passiveId);
    }
  }

  destroy(): void {
    this.renderer.destroy();
    this.inputManager.destroy();
  }
}

// game/entities/Player.ts
export class Player implements GameObject {
  id: string;
  position: Vector2;
  baseStats: PlayerStats;
  stats: PlayerStats; // 계산된 최종 스텟
  weapons: Weapon[] = [];

  constructor(position: Vector2, metaBonuses: Partial<PlayerStats>) {
    this.id = 'player';
    this.position = position;

    // 기본 스텟 설정
    this.baseStats = {
      strength: 5 + (metaBonuses.strength || 0),
      agility: 5 + (metaBonuses.agility || 0),
      intelligence: 5 + (metaBonuses.intelligence || 0),
      health: 100,
      maxHealth: 100,
      // ... 나머지 스텟
    };

    this.stats = { ...this.baseStats };
  }

  handleInput(input: InputState, dt: number): void {
    // 이동 속도는 stats.speed 사용
    const speed = 250 + this.stats.agility * 2; // 민첩 1당 +2 속도

    this.position.x += input.x * speed * dt;
    this.position.y += input.y * speed * dt;
  }

  updateStats(newStats: PlayerStats): void {
    const healthRatio = this.stats.health / this.stats.maxHealth;
    this.stats = newStats;

    // 최대 체력 증가 시 현재 체력도 비율 유지
    this.stats.health = this.stats.maxHealth * healthRatio;
  }

  addWeapon(weaponId: number): void {
    const WeaponClass = this.getWeaponClass(weaponId);
    this.weapons.push(new WeaponClass(this.stats));
  }

  takeDamage(amount: number): void {
    this.stats.health -= amount;
    if (this.stats.health < 0) this.stats.health = 0;
  }

  update(dt: number): void {
    // 체력 재생 (힘 스텟 기반)
    const regen = this.stats.strength * BALANCE.stats.strength.healthRegenPerPoint;
    this.stats.health = Math.min(this.stats.health + regen * dt, this.stats.maxHealth);
  }

  render(renderer: PixiApp): void {
    renderer.drawCircle(this.position, 40, 0xff5555);
  }
}
```

---

## 데이터 흐름

### 게임 시작 플로우

```
1. MainMenu (UI) → "게임 시작" 버튼 클릭
   ↓
2. useGameState hook → setGamePhase('playing')
   ↓
3. App.tsx → GameView 렌더링
   ↓
4. useEffect → GameScene.init(container)
   ↓
5. GameScene → MetaProgressionManager에서 보너스 로드
   ↓
6. Player 생성 (메타 보너스 적용)
   ↓
7. 게임 루프 시작 (requestAnimationFrame)
```

### 레벨업 플로우

```
1. LevelSystem.update(player)
   ↓
2. player.xp >= threshold 감지
   ↓
3. levelUpCallback(cards) 호출
   ↓
4. GameScene → onLevelUp callback → App.tsx
   ↓
5. setLevelUpCards(cards)
   ↓
6. <LevelUpSelection cards={cards} /> 렌더링
   ↓
7. 유저 선택 → onSelect(card)
   ↓
8. GameScene.applyCard(card)
   ↓
9. Player.addWeapon() 또는 Player.addPassive()
```

### 장비 착용 플로우

```
1. 적 처치 → EquipmentGenerator.generate()
   ↓
2. Equipment 드롭 (접두사/접미사 랜덤)
   ↓
3. Pickup 생성 → Player 충돌 감지
   ↓
4. GameScene.onEquipmentDrop callback → UI
   ↓
5. <EquipmentInventory> 렌더링
   ↓
6. 유저가 장비 선택 → onEquip(equipment)
   ↓
7. GameScene.equipItem(equipment)
   ↓
8. 다음 프레임에 StatSystem.calculatePlayerStats() 실행
   ↓
9. Player.updateStats(newStats)
```

---

## 확장 가이드

### 새로운 무기 추가

```typescript
// 1. game/weapons/NewWeapon.ts 생성
export class SacredBell extends Weapon {
  fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    // 성스러운 종 로직
    // - 광역 공격
    // - 적 넉백
    return [];
  }
}

// 2. game/data/weapons.ts에 데이터 추가
export const WEAPON_DATA = [
  // ...
  {
    id: 5,
    name: '성스러운 종',
    type: 'aoe',
    baseDamage: 20,
    cooldown: 3.0,
    range: 200,
  },
];

// 3. Player.getWeaponClass()에 추가
```

### 새로운 적 추가

```typescript
// 1. game/enemies/NewEnemy.ts 생성
export class FlyingGhost extends Enemy {
  update(dt: number, playerPos: Vector2): void {
    // 날아다니는 귀신 로직
    // - 벽 무시
    // - 플레이어에게 직선 이동
  }
}

// 2. game/data/enemies.ts에 데이터 추가
// 3. SpawnSystem에서 스폰 타이밍 설정
```

### 새로운 접사 추가

```typescript
// game/data/affixes.ts
export const AFFIXES: AffixData[] = [
  // ...
  {
    id: 'prefix_burning',
    name: '불타는',
    type: 'prefix',
    statBonus: {
      damage: 10,
      // 추가 효과: 적 화상 (시스템에서 처리)
    },
    specialEffect: 'burning',
  },
];
```

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-14
**작성자**: 개발팀

---

## 변경 이력

| 날짜       | 변경 사항                                 | 작성자 |
| ---------- | ----------------------------------------- | ------ |
| 2025-10-14 | 초기 문서 작성, 레이어 기반 아키텍처 설계 | 개발팀 |
| 2025-10-14 | Kepler Wars 코드 참고, ECS 제거 결정      | 개발팀 |
