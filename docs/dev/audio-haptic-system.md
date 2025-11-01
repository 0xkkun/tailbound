# 오디오 & 햅틱 시스템 구현 가이드

> 설화(Talebound) - 앱인토스 오디오 및 햅틱 피드백 시스템

---

## 목차

1. [개요](#개요)
2. [햅틱 피드백 시스템](#햅틱-피드백-시스템)
3. [오디오 시스템](#오디오-시스템)
4. [설정 UI](#설정-ui)
5. [게임 통합](#게임-통합)
6. [테스트 가이드](#테스트-가이드)

---

## 개요

앱인토스 검수 요구사항에 따라 다음 기능을 구현합니다:

### 필수 요구사항
- ✅ 배경 음악 ON/OFF 토글
- ✅ 효과음 ON/OFF 토글
- ✅ 진동 ON/OFF 토글
- ✅ 볼륨 조절 (BGM, SFX)
- ✅ 백그라운드/포그라운드 전환 시 오디오 제어
- ✅ 설정 저장/로드 (LocalStorage)

### 구현 범위

#### 햅틱 피드백
- **피격 시**: `basicMedium` (중간 강도 진동)
- **죽음 시**: `error` (오류 패턴 진동)

#### 오디오 피드백
- **배경 음악**: 게임 씬별 BGM (추후 Howler.js 연동)
- **효과음**: 피격음, 죽음음 등

---

## 햅틱 피드백 시스템

### API 레퍼런스

앱인토스 SDK는 다음 햅틱 타입을 지원합니다:

```typescript
type HapticFeedbackType =
  | 'tickWeak'      // 약한 틱
  | 'tap'           // 탭
  | 'tickMedium'    // 중간 틱
  | 'softMedium'    // 부드러운 중간
  | 'basicWeak'     // 기본 약함
  | 'basicMedium'   // 기본 중간 ⭐ 피격용
  | 'success'       // 성공
  | 'error'         // 오류 ⭐ 죽음용
  | 'wiggle'        // 흔들림
  | 'confetti';     // 축하
```

### HapticManager 구현

**파일**: `src/services/hapticManager.ts`

```typescript
import { generateHapticFeedback } from '@toss/apps-in-toss-sdk';

type HapticFeedbackType = 'basicMedium' | 'error';

export class HapticManager {
  private static instance: HapticManager;
  private enabled: boolean = true;

  private constructor() {
    const saved = localStorage.getItem('haptic_enabled');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('haptic_enabled', String(this.enabled));

    // 토글 시 즉각 피드백
    if (this.enabled) {
      this.triggerImmediate('basicMedium');
    }

    return this.enabled;
  }

  private async trigger(type: HapticFeedbackType): Promise<void> {
    if (!this.enabled) return;

    try {
      await generateHapticFeedback({ type });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  private async triggerImmediate(type: HapticFeedbackType): Promise<void> {
    try {
      await generateHapticFeedback({ type });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  /** 플레이어 피격 */
  onPlayerHit(): void {
    this.trigger('basicMedium');
  }

  /** 플레이어 사망 */
  onPlayerDeath(): void {
    this.trigger('error');
  }
}

export const hapticManager = HapticManager.getInstance();
```

### 사용 예시

```typescript
import { hapticManager } from '@/services/hapticManager';

// Player 클래스에서
takeDamage(amount: number): void {
  this.health -= amount;
  hapticManager.onPlayerHit(); // 피격 진동

  if (this.health <= 0) {
    this.die();
  }
}

private die(): void {
  hapticManager.onPlayerDeath(); // 죽음 진동
  this.onGameOver?.();
}
```

---

## 오디오 시스템

### AudioManager 구현

**파일**: `src/services/audioManager.ts`

```typescript
export class AudioManager {
  private static instance: AudioManager;

  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  // Howler.js 인스턴스들 (추후 추가)
  private currentBGM: Howl | null = null;
  private sfxPool: Map<string, Howl> = new Map();

  private constructor() {
    this.loadSettings();
    this.setupVisibilityHandler();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private loadSettings(): void {
    const bgmEnabled = localStorage.getItem('bgm_enabled');
    const sfxEnabled = localStorage.getItem('sfx_enabled');
    const bgmVolume = localStorage.getItem('bgm_volume');
    const sfxVolume = localStorage.getItem('sfx_volume');

    if (bgmEnabled !== null) this.bgmEnabled = bgmEnabled === 'true';
    if (sfxEnabled !== null) this.sfxEnabled = sfxEnabled === 'true';
    if (bgmVolume !== null) this.bgmVolume = parseFloat(bgmVolume);
    if (sfxVolume !== null) this.sfxVolume = parseFloat(sfxVolume);
  }

  // Getters
  isBGMEnabled(): boolean { return this.bgmEnabled; }
  isSFXEnabled(): boolean { return this.sfxEnabled; }
  getBGMVolume(): number { return this.bgmVolume; }
  getSFXVolume(): number { return this.sfxVolume; }

  // BGM 제어
  toggleBGM(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    localStorage.setItem('bgm_enabled', String(this.bgmEnabled));

    if (!this.bgmEnabled) {
      this.pauseAllBGM();
    } else {
      this.resumeBGM();
    }

    return this.bgmEnabled;
  }

  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('bgm_volume', String(this.bgmVolume));

    if (this.currentBGM) {
      this.currentBGM.volume(this.bgmVolume);
    }
  }

  // SFX 제어
  toggleSFX(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('sfx_enabled', String(this.sfxEnabled));
    return this.sfxEnabled;
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('sfx_volume', String(this.sfxVolume));
  }

  // 게임 이벤트별 사운드
  playHitSound(): void {
    if (!this.sfxEnabled) return;
    // TODO: Howler.js로 효과음 재생
    console.log('Play hit sound');
  }

  playDeathSound(): void {
    if (!this.sfxEnabled) return;
    // TODO: Howler.js로 효과음 재생
    console.log('Play death sound');
  }

  playLevelUpSound(): void {
    if (!this.sfxEnabled) return;
    // TODO: Howler.js로 효과음 재생
    console.log('Play level up sound');
  }

  // Private Methods
  private pauseAllBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.pause();
    }
  }

  private resumeBGM(): void {
    if (this.currentBGM && this.bgmEnabled) {
      this.currentBGM.play();
    }
  }

  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllBGM();
      } else {
        if (this.bgmEnabled) {
          this.resumeBGM();
        }
      }
    });
  }
}

export const audioManager = AudioManager.getInstance();
```

---

## 설정 UI

### 통합 Hook

**파일**: `src/hooks/useSettings.ts`

```typescript
import { useState } from 'react';
import { audioManager } from '@/services/audioManager';
import { hapticManager } from '@/services/hapticManager';

export function useSettings() {
  // 오디오
  const [bgmEnabled, setBgmEnabled] = useState(audioManager.isBGMEnabled());
  const [sfxEnabled, setSfxEnabled] = useState(audioManager.isSFXEnabled());
  const [bgmVolume, setBgmVolumeState] = useState(audioManager.getBGMVolume());
  const [sfxVolume, setSfxVolumeState] = useState(audioManager.getSFXVolume());

  // 햅틱
  const [hapticEnabled, setHapticEnabled] = useState(hapticManager.isEnabled());

  // 토글 함수들
  const toggleBGM = () => setBgmEnabled(audioManager.toggleBGM());
  const toggleSFX = () => setSfxEnabled(audioManager.toggleSFX());
  const toggleHaptic = () => setHapticEnabled(hapticManager.toggle());

  const setBGMVolume = (volume: number) => {
    audioManager.setBGMVolume(volume);
    setBgmVolumeState(volume);
  };

  const setSFXVolume = (volume: number) => {
    audioManager.setSFXVolume(volume);
    setSfxVolumeState(volume);
  };

  return {
    bgmEnabled,
    sfxEnabled,
    bgmVolume,
    sfxVolume,
    hapticEnabled,
    toggleBGM,
    toggleSFX,
    toggleHaptic,
    setBGMVolume,
    setSFXVolume,
  };
}
```

### 설정 화면 컴포넌트

**파일**: `src/ui/screens/SettingsScreen.tsx`

```typescript
import { useSettings } from '@/hooks/useSettings';

export function SettingsScreen() {
  const {
    bgmEnabled,
    sfxEnabled,
    bgmVolume,
    sfxVolume,
    hapticEnabled,
    toggleBGM,
    toggleSFX,
    toggleHaptic,
    setBGMVolume,
    setSFXVolume,
  } = useSettings();

  return (
    <div className="settings-screen">
      <h2>설정</h2>

      {/* 배경 음악 */}
      <div className="setting-item">
        <label>배경 음악</label>
        <button onClick={toggleBGM} className={bgmEnabled ? 'on' : 'off'}>
          {bgmEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {bgmEnabled && (
        <div className="setting-item volume">
          <label>볼륨</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={bgmVolume}
            onChange={(e) => setBGMVolume(parseFloat(e.target.value))}
          />
          <span>{Math.round(bgmVolume * 100)}%</span>
        </div>
      )}

      {/* 효과음 */}
      <div className="setting-item">
        <label>효과음</label>
        <button onClick={toggleSFX} className={sfxEnabled ? 'on' : 'off'}>
          {sfxEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {sfxEnabled && (
        <div className="setting-item volume">
          <label>볼륨</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sfxVolume}
            onChange={(e) => setSFXVolume(parseFloat(e.target.value))}
          />
          <span>{Math.round(sfxVolume * 100)}%</span>
        </div>
      )}

      {/* 진동 */}
      <div className="setting-item">
        <label>진동</label>
        <button onClick={toggleHaptic} className={hapticEnabled ? 'on' : 'off'}>
          {hapticEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
```

---

## 게임 통합

### Player 엔티티 통합

**파일**: `src/game/entities/Player.ts`

```typescript
import { audioManager } from '@/services/audioManager';
import { hapticManager } from '@/services/hapticManager';

export class Player {
  // ... 기존 코드

  takeDamage(amount: number): void {
    this.health -= amount;

    // 피격 피드백
    audioManager.playHitSound();
    hapticManager.onPlayerHit();

    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    // 죽음 피드백
    audioManager.playDeathSound();
    hapticManager.onPlayerDeath();

    this.onGameOver?.();
  }
}
```

---

## 테스트 가이드

### 1. 햅틱 테스트

#### 테스트 항목
- [ ] 설정에서 진동 ON/OFF 토글
- [ ] 토글 시 즉각 피드백 발생
- [ ] 피격 시 `basicMedium` 진동 발생
- [ ] 죽음 시 `error` 진동 발생 (다른 패턴)
- [ ] 진동 OFF 시 모든 진동 발생 안 함
- [ ] 설정이 LocalStorage에 저장됨

#### 테스트 방법
```typescript
// 개발자 도구 콘솔에서 테스트
import { hapticManager } from '@/services/hapticManager';

// 피격 진동 테스트
hapticManager.onPlayerHit();

// 죽음 진동 테스트
hapticManager.onPlayerDeath();

// 설정 확인
console.log('Haptic enabled:', hapticManager.isEnabled());
```

### 2. 오디오 테스트

#### 테스트 항목
- [ ] BGM ON/OFF 정상 동작
- [ ] SFX ON/OFF 정상 동작
- [ ] 볼륨 슬라이더 동작
- [ ] 백그라운드 전환 시 BGM 일시정지
- [ ] 포그라운드 복귀 시 BGM 재개
- [ ] 설정이 LocalStorage에 저장됨

#### 테스트 방법
```typescript
// 개발자 도구 콘솔에서 테스트
import { audioManager } from '@/services/audioManager';

// BGM 상태 확인
console.log('BGM enabled:', audioManager.isBGMEnabled());
console.log('BGM volume:', audioManager.getBGMVolume());

// 효과음 테스트
audioManager.playHitSound();
audioManager.playDeathSound();
```

### 3. 통합 테스트

#### 시나리오 1: 피격 피드백
1. 게임 시작
2. 적에게 피격
3. **예상 결과**:
   - 피격 효과음 재생
   - `basicMedium` 진동 발생

#### 시나리오 2: 죽음 피드백
1. 게임 시작
2. 체력을 0으로 만듦
3. **예상 결과**:
   - 죽음 효과음 재생
   - `error` 진동 발생 (피격보다 강함)

#### 시나리오 3: 설정 변경
1. 설정 화면 진입
2. 진동 OFF
3. 게임 중 피격
4. **예상 결과**: 진동 발생 안 함
5. 앱 재시작
6. **예상 결과**: 설정 유지됨

---

## 주의사항

### 햅틱 피드백
- ⚠️ 너무 빈번한 진동은 사용자 피로 유발
- ⚠️ 피격은 중간 강도(`basicMedium`)로 설정
- ⚠️ 죽음은 오류 패턴(`error`)으로 명확히 구분
- ⚠️ 사용자가 진동을 끌 수 있어야 함 (검수 요구사항)

### 오디오
- ⚠️ 백그라운드 전환 시 반드시 일시정지
- ⚠️ 포그라운드 복귀 시 설정에 따라 재개
- ⚠️ 볼륨은 0~1 범위로 제한
- ⚠️ 설정은 LocalStorage에 저장

### 검수 대응
- ✅ 배경 음악 ON/OFF 토글 구현
- ✅ 효과음 ON/OFF 토글 구현
- ✅ 진동 ON/OFF 토글 구현
- ✅ visibilitychange 이벤트 처리
- ✅ 설정 영구 저장

---

## 향후 개선 사항

### Howler.js 통합 (Phase 2)
- BGM 파일 로드 및 재생
- SFX 파일 로드 및 재생
- 페이드 인/아웃 효과
- 크로스페이드 전환

### 추가 햅틱 이벤트 (선택사항)
- 레벨업: `success`
- 보스 격파: `confetti`
- 장비 획득: `tap`

---

**작성일**: 2025-11-01
**버전**: 1.0
