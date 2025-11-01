# 로비 화면 구현 가이드

> 로비 화면 진입부터 게임 시작까지의 기본 플로우 구현

---

## 목차

1. [개요](#개요)
2. [비주얼 디자인 컨셉](#비주얼-디자인-컨셉)
3. [기능 범위](#기능-범위)
4. [UI/UX 설계](#uiux-설계)
5. [구현 가이드](#구현-가이드)
6. [개발 체크리스트](#개발-체크리스트)

---

## 개요

### 목적

이번 단계에서는 **로비 화면 진입 → 게임 시작 버튼 클릭 → 게임 화면 진입**까지의 기본 플로우만 구현합니다.

### 구현 범위

- ✅ 로비 화면 표시
- ✅ 타이틀 표시
- ✅ 기본 캐릭터 표시
- ✅ 게임 시작 버튼 (활성화)
- ✅ 캐릭터 선택, 옵션 버튼 (비활성화, UI만 존재)
- ✅ 게임 시작 → GameScene 전환
- ✅ **모바일 반응형 디자인 (최소 330px 지원)**

### 미구현 (추후 작업)

- ❌ 캐릭터 선택 기능
- ❌ 옵션 화면
- ❌ 복잡한 애니메이션

### 기술 스택

- **PixiJS 8**: 로비 화면 렌더링
- **@pixi/react**: React와 PixiJS 통합
- **React 19**: 상태 관리

### 지원 디바이스

- **데스크톱**: 768px 이상
- **태블릿**: 768px ~ 480px
- **모바일**: 480px ~ 330px (최소 지원)

---

## 비주얼 디자인 컨셉

### 전체 스타일

- **16-bit 픽셀 아트**
- **한국 전통 설화 테마**
- **어둡고 신비로운 밤 분위기**

### 컬러 팔레트 (오방색 기반)

| 색상   | 용도             | RGB     |
| ------ | ---------------- | ------- |
| 흑(黑) | 배경             | #1a1a2e |
| 백(白) | 텍스트           | #eaeaea |
| 황(黃) | 강조 (게임 시작) | #d4af37 |
| 청(靑) | 버튼 테두리      | #0e4c92 |
| 회색   | 비활성화         | #666666 |

### AI 프롬프트 템플릿 (에셋 제작용)

**공통 베이스**:

```
16-bit pixel art, cute chibi style, top-down view,
clean lines, high resolution, minimal shading, dark fantasy tone,
Korean folklore theme, Joseon dynasty style,
dark night palette with Korean Obangsaek colors,
supernatural atmosphere, transparent background
```

**타이틀 로고**:

```
Pixel art title logo "설화" in Korean calligraphy style,
16-bit, glowing gold effect, traditional Korean cloud patterns,
dark blue background, mystical atmosphere
```

**캐릭터 (호랑이)**:

```
Pixel art tiger character, Korean folklore style,
16-bit, cute chibi, idle pose, white and orange fur,
glowing mystical aura, transparent background,
sprite sheet with 4 frames for idle animation
```

**UI 버튼**:

```
Pixel art UI button frames, Korean traditional ornament border,
16-bit, gold and blue colors, ornate decorative corners,
3 states: normal, hover, disabled, transparent background
```

---

## 기능 범위

### 현재 구현

1. **로비 화면 표시**
   - 타이틀 (임시 텍스트, 추후 이미지로 교체)
   - 기본 캐릭터 표시 (임시 placeholder)
   - 배경 (단색, 추후 그라데이션/이미지)

2. **게임 시작 버튼 (활성화)**
   - 클릭 시 게임 화면으로 전환
   - Hover 효과
   - 금색 강조

3. **비활성화 버튼 (UI만)**
   - 캐릭터 선택 (회색, disabled)
   - 옵션 (회색, disabled)
   - 클릭 불가

### 데이터 구조

```typescript
// types/character.types.ts
export interface Character {
  id: string;
  name: string;
  sprite: string;
}

// data/characters.ts
export const DEFAULT_CHARACTER: Character = {
  id: 'tiger',
  name: '인간이 되지 못한 호랑이',
  sprite: '/assets/characters/tiger.png',
};
```

---

## UI/UX 설계

### 화면 레이아웃

#### 데스크톱 (768px 이상)

```
┌─────────────────────────────────────────┐
│                                         │
│              [타이틀]                    │
│           설화(說話) / Talebound        │
│                                         │
│         [캐릭터 표시 영역]                │
│              🐯                         │
│      인간이 되지 못한 호랑이               │
│                                         │
│      [게임 시작] ← 활성화, 금색           │
│      [캐릭터 선택] ← 비활성화, 회색       │
│      [옵션] ← 비활성화, 회색              │
│                                         │
└─────────────────────────────────────────┘
```

#### 모바일 (330px ~ 767px)

```
┌─────────────────┐
│                 │
│   설화(說話)     │ ← 폰트 크기 조정
│   Talebound     │
│                 │
│      🐯         │ ← 크기 축소
│  호랑이 이름     │
│                 │
│ [게임 시작]      │ ← 화면 너비 80%
│ [캐릭터 선택]    │
│ [옵션]          │
│                 │
└─────────────────┘
```

### 버튼 상태

| 버튼        | 상태     | 색상           | 클릭              |
| ----------- | -------- | -------------- | ----------------- |
| 게임 시작   | 활성화   | 금색 (#d4af37) | ✅ 게임 화면 이동 |
| 캐릭터 선택 | 비활성화 | 회색 (#666666) | ❌ 반응 없음      |
| 옵션        | 비활성화 | 회색 (#666666) | ❌ 반응 없음      |

### 인터랙션

**게임 시작 버튼**:

- Normal: 금색 테두리, 반투명 배경
- Hover: 더 밝은 금색, scale 1.05
- Click: scale 0.95, 게임 화면으로 전환

**비활성화 버튼**:

- 회색, 불투명도 50%
- Hover 효과 없음
- 클릭 불가 (cursor: not-allowed)

---

## 반응형 디자인

### 브레이크포인트

| 디바이스      | 최소 너비 | 최대 너비 | 스케일 팩터 |
| ------------- | --------- | --------- | ----------- |
| 극소형 모바일 | 330px     | 374px     | 0.88        |
| 모바일        | 375px     | 479px     | 1.0         |
| 태블릿        | 480px     | 767px     | 1.2         |
| 데스크톱      | 768px     | -         | 1.5 (최대)  |

### 반응형 요소 크기

| 요소               | 데스크톱 | 모바일                     |
| ------------------ | -------- | -------------------------- |
| 타이틀 폰트        | 64px     | 48px × scaleFactor         |
| 부제 폰트          | 20px     | 16px × scaleFactor         |
| 캐릭터 크기        | 160px    | 120px × scaleFactor        |
| 버튼 너비          | 300px    | 화면 너비 80% (최소 260px) |
| 게임시작 버튼 높이 | 70px     | 60px × scaleFactor         |
| 기타 버튼 높이     | 60px     | 50px × scaleFactor         |
| 버튼 간격          | 75px     | 55px × scaleFactor         |

### 반응형 구현 전략

1. **화면 크기 감지**
   - window.innerWidth 기준
   - 768px 미만을 모바일로 판단

2. **스케일 팩터 계산**
   - 375px 기준으로 비율 계산
   - 최소 0.88, 최대 1.5로 제한

3. **동적 크기 조정**
   - 모든 UI 요소를 scaleFactor로 조정
   - 폰트, 버튼, 간격 등 비례적 축소

4. **터치 최적화**
   - 모바일 버튼 최소 높이 44px 유지
   - 터치 영역 충분히 확보

---

## 구현 가이드

### 디렉토리 구조

```
src/
├── game/
│   ├── scenes/
│   │   ├── LobbyScene.ts      # 로비 씬
│   │   └── GameScene.ts       # 게임 씬 (기존)
│   │
│   └── ui/
│       ├── PixelButton.ts     # 버튼 클래스
│       └── CharacterDisplay.ts # 캐릭터 표시
│
├── hooks/
│   └── useGameState.ts        # 게임 페이즈 관리
│
├── types/
│   └── character.types.ts
│
├── data/
│   └── characters.ts          # 기본 캐릭터 데이터
│
└── App.tsx
```

### Step 1: useGameState 훅

```typescript
// hooks/useGameState.ts
import { useState } from 'react';

export type GamePhase = 'lobby' | 'playing';

export const useGameState = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');

  const startGame = () => {
    setGamePhase('playing');
  };

  return {
    gamePhase,
    startGame,
  };
};
```

### Step 2: PixelButton 클래스

```typescript
// game/ui/PixelButton.ts
import { Container, Graphics, Text } from 'pixi.js';

export class PixelButton extends Container {
  private background!: Graphics;
  private label!: Text;
  private width: number;
  private height: number;
  private color: number;
  private isDisabled: boolean;

  public onClick?: () => void;

  constructor(
    text: string,
    width: number = 300,
    height: number = 60,
    color: number = 0xffffff,
    disabled: boolean = false
  ) {
    super();

    this.width = width;
    this.height = height;
    this.color = disabled ? 0x666666 : color;
    this.isDisabled = disabled;

    this.createBackground();
    this.createLabel(text);

    if (!disabled) {
      this.setupInteraction();
    } else {
      this.alpha = 0.5;
      this.cursor = 'not-allowed';
    }
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.drawButton(false);
    this.addChild(this.background);
  }

  private drawButton(hover: boolean): void {
    this.background.clear();

    const alpha = hover ? 0.4 : 0.2;
    const borderAlpha = hover ? 1 : 0.6;

    // 픽셀 스타일 사각형 버튼
    this.background.lineStyle(3, this.color, borderAlpha);
    this.background.beginFill(0x000000, alpha);
    this.background.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
    this.background.endFill();

    // 코너 강조 (hover 시)
    if (hover && !this.isDisabled) {
      const cornerSize = 8;
      this.background.beginFill(this.color, 0.8);

      // 4개 코너
      this.background.drawRect(-this.width / 2, -this.height / 2, cornerSize, cornerSize);
      this.background.drawRect(
        this.width / 2 - cornerSize,
        -this.height / 2,
        cornerSize,
        cornerSize
      );
      this.background.drawRect(
        -this.width / 2,
        this.height / 2 - cornerSize,
        cornerSize,
        cornerSize
      );
      this.background.drawRect(
        this.width / 2 - cornerSize,
        this.height / 2 - cornerSize,
        cornerSize,
        cornerSize
      );

      this.background.endFill();
    }
  }

  private createLabel(text: string): void {
    this.label = new Text(text, {
      fontFamily: 'Nanum Gothic',
      fontSize: 18,
      fill: this.isDisabled ? 0x999999 : 0xeaeaea,
      fontWeight: 'bold',
    });
    this.label.anchor.set(0.5);
    this.addChild(this.label);
  }

  private setupInteraction(): void {
    this.interactive = true;
    this.buttonMode = true;

    this.on('pointerover', () => {
      this.drawButton(true);
      this.scale.set(1.05);
    });

    this.on('pointerout', () => {
      this.drawButton(false);
      this.scale.set(1);
    });

    this.on('pointerdown', () => {
      this.scale.set(0.95);
    });

    this.on('pointerup', () => {
      this.scale.set(1.05);
      this.onClick?.();
    });
  }

  public destroy(): void {
    this.removeAllListeners();
    super.destroy({ children: true });
  }
}
```

### Step 3: CharacterDisplay 클래스

```typescript
// game/ui/CharacterDisplay.ts
import { Container, Graphics, Text } from 'pixi.js';
import { Character } from '../../types/character.types';

export class CharacterDisplay extends Container {
  private placeholder!: Graphics;
  private nameText!: Text;

  constructor(character: Character) {
    super();

    this.createPlaceholder();
    this.createNameText(character.name);
  }

  private createPlaceholder(): void {
    // 임시 placeholder (추후 Sprite로 교체)
    this.placeholder = new Graphics();
    this.placeholder.beginFill(0xffffff, 0.1);
    this.placeholder.lineStyle(2, 0xffffff, 0.3);
    this.placeholder.drawCircle(0, 0, 80);
    this.placeholder.endFill();

    // 임시 이모지
    const emoji = new Text('🐯', {
      fontSize: 80,
    });
    emoji.anchor.set(0.5);
    this.placeholder.addChild(emoji);

    this.addChild(this.placeholder);
  }

  private createNameText(name: string): void {
    this.nameText = new Text(name, {
      fontFamily: 'Nanum Gothic',
      fontSize: 16,
      fill: 0xd4af37,
      fontWeight: 'bold',
    });
    this.nameText.anchor.set(0.5, 0);
    this.nameText.y = 100;
    this.addChild(this.nameText);
  }
}
```

### Step 4: LobbyScene 클래스

```typescript
// game/scenes/LobbyScene.ts
import { Container, Text, Graphics } from 'pixi.js';
import { PixelButton } from '../ui/PixelButton';
import { CharacterDisplay } from '../ui/CharacterDisplay';
import { DEFAULT_CHARACTER } from '../../data/characters';

export class LobbyScene extends Container {
  private titleText!: Text;
  private subtitleText!: Text;
  private characterDisplay!: CharacterDisplay;
  private startButton!: PixelButton;
  private characterSelectButton!: PixelButton;
  private optionsButton!: PixelButton;

  public onStartGame?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.createBackground(screenWidth, screenHeight);
    this.createTitle(screenWidth);
    this.createCharacterDisplay(screenWidth, screenHeight);
    this.createButtons(screenWidth, screenHeight);
  }

  private createBackground(width: number, height: number): void {
    // 단색 배경 (추후 그라데이션/이미지로 교체)
    const bg = new Graphics();
    bg.beginFill(0x1a1a2e);
    bg.drawRect(0, 0, width, height);
    bg.endFill();
    this.addChild(bg);
  }

  private createTitle(screenWidth: number): void {
    // 타이틀 (추후 이미지로 교체)
    this.titleText = new Text('설화', {
      fontFamily: 'Nanum Gothic',
      fontSize: 64,
      fill: 0xeaeaea,
      fontWeight: 'bold',
    });
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = screenWidth / 2;
    this.titleText.y = 80;
    this.addChild(this.titleText);

    // 부제
    this.subtitleText = new Text('Talebound', {
      fontFamily: 'Nanum Gothic',
      fontSize: 20,
      fill: 0xb8b8b8,
    });
    this.subtitleText.anchor.set(0.5, 0);
    this.subtitleText.x = screenWidth / 2;
    this.subtitleText.y = 160;
    this.addChild(this.subtitleText);
  }

  private createCharacterDisplay(screenWidth: number, screenHeight: number): void {
    this.characterDisplay = new CharacterDisplay(DEFAULT_CHARACTER);
    this.characterDisplay.x = screenWidth / 2;
    this.characterDisplay.y = screenHeight / 2 - 80;
    this.addChild(this.characterDisplay);
  }

  private createButtons(screenWidth: number, screenHeight: number): void {
    const buttonX = screenWidth / 2;
    const startY = screenHeight / 2 + 100;
    const gap = 75;

    // 게임 시작 버튼 (활성화, 금색 강조)
    this.startButton = new PixelButton(
      '게임 시작',
      300,
      70,
      0xd4af37, // 금색
      false // 활성화
    );
    this.startButton.x = buttonX;
    this.startButton.y = startY;
    this.startButton.onClick = () => {
      console.log('게임 시작!');
      this.onStartGame?.();
    };
    this.addChild(this.startButton);

    // 캐릭터 선택 버튼 (비활성화)
    this.characterSelectButton = new PixelButton(
      '캐릭터 선택',
      300,
      60,
      0xffffff,
      true // 비활성화
    );
    this.characterSelectButton.x = buttonX;
    this.characterSelectButton.y = startY + gap;
    this.addChild(this.characterSelectButton);

    // 옵션 버튼 (비활성화)
    this.optionsButton = new PixelButton(
      '옵션',
      300,
      60,
      0xffffff,
      true // 비활성화
    );
    this.optionsButton.x = buttonX;
    this.optionsButton.y = startY + gap * 2;
    this.addChild(this.optionsButton);
  }

  public destroy(): void {
    this.startButton.destroy();
    this.characterSelectButton.destroy();
    this.optionsButton.destroy();
    super.destroy({ children: true });
  }
}
```

### Step 5: App.tsx 통합

```typescript
// App.tsx
import { FC, useEffect, useRef } from 'react';
import { Application } from '@pixi/react';
import { useGameState } from './hooks/useGameState';
import { LobbyScene } from './game/scenes/LobbyScene';
import { Application as PixiApplication } from 'pixi.js';

export const App: FC = () => {
  const { gamePhase, startGame } = useGameState();
  const pixiAppRef = useRef<PixiApplication | null>(null);
  const lobbySceneRef = useRef<LobbyScene | null>(null);

  useEffect(() => {
    if (!pixiAppRef.current) return;

    const app = pixiAppRef.current;

    if (gamePhase === 'lobby') {
      // 로비 씬 생성
      const lobbyScene = new LobbyScene(
        app.screen.width,
        app.screen.height
      );

      // 게임 시작 콜백 연결
      lobbyScene.onStartGame = () => {
        startGame();
      };

      app.stage.addChild(lobbyScene);
      lobbySceneRef.current = lobbyScene;

      return () => {
        lobbyScene.destroy();
        app.stage.removeChild(lobbyScene);
      };
    } else if (gamePhase === 'playing') {
      // 게임 씬으로 전환 (추후 GameScene 구현)
      console.log('게임 시작됨!');
      // TODO: GameScene 초기화
    }
  }, [gamePhase, startGame]);

  return (
    <Application
      ref={pixiAppRef}
      background="#1a1a2e"
      resizeTo={window}
    />
  );
};
```

### Step 6: 캐릭터 데이터

```typescript
// types/character.types.ts
export interface Character {
  id: string;
  name: string;
  sprite: string;
}
```

```typescript
// data/characters.ts
import { Character } from '../types/character.types';

export const DEFAULT_CHARACTER: Character = {
  id: 'tiger',
  name: '인간이 되지 못한 호랑이',
  sprite: '/assets/characters/tiger.png', // 추후 사용
};
```

---

## 개발 체크리스트

### Phase 1: 기본 구조 (1-2일)

- [x] `useGameState` 훅 구현
- [x] 캐릭터 타입 및 데이터 정의
- [x] `PixelButton` 클래스 구현
- [x] `CharacterDisplay` 클래스 구현
- [x] `LobbyScene` 클래스 구현
- [x] `App.tsx` 통합

### Phase 2: 모바일 대응 (1일)

- [x] 반응형 스케일 팩터 적용
- [x] 모바일 레이아웃 최적화
- [x] 330px 최소 화면 지원
- [x] 터치 인터랙션 최적화

### Phase 3: 테스트 (1일)

- [ ] 로비 화면 표시 확인
- [ ] 게임 시작 버튼 클릭 → 페이즈 전환 확인
- [ ] 비활성화 버튼 클릭 불가 확인
- [ ] 버튼 hover 효과 확인
- [ ] 다양한 화면 크기 테스트 (330px ~ 1920px)

### Phase 4: 스타일링 (선택적)

- [ ] 픽셀 아트 에셋 교체
- [ ] 폰트 교체
- [ ] 배경 그라데이션 추가

---

## 참고 문서

- [CORE_DESIGN.md](../CORE_DESIGN.md)
- [architecture.md](../technical/architecture.md)
- [PixiJS 공식 문서](https://pixijs.com/docs)

---

## 주의사항

### 1. PixiJS 설정

```typescript
// 픽셀 아트 렌더링 설정
import { settings, SCALE_MODES } from 'pixi.js';
settings.SCALE_MODE = SCALE_MODES.NEAREST;
```

### 2. 리소스 정리

- 씬 전환 시 반드시 `destroy()` 호출
- 메모리 누수 방지

### 3. 비활성화 버튼

- `disabled: true` 파라미터로 생성
- 회색 + 반투명 처리
- 인터랙션 없음

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-15
**작성자**: 개발팀
**상태**: 초안

---

## 변경 이력

| 날짜       | 변경 사항                                   | 작성자 |
| ---------- | ------------------------------------------- | ------ |
| 2025-10-15 | 초기 문서 작성                              | 개발팀 |
| 2025-10-15 | 모바일 반응형 디자인 추가 (최소 330px 지원) | 개발팀 |
