# 레벨업 & 경험치 시스템 설계

## 목차

1. [개요](#개요)
2. [경험치 획득 방식](#경험치-획득-방식)
3. [레벨업 경험치 테이블](#레벨업-경험치-테이블)
4. [레벨업 보상 시스템](#레벨업-보상-시스템)
5. [구현 가이드](#구현-가이드)
6. [밸런스 조정](#밸런스-조정)

---

## 개요

설화(Tailbound)의 레벨업 시스템은 Vampire Survivors 스타일의 빠른 성장과 선택의 재미를 제공합니다.

### 핵심 원칙

- **빠른 초반 성장**: 게임 시작 후 빠르게 레벨업하여 재미 제공
- **의미있는 선택**: 매 레벨업마다 3-4개 선택지 중 전략적 선택
- **예측 가능한 진행**: 10분 플레이 시 약 25-30레벨 도달

---

## 경험치 획득 방식

### 경험치 드랍 (balance.config.ts 기준)

```typescript
// 적 티어별 기본 경험치
normal: 5 XP    // 일반 적
elite: 25 XP    // 엘리트 적
boss: 100 XP    // 보스
```

### 경험치 젬 시스템

- 적 처치 시 경험치 젬 드랍
- 플레이어가 가까이 가면 자동 획득
- 자석 범위: 80픽셀 (XP_BALANCE.pickupRadius)
- 수집 거리: 60픽셀 (실제 획득)
- 지속 시간: 120초(2분) 후 소멸

---

## 레벨업 경험치 테이블

### 경험치 계산 공식

```typescript
export function getRequiredXP(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 10; // 첫 레벨업은 매우 빠르게

  // 초반 (2-10): 지수 성장 (빠른 레벨업)
  if (level <= 10) {
    const base = 10;
    const growth = 1.6;
    return Math.floor(base * Math.pow(growth, level - 2));
  }

  // 중반 (11-20): 선형 증가
  if (level <= 20) {
    const baseXP = 320; // 레벨 10→11 필요량
    const increment = 60;
    return baseXP + (level - 11) * increment;
  }

  // 후반 (21-99): 완만한 증가
  const baseXP = 1145; // 레벨 20→21 필요량
  const increment = 110;
  return baseXP + (level - 21) * increment;
}
```

### 레벨별 필요 경험치 표

#### 초반 (1-10 레벨) - 빠른 성장 구간

| 레벨  | 필요 XP | 누적 XP | 일반 적 처치 수 | 예상 시간 |
| ----- | ------- | ------- | --------------- | --------- |
| 1→2   | 10      | 10      | 2               | ~5초      |
| 2→3   | 20      | 30      | 4               | ~10초     |
| 3→4   | 40      | 70      | 8               | ~15초     |
| 4→5   | 65      | 135     | 13              | ~20초     |
| 5→6   | 95      | 230     | 19              | ~30초     |
| 6→7   | 130     | 360     | 26              | ~40초     |
| 7→8   | 170     | 530     | 34              | ~50초     |
| 8→9   | 215     | 745     | 43              | ~60초     |
| 9→10  | 265     | 1,010   | 53              | ~70초     |
| 10→11 | 320     | 1,330   | 64              | ~80초     |

#### 중반 (11-20 레벨) - 안정적 성장

| 레벨  | 필요 XP | 누적 XP | 예상 시간 |
| ----- | ------- | ------- | --------- |
| 11→12 | 380     | 1,710   | ~90초     |
| 12→13 | 445     | 2,155   | ~100초    |
| 13→14 | 515     | 2,670   | ~110초    |
| 14→15 | 590     | 3,260   | ~120초    |
| 15→16 | 670     | 3,930   | ~135초    |
| 16→17 | 755     | 4,685   | ~150초    |
| 17→18 | 845     | 5,530   | ~165초    |
| 18→19 | 940     | 6,470   | ~180초    |
| 19→20 | 1,040   | 7,510   | ~195초    |
| 20→21 | 1,145   | 8,655   | ~210초    |

#### 후반 (21-30 레벨) - 느린 성장

| 레벨  | 필요 XP | 누적 XP | 예상 시간 |
| ----- | ------- | ------- | --------- |
| 21→22 | 1,255   | 9,910   | ~225초    |
| 22→23 | 1,370   | 11,280  | ~240초    |
| 23→24 | 1,490   | 12,770  | ~255초    |
| 24→25 | 1,615   | 14,385  | ~270초    |
| 25→26 | 1,745   | 16,130  | ~285초    |
| 26→27 | 1,880   | 18,010  | ~300초    |
| 27→28 | 2,020   | 20,030  | ~315초    |
| 28→29 | 2,165   | 22,195  | ~330초    |
| 29→30 | 2,315   | 24,510  | ~345초    |

### 시간대별 경험치 획득 예상

```
0-60초: 주로 일반 적 (100%)
- 평균 XP/초: ~10
- 예상 레벨: 8-10

60-180초: 일반 (85%) + 엘리트 (15%)
- 평균 XP/초: ~15
- 예상 레벨: 15-18

180-300초: 일반 (70%) + 엘리트 (25%) + 보스 (5%)
- 평균 XP/초: ~20
- 예상 레벨: 22-25

300-600초: 일반 (60%) + 엘리트 (30%) + 보스 (10%)
- 평균 XP/초: ~25
- 예상 레벨: 28-35
```

---

## 레벨업 보상 시스템

### 레벨업 시 선택지

매 레벨업마다 **3개 선택지** 중 1개 선택:

#### 선택지 타입

1. **새 무기 획득**
   - 부적, 도깨비불, 목탁 소리, 작두날 중 미보유 무기
   - 중복 선택 시 향후 업그레이드로 전환 (미구현)

2. **스탯 업그레이드** (등급별 증가폭)
   - **공격력**: Common(+2%), Rare(+5%), Epic(+10%) - 최대 500%
   - **이동 속도**: Common(+3%), Rare(+7%), Epic(+15%) - 최대 200%
   - **쿨타임 감소**: Common(-2%), Rare(-5%), Epic(-10%) - 최소 30%
   - **최대 체력**: Common(+5), Rare(+15), Epic(+30) - 최대 500
   - **획득 범위**: Common(+5%), Rare(+15%), Epic(+30%) - 최대 500%

### 스탯 상한선

무한 성장을 방지하기 위한 스탯 최대치:

| 스탯           | 최대치         | 설명               |
| -------------- | -------------- | ------------------ |
| 공격력 배율    | 500% (5배)     | 과도한 화력 방지   |
| 이동 속도 배율 | 200% (2배)     | 게임플레이 밸런스  |
| 쿨타임 배율    | 30% (70% 감소) | 최소 쿨타임 보장   |
| 최대 체력      | 500            | 생존력 한계        |
| 획득 범위 배율 | 500% (5배)     | 경험치 수집 밸런스 |

상한선 도달 시 해당 선택지 선택 불가 (경고 메시지 표시)

### 특별 레벨 보상

```typescript
// 10레벨마다 특별 보상
level 10: 무기 슬롯 +1
level 20: 무기 슬롯 +1
level 30: 모든 무기 레벨 +1
level 40: 전설 장비 획득
level 50: 사신의 축복 (4가지 중 선택)
```

---

## 구현 가이드

### 1. LevelSystem 클래스 구조

```typescript
// src/systems/LevelSystem.ts
export class LevelSystem {
  private level: number = 1;
  private currentXP: number = 0;
  private totalXP: number = 0;

  constructor() {
    this.level = 1;
    this.currentXP = 0;
    this.totalXP = 0;
  }

  // 경험치 획득
  public gainXP(amount: number): boolean {
    this.currentXP += amount;
    this.totalXP += amount;

    const requiredXP = getRequiredXP(this.level + 1);

    if (this.currentXP >= requiredXP) {
      this.levelUp();
      return true; // 레벨업 발생
    }

    return false;
  }

  // 레벨업 처리
  private levelUp(): void {
    const requiredXP = getRequiredXP(this.level + 1);
    this.currentXP -= requiredXP;
    this.level++;

    // 레벨업 이벤트 발생
    this.onLevelUp?.(this.level);
  }

  // 현재 레벨 진행도 (0-1)
  public getProgress(): number {
    const requiredXP = getRequiredXP(this.level + 1);
    return this.currentXP / requiredXP;
  }

  // 레벨업 콜백
  public onLevelUp?: (level: number) => void;
}
```

### 2. Player 클래스와 통합

```typescript
// src/game/entities/Player.ts
export class Player extends Container {
  private levelSystem: LevelSystem;

  constructor(x: number, y: number) {
    super();
    this.levelSystem = new LevelSystem();

    // 레벨업 시 선택 UI 표시
    this.levelSystem.onLevelUp = (level) => {
      this.showLevelUpChoices(level);
    };
  }

  public gainExperience(amount: number): void {
    const leveledUp = this.levelSystem.gainXP(amount);

    if (leveledUp) {
      // 레벨업 이펙트
      this.playLevelUpEffect();
    }
  }
}
```

### 3. 경험치 젬 구현

```typescript
// src/game/entities/ExperienceGem.ts
export class ExperienceGem extends Container {
  private value: number;
  private lifetime: number = 120; // 120초(2분)

  constructor(x: number, y: number, value: number) {
    super();
    this.x = x;
    this.y = y;
    this.value = value;

    // 비주얼 생성
    this.createVisual();
  }

  private createVisual(): void {
    const gem = new Graphics();
    // 경험치 양에 따라 크기/색상 변경
    const color = this.value >= 25 ? 0x00ff00 : 0x00aa00;
    const size = Math.min(10 + this.value / 5, 20);

    gem.beginFill(color);
    gem.drawCircle(0, 0, size);
    gem.endFill();

    this.addChild(gem);
  }

  public update(deltaTime: number, player: Player): void {
    // 수명 감소
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // 플레이어와의 거리 체크
    const distance = this.getDistanceTo(player);

    // 자동 획득 범위
    if (distance < XP_BALANCE.pickupRadius) {
      // 플레이어에게 빨려들어감
      this.moveToward(player, XP_BALANCE.gemSpeed * deltaTime);

      if (distance < 10) {
        player.gainExperience(this.value);
        this.destroy();
      }
    }
  }
}
```

### 4. UI 구현

```typescript
// src/game/ui/ExperienceBar.ts
export class ExperienceBar extends Container {
  private bar: Graphics;
  private text: Text;
  private levelSystem: LevelSystem;

  constructor(levelSystem: LevelSystem) {
    super();
    this.levelSystem = levelSystem;

    // 경험치 바 생성
    this.createBar();
    this.createText();
  }

  private createBar(): void {
    // 배경
    const bg = new Graphics();
    bg.beginFill(0x222222);
    bg.drawRect(0, 0, 400, 20);
    bg.endFill();

    // 진행 바
    this.bar = new Graphics();
    this.updateBar();

    this.addChild(bg);
    this.addChild(this.bar);
  }

  private updateBar(): void {
    const progress = this.levelSystem.getProgress();

    this.bar.clear();
    this.bar.beginFill(0xffff00);
    this.bar.drawRect(2, 2, 396 * progress, 16);
    this.bar.endFill();
  }

  private createText(): void {
    this.text = new Text('', {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
    });

    this.updateText();
    this.addChild(this.text);
  }

  private updateText(): void {
    const level = this.levelSystem.getLevel();
    const current = this.levelSystem.getCurrentXP();
    const required = getRequiredXP(level + 1);

    this.text.text = `Lv.${level} (${current}/${required})`;
    this.text.x = 10;
    this.text.y = 2;
  }

  public update(): void {
    this.updateBar();
    this.updateText();
  }
}
```

---

## 밸런스 조정

<!-- TODO: 난이도 시스템 구현 후 활성화 -->
<!--
### 난이도별 경험치 배율

```typescript
// TODO: 난이도 시스템 구현 시 추가
// config/balance.config.ts
// export const DIFFICULTY_MULTIPLIERS = {
//   easy: {
//     xpGain: 1.5,    // 150% 경험치
//     enemyXP: 1.0    // 기본 경험치 드랍
//   },
//   normal: {
//     xpGain: 1.0,    // 100% 경험치
//     enemyXP: 1.0
//   },
//   hard: {
//     xpGain: 0.8,    // 80% 경험치
//     enemyXP: 1.2    // 120% 경험치 드랍 (보상)
//   },
//   hell: {
//     xpGain: 0.7,    // 70% 경험치
//     enemyXP: 1.5    // 150% 경험치 드랍 (높은 보상)
//   }
// };
```
-->

<!-- TODO: 아이템 시스템 구현 후 활성화 -->
<!--
### 경험치 부스터 아이템

```typescript
// TODO: 아이템 시스템 구현 시 추가
// 임시 버프
// export const XP_BOOSTERS = {
//   small: 1.2,   // +20% 경험치 (30초)
//   medium: 1.5,  // +50% 경험치 (30초)
//   large: 2.0    // +100% 경험치 (30초)
// };

// 영구 업그레이드 (메타 진행)
// export const PERMANENT_XP_BONUS = {
//   level1: 1.05,  // +5% (혼 100개)
//   level2: 1.10,  // +10% (혼 300개)
//   level3: 1.15,  // +15% (혼 600개)
//   level4: 1.20,  // +20% (혼 1000개)
//   level5: 1.25   // +25% (혼 1500개)
// };
```
-->

### 밸런스 테스트 체크리스트

- [ ] 10분 플레이 시 25-30레벨 도달 확인
- [ ] 초반 1분 내 5레벨 이상 확인
- [ ] 레벨업 간격이 너무 길지 않은지 확인
- [ ] 경험치 젬 획득이 자연스러운지 확인
<!-- TODO: 난이도 시스템 구현 후 활성화
- [ ] 난이도별 레벨 진행 속도 차이 확인
      -->

---

## 구현 체크리스트

### 필수 구현

- [x] `LevelSystem` 클래스 구현 (`src/systems/LevelSystem.ts`)
- [x] 경험치 계산 함수 (`getRequiredXP`)
- [x] 경험치 젬 엔티티 (`ExperienceGem`) - `src/game/entities/ExperienceGem.ts`
- [x] 경험치 바 UI - GameScene에 통합 완료
- [x] 레벨 표시 UI - GameScene에 통합 완료
- [x] 레벨업 선택 UI (`LevelUpUI`) - **완료 (2025-10-17)**
- [x] 스탯 업그레이드 적용 로직 - **완료 (2025-10-17)**
- [x] 스탯 상한선 시스템 - **완료 (2025-10-17)**

### 추가 구현

- [ ] 레벨업 이펙트 (파티클, 사운드)
- [x] 경험치 자석 효과 (범위 내 자동 흡수) - 80픽셀 범위, 60픽셀 수집
- [x] 획득 범위 배율 적용 - Player의 pickupRangeMultiplier 반영
- [ ] 경험치 부스터 아이템
- [ ] 특별 레벨 보상 시스템
- [ ] 경험치 배율 시스템

### 통합 및 테스트

- [x] Player와 LevelSystem 통합 - `Player.ts`에 통합 완료
- [x] CombatSystem에서 경험치 드랍 처리 - `onEnemyKilled` 콜백 구현
- [x] GameScene에서 경험치 젬 관리 - 생성/업데이트/제거 로직 완료
- [x] 레벨업 UI 통합 - 선택 시 게임 일시정지/재개
- [x] 스탯 배율 시스템 적용 - 공격력/이동속도/쿨타임/획득범위
- [x] 빌드 테스트 - 성공

---

## 참고 문서

- [CORE_DESIGN.md](../CORE_DESIGN.md) - 전체 게임 디자인
- [balance.config.ts](../../src/config/balance.config.ts) - 밸런스 설정
- [DATA_LAYER.md](../implementation/DATA_LAYER.md) - 데이터 레이어 가이드

---

## 구현 현황 및 남은 작업

> 최종 업데이트: 2025-10-17

### ✅ 완료된 구현 (2025-10-17)

#### 1. 레벨 시스템 코어

- **파일**: `src/systems/LevelSystem.ts`
- **구현 내용**:
  - 경험치 계산 함수 (`getRequiredXP`)
  - 레벨업 처리 및 콜백
  - 레벨업 선택지 랜덤 생성 (Fisher-Yates 셔플)
  - 무기 4종 + 스탯 업그레이드 15종 (Common/Rare/Epic)
  - 게임 일시정지/재개 기능

#### 2. 경험치 젬 시스템

- **파일**: `src/game/entities/ExperienceGem.ts`
- **구현 내용**:
  - 가치별 색상/크기 (일반: 녹색 8px, 엘리트: 보라 12px, 보스: 금색 15px)
  - 육각형 비주얼 + 발광 효과
  - 120초 수명 (10초 미만 시 깜빡임)
  - 80픽셀 자석 범위 (점진적 가속, 최대 500px/s)
  - 60픽셀 수집 거리
  - 애니메이션 (회전, 펄스, 수집 효과)

#### 3. 플레이어 통합

- **파일**: `src/game/entities/Player.ts`
- **구현 내용**:
  - LevelSystem 인스턴스 보유
  - `gainExperience(amount)` 메서드
  - 레벨업 콜백 처리
  - 레벨 텍스트 UI (플레이어 위)

#### 4. 전투 시스템 통합

- **파일**: `src/systems/CombatSystem.ts`
- **구현 내용**:
  - `KillResult` 인터페이스 (enemy, position, xpValue)
  - `onEnemyKilled` 콜백
  - 적 티어별 경험치 자동 계산

#### 5. 게임 씬 통합

- **파일**: `src/game/scenes/GameScene.ts`
- **구현 내용**:
  - 경험치 젬 배열 관리
  - CombatSystem 콜백 연결 (적 처치 → 젬 생성)
  - 경험치 젬 업데이트 루프
  - 경험치 바 UI (300x15px, 녹색)
  - 레벨 텍스트 UI (노란색)

#### 6. 밸런스 설정

- **파일**: `src/config/balance.config.ts`
- **설정값**:
  - 젬 수명: 120초
  - 자석 범위: 80픽셀 (pickupRadius)
  - 젬 최대 속도: 500픽셀/초 (gemSpeed)
  - 수집 거리: 60픽셀 (하드코딩)
  - 적 경험치: normal(5), elite(25), boss(100)

#### 7. 레벨업 UI

- **파일**: `src/game/ui/LevelUpUI.ts`
- **구현 내용**:
  - 반투명 오버레이 (배경 클릭 방지)
  - 3개 카드 레이아웃 (가로 배치)
  - 등급별 색상 (common: 회색, rare: 파란색, epic: 보라색)
  - 터치/마우스 클릭 지원
  - 호버 효과 (밝기 증가)
  - 선택 시 자동 숨김 및 게임 재개
  - 화면 크기 변경 대응 (resize)

#### 8. 스탯 배율 시스템

- **파일**: `src/game/entities/Player.ts`
- **구현 내용**:
  - 5가지 스탯 배율 추가 (damage, speed, cooldown, pickup)
  - `applyStatUpgrade(statId)` 메서드
  - 등급별 증가량 자동 계산
  - 스탯 상한선 체크 및 경고
  - 체력 회복 효과 (체력 증가 시)
  - 이모지 로그 출력 (⚔️🏃⚡❤️🧲)

#### 9. 스탯 상한선 시스템

- **파일**: `src/game/entities/Player.ts`
- **상한선**:
  - 공격력: 최대 500% (5배)
  - 이동 속도: 최대 200% (2배)
  - 쿨타임: 최소 30% (70% 감소)
  - 최대 체력: 500
  - 획득 범위: 최대 500% (5배)
- **구현**: 상한선 도달 시 선택 불가 및 경고 메시지

#### 10. 스탯 적용 시스템

- **파일**: `src/game/scenes/GameScene.ts`
- **구현 내용**:
  - 무기 발사 시 공격력 배율 적용
  - 무기 쿨다운에 쿨타임 배율 적용
  - 획득 범위 배율을 경험치 젬에 전달
  - 이동 속도 배율을 Player 이동에 적용
  - 무기 추가 로직 (`addWeapon`)

#### 11. i18n 통합

- **파일**: `src/i18n/locales/ko.json`
- **구현 내용**:
  - 레벨업 메시지 번역
  - 4종 무기 이름/설명
  - 15종 스탯 업그레이드 (Common/Rare/Epic)
  - 선택 로그 메시지

---

### 🚧 남은 작업

#### 우선순위 1: 무기 업그레이드 시스템 (3-4시간 예상)

**목표**: 중복 무기 선택 시 레벨업 처리

**작업 항목**:

1. 무기별 레벨 시스템 추가 (최대 레벨 5)
2. 레벨업 시 능력치 증가 (데미지, 쿨타임, 특수 효과)
3. 무기 보유 체크 및 업그레이드 선택지 생성
4. 최대 레벨 시 진화 시스템 (특별 효과)

---

#### 우선순위 2: 추가 무기 구현 (각 1-2시간)

**목표**: 레벨업 시 선택지를 표시하는 UI 구현

**작업 항목**:

1. **LevelUpUI 컴포넌트 생성** (`src/game/ui/LevelUpUI.ts`)
   - 반투명 오버레이 (화면 중앙)
   - 3개 선택지 카드 (가로 배치)
   - 카드 구성: 아이콘, 이름, 설명, 등급 표시
   - 마우스 클릭 지원
   - 선택 시 애니메이션

2. **GameScene 통합**
   - Player의 `onLevelUp` 콜백에서 UI 표시
   - 게임 일시정지 구현 (`isPaused` 플래그)
   - 선택 시 UI 숨기기 및 게임 재개

3. **시각적 요소**
   - 등급별 색상 (Common: 회색, Rare: 파란색, Epic: 보라색)
   - 호버 효과 (확대, 발광)
   - 선택 애니메이션

**참고 구조**:

```typescript
// src/game/ui/LevelUpUI.ts
export class LevelUpUI extends Container {
  private overlay: Graphics;
  private cards: Container[] = [];
  private onChoice?: (choiceId: string) => void;

  public show(choices: LevelUpChoice[]): void {
    // 3개 카드 생성 및 표시
  }

  public hide(): void {
    // UI 숨기기
  }
}
```

---

#### 우선순위 2: 선택 적용 로직 (2-3시간 예상)

**목표**: 레벨업 선택 시 실제 효과 적용

**작업 항목**:

1. **무기 추가 로직**
   - GameScene에 `addWeapon(weaponId)` 메서드
   - 무기 ID 파싱 및 해당 무기 생성
   - `weapons` 배열에 추가
   - 중복 무기 체크 (향후 업그레이드로 전환)

2. **스탯 업그레이드 로직**
   - Player에 스탯 배율 시스템 추가

   ```typescript
   private statMultipliers = {
     damage: 1.0,      // 공격력
     attackSpeed: 1.0, // 공격 속도
     moveSpeed: 1.0,   // 이동 속도
     cooldown: 1.0,    // 쿨타임
     pickupRange: 1.0, // 획득 범위
   };
   ```

   - `applyStatUpgrade(statId)` 메서드 구현
   - 백분율/절대값 증가 처리

3. **LevelSystem 선택 처리**
   - `selectChoice(choiceId)` 메서드 완성
   - 선택지 ID에 따라 적절한 효과 적용
   - 콜백으로 GameScene에 전달

**참고 코드**:

```typescript
// GameScene.ts
private handleLevelUpChoice(choiceId: string): void {
  if (choiceId.startsWith('weapon_')) {
    this.addWeapon(choiceId);
  } else if (choiceId.startsWith('stat_')) {
    this.player.applyStatUpgrade(choiceId);
  }

  this.levelUpUI.hide();
  this.resumeGame();
}
```

---

#### 우선순위 3: 추가 무기 구현 (각 1-2시간)

**목표**: 부적 외 3가지 무기 구현

1. **도깨비불** (`DokkaebiFireWeapon.ts`)
   - 타입: 궤도형 (Orbital)
   - 플레이어 주변 회전
   - 접촉 시 화상 피해

2. **목탁 소리** (`MoktakWeapon.ts`)
   - 타입: 광역 (AoE)
   - 쿨타임 기반 발동
   - 주변 모든 적에게 피해

3. **작두날** (`JakduWeapon.ts`)
   - 타입: 근접 (Melee)
   - 플레이어 주변 회전 베기
   - 강력한 단일 피해

**참고**: `Talisman.ts` 구조를 참고하여 구현

---

#### 우선순위 4: 무기 업그레이드 시스템 (3-4시간)

**작업 항목**:

- 무기별 레벨 시스템 (최대 레벨 5)
- 레벨업 시 능력치 증가
- 보유 무기 → 업그레이드 선택지로 전환
- 무기 진화 시스템 (최대 레벨 시 특수 효과)

---

#### 우선순위 5: 추가 개선 사항

1. **레벨업 이펙트**
   - 파티클 효과
   - 사운드 효과
   - 화면 플래시

2. **경험치 수집 이펙트**
   - 수집 시 파티클
   - 사운드 효과
   - 경험치 텍스트 팝업

3. **UI 개선**
   - 경험치 바 애니메이션
   - 레벨업 알림
   - 누적 경험치 표시

4. **밸런스 조정 도구**
   - 디버그 UI (레벨 강제 증가)
   - 경험치 배율 테스트
   - DPS 계산기

---

### 📊 진행률

- **레벨 시스템 코어**: ✅ 100%
- **경험치 젬 시스템**: ✅ 100%
- **UI 기본 구현**: ✅ 100%
- **레벨업 선택 UI**: ❌ 0%
- **선택 적용 로직**: ❌ 0%
- **추가 무기**: ❌ 0%
- **무기 업그레이드**: ❌ 0%

**전체 진행률: 약 60%**

---

**문서 버전**: 1.1
**작성일**: 2025-01-16
**최종 업데이트**: 2025-10-16
**작성자**: Claude Code
**상태**: 구현 진행 중 (60%)
