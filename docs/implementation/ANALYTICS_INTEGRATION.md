# 앱인토스 Analytics 통합 가이드

> 설화 게임의 사용자 행동 분석을 위한 앱인토스 Analytics 로깅 시스템 구현 계획

---

## 목차

1. [개요](#개요)
2. [Analytics의 중요성](#analytics의-중요성)
3. [요구사항](#요구사항)
4. [구현 계획](#구현-계획)
5. [추적할 이벤트](#추적할-이벤트)
6. [구현 단계](#구현-단계)
7. [코드 예시](#코드-예시)
8. [테스트 및 검증](#테스트-및-검증)
9. [주의사항](#주의사항)

---

## 개요

앱인토스 Analytics는 **미니앱 성과를 높이는 가장 중요한 도구**입니다. 사용자 행동과 요소 노출을 기록하여:

- **이탈 지점 파악**: 어디서 사용자가 게임을 그만두는지
- **전환율 개선**: 어떤 무기/파워업이 인기 있는지
- **트래픽 유도**: 어떤 UI 요소가 사용자 참여를 높이는지

---

## Analytics의 중요성

### 설화 게임에서 활용 가치

1. **게임플레이 최적화**
   - 레벨업 선택에서 어떤 파워업이 많이 선택되는지
   - 어떤 무기 조합이 승리로 이어지는지
   - 평균 생존 시간 및 보스 처치율

2. **UI/UX 개선**
   - 사용자가 어디서 멈추는지 (이탈 지점)
   - 어떤 버튼이 잘 안 눌리는지
   - 튜토리얼이 필요한 부분은 어디인지

3. **밸런스 조정**
   - 너무 강한/약한 무기 파악
   - 난이도 곡선 분석
   - 보스 난이도 적정성

4. **마케팅 최적화**
   - 첫 실행 후 재방문율
   - 평균 플레이 시간
   - 공유/초대 전환율

---

## 요구사항

### SDK 버전

- **최소 버전**: `@apps-in-toss/web-framework` 0.0.26 이상
- **현재 프로젝트**: 1.4.2 ✅

### 제약사항

- 샌드박스/테스트 환경 데이터 미제공
- **실제 출시 후 1일 뒤**부터 데이터 확인 가능
- 페이지 이동 외 이벤트는 수동 구현 필요

---

## 구현 계획

### Phase 1: 핵심 이벤트 (출시 전 필수)

#### 1.1 게임 세션 추적

- 게임 시작
- 게임 오버
- 보스 처치 성공/실패

#### 1.2 레벨업 선택 추적

- 레벨업 UI 노출
- 선택한 파워업/무기

#### 1.3 UI 인터랙션

- 설정 버튼 클릭
- 사운드/햅틱 토글
- 재시작 버튼 클릭

### Phase 2: 상세 분석 (출시 후 1주일 내)

#### 2.1 게임플레이 상세 추적

- 무기별 사용 빈도
- 요괴 처치 수
- 획득 경험치/골드

#### 2.2 보스 전투 분석

- 보스 등장 시점
- 보스 처치 시간
- 남은 체력

#### 2.3 메타 진행도 (향후 추가 예정)

- 영구 업그레이드 선택
- 도감 완성도

### Phase 3: 고급 분석 (필요 시)

#### 3.1 A/B 테스트

- 다양한 UI 레이아웃 테스트
- 난이도 조정 효과 분석

#### 3.2 코호트 분석

- 신규 사용자 vs 복귀 사용자
- 플레이 횟수별 그룹화

---

## 추적할 이벤트

### 1. 클릭 이벤트

| 이벤트명         | 위치           | 파라미터                                                | 목적           |
| ---------------- | -------------- | ------------------------------------------------------- | -------------- |
| `game_start`     | 로비 화면      | -                                                       | 게임 시작 클릭 |
| `settings_open`  | 게임 중        | -                                                       | 설정 모달 열기 |
| `sound_toggle`   | 설정 모달      | `type: 'bgm'\|'sfx'`, `enabled: boolean`                | 음향 설정      |
| `haptic_toggle`  | 설정 모달      | `enabled: boolean`                                      | 햅틱 설정      |
| `levelup_select` | 레벨업 UI      | `card_type: string`, `card_id: string`, `level: number` | 파워업 선택    |
| `game_restart`   | 게임 오버 화면 | -                                                       | 재시작 클릭    |
| `game_quit`      | 게임 오버 화면 | -                                                       | 종료 클릭      |

### 2. 노출 이벤트

| 이벤트명           | 위치           | 파라미터                                                                      | 목적                |
| ------------------ | -------------- | ----------------------------------------------------------------------------- | ------------------- |
| `levelup_ui_shown` | 레벨업 UI      | `level: number`, `options: string[]`                                          | 레벨업 화면 노출    |
| `boss_appear`      | 게임 화면      | `boss_name: string`, `player_level: number`                                   | 보스 등장           |
| `game_over_shown`  | 게임 오버 화면 | `survived_seconds: number`, `level: number`, `kills: number`, `score: number` (총 획득 경험치) | 게임 오버 화면 노출 |

### 3. 커스텀 이벤트

| 이벤트명             | 시점        | 파라미터                                                                                             | 목적           |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------- | -------------- |
| `game_session_start` | 게임 시작   | `timestamp: number`                                                                                  | 세션 시작      |
| `game_session_end`   | 게임 종료   | `duration: number`, `result: 'victory'\|'defeat'`, `score: number` (총 획득 경험치), `level: number`, `kills: number` | 세션 종료      |
| `boss_defeated`      | 보스 처치   | `boss_name: string`, `time_taken: number`                                                            | 보스 처치 성공 |
| `weapon_acquired`    | 무기 획득   | `weapon_name: string`, `level: number`                                                               | 새 무기 획득   |
| `powerup_acquired`   | 파워업 획득 | `powerup_name: string`, `stack: number`                                                              | 파워업 획득    |

---

## 구현 단계

### Step 1: Analytics 서비스 구현

```typescript
// src/services/gameAnalytics.ts
import { safeAnalyticsClick, safeAnalyticsImpression } from '@utils/tossAppBridge';

/**
 * 게임 Analytics 서비스
 * 앱인토스 Analytics를 래핑하여 게임 전용 로깅 제공
 *
 * @important
 * Analytics.click/impression을 직접 사용하지 말고
 * safeAnalyticsClick/safeAnalyticsImpression을 사용하세요.
 * 토스 앱이 아닌 환경에서도 오류 없이 동작합니다.
 */
export class GameAnalytics {
  private static sessionStartTime: number | null = null;
  private static isInitialized = false;

  /**
   * Analytics 초기화 (앱 시작 시 1회 호출)
   */
  static init() {
    if (this.isInitialized) return;

    console.log('[GameAnalytics] Initialized');
    this.isInitialized = true;
  }

  /**
   * 게임 세션 시작
   */
  static trackGameStart() {
    this.sessionStartTime = Date.now();
    safeAnalyticsClick({
      button_name: 'game_start',
      screen: 'lobby',
    });
  }

  /**
   * 게임 세션 종료
   */
  static trackGameEnd(
    result: 'victory' | 'defeat',
    stats: {
      survived_seconds: number;
      level: number;
      kills: number;
      score: number;  // 총 획득 경험치
    }
  ) {
    const duration = this.sessionStartTime
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
      : 0;

    safeAnalyticsClick({
      button_name: 'game_session_end',
      screen: 'game_over',
      result,
      duration,
      survived_seconds: stats.survived_seconds,
      level: stats.level,
      kills: stats.kills,
      score: stats.score,
    });
  }

  /**
   * 레벨업 카드 선택
   */
  static trackLevelUpChoice(params: { cardType: string; cardId: string; level: number }) {
    safeAnalyticsClick({
      button_name: 'levelup_card_select',
      screen: 'level_up_modal',
      card_type: params.cardType,
      card_id: params.cardId,
      level: params.level,
    });
  }

  /**
   * 보스 등장 (노출 이벤트)
   */
  static trackBossAppear(bossName: string, playerLevel: number) {
    safeAnalyticsImpression({
      item_id: `boss_${bossName}`,
      screen: 'game',
      boss_name: bossName,
      player_level: playerLevel,
    });
  }

  /**
   * 보스 처치
   */
  static trackBossDefeated(bossName: string, timeTaken: number) {
    safeAnalyticsClick({
      button_name: 'boss_defeated',
      screen: 'game',
      boss_name: bossName,
      time_taken: timeTaken,
    });
  }

  /**
   * 설정 변경
   */
  static trackSettingsChange(params: { setting: 'bgm' | 'sfx' | 'haptic'; enabled: boolean }) {
    safeAnalyticsClick({
      button_name: `${params.setting}_toggle`,
      screen: 'settings',
      setting: params.setting,
      enabled: params.enabled,
    });
  }

  /**
   * 무기 획득
   */
  static trackWeaponAcquired(weaponName: string, level: number) {
    safeAnalyticsClick({
      button_name: 'weapon_acquired',
      screen: 'level_up_modal',
      weapon_name: weaponName,
      level,
    });
  }

  /**
   * 파워업 획득
   */
  static trackPowerupAcquired(powerupName: string, stack: number) {
    safeAnalyticsClick({
      button_name: 'powerup_acquired',
      screen: 'level_up_modal',
      powerup_name: powerupName,
      stack,
    });
  }
}

export const gameAnalytics = GameAnalytics;
```

### Step 2: 기존 코드에 통합

#### 2.1 App 초기화

```typescript
// src/App.tsx
import { gameAnalytics } from '@services/gameAnalytics';

function App() {
  useEffect(() => {
    // Analytics 초기화
    gameAnalytics.init();
  }, []);

  // ...
}
```

#### 2.2 로비 화면 - 게임 시작

```typescript
// src/game/scenes/LobbyScene.ts
import { gameAnalytics } from '@services/gameAnalytics';

export class LobbyScene extends Container {
  private createButtons(screenWidth: number, screenHeight: number): void {
    // 게임 시작 버튼
    this.startButton = new PixelButton({
      text: i18n.t('lobby.startGame'),
      onClick: () => {
        // Analytics 추적
        gameAnalytics.trackGameStart();

        // 기존 로직
        audioManager.playSFX('ui_click');
        this.onStartGame?.();
      },
    });
    // ...
  }
}
```

#### 2.3 레벨업 UI - 카드 선택

```typescript
// src/game/ui/LevelUpUI.ts
import { gameAnalytics } from '@services/gameAnalytics';

export class LevelUpUI extends Container {
  private handleCardClick(card: LevelUpCard, index: number): void {
    // Analytics 추적
    gameAnalytics.trackLevelUpChoice({
      cardType: card.type,
      cardId: card.id,
      level: this.currentLevel,
    });

    // 무기 획득 추적
    if (card.type === 'weapon') {
      gameAnalytics.trackWeaponAcquired(card.id, card.level || 1);
    }
    // 파워업 획득 추적
    else if (card.type === 'powerup') {
      gameAnalytics.trackPowerupAcquired(card.id, card.stack || 1);
    }

    // 기존 로직
    this.onCardSelected?.(card, index);
  }
}
```

#### 2.4 보스 시스템 - 보스 등장/처치

```typescript
// src/systems/BossSystem.ts
import { gameAnalytics } from '@services/gameAnalytics';

export class BossSystem {
  spawnBoss(playerLevel: number): void {
    // 보스 생성 로직...

    // Analytics 추적: 보스 등장
    gameAnalytics.trackBossAppear(this.currentBoss.name, playerLevel);
  }

  onBossDefeated(timeTaken: number): void {
    // Analytics 추적: 보스 처치
    gameAnalytics.trackBossDefeated(this.currentBoss.name, timeTaken);

    // 기존 로직...
  }
}
```

#### 2.5 게임 오버 - 세션 종료

```typescript
// src/game/scenes/game/BaseGameScene.ts
import { gameAnalytics } from '@services/gameAnalytics';

export class BaseGameScene extends Container {
  public gameOver(victory: boolean = false): void {
    // Analytics 추적: 게임 종료
    gameAnalytics.trackGameEnd(victory ? 'victory' : 'defeat', {
      survived_seconds: Math.floor(this.elapsedTime),
      level: this.player.level,
      kills: this.enemyKillCount,
      score: this.player.getTotalXP(),  // 총 획득 경험치
    });

    // 기존 로직...
  }
}
```

#### 2.6 설정 모달 - 설정 변경

```typescript
// src/game/ui/SettingsModal.ts
import { gameAnalytics } from '@services/gameAnalytics';

export class SettingsModal extends Container {
  private createSettingButtons(): void {
    // BGM 토글
    this.bgmButton.onClick = () => {
      const newState = audioManager.toggleBGM();

      // Analytics 추적
      gameAnalytics.trackSettingsChange({
        setting: 'bgm',
        enabled: newState,
      });
    };

    // SFX 토글
    this.sfxButton.onClick = () => {
      const newState = audioManager.toggleSFX();

      // Analytics 추적
      gameAnalytics.trackSettingsChange({
        setting: 'sfx',
        enabled: newState,
      });
    };

    // Haptic 토글
    this.hapticButton.onClick = () => {
      const newState = hapticManager.toggle();

      // Analytics 추적
      gameAnalytics.trackSettingsChange({
        setting: 'haptic',
        enabled: newState,
      });
    };
  }
}
```

### Step 3: 노출 이벤트 구현

레벨업 UI가 화면에 나타날 때 추적:

```typescript
// src/game/ui/LevelUpUI.ts
import { gameAnalytics } from '@services/gameAnalytics';
import { safeAnalyticsImpression } from '@utils/tossAppBridge';

export class LevelUpUI extends Container {
  private trackUIImpression(): void {
    // DOM 요소가 아닌 PixiJS Container이므로
    // 수동으로 노출 이벤트 발생
    safeAnalyticsImpression({
      item_id: 'levelup_ui',
      screen: 'game',
      level: this.currentLevel,
      options_count: this.cards.length,
    });
  }

  show(cards: LevelUpCard[], level: number): void {
    // 기존 로직...

    // 노출 추적
    this.trackUIImpression();
  }
}
```

---

## 코드 예시

### 전체 파일 구조

```
src/
├── services/
│   ├── gameAnalytics.ts          # Analytics 서비스 (신규)
│   ├── audioManager.ts            # 기존
│   └── hapticManager.ts           # 기존
├── game/
│   ├── scenes/
│   │   ├── LobbyScene.ts         # 수정: trackGameStart()
│   │   └── game/
│   │       └── BaseGameScene.ts   # 수정: trackGameEnd()
│   └── ui/
│       ├── LevelUpUI.ts           # 수정: trackLevelUpChoice()
│       └── SettingsModal.ts       # 수정: trackSettingsChange()
└── systems/
    └── BossSystem.ts              # 수정: trackBossAppear/Defeated()
```

---

## 테스트 및 검증

### 개발 환경 테스트

Analytics는 출시 후에만 데이터를 확인할 수 있으므로, 개발 중에는 **콘솔 로그**로 검증:

```typescript
// gameAnalytics.ts에 이미 console.log 포함
static trackGameStart() {
  // ...
  console.log('[Analytics] Game started');
}
```

### 체크리스트

출시 전 확인 사항:

- [ ] SDK 버전 0.0.26 이상 확인 (`package.json`)
- [ ] 모든 핵심 이벤트 추적 코드 추가
  - [ ] 게임 시작
  - [ ] 게임 종료
  - [ ] 레벨업 선택
  - [ ] 보스 등장/처치
  - [ ] 설정 변경
- [ ] 콘솔 로그로 이벤트 발생 확인
- [ ] 프로덕션 빌드 테스트
- [ ] 출시 후 1일 뒤 콘솔에서 데이터 확인

### 데이터 확인 (출시 후)

1. 앱인토스 콘솔 접속
2. **분석 > 이벤트** 메뉴 이동
3. 확인할 지표:
   - 게임 시작 클릭률
   - 레벨업 선택 분포 (어떤 무기/파워업이 인기?)
   - 평균 생존 시간
   - 보스 처치율
   - 설정 변경 빈도

---

## 주의사항

### ⚠️ 중요: Analytics 직접 사용 금지

**절대로 `Analytics.click()` 또는 `Analytics.impression()`을 직접 사용하지 마세요!**

```typescript
// ❌ 잘못된 예 - 토스 앱이 아닌 환경에서 오류 발생
import { Analytics } from '@apps-in-toss/web-framework';
Analytics.click({ button_name: 'test' }); // 오류!

// ✅ 올바른 예 - 안전한 래퍼 사용
import { safeAnalyticsClick } from '@utils/tossAppBridge';
safeAnalyticsClick({ button_name: 'test' }); // 안전!
```

**이유:**
- `Analytics`는 토스 앱 환경에서만 동작
- 웹 브라우저/다른 플랫폼에서는 오류 발생
- `safeAnalyticsClick/safeAnalyticsImpression`은 환경 체크 후 안전하게 실행
- 토스 앱이 아니면 콘솔 로그만 출력

### 1. 개인정보 보호

- ❌ 사용자 식별 정보 로깅 금지 (이름, 이메일 등)
- ✅ 게임 플레이 데이터만 수집 (레벨, 무기, 생존 시간 등)

### 2. 성능 최적화

- 과도한 로깅은 성능 저하 유발
- **의미 있는 이벤트만** 추적
- 1초에 수십 번 발생하는 이벤트는 피하기

### 3. 테스트 환경 제약

- 샌드박스 데이터 미제공
- 로컬/테스트는 콘솔 로그로만 확인
- 출시 후 1일 뒤 실제 데이터 확인 가능

### 4. 파라미터 명명 규칙

```typescript
// ✅ 좋은 예
Analytics.click({
  button_name: 'levelup_weapon_talisman',
  screen: 'level_up_modal',
  level: 5,
});

// ❌ 나쁜 예
Analytics.click({
  button_name: 'button1',
  screen: 'modal',
});
```

---

## 우선순위

### P0 (출시 전 필수)

- [x] Analytics 서비스 구현 (`gameAnalytics.ts`)
- [ ] 게임 시작/종료 추적
- [ ] 레벨업 선택 추적
- [ ] 보스 등장/처치 추적

### P1 (출시 직후)

- [ ] 설정 변경 추적
- [ ] 무기/파워업 획득 통계
- [ ] 콘솔에서 데이터 확인 및 분석

### P2 (필요 시)

- [ ] 상세 게임플레이 통계 (요괴 처치 수, 획득 골드 등)
- [ ] A/B 테스트 (UI 레이아웃, 난이도 등)
- [ ] 코호트 분석 (신규 vs 복귀 사용자)

---

## 참고 문서

- [앱인토스 Analytics 공식 문서](https://developers-apps-in-toss.toss.im/analytics/logging.html)
- [앱인토스 통합 가이드](./apps-in-toss-integration.md)

---

## 빠른 시작 요약

### 1. 안전 래퍼 사용하기

```typescript
// src/utils/tossAppBridge.ts에 이미 구현됨 ✅
import { safeAnalyticsClick, safeAnalyticsImpression } from '@utils/tossAppBridge';

// 클릭 이벤트
safeAnalyticsClick({
  button_name: 'game_start',
  screen: 'lobby',
});

// 노출 이벤트
safeAnalyticsImpression({
  item_id: 'boss_whitetiger',
  screen: 'game',
});
```

### 2. GameAnalytics 서비스 생성

`src/services/gameAnalytics.ts` 파일을 생성하고 문서의 코드 복사

### 3. 주요 이벤트 추가

- 게임 시작: `LobbyScene.ts`
- 게임 종료: `BaseGameScene.ts`
- 레벨업 선택: `LevelUpUI.ts`
- 보스 등장/처치: `BossSystem.ts`
- 설정 변경: `SettingsModal.ts`

### 4. 테스트

- 개발 중: 콘솔 로그 확인
- 출시 후: 앱인토스 콘솔에서 데이터 확인 (1일 뒤부터)

---

**작성일**: 2025-11-09
**작성자**: 개발팀
**버전**: 1.1
**최종 수정**: Analytics 안전 래퍼 적용
