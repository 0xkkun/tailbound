# Analytics 이벤트 정의서

> 설화(Talebound) 게임의 앱인토스 Analytics 이벤트 명세

**버전**: 3.0
**작성일**: 2025-11-09
**최종 수정**: 2025-11-10
**상태**: ✅ Phase 1-3 완료

## 변경 이력

### v3.0 (2025-11-10)
- ✅ Phase 2 (Critical) 모든 이벤트 구현 완료
  - Victory 이벤트 추가
  - 세션 ID 시스템 구현
  - 게임 오버 액션 추적 추가
  - 공통 파라미터 시스템 구축
- ✅ Phase 3 (High Priority) 모든 이벤트 구현 완료
  - 플레이어 사망 원인 추적 (DeathCause 타입 정의)
  - 최종 빌드 스냅샷 추적
  - 설정 모달 접근성 추적
- 🔧 코드 품질 개선
  - localStorage 에러 핸들링 추가
  - DeathCause 공유 타입 추출 (game.types.ts)
  - TypeScript 타입 안정성 강화
- 📝 총 13개 이벤트 구현 완료

### v2.0 (2025-11-09)
- 📋 Phase 2-3 구현 계획 수립
- 🎯 승률, 재참여율, 사망 원인 분석 등 핵심 지표 정의

### v1.0 (초기 버전)
- ✅ Phase 1 기본 이벤트 7개 구현

---

## 목차

1. [개요](#개요)
2. [현재 구현 상태](#현재-구현-상태)
3. [Phase 1: 구현 완료 이벤트](#phase-1-구현-완료-이벤트)
4. [Phase 2: Critical 이벤트 (출시 전 필수)](#phase-2-critical-이벤트-출시-전-필수)
5. [Phase 3: High Priority 이벤트 (출시 후 1주일)](#phase-3-high-priority-이벤트-출시-후-1주일)
6. [Phase 4: Medium Priority 이벤트 (선택)](#phase-4-medium-priority-이벤트-선택)
7. [구현 위치](#구현-위치)
8. [테스트 방법](#테스트-방법)
9. [데이터 아키텍처](#데이터-아키텍처)

---

## 개요

이 문서는 설화 게임에서 수집하는 모든 Analytics 이벤트를 정의합니다.

### 게임 승리 조건

**중요**: 현재 게임의 승리 조건은 **보스 처치**입니다.
- 보스(백호) 처치 시 = 승리 (`victory`)
- 플레이어 사망 시 = 패배 (`defeat`)

### 이벤트 수집 목적

- **사용자 행동 분석**: 플레이어가 게임을 어떻게 플레이하는지 파악
- **이탈 지점 파악**: 어디서 사용자가 게임을 그만두는지 확인
- **밸런스 조정**: 인기 있는 무기/파워업 데이터 수집
- **UI/UX 개선**: 사용자가 자주 변경하는 설정 파악
- **승률 분석**: 게임 난이도 적절성 검증

### 기술 스택

- **SDK**: `@apps-in-toss/web-framework` v1.4.2
- **래퍼**: `safeAnalyticsClick()`, `safeAnalyticsImpression()` (from `@utils/tossAppBridge`)
- **서비스**: `GameAnalytics` (from `@services/gameAnalytics`)

---

## 현재 구현 상태

### Phase 1: ✅ 완료 (7개 이벤트)

| 우선순위 | 이벤트 | 상태 | 비고 |
|---------|--------|------|------|
| ✅ | 게임 시작 | 완료 | - |
| ✅ | 게임 종료 (victory/defeat) | 완료 | ✅ 모두 구현 |
| ✅ | 레벨업 선택 | 완료 | - |
| ✅ | 보스 등장 | 완료 | - |
| ✅ | 보스 처치 | 완료 | - |
| ✅ | 설정 변경 (BGM/SFX/진동) | 완료 | - |
| ✅ | 화면 노출 (로비) | 완료 | - |

**총 구현**: 13개 이벤트 (Phase 1-3 포함)
**데이터 품질**: ⭐⭐⭐⭐⭐ (5/5)

### Phase 2: ✅ Critical 완료 (출시 전 필수)

| 우선순위 | 이벤트 | 상태 | 구현 위치 |
|---------|--------|------|----------|
| ✅ | Victory 이벤트 | 완료 | OverworldGameScene.ts:2001 |
| ✅ | 세션 ID 시스템 | 완료 | gameAnalytics.ts:22-86 |
| ✅ | 게임 오버 액션 | 완료 | OverworldGameScene.ts:1665-1691 |

### Phase 3: ✅ High Priority 완료

| 우선순위 | 이벤트 | 상태 | 구현 위치 |
|---------|--------|------|----------|
| ✅ | 플레이어 사망 원인 | 완료 | OverworldGameScene.ts:1570 |
| ✅ | 최종 빌드 스냅샷 | 완료 | OverworldGameScene.ts:1576 |
| ✅ | 설정 모달 오픈 | 완료 | LobbyScene.ts:300, OverworldGameScene.ts:1791 |

---

## Phase 1: 구현 완료 이벤트

### 1. 게임 시작 (`game_start`) ✅

**타입**: Click
**설명**: 플레이어가 로비에서 "게임 시작" 버튼을 클릭했을 때

**트리거**: 로비 화면 → "게임 시작" 버튼 클릭

**파라미터**:
```typescript
{
  button_name: 'game_start',
  screen: 'lobby'
}
```

**구현 위치**: `src/game/scenes/LobbyScene.ts:173`

**사용 목적**:
- 게임 세션 시작 추적
- 플레이 빈도 측정 (DAU, MAU)
- 세션 시작 시간 기록 (세션 길이 계산용)

**분석 가능 지표**:
- 일간 게임 시작 횟수 (DAU)
- 시간대별 게임 시작 분포
- 평균 재방문 주기

---

### 2. 게임 종료 (`game_session_end`) ✅

**타입**: Click
**설명**: 게임이 종료되었을 때 (승리 또는 패배)

**트리거**:
- **패배**: 플레이어 체력 0 → 게임 오버 화면 표시
- **승리**: 보스 처치 → 승리 화면 표시

**파라미터**:
```typescript
{
  button_name: 'game_session_end',
  screen: 'game_over',
  result: 'victory' | 'defeat',       // 게임 결과
  duration: number,                    // 세션 시작부터 종료까지 시간 (초)
  survived_seconds: number,            // 게임 내 생존 시간 (초)
  level: number,                       // 플레이어 최종 레벨
  kills: number,                       // 총 처치한 적 수
  score: number                        // 최종 점수 (kills * 100)
}
```

**현재 구현 위치**:
- Defeat: `src/game/scenes/game/OverworldGameScene.ts:1563`
- Victory: ⚠️ **미구현** (Critical 이슈)

**사용 목적**:
- **승률 계산** (가장 중요!)
- 평균 생존 시간 측정
- 게임 난이도 분석
- 플레이어 성과 측정

**분석 가능 지표**:
```sql
-- 승률 계산 (목표: 5-15%)
SELECT
  result,
  COUNT(*) as sessions,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as win_rate,
  AVG(score) as avg_score,
  AVG(level) as avg_level
FROM game_sessions
GROUP BY result;
```

**⚠️ Critical 이슈**:
- 현재 `defeat`만 구현됨
- `victory` 케이스 미구현 → 승률 측정 불가
- **해결 필요**: [Phase 2 #1](#1-victory-이벤트-추가-🔴) 참조

---

### 3. 레벨업 선택 (`level_up_choice`) ✅

**타입**: Click
**설명**: 플레이어가 레벨업 UI에서 무기 또는 파워업을 선택했을 때

**트리거**: 레벨업 → 선택지 카드 클릭

**파라미터**:
```typescript
{
  button_name: 'level_up_choice',
  screen: 'level_up_modal',
  choice_type: 'weapon' | 'powerup',   // 선택 타입
  choice_id: string,                   // 선택한 아이템 ID (예: 'weapon_talisman', 'powerup_speed')
  player_level: number                 // 현재 플레이어 레벨
}
```

**구현 위치**: `src/game/ui/LevelUpUI.ts:310`

**사용 목적**:
- 인기 무기/파워업 통계
- 메타 분석 (어떤 조합이 강한지)
- 밸런스 조정 데이터
- 레벨별 선택 패턴 분석

**분석 가능 지표**:
```sql
-- 무기별 선택률
SELECT
  choice_id,
  COUNT(*) as picks,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as pick_rate
FROM level_up_choices
WHERE choice_type = 'weapon'
GROUP BY choice_id
ORDER BY picks DESC;
```

---

### 4. 보스 처치 (`boss_defeated`) ✅

**타입**: Click
**설명**: 플레이어가 보스를 처치했을 때 (**= 게임 승리**)

**트리거**: 보스 체력 0 → 보스 사망 처리 → 승리

**파라미터**:
```typescript
{
  button_name: 'boss_defeated',
  screen: 'game',
  boss_name: string,                   // 보스 이름 (예: 'white_tiger')
  player_level: number,                // 처치 시 플레이어 레벨
  time_to_defeat: number               // 보스 스폰부터 처치까지 시간 (초)
}
```

**구현 위치**: `src/systems/BossSystem.ts:538`

**사용 목적**:
- 보스 난이도 분석
- 보스 처치율 = 승률
- 평균 처치 시간 측정
- 보스 밸런스 조정

**분석 가능 지표**:
```sql
-- 보스 처치율 (= 승률)
SELECT
  COUNT(DISTINCT session_id) as total_players_reached_boss,
  COUNT(CASE WHEN boss_defeated THEN 1 END) as defeats,
  COUNT(CASE WHEN boss_defeated THEN 1 END) * 100.0 / COUNT(DISTINCT session_id) as defeat_rate
FROM boss_encounters;

-- 평균 처치 시간
SELECT
  AVG(time_to_defeat) as avg_time,
  MIN(time_to_defeat) as fastest,
  MAX(time_to_defeat) as slowest
FROM boss_defeats;
```

---

### 5. 설정 변경 (`settings_change`) ✅

**타입**: Click
**설명**: 플레이어가 게임 설정을 변경했을 때

**트리거**: 설정 모달 → BGM/SFX/진동 토글 클릭

**파라미터**:
```typescript
{
  button_name: 'settings_change',
  screen: 'settings',
  setting_name: 'bgm_volume' | 'sfx_volume' | 'vibration',
  value: number | boolean              // BGM/SFX: 0 (끄기) | 1 (켜기), 진동: true | false
}
```

**구현 위치**:
- BGM: `src/game/ui/SettingsModal.ts:79`
- SFX: `src/game/ui/SettingsModal.ts:105`
- 진동: `src/game/ui/SettingsModal.ts:137`

**사용 목적**:
- 사용자 선호도 파악
- 기본 설정 최적화
- 접근성 개선

**분석 가능 지표**:
- BGM 끄기 비율 (목표: <30%)
- SFX 끄기 비율 (목표: <20%)
- 진동 사용 비율

---

### 6. 화면 노출 (`screen_view`) ✅

**타입**: Impression
**설명**: 주요 화면이 사용자에게 표시되었을 때

**트리거**: 화면 렌더링 완료

**파라미터**:
```typescript
{
  item_id: string,                     // 'screen_{화면명}' 형식 (예: 'screen_lobby')
  screen: string                       // 화면 이름 (예: 'lobby')
}
```

**구현 위치**:
- 로비: `src/game/scenes/LobbyScene.ts:57`

**사용 목적**:
- 화면별 진입률 측정
- 사용자 플로우 분석
- 이탈 지점 파악

**현재 추적 중인 화면**:
- ✅ `lobby` - 로비 화면

---

### 7. 보스 등장 (`boss_appear`) ✅

**타입**: Impression
**설명**: 보스가 게임 화면에 스폰되었을 때

**트리거**: 보스 생성 완료 (10분 경과 시)

**파라미터**:
```typescript
{
  item_id: string,                     // 'boss_{보스명}' 형식 (예: 'boss_white_tiger')
  screen: 'game',
  boss_name: string,                   // 보스 이름 (예: 'white_tiger')
  player_level: number                 // 보스 등장 시 플레이어 레벨
}
```

**구현 위치**: `src/systems/BossSystem.ts:153`

**사용 목적**:
- 보스 도달률 측정 (게임 진행도)
- 보스 등장 시 평균 레벨 분석
- 난이도 곡선 검증

**분석 가능 지표**:
```sql
-- 보스 도달률
SELECT
  COUNT(DISTINCT session_id_with_boss_appear) * 100.0 / COUNT(DISTINCT session_id_total) as boss_reach_rate
FROM sessions;

-- 평균: 40-50% 도달이 적정
```

---

## Phase 2: Critical 이벤트 (출시 전 필수)

### 1. Victory 이벤트 추가 🔴

**현재 문제**:
- `game_session_end` 이벤트가 `defeat`만 추적
- 보스 처치 후 `victory` 이벤트 미발생
- **승률 측정 불가** → 게임 난이도 평가 불가

**해결 방법**:

```typescript
// src/systems/BossSystem.ts - handleBossDefeat() 메서드에 추가

private handleBossDefeat(): void {
  // ... 기존 보스 처치 로직 ...

  // Analytics: 보스 처치 추적 (기존)
  GameAnalytics.trackBossDefeated('white_tiger', this.player.getLevel(), timeToDefeat);

  // 🔴 추가 필요: 승리 이벤트
  // 보스 처치 = 게임 승리
  GameAnalytics.trackGameEnd('victory', {
    survived_seconds: Math.floor(this.gameTime),
    level: this.player.getLevel(),
    kills: this.enemiesKilled,
    score: this.enemiesKilled * 100,
  });
}
```

**예상 효과**:
- 승률 측정 가능
- 난이도 밸런싱 근거 확보
- 목표 승률: 5-15% (로그라이크 장르 평균)

---

### 2. 세션 ID 시스템 🔴

**현재 문제**:
- 같은 사용자의 1회차, 2회차, 3회차 플레이 구분 불가
- "플레이 횟수에 따른 성과 향상" 분석 불가
- 이벤트 순서 보장 불가

**해결 방법**:

```typescript
// src/services/gameAnalytics.ts

export class GameAnalytics {
  private static sessionId: string | null = null;
  private static sessionCounter: number = 0;
  private static eventSequence: number = 0;

  static initialize(): void {
    // 세션 ID 생성
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 누적 플레이 횟수 (localStorage)
    this.sessionCounter = parseInt(localStorage.getItem('session_count') || '0') + 1;
    localStorage.setItem('session_count', this.sessionCounter.toString());

    console.log(`[GameAnalytics] Session ${this.sessionCounter} started: ${this.sessionId}`);

    safeAnalyticsImpression({
      item_id: 'app_launch',
      screen: 'loading',
      session_id: this.sessionId,
      session_number: this.sessionCounter,
      timestamp: Date.now(),
    });

    this.isInitialized = true;
  }

  // 모든 이벤트에 추가할 공통 파라미터
  private static getCommonParams() {
    return {
      session_id: this.sessionId,
      session_number: this.sessionCounter,
      event_sequence: ++this.eventSequence,
      timestamp: Date.now(),
    };
  }

  // 기존 메서드들에 getCommonParams() 추가
  static trackGameStart() {
    this.sessionStartTime = Date.now();
    safeAnalyticsClick({
      button_name: 'game_start',
      screen: 'lobby',
      ...this.getCommonParams(),  // 🔴 추가
    });
  }

  // 다른 모든 메서드도 동일하게 수정...
}
```

**예상 효과**:
```sql
-- 플레이 횟수별 성과 분석
SELECT
  session_number,
  COUNT(DISTINCT session_id) as players,
  AVG(level) as avg_level,
  AVG(score) as avg_score,
  AVG(survived_seconds) as avg_survival
FROM game_sessions
GROUP BY session_number
ORDER BY session_number;

-- 기대 결과: 학습 곡선 확인
-- session_1: level 3, score 150
-- session_2: level 5, score 300
-- session_3: level 7, score 450
```

---

### 3. 게임 오버 후 액션 추적 🔴

**현재 문제**:
- "다시하기" vs "로비로" 선택률 알 수 없음
- 재참여 의도 측정 불가
- 이탈률 정확한 측정 불가

**해결 방법**:

```typescript
// src/services/gameAnalytics.ts - 새 메서드 추가

/**
 * 게임 오버 화면 액션 추적
 */
static trackGameOverAction(
  action: 'restart' | 'lobby',
  previousStats: {
    result: 'victory' | 'defeat';
    level: number;
    score: number;
  }
): void {
  safeAnalyticsClick({
    button_name: 'game_over_action',
    screen: 'game_over',
    action,
    previous_result: previousStats.result,
    previous_level: previousStats.level,
    previous_score: previousStats.score,
    ...this.getCommonParams(),
  });
}
```

```typescript
// src/game/scenes/game/OverworldGameScene.ts - handleGameOver() 수정

private handleGameOver(): void {
  // ... 기존 게임 오버 UI 생성 ...

  // 로비로 돌아가기 버튼
  this.createMenuButtonWithIcon(
    gameOverContainer,
    i18n.t('gameOver.returnToLobby'),
    `${CDN_BASE_URL}/assets/gui/back.png`,
    centerX,
    centerY + 40,
    buttonWidth,
    buttonHeight,
    () => {
      // 🔴 추가: Analytics 추적
      GameAnalytics.trackGameOverAction('lobby', {
        result: 'defeat',
        level: this.player.getLevel(),
        score: this.enemiesKilled * 100,
      });

      this.onReturnToLobby?.();
    }
  );

  // 게임 다시하기 버튼
  this.createMenuButtonWithIcon(
    gameOverContainer,
    i18n.t('gameOver.restart'),
    `${CDN_BASE_URL}/assets/gui/restart.png`,
    centerX,
    centerY + 40 + buttonGap,
    buttonWidth,
    buttonHeight,
    () => {
      // 🔴 추가: Analytics 추적
      GameAnalytics.trackGameOverAction('restart', {
        result: 'defeat',
        level: this.player.getLevel(),
        score: this.enemiesKilled * 100,
      });

      this.onRestartGame?.();
    }
  );
}
```

**예상 효과**:
```sql
-- 재참여율 (Retry Rate)
SELECT
  action,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM game_over_actions
GROUP BY action;

-- 목표:
-- restart: 60-70% (재참여 의도 높음)
-- lobby: 30-40% (이탈)
```

---

## Phase 3: High Priority 이벤트 (출시 후 1주일)

### 1. 플레이어 사망 원인 추적 🟠

**가치**: 어떤 적이 가장 위협적인지 분석, 난이도 조정 우선순위 결정

```typescript
// src/services/gameAnalytics.ts

static trackPlayerDeath(deathInfo: {
  killerType: 'enemy' | 'boss' | 'projectile';
  killerName: string;
  playerLevel: number;
  gameTime: number;
}): void {
  safeAnalyticsClick({
    button_name: 'player_death',
    screen: 'game',
    killer_type: deathInfo.killerType,
    killer_name: deathInfo.killerName,
    player_level: deathInfo.playerLevel,
    game_time: deathInfo.gameTime,
    ...this.getCommonParams(),
  });
}
```

**분석 예시**:
```sql
-- 적별 치명도 순위
SELECT
  killer_name,
  COUNT(*) as deaths,
  AVG(player_level) as avg_level_at_death,
  AVG(game_time) as avg_survival_time
FROM player_deaths
GROUP BY killer_name
ORDER BY deaths DESC
LIMIT 10;
```

---

### 2. 최종 빌드 스냅샷 🟠

**가치**: 어떤 무기 조합이 강한지 메타 분석, 승리 빌드 패턴 발견

```typescript
// src/services/gameAnalytics.ts

static trackFinalBuild(build: {
  weapons: Array<{ id: string; level: number }>;
  powerups: Record<string, number>;
  stats: {
    maxHealth: number;
    damage: number;
    speed: number;
    attackSpeed: number;
  };
}): void {
  const weaponString = build.weapons
    .map(w => `${w.id}_lv${w.level}`)
    .join(',');

  safeAnalyticsClick({
    button_name: 'final_build',
    screen: 'game_over',
    weapons: weaponString,
    weapon_count: build.weapons.length,
    powerup_count: Object.keys(build.powerups).length,
    final_max_health: build.stats.maxHealth,
    final_damage: build.stats.damage,
    ...this.getCommonParams(),
  });
}
```

**분석 예시**:
```sql
-- 승리한 플레이어들의 인기 무기 조합
SELECT
  weapons,
  COUNT(*) as wins,
  AVG(score) as avg_score
FROM game_sessions
WHERE result = 'victory'
GROUP BY weapons
ORDER BY wins DESC
LIMIT 10;
```

---

### 3. 설정 모달 오픈 추적 🟠

**가치**: UI 발견율 측정, 사용자 경험 개선

```typescript
// src/services/gameAnalytics.ts

static trackSettingsOpen(source: 'lobby' | 'game'): void {
  safeAnalyticsClick({
    button_name: 'settings_open',
    screen: source,
    ...this.getCommonParams(),
  });
}
```

---

## Phase 4: Medium Priority 이벤트 (선택)

### 1. 레벨업 의사결정 시간 🟡

**가치**: UI 직관성 측정, 선택 난이도 분석

```typescript
static trackLevelUpInteraction(metrics: {
  timeToDecide: number;  // 밀리초
  optionsShown: number;
  choiceType: 'weapon' | 'powerup';
  choiceId: string;
}): void {
  safeAnalyticsClick({
    button_name: 'levelup_interaction',
    screen: 'level_up_modal',
    decision_time_ms: metrics.timeToDecide,
    options_count: metrics.optionsShown,
    ...this.getCommonParams(),
  });
}
```

**목표**:
- 평균 결정 시간 < 5초 (직관적)
- 평균 결정 시간 > 30초 (선택이 어려움)

---

### 2. 마일스톤 추적 🟡

**가치**: 진행도별 이탈률 측정, 난이도 곡선 검증

```typescript
static trackMilestone(milestone: {
  type: 'level' | 'time' | 'score';
  value: number;
  playerLevel: number;
  gameTime: number;
}): void {
  // 샘플링: 5레벨마다, 3분마다, 1000점마다
  const shouldTrack =
    (milestone.type === 'level' && milestone.value % 5 === 0) ||
    (milestone.type === 'time' && milestone.value % 180 === 0) ||
    (milestone.type === 'score' && milestone.value % 1000 === 0);

  if (!shouldTrack) return;

  safeAnalyticsClick({
    button_name: 'milestone_reached',
    screen: 'game',
    milestone_type: milestone.type,
    milestone_value: milestone.value,
    ...this.getCommonParams(),
  });
}
```

---

## 구현 위치

### 서비스 파일

| 파일 | 역할 | 라인 |
|------|------|------|
| `src/services/gameAnalytics.ts` | Analytics 서비스 메인 클래스 | 전체 |
| `src/utils/tossAppBridge.ts` | 안전한 Analytics 래퍼 함수 | 65-99 |

### 게임 씬

| 파일 | 추적 이벤트 | 라인 |
|------|------------|------|
| `src/main.tsx` | GameAnalytics 초기화 | 9 |
| `src/game/scenes/LobbyScene.ts` | 게임 시작, 로비 화면 노출 | 57, 173 |
| `src/game/scenes/game/OverworldGameScene.ts` | 게임 종료 (defeat), 🔴 victory 필요 | 1563 |

### UI 컴포넌트

| 파일 | 추적 이벤트 | 라인 |
|------|------------|------|
| `src/game/ui/LevelUpUI.ts` | 레벨업 선택 | 310 |
| `src/game/ui/SettingsModal.ts` | 설정 변경 (BGM/SFX/진동) | 79, 105, 137 |

### 게임 시스템

| 파일 | 추적 이벤트 | 라인 |
|------|------------|------|
| `src/systems/BossSystem.ts` | 보스 등장, 보스 처치 | 153, 538 |

---

## 테스트 방법

### 1. 개발 환경에서 테스트

개발 환경에서는 Analytics 이벤트가 **콘솔 로그**로 출력됩니다.

```bash
# 개발 서버 실행
npm run dev

# 브라우저 콘솔 확인
# 예: [Analytics] Click: { button_name: 'game_start', screen: 'lobby' }
```

### 2. 이벤트 발생 시나리오

#### 시나리오 1: 승리 플레이

1. **로비 진입**
   - ✅ `screen_view` (lobby)

2. **게임 시작 버튼 클릭**
   - ✅ `game_start`

3. **레벨업 (여러 번)**
   - ✅ `level_up_choice` (무기/파워업 선택마다)

4. **보스 등장 (10분 경과)**
   - ✅ `boss_appear` (white_tiger)

5. **보스 처치 (승리!)**
   - ✅ `boss_defeated`
   - 🔴 `game_session_end` (victory) ← **구현 필요**

6. **승리 화면에서 액션**
   - 🔴 `game_over_action` (restart/lobby) ← **구현 필요**

#### 시나리오 2: 패배 플레이

1-4. (승리와 동일)

5. **플레이어 사망**
   - 🟠 `player_death` (killer_name) ← **계획**
   - ✅ `game_session_end` (defeat)

6. **게임 오버 화면에서 액션**
   - 🔴 `game_over_action` (restart/lobby) ← **구현 필요**

#### 시나리오 3: 설정 변경

1. **설정 모달 열기**
   - 🟠 `settings_open` (lobby/game) ← **계획**

2. **BGM 끄기**
   - ✅ `settings_change` (bgm_volume: 0)

3. **SFX 끄기**
   - ✅ `settings_change` (sfx_volume: 0)

4. **진동 끄기**
   - ✅ `settings_change` (vibration: false)

### 3. 프로덕션 환경에서 확인

앱인토스에 출시 후 **1일 뒤**부터 [앱인토스 콘솔](https://developers-apps-in-toss.toss.im/)에서 실제 데이터를 확인할 수 있습니다.

---

## 데이터 아키텍처

### 이벤트 명명 규칙

#### 클릭 이벤트 (`button_name`)

- **동사_명사** 형식 사용
- 예: `game_start`, `boss_defeated`, `level_up_choice`

#### 노출 이벤트 (`item_id`)

- **타입_이름** 형식 사용
- 예: `screen_lobby`, `boss_white_tiger`

#### 화면 이름 (`screen`)

- 소문자, 언더스코어 사용
- 예: `lobby`, `game`, `game_over`, `settings`, `level_up_modal`

#### 파라미터 이름

- 소문자, 언더스코어 사용
- 명확한 의미 전달
- 예: `player_level`, `boss_name`, `time_to_defeat`

### 공통 파라미터 (Phase 2 구현 예정)

모든 이벤트에 포함될 공통 파라미터:

```typescript
{
  session_id: string,        // 고유 세션 ID
  session_number: number,    // 누적 플레이 횟수 (1, 2, 3, ...)
  event_sequence: number,    // 세션 내 이벤트 순서 (1, 2, 3, ...)
  timestamp: number          // 이벤트 발생 시간 (Unix timestamp)
}
```

### 데이터 크기 추정

#### 플레이어 1명당 (15분 플레이 기준)

| 이벤트 타입 | 발생 횟수 | 데이터 크기 |
|------------|----------|-----------|
| 게임 시작 | 1 | 0.5 KB |
| 레벨업 선택 | ~10 | 5 KB |
| 보스 등장 | 1 | 0.5 KB |
| 보스 처치 | 0-1 | 0.5 KB |
| 게임 종료 | 1 | 1 KB |
| 최종 빌드 (Phase 3) | 1 | 2 KB |
| 게임 오버 액션 (Phase 2) | 1 | 0.5 KB |
| 설정 변경 | 0-3 | 1.5 KB |
| **합계** | ~15-20 | **~12 KB** |

#### DAU 1,000명 기준

- 일일 데이터: 12 KB × 1,000 = **12 MB**
- 월간 데이터: 12 MB × 30 = **360 MB**
- 연간 데이터: 360 MB × 12 = **~4.3 GB**

**결론**: 데이터 크기는 문제 없음. 앱인토스 Analytics로 충분히 처리 가능.

---

## 데이터 개인정보 보호

### ✅ 수집하는 데이터

- 게임 플레이 통계 (레벨, 점수, 생존 시간)
- 선택한 무기/파워업 ID
- 설정 선호도 (ON/OFF 상태)
- 화면 진입 기록
- 세션 ID (임의 생성, 개인 식별 불가)
- 플레이 횟수 (누적 카운트, 개인 식별 불가)

### ❌ 수집하지 않는 데이터

- 사용자 개인정보 (이름, 이메일, 전화번호)
- 기기 고유 식별자 (IMEI, MAC 주소 등)
- 위치 정보 (GPS, IP 주소 등)
- 민감한 개인정보

---

## 구현 로드맵

### ✅ Phase 1-3 완료 (2025-11-10 기준)

**Phase 1 (기본 이벤트)**:
- [x] 게임 시작 추적
- [x] 게임 종료 추적 (victory/defeat)
- [x] 레벨업 선택 추적
- [x] 보스 등장/처치 추적
- [x] 설정 변경 추적
- [x] 화면 노출 추적

**Phase 2 (Critical - 출시 전 필수)**:
- [x] Victory 이벤트 구현
- [x] 세션 ID 시스템 구현
- [x] 게임 오버 액션 추적
- [x] 공통 파라미터 시스템 구축

**Phase 3 (High Priority)**:
- [x] 플레이어 사망 원인 추적
- [x] 최종 빌드 스냅샷
- [x] 설정 모달 접근성 추적

**실제 소요 시간**: 약 1일 (2025-11-09 ~ 2025-11-10)

### Phase 4 (향후 계획 - Medium Priority) 🟡

- [ ] 레벨업 의사결정 시간 측정
- [ ] 마일스톤 추적 (5레벨, 3분, 1000점마다)
- [ ] 샘플링 시스템 구현
- [ ] 파워업 추적 시스템 (현재 TODO)

**예상 소요**: 2-3일

---

## 핵심 지표 (KPI)

### 출시 직후 모니터링 지표

1. **DAU** (Daily Active Users)
   - `game_start` 이벤트로 측정
   - 목표: 점진적 증가

2. **승률** (Win Rate)
   - `game_session_end` (victory vs defeat)
   - 목표: 5-15%

3. **재참여율** (Retry Rate)
   - `game_over_action` (restart vs lobby)
   - 목표: 60-70%

4. **평균 세션 길이**
   - `game_start` ~ `game_session_end` duration
   - 목표: 10-15분

5. **보스 도달률**
   - `boss_appear` / `game_start`
   - 목표: 40-50%

---

## 참고 문서

- [Analytics 통합 가이드](./ANALYTICS_INTEGRATION.md)
- [Analytics 개선 제안서](./ANALYTICS_IMPROVEMENTS.md)
- [앱인토스 Analytics 공식 문서](https://developers-apps-in-toss.toss.im/analytics/logging.html)
- [GameAnalytics 서비스 구현](../../src/services/gameAnalytics.ts)

---

**최종 수정**: 2025-11-10
**작성자**: 개발팀
**버전**: 3.0
**상태**: ✅ Phase 1-3 완료, Phase 4 계획 중
**다음 검토**: Phase 4 구현 계획 수립 시
