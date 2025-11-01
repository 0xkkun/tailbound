# 앱인토스 (Apps in Toss) 통합 가이드

> 설화(Talebound) - 앱인토스 플랫폼 통합을 위한 기술 문서

---

## 목차

1. [개요](#개요)
2. [앱인토스란?](#앱인토스란)
3. [통합 프로세스](#통합-프로세스)
4. [mTLS 인증 설정](#mtls-인증-설정)
5. [도메인 및 환경 설정](#도메인-및-환경-설정)
6. [CORS 설정](#cors-설정)
7. [주요 기능 통합](#주요-기능-통합)
8. [개발 시 주의사항](#개발-시-주의사항)
9. [앱 검수 가이드](#앱-검수-가이드)
10. [개발 체크리스트](#개발-체크리스트)
11. [구현 예시](#구현-예시)

---

## 개요

설화(Talebound)는 토스 앱인토스(Apps in Toss) 플랫폼에 통합되는 미니앱입니다. 이 문서는 앱인토스 플랫폼과의 통합에 필요한 기술적 요구사항과 구현 가이드를 제공합니다.

### 참고 문서
- [앱인토스 개발자 문서](https://developers-apps-in-toss.toss.im/development/integration-process.html)

---

## 앱인토스란?

**앱인토스(Apps in Toss)**는 텔레그램 미니앱과 유사한 개념으로, 토스 앱 내에서 동작하는 경량화된 웹 애플리케이션 플랫폼입니다.

### 주요 특징
- 토스 앱 생태계 내에서 실행
- 토스의 인증, 결제, 푸시 알림 등의 기능 활용 가능
- 별도의 앱 설치 없이 웹 기술로 서비스 제공

---

## 통합 프로세스

### 핵심 요구사항

앱인토스 개발에서 가장 중요한 요구사항은 **mTLS (mutual TLS) 서버 간 통신**을 구현하는 것입니다.

mTLS가 필수인 기능:
- Toss Login (토스 로그인)
- Toss Pay (토스 페이)
- 인앱 결제
- 기능성 푸시 알림
- 프로모션

---

## mTLS 인증 설정

### 1. 인증서 발급

**발급 방법:**
1. 앱인토스 콘솔에 접속
2. 해당 앱의 mTLS 인증서 탭으로 이동
3. 발급 버튼 클릭
4. 인증서 파일과 키 파일 다운로드

### 2. 인증서 보안 관리

```
⚠️ 중요: 인증서와 키 파일은 안전한 장소에 보관해야 합니다
```

**보안 수칙:**
- 인증서 파일과 키 파일을 안전한 위치에 저장
- Git 저장소에 절대 커밋하지 않기 (`.gitignore`에 추가)
- 환경 변수 또는 시크릿 관리 시스템 사용
- 프로덕션 환경에서는 Key Vault 등 보안 스토리지 활용

### 3. 인증서 만료 및 갱신

**만료 정책:**
- 인증서는 **390일 후 만료**
- 만료 전에 갱신 필요
- **다중 인증서 등록 지원**: 무중단 로테이션 가능

**인증서 로테이션 전략:**
```
1. 새 인증서 발급
2. 새 인증서를 기존 인증서와 함께 등록
3. 애플리케이션에 새 인증서 배포
4. 안정화 후 구 인증서 제거
```

### 4. mTLS 구현 예시

#### Node.js/TypeScript (추천)
```typescript
import https from 'https';
import fs from 'fs';

const options = {
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem'),
  ca: fs.readFileSync('/path/to/ca.pem'), // 필요시
};

// Fetch API 사용 시
import { Agent } from 'undici';

const agent = new Agent({
  connect: {
    cert: options.cert,
    key: options.key,
  },
});

// API 호출
const response = await fetch('https://api.tossmini.com/v1/...', {
  dispatcher: agent,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ ... }),
});
```

#### axios 사용 시
```typescript
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const httpsAgent = new https.Agent({
  cert: fs.readFileSync('/path/to/cert.pem'),
  key: fs.readFileSync('/path/to/key.pem'),
});

const client = axios.create({
  httpsAgent,
  baseURL: 'https://api.tossmini.com',
});

// API 호출
const response = await client.post('/v1/...', { ... });
```

---

## 도메인 및 환경 설정

### 환경별 도메인

앱인토스는 두 가지 환경을 제공합니다:

| 환경 | 도메인 | 용도 |
|------|--------|------|
| **프로덕션** | `https://<appName>.apps.tossmini.com` | 실제 서비스 환경 |
| **테스트** | `https://<appName>.private-apps.tossmini.com` | 콘솔 QR 테스트 환경 |

**설화(Talebound) 도메인 예시:**
- 프로덕션: `https://talebound.apps.tossmini.com`
- 테스트: `https://talebound.private-apps.tossmini.com`

### 프로토콜 요구사항

| 환경 | 지원 프로토콜 |
|------|-------------|
| Sandbox (개발) | HTTP, HTTPS |
| Production (프로덕션) | **HTTPS만 지원** |

```
⚠️ 주의: 프로덕션 환경에서는 HTTPS가 필수입니다
```

---

## CORS 설정

### 허용 도메인 등록

백엔드 서버의 CORS 설정에 다음 도메인들을 추가해야 합니다:

```typescript
// 예시: Express.js
import cors from 'cors';

const allowedOrigins = [
  'https://talebound.apps.tossmini.com',           // 프로덕션
  'https://talebound.private-apps.tossmini.com',   // 테스트
  'http://localhost:5173',                          // 로컬 개발
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### CORS Preflight 처리

```typescript
// OPTIONS 요청 처리
app.options('*', cors());
```

---

## 주요 기능 통합

### 1. 게임 로그인 (Game Login) - 필수 ⭐

게임 미니앱에서 사용자를 식별하기 위한 고유 키를 반환하는 SDK 기능입니다. **서버 통합 없이 SDK만으로 간단하게 구현**할 수 있어 설화 프로젝트에서 가장 먼저 구현해야 하는 인증 기능입니다.

#### 특징

- ✅ **서버 통합 불필요**: mTLS 없이도 사용 가능
- ✅ **SDK만으로 간단 구현**: 클라이언트 측에서만 호출
- ✅ **게임 카테고리 전용**: 게임 미니앱에서만 사용 가능
- ✅ **고유 식별자**: 미니앱별 고유한 사용자 hash 제공
- ✅ **프로모션 연동**: Toss Points 보상 기능과 연계 가능

#### 요구사항

| 항목 | 요구 버전 |
|------|----------|
| SDK 버전 | 1.4.0 이상 |
| Toss 앱 버전 | 5.232.0 이상 |
| 미니앱 카테고리 | 게임 카테고리만 사용 가능 |

#### API 레퍼런스

```typescript
function getUserKeyForGame(): Promise<
  GetUserKeyForGameSuccessResponse |
  'INVALID_CATEGORY' |
  'ERROR' |
  undefined
>;
```

**반환값:**
- `{ type: 'HASH', hash: string }`: 성공 (사용자 고유 식별자)
- `'INVALID_CATEGORY'`: 게임 카테고리가 아닌 미니앱에서 호출
- `'ERROR'`: 알 수 없는 오류
- `undefined`: Toss 앱 버전이 5.232.0 미만

#### 구현 예시

```typescript
// src/services/gameAuth.ts
import { getUserKeyForGame } from '@toss/apps-in-toss-sdk';

export class GameAuthService {
  private userHash: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      const result = await getUserKeyForGame();

      // 버전 체크
      if (!result) {
        console.error('Toss 앱 버전이 너무 낮습니다. (최소 5.232.0 필요)');
        // 사용자에게 업데이트 안내
        return false;
      }

      // 카테고리 체크
      if (result === 'INVALID_CATEGORY') {
        console.error('게임 카테고리가 아닌 미니앱입니다.');
        return false;
      }

      // 오류 체크
      if (result === 'ERROR') {
        console.error('게임 로그인 중 오류가 발생했습니다.');
        return false;
      }

      // 성공
      if (result.type === 'HASH') {
        this.userHash = result.hash;
        console.log('게임 로그인 성공:', this.userHash);

        // 백엔드에 사용자 정보 전송 (선택사항)
        await this.syncUserToBackend(this.userHash);

        return true;
      }

      return false;
    } catch (error) {
      console.error('게임 로그인 실패:', error);
      return false;
    }
  }

  getUserHash(): string | null {
    return this.userHash;
  }

  private async syncUserToBackend(hash: string): Promise<void> {
    // 백엔드에 사용자 hash 전송하여 게임 데이터 동기화
    await fetch('/api/game/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userHash: hash }),
    });
  }
}

export const gameAuth = new GameAuthService();
```

#### React 통합 예시

```typescript
// src/hooks/useGameAuth.ts
import { useEffect, useState } from 'react';
import { gameAuth } from '@/services/gameAuth';

export function useGameAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userHash, setUserHash] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      const success = await gameAuth.initialize();

      if (success) {
        setIsAuthenticated(true);
        setUserHash(gameAuth.getUserHash());
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  return { isAuthenticated, isLoading, userHash };
}
```

```typescript
// src/App.tsx
import { useGameAuth } from '@/hooks/useGameAuth';

function App() {
  const { isAuthenticated, isLoading, userHash } = useGameAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <UpdateRequiredScreen />;
  }

  return <GameView userHash={userHash} />;
}
```

#### 주의사항

1. **사용 용도 제한**
   - 반환된 `hash`는 **게임사 내부 사용자 식별 용도로만 사용**
   - Toss 서버에 직접 요청하는 용도로는 사용 불가
   - 개인정보로 취급하여 안전하게 관리 필요

2. **미니앱별 고유 hash**
   - 동일 사용자라도 미니앱마다 다른 hash 반환
   - 다른 미니앱으로 사용자 정보 이전 불가

3. **버전 호환성**
   - 구버전 Toss 앱에서는 `undefined` 반환
   - 사용자에게 앱 업데이트 안내 UI 제공 필요

4. **카테고리 제한**
   - 게임 카테고리 미니앱에서만 동작
   - 다른 카테고리에서 호출 시 `INVALID_CATEGORY` 오류

#### 백엔드 연동 (선택사항)

게임 데이터를 서버에 저장하려면 백엔드에서 사용자 hash를 관리해야 합니다:

```typescript
// 백엔드 예시 (Express.js)
app.post('/api/game/user/sync', async (req, res) => {
  const { userHash } = req.body;

  // userHash를 기반으로 사용자 데이터 조회 또는 생성
  let user = await db.users.findOne({ tossGameHash: userHash });

  if (!user) {
    // 신규 사용자 생성
    user = await db.users.create({
      tossGameHash: userHash,
      createdAt: new Date(),
      gameProgress: {
        level: 1,
        gold: 0,
        equipment: [],
        metaUpgrades: [],
      },
    });
  }

  res.json({ userId: user.id, gameProgress: user.gameProgress });
});

// 게임 진행 상황 저장
app.post('/api/game/save', async (req, res) => {
  const { userHash, gameProgress } = req.body;

  await db.users.updateOne(
    { tossGameHash: userHash },
    { $set: { gameProgress, lastSavedAt: new Date() } }
  );

  res.json({ success: true });
});
```

---

### 2. Toss Login

토스 로그인은 mTLS 인증이 필수입니다.

```typescript
// 토스 로그인 토큰 검증 예시
async function verifyTossToken(token: string) {
  const response = await fetch('https://api.tossmini.com/v1/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    dispatcher: mtlsAgent, // mTLS 인증서 포함
    body: JSON.stringify({ token }),
  });

  return await response.json();
}
```

### 3. Toss Pay (인앱 결제)

게임 내 아이템 구매, 프리미엄 기능 등에 토스 페이를 활용할 수 있습니다.

```typescript
// 결제 요청 예시
async function requestPayment(orderId: string, amount: number) {
  const response = await fetch('https://api.tossmini.com/v1/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    dispatcher: mtlsAgent,
    body: JSON.stringify({
      orderId,
      amount,
      orderName: '설화 - 프리미엄 패스',
      customerEmail: user.email,
    }),
  });

  return await response.json();
}
```

### 4. 푸시 알림

사용자에게 게임 이벤트나 업데이트 알림을 전송할 수 있습니다.

```typescript
// 푸시 알림 전송 예시
async function sendPushNotification(userId: string, message: string) {
  const response = await fetch('https://api.tossmini.com/v1/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    dispatcher: mtlsAgent,
    body: JSON.stringify({
      userId,
      title: '설화',
      body: message,
    }),
  });

  return await response.json();
}
```

---

## 개발 시 주의사항

### 1. iOS 쿠키 제한 (iOS 13.4+)

iOS 13.4 이상에서는 **서드파티 쿠키가 차단**됩니다.

**해결 방법:**
- ❌ 세션 쿠키 의존 (작동하지 않음)
- ✅ **토큰 기반 인증** (JWT, Bearer Token)
- ✅ **OAuth 2.0 인증**

```typescript
// 토큰 기반 인증 예시
// 쿠키 대신 localStorage 또는 sessionStorage 사용
localStorage.setItem('auth_token', token);

// API 요청 시 헤더에 토큰 포함
fetch('/api/user', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

### 2. 파일 크기 제한 (게임 앱)

게임 앱의 경우 대용량 에셋을 분리해야 합니다.

**제한 사항:**
- 빌드 파일(압축 해제 기준): **최대 100MB**
- 초과 시 외부 CDN에서 에셋 로딩 필요

**설화(Talebound) 대응 전략:**
```typescript
// 1. 필수 에셋만 번들링 (UI, 기본 스프라이트)
// 2. 게임 에셋은 CDN에서 동적 로딩

// 에셋 동적 로딩 예시
async function loadGameAssets() {
  const CDN_BASE = 'https://cdn.talebound.com/assets';

  const sprites = await fetch(`${CDN_BASE}/sprites.json`).then(r => r.json());
  const textures = await PIXI.Assets.load(`${CDN_BASE}/textures.png`);

  return { sprites, textures };
}
```

### 3. Features 설정 (비게임 미니앱)

게임이 아닌 미니앱의 경우 "features" 개념을 사용합니다.

**Features란?**
- 사용자가 접근할 수 있는 랜딩 페이지
- **최대 3개**까지 설정 가능

**설화는 게임이므로 해당 없음**

### 4. 로깅 및 분석

앱인토스는 미니앱 성능 개선을 위한 강력한 로깅 및 분석 기능을 제공합니다. **로깅은 미니앱 성능 개선을 위한 가장 중요한 도구**로, 사용자 행동과 요소 노출을 기록하여 이탈 지점 파악, 전환율 개선, 트래픽 유도에 활용할 수 있습니다.

#### 앱인토스 Analytics

**요구사항:**
- SDK 버전: **0.0.26 이상** 필수
- 데이터 가시성: **실제 서비스 출시 후 1일부터** 제공
- 테스트 환경: Sandbox 및 테스트 데이터는 제공되지 않음

**지원되는 이벤트 타입:**
- ✅ **페이지 네비게이션**: 자동 추적 (별도 설정 불필요)
- ✅ **클릭 이벤트**: 버튼 클릭 등 사용자 인터랙션 추적
- ✅ **노출 이벤트**: 화면에 요소가 노출되는 시점 추적

#### Analytics API 사용법

```typescript
import { Analytics } from '@toss/apps-in-toss-sdk';

// 1. Analytics 초기화 (앱 시작 시 한 번만 호출)
Analytics.init({
  appName: 'Talebound',
  version: '1.0.0',
});

// 2. 화면 전환 추적 (자동으로 기록됨)
// 별도 코드 불필요

// 3. 클릭 이벤트 추적
function GameStartButton() {
  const handleClick = () => {
    // 버튼 클릭 로깅
    Analytics.click({
      button_name: 'game_start_button',
      screen: 'main_menu',
    });

    startGame();
  };

  return <button onClick={handleClick}>게임 시작</button>;
}

// 4. 노출 이벤트 추적 (IntersectionObserver 활용)
function TrackableItem({ itemId, children }) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            // 요소가 10% 이상 노출되면 로깅
            Analytics.impression({
              item_id: itemId,
              screen: 'equipment_shop',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [itemId]);

  return <div ref={elementRef}>{children}</div>;
}
```

#### React Component 기반 Analytics

앱인토스 SDK는 React Component 기반의 선언적 로깅도 지원합니다:

```typescript
import { Analytics } from '@toss/apps-in-toss-sdk';

function GameMenu() {
  return (
    <Analytics.Area name="main_menu">
      {/* 클릭 이벤트 자동 추적 */}
      <Analytics.Press buttonName="start_game">
        <button onClick={startGame}>게임 시작</button>
      </Analytics.Press>

      {/* 노출 이벤트 자동 추적 */}
      <Analytics.Impression itemId="daily_quest">
        <DailyQuestBanner />
      </Analytics.Impression>
    </Analytics.Area>
  );
}
```

#### 로깅 모범 사례

1. **의미 있는 인터랙션만 로깅**
   - 실제 분석 가치가 있는 이벤트만 기록
   - 불필요한 로그는 데이터 노이즈 증가

2. **명확한 파라미터 사용**
   ```typescript
   // ❌ 나쁜 예
   Analytics.click({ button_name: 'button1' });

   // ✅ 좋은 예
   Analytics.click({ button_name: 'equipment_upgrade_confirm' });
   ```

3. **이탈 지점 분석**
   - 콘솔의 **Analytics > Events**에서 데이터 확인
   - 클릭률, 노출-전환 비율 분석
   - 주요 이탈 지점 파악 및 UI 개선

#### 설화 프로젝트 Analytics 구현

```typescript
// src/services/analytics.ts
import { Analytics } from '@toss/apps-in-toss-sdk';

export class GameAnalytics {
  static init() {
    Analytics.init({
      appName: 'Talebound',
      version: import.meta.env.VITE_APP_VERSION,
    });
  }

  // 게임 시작
  static trackGameStart(difficulty: string) {
    Analytics.click({
      button_name: 'game_start',
      screen: 'main_menu',
      difficulty,
    });
  }

  // 레벨업 선택
  static trackLevelUpChoice(cardType: string, cardId: string) {
    Analytics.click({
      button_name: 'levelup_card_select',
      screen: 'level_up_modal',
      card_type: cardType,
      card_id: cardId,
    });
  }

  // 장비 획득
  static trackEquipmentDrop(equipmentId: string, rarity: string) {
    Analytics.impression({
      item_id: equipmentId,
      screen: 'game_screen',
      rarity,
    });
  }

  // 게임 오버
  static trackGameOver(stage: number, score: number, survived: number) {
    Analytics.click({
      button_name: 'game_over_confirm',
      screen: 'game_over',
      stage,
      score,
      survived_seconds: survived,
    });
  }

  // 메타 업그레이드
  static trackMetaUpgrade(upgradeId: string, level: number) {
    Analytics.click({
      button_name: 'meta_upgrade',
      screen: 'meta_progression',
      upgrade_id: upgradeId,
      level,
    });
  }
}
```

```typescript
// App.tsx에서 초기화
useEffect(() => {
  GameAnalytics.init();
}, []);

// 사용 예시
function MainMenu() {
  const handleGameStart = () => {
    GameAnalytics.trackGameStart('normal');
    startGame();
  };

  return (
    <button onClick={handleGameStart}>
      게임 시작
    </button>
  );
}
```

#### 외부 분석 도구 통합

앱인토스 Analytics 외에도 다음 도구들을 함께 사용할 수 있습니다:

**지원되는 분석 도구:**
- ✅ **Sentry** (에러 트래킹)
- ✅ **Google Analytics** (사용자 분석)
- ✅ **Unity Analytics** (Unity 게임용)
- ✅ **Amplitude** (WebView 전용)

**설화 추천 설정:**
```typescript
// Sentry 초기화 (에러 트래킹)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // 민감한 정보 필터링
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});

// Google Analytics 초기화
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX', {
  gaOptions: {
    anonymizeIp: true, // IP 익명화
  },
});

// 페이지뷰 추적
ReactGA.send({ hitType: 'pageview', page: window.location.pathname });

// 커스텀 이벤트 추적
ReactGA.event({
  category: 'Game',
  action: 'LevelUp',
  label: 'Level 5',
  value: 5,
});
```

#### 콘솔에서 데이터 확인

1. 앱인토스 콘솔 접속
2. **Analytics > Events** 메뉴 이동
3. 다음 지표 확인:
   - **클릭률**: 각 버튼의 클릭 빈도
   - **노출-전환 비율**: 노출된 요소가 실제 전환으로 이어진 비율
   - **이탈 지점**: 사용자가 많이 이탈하는 화면/단계
4. 데이터 기반 UI/UX 개선 및 프로모션 타겟팅

#### 주의사항

- 📊 **실제 출시 후 1일부터** 데이터 확인 가능
- 🧪 테스트 환경 데이터는 제공되지 않음
- 🔒 사용자 개인정보는 로깅하지 말 것
- 📈 의미 있는 이벤트만 선별하여 로깅

---

## 앱 검수 가이드

앱인토스에 게임을 출시하기 전 필수로 통과해야 하는 검수 항목입니다. 검수 실패 시 반려되므로 출시 전에 모든 항목을 확인해야 합니다.

### 검수 전 필수 준비사항

출시 신청 전에 다음 항목을 완료해야 합니다:

- ✅ 앱 정보 검토 완료
- ✅ 사업자 인증 완료
- ✅ 대표 관리자 승인 완료

---

### 1. Bridge View (진입 화면)

앱이 처음 로드될 때 표시되는 화면과 관련된 검수 항목입니다.

#### 필수 사항
- [ ] **앱 이름, 로고, 브랜드 컬러가 정확히 표시**
- [ ] **다크 모드(Inverted) 적용 권장** (게임은 다크 모드 추천)
- [ ] **연령 등급 표시 필수**
  - 전체 이용가: 최소 3초 이상 표시
  - 연령 제한: 3초 이상 + 상세 설명 표시
- [ ] **로딩 시간 20초 이내**
- [ ] Toss Login 사용 시 인트로 화면 필수 (바로 로그인 프롬프트 X)
- [ ] Game Center 통합 테스트 완료

**설화 적용 예시:**
```typescript
// 인트로 화면에 연령 등급 표시
function IntroScreen() {
  const [showRating, setShowRating] = useState(true);

  useEffect(() => {
    // 연령 등급 3초 이상 표시
    const timer = setTimeout(() => {
      setShowRating(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showRating) {
    return (
      <div className="age-rating">
        <img src="/assets/rating-12.png" alt="12세 이용가" />
        <p>본 게임은 12세 이용가입니다.</p>
      </div>
    );
  }

  return <GameIntro />;
}
```

---

### 2. 시스템 모드

- [ ] **라이트 모드만 지원** (다크 모드 현재 미지원)
- [ ] 라이트/다크 모드 전환 시 UI 깨짐 없음

---

### 3. 오디오

게임 오디오 관리와 관련된 검수 항목입니다.

#### 필수 사항
- [ ] **배경 음악 ON/OFF 토글 기능**
- [ ] **효과음 ON/OFF 토글 기능**
- [ ] **기기 무음/진동 모드 감지 및 반영**
- [ ] **앱 백그라운드 전환 시 오디오 일시정지**
- [ ] **앱 포그라운드 복귀 시 오디오 재생 재개**

**설화 적용 예시:**
```typescript
// src/services/audioManager.ts
export class AudioManager {
  private bgmEnabled = true;
  private sfxEnabled = true;
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this.pauseAllBGM();
    } else {
      this.resumeBGM();
    }
    localStorage.setItem('bgm_enabled', String(this.bgmEnabled));
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('sfx_enabled', String(this.sfxEnabled));
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // 백그라운드로 전환
      this.pauseAllBGM();
    } else {
      // 포그라운드로 복귀
      if (this.bgmEnabled) {
        this.resumeBGM();
      }
    }
  }
}

// App.tsx에서 visibility 이벤트 처리
useEffect(() => {
  const handleVisibility = () => audioManager.handleVisibilityChange();
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

---

### 4. 확대/축소 제스처

- [ ] **핀치 줌 제스처 기본적으로 비활성화**
- [ ] 특정 게임(예: 틀린그림찾기)에서만 활성화 허용
- [ ] 줌 활성화 시 UI 깨짐 없음

**설화 적용:**
```css
/* 핀치 줌 비활성화 */
* {
  touch-action: pan-x pan-y;
  user-select: none;
  -webkit-user-select: none;
}
```

---

### 5. 네비게이션 바

앱 상단 네비게이션 바 관련 검수 항목입니다.

#### 필수 사항
- [ ] **우측 상단에 "더보기(⋯)" 및 "닫기(X)" 버튼 고정**
- [ ] **iOS Dynamic Island 영역과 겹치지 않음**
- [ ] **전체 화면 구현**
- [ ] **닫기 버튼 클릭 시 종료 확인 모달 표시**

**설화 적용 예시:**
```typescript
function GameView() {
  const [showExitModal, setShowExitModal] = useState(false);

  const handleClose = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    // Toss 앱 종료 SDK 호출
    window.toss?.app?.close();
  };

  return (
    <>
      <nav className="game-nav">
        <button className="nav-more" onClick={() => setShowMenu(true)}>⋯</button>
        <button className="nav-close" onClick={handleClose}>✕</button>
      </nav>

      {showExitModal && (
        <Modal>
          <p>게임을 종료하시겠습니까?</p>
          <button onClick={confirmExit}>확인</button>
          <button onClick={() => setShowExitModal(false)}>취소</button>
        </Modal>
      )}
    </>
  );
}
```

```css
/* iOS Dynamic Island 회피 */
.game-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: env(safe-area-inset-top);
  z-index: 1000;
}
```

---

### 6. 일반 기능

게임의 핵심 기능과 관련된 검수 항목입니다.

#### 필수 사항
- [ ] **연령 등급이 게임 콘텐츠와 일치**
- [ ] **화면 방향(세로/가로) 정상 동작**
- [ ] **스크롤, 인터랙션, UI 반응 속도 2초 이내**
- [ ] **게임 내 모든 기능 정상 작동**
- [ ] **좌측 스와이프 및 Android 뒤로가기 버튼으로 앱이 닫히지 않음**
- [ ] **점수 획득, 레벨 완료 등 핵심 기능 정상 작동**
- [ ] **재설치/기기 변경 시 데이터 지속성 유지**
- [ ] **광고 3회 이상 시청 후에도 안정성 유지**
- [ ] **진행 차단 버그 0개**

**설화 주의사항:**
```typescript
// Android 뒤로가기 버튼 및 스와이프 제스처 처리
useEffect(() => {
  const preventBack = (e: PopStateEvent) => {
    e.preventDefault();
    // 게임 내 뒤로가기 로직 (예: 메뉴 닫기)
    handleGameBack();
  };

  window.addEventListener('popstate', preventBack);
  return () => window.removeEventListener('popstate', preventBack);
}, []);
```

---

### 7. 게임 프로필 & 리더보드

리더보드 기능 사용 시 검수 항목입니다.

#### 필수 사항
- [ ] **리더보드 접근 전 프로필 생성 필수**
- [ ] **점수 실시간 반영**
- [ ] **리더보드 올바르게 표시**

---

### 8. Toss Login

Toss Login 사용 시 검수 항목입니다.

#### 필수 사항
- [ ] **약관 표시 및 링크 정상 동작**
- [ ] **로그인 완료 시 오류 없음**
- [ ] **로그아웃이 Toss 앱 설정에서 정상 처리**
- [ ] **닫기 버튼 동작 정상**

---

### 9. 프로모션

프로모션 및 보상 관련 검수 항목입니다.

#### 금지 사항
- ❌ **현금 출금 이벤트 금지**
- ❌ **구독 상품 금지**
- ❌ **도박 요소 금지**

---

### 10. 인앱 결제

인앱 결제 사용 시 검수 항목입니다.

#### 필수 사항
- [ ] **결제 화면에서 배경 음악 일시정지**
- [ ] **앱 내 가격과 스토어 가격 일치**
- [ ] **결제 실패 시 오류 메시지 표시**
- [ ] **구매 내역 접근 가능**
- [ ] **기기 변경 시 구매 데이터 유지**
- [ ] **구독 상품 미사용**

**설화 적용 예시:**
```typescript
async function handlePurchase(itemId: string) {
  // 배경 음악 일시정지
  audioManager.pauseBGM();

  try {
    const result = await tossPayment.requestPayment({
      itemId,
      amount: ITEM_PRICES[itemId],
    });

    if (result.success) {
      await savePurchase(result);
    } else {
      showErrorMessage('결제에 실패했습니다. 다시 시도해주세요.');
    }
  } catch (error) {
    showErrorMessage('결제 중 오류가 발생했습니다.');
  } finally {
    // 배경 음악 재개
    audioManager.resumeBGM();
  }
}
```

---

### 11. 친구 초대 & 보상

친구 초대 기능 사용 시 검수 항목입니다.

#### 필수 사항
- [ ] **보상 정확히 표시**
- [ ] **종료 처리 정상**
- [ ] **보상 실시간 지급**
- [ ] **초대 가능한 친구 없을 때 정상 처리**

---

### 12. 인앱 광고

광고 사용 시 검수 항목입니다.

#### 필수 사항
- [ ] **광고 로딩 및 표시 정상**
- [ ] **광고 종료 후 배경 음악 재개**
- [ ] **광고 종료 시 올바른 화면으로 복귀**
- [ ] **리워드 광고는 전체 시청 후에만 보상 지급**

**설화 적용 예시:**
```typescript
async function showRewardedAd() {
  audioManager.pauseBGM();

  try {
    const result = await tossAd.showRewardedAd();

    if (result.watched) {
      // 광고 전체 시청 완료
      giveReward();
    } else {
      // 중간에 종료
      showMessage('광고를 끝까지 시청해야 보상을 받을 수 있습니다.');
    }
  } finally {
    audioManager.resumeBGM();
  }
}
```

---

### 13. 앱 권한

앱 권한 관련 검수 항목입니다.

#### 필수 사항
- [ ] **선언된 모든 권한이 정상 동작**
- [ ] **권한 거부 시에도 기능 정상 작동**

**설화 적용:**
```typescript
// 권한 요청 예시 (예: 알림 권한)
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    // 알림 활성화
  } else {
    // 권한 거부되어도 게임은 정상 작동
    console.log('알림 권한이 거부되었습니다.');
  }
}
```

---

### 14. 데이터 & 메모리

성능 관련 검수 항목입니다.

#### 필수 사항
- [ ] **과도한 데이터 사용 없음**
- [ ] **메모리 누수 없음**

**설화 주의사항:**
```typescript
// 메모리 누수 방지
useEffect(() => {
  const texture = PIXI.Texture.from('/assets/sprite.png');

  return () => {
    // 컴포넌트 언마운트 시 텍스처 해제
    texture.destroy(true);
  };
}, []);
```

---

### 15. 보안

보안 관련 검수 항목입니다.

#### 필수 사항
- [ ] **보안 취약점 없음** (XSS, SQL Injection 등)
- [ ] **개인정보 안전하게 처리**
- [ ] **HTTPS 통신만 사용**

---

### 16. 콘텐츠 정책

콘텐츠 관련 검수 항목입니다.

#### 금지 사항
- ❌ **불법 또는 선정적 콘텐츠**
- ❌ **자사 앱 홍보**
- ❌ **외부 링크 리다이렉션**
- ❌ **다크 패턴 (사용자 기만 UI/UX)**

#### 필수 사항
- [ ] **미니앱 브랜딩 가이드라인 준수**

---

## 개발 체크리스트

### 배포 전 확인사항

#### mTLS 설정
- [ ] mTLS 인증서 발급 완료
- [ ] 인증서 파일 안전한 위치에 저장
- [ ] 서버에 mTLS 인증 구현
- [ ] 인증서 만료 알림 설정 (390일)

#### 도메인 및 환경
- [ ] 프로덕션 도메인 확인: `https://<appName>.apps.tossmini.com`
- [ ] 테스트 도메인 확인: `https://<appName>.private-apps.tossmini.com`
- [ ] HTTPS 적용 완료 (프로덕션 필수)

#### CORS 설정
- [ ] 앱인토스 도메인 허용 목록에 추가
- [ ] CORS Preflight 처리 구현
- [ ] credentials 옵션 설정

#### 인증 및 보안
- [ ] 토큰 기반 인증 구현 (쿠키 대신)
- [ ] iOS 13.4+ 호환성 테스트

#### 파일 크기 및 에셋
- [ ] 빌드 파일 크기 100MB 미만 확인
- [ ] 대용량 에셋 CDN 분리 (필요시)

#### 기능 통합
- [ ] Toss Login 연동 (필요시)
- [ ] Toss Pay 연동 (인앱 결제 사용 시)
- [ ] 푸시 알림 연동 (필요시)

#### 모니터링
- [ ] Sentry 에러 트래킹 설정
- [ ] Google Analytics 분석 설정
- [ ] 로그 수집 설정

---

## 구현 예시

### 환경 변수 설정

```env
# .env.production
VITE_APP_ENV=production
VITE_APPS_IN_TOSS_DOMAIN=https://talebound.apps.tossmini.com
VITE_API_BASE_URL=https://api.talebound.com

# mTLS 인증서 경로 (서버 환경 변수)
MTLS_CERT_PATH=/etc/talebound/certs/cert.pem
MTLS_KEY_PATH=/etc/talebound/certs/key.pem
```

```env
# .env.development
VITE_APP_ENV=development
VITE_APPS_IN_TOSS_DOMAIN=https://talebound.private-apps.tossmini.com
VITE_API_BASE_URL=http://localhost:3000
```

### TypeScript 환경 변수 타입

```typescript
// src/types/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'development' | 'production';
  readonly VITE_APPS_IN_TOSS_DOMAIN: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### API 클라이언트 구현

```typescript
// src/services/appsInTossClient.ts
import { Agent } from 'undici';
import fs from 'fs';

class AppsInTossClient {
  private agent: Agent | undefined;
  private baseURL: string;

  constructor() {
    this.baseURL = 'https://api.tossmini.com';

    // 서버 환경에서만 mTLS 에이전트 초기화
    if (typeof window === 'undefined') {
      this.initMTLS();
    }
  }

  private initMTLS() {
    const certPath = process.env.MTLS_CERT_PATH;
    const keyPath = process.env.MTLS_KEY_PATH;

    if (!certPath || !keyPath) {
      throw new Error('mTLS certificate paths not configured');
    }

    this.agent = new Agent({
      connect: {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      },
    });
  }

  async verifyToken(token: string) {
    const response = await fetch(`${this.baseURL}/v1/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      dispatcher: this.agent,
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return await response.json();
  }

  async requestPayment(params: {
    orderId: string;
    amount: number;
    orderName: string;
    customerEmail: string;
  }) {
    const response = await fetch(`${this.baseURL}/v1/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      dispatcher: this.agent,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Payment request failed');
    }

    return await response.json();
  }
}

export const appsInTossClient = new AppsInTossClient();
```

---

**문서 버전**: 1.0
**최종 수정일**: 2025-11-01
**참고 문서**: [Apps in Toss 개발자 문서](https://developers-apps-in-toss.toss.im/)

---

## 변경 이력

| 날짜 | 변경 사항 | 작성자 |
|------|----------|--------|
| 2025-11-01 | 초기 문서 작성, 앱인토스 통합 가이드 | 개발팀 |
