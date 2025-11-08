/**
 * AudioManager - 게임 오디오 관리
 *
 * 배경 음악(BGM)과 효과음(SFX)을 관리합니다.
 * - BGM/SFX ON/OFF 토글
 * - 볼륨 조절
 * - 백그라운드/포그라운드 전환 처리
 * - 설정 영구 저장 (LocalStorage)
 */

import { BGM_PATHS, SFX_PATHS } from '@config/assets.config';
import type { BGMTrack, SFXType } from '@type/audio.types';
import { Howl } from 'howler';

export class AudioManager {
  private static instance: AudioManager;

  // 설정
  private bgmEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.7;

  // Howler.js 인스턴스들
  private currentBGM: Howl | null = null;
  private sfxPool: Map<string, Howl> = new Map();

  // 교차 재생용 BGM 트랙
  private alternatingTracks: string[] = [];
  private currentTrackIndex: number = 0;
  private isAlternatingMode: boolean = false;
  private bgmWasPausedManually: boolean = false; // 수동 일시정지 여부 추적

  // 재생 대기 중인 BGM (autoplay 차단 시 사용)
  private pendingBGM: { track: BGMTrack; loop: boolean } | null = null;

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

  /**
   * LocalStorage에서 설정 로드
   */
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

  // === Getters ===

  isBGMEnabled(): boolean {
    return this.bgmEnabled;
  }

  isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  getBGMVolume(): number {
    return this.bgmVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  // === BGM 제어 ===

  /**
   * BGM ON/OFF 토글
   * @returns 새로운 활성화 상태
   */
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

  /**
   * BGM 볼륨 설정 (0.0 ~ 1.0)
   */
  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('bgm_volume', String(this.bgmVolume));

    if (this.currentBGM) {
      this.currentBGM.volume(this.bgmVolume);
      console.log(`[Audio] BGM volume set to ${Math.round(this.bgmVolume * 100)}%`);
    }
  }

  // === SFX 제어 ===

  /**
   * 효과음 ON/OFF 토글
   * @returns 새로운 활성화 상태
   */
  toggleSFX(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('sfx_enabled', String(this.sfxEnabled));
    return this.sfxEnabled;
  }

  /**
   * 효과음 볼륨 설정 (0.0 ~ 1.0)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('sfx_volume', String(this.sfxVolume));

    // 모든 SFX 인스턴스의 볼륨 업데이트
    this.sfxPool.forEach((sfx) => {
      sfx.volume(this.sfxVolume);
    });
  }

  // === GUI 효과음 ===

  /**
   * 버튼 클릭 효과음 재생
   */
  playButtonClickSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('button-click');
  }

  /**
   * 슬라이드 업 효과음 재생
   */
  playSlideUpSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('slide-up');
  }

  /**
   * 슬라이드 다운 효과음 재생
   */
  playSlideDownSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('slide-down');
  }

  /**
   * 인게임 시작 효과음 재생
   */
  playIngameStartSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('ingame-start');
  }

  // === 무기 효과음 ===

  /**
   * 도깨비불 무기 효과음 재생
   */
  playDokkaebiFireSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('dokkabi-fire');
  }

  /**
   * 부채바람 무기 효과음 재생
   */
  playFanWindSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('fan-wind');
  }

  /**
   * 작두칼 무기 효과음 재생
   */
  playJakduBladeSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('jakdu-blade');
  }

  /**
   * 부적 무기 효과음 재생
   */
  playTalismanSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('talisman');
  }

  // === 적 효과음 ===

  /**
   * 일반 적 피격 효과음 재생 (common-01~04 랜덤)
   */
  playEnemyHitSound(): void {
    if (!this.sfxEnabled) return;
    const sounds: Array<
      'enemy-common-01' | 'enemy-common-02' | 'enemy-common-03' | 'enemy-common-04'
    > = ['enemy-common-01', 'enemy-common-02', 'enemy-common-03', 'enemy-common-04'];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.playSFX(randomSound);
  }

  /**
   * 유령계 적 사망 효과음 재생 (처녀귀신, 악령)
   */
  playEnemyGhostDeathSound(): void {
    if (!this.sfxEnabled) return;
    this.playSFX('enemy-ghost-01');
  }

  /**
   * 효과음 재생 (내부 헬퍼 메서드)
   */
  private playSFX(soundName: SFXType): void {
    let sfx = this.sfxPool.get(soundName);

    if (!sfx) {
      // 첫 재생 시 로드 (경로 매핑 사용)
      const audioPath = SFX_PATHS[soundName];

      sfx = new Howl({
        src: [audioPath],
        volume: this.sfxVolume,
        preload: true,
        onloaderror: (_id, error) => {
          console.warn(`[Audio] SFX not found (${soundName}):`, error);
          // 실패한 SFX는 pool에서 제거
          this.sfxPool.delete(soundName);
        },
        onplayerror: (_id, error) => {
          // 사용자 인터랙션 없이 재생 시도 시 발생하는 에러는 조용히 무시
          console.debug(`[Audio] SFX play skipped (${soundName}):`, error);
        },
      });
      this.sfxPool.set(soundName, sfx);
    }

    // 볼륨 업데이트 (설정 변경 반영)
    sfx.volume(this.sfxVolume);
    sfx.play();
  }

  // === BGM 일시정지/재개 ===

  /**
   * 모든 BGM 일시정지
   */
  pauseAllBGM(): void {
    if (this.currentBGM && this.currentBGM.playing()) {
      this.currentBGM.pause();
      this.bgmWasPausedManually = true;
      console.log('[Audio] BGM paused');
    }
  }

  /**
   * BGM 재개
   */
  resumeBGM(): void {
    if (this.currentBGM && this.bgmEnabled && this.bgmWasPausedManually) {
      // 수동으로 일시정지된 BGM만 재개
      if (!this.currentBGM.playing()) {
        this.currentBGM.play();
        this.bgmWasPausedManually = false;
        console.log('[Audio] BGM resumed');
      }
    }
  }

  // === Private Methods ===

  /**
   * Visibility change 이벤트 핸들러 설정
   * 백그라운드/포그라운드 전환 시 오디오 제어
   */
  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 백그라운드로 전환
        this.pauseAllBGM();
        console.log('[Audio] App went to background, BGM paused');
      } else {
        // 포그라운드로 복귀
        if (this.bgmEnabled) {
          this.resumeBGM();
          console.log('[Audio] App returned to foreground, BGM resumed');
        }
      }
    });
  }

  /**
   * BGM 로드 및 재생
   */
  playBGM(src: string, loop: boolean = true): void {
    // 교차 재생 모드 해제
    this.isAlternatingMode = false;
    this.alternatingTracks = [];
    this.bgmWasPausedManually = false; // 새 BGM 시작 시 플래그 리셋

    // 기존 BGM이 있으면 중지
    if (this.currentBGM) {
      try {
        this.currentBGM.stop();
        this.currentBGM.unload();
      } catch (error) {
        console.warn('[Audio] Failed to cleanup previous BGM:', error);
      }
    }

    this.currentBGM = new Howl({
      src: [src],
      loop,
      volume: this.bgmVolume,
      html5: true, // 스트리밍 방식으로 로드 (메모리 절약)
      onload: () => {
        console.log(`[Audio] BGM loaded: ${src}`);
        if (this.bgmEnabled) {
          this.currentBGM?.play();
        }
      },
      onloaderror: (id, error) => {
        console.warn(`[Audio] BGM load failed: ${id}`, error);
      },
      onplayerror: (id, error) => {
        // 사용자 인터랙션 없이 재생 시도 시 발생하는 에러는 조용히 무시
        console.debug(`[Audio] BGM play skipped: ${id}`, error);
      },
    });
  }

  /**
   * 여러 BGM을 교차로 재생
   * @param tracks BGM 파일 경로 배열
   */
  playAlternatingBGM(tracks: string[]): void {
    if (tracks.length === 0) {
      console.warn('[Audio] No tracks provided for alternating BGM');
      return;
    }

    // 교차 재생 모드 활성화
    this.isAlternatingMode = true;
    this.alternatingTracks = tracks;
    this.currentTrackIndex = 0;
    this.bgmWasPausedManually = false; // 새 BGM 시작 시 플래그 리셋

    // 첫 번째 트랙 재생
    this.playNextAlternatingTrack();
  }

  /**
   * 다음 교차 재생 트랙 재생 (내부 메서드)
   */
  private playNextAlternatingTrack(): void {
    if (!this.isAlternatingMode || this.alternatingTracks.length === 0) {
      return;
    }

    const currentTrack = this.alternatingTracks[this.currentTrackIndex];

    // 기존 BGM이 있으면 중지
    if (this.currentBGM) {
      try {
        this.currentBGM.stop();
        this.currentBGM.unload();
      } catch (error) {
        console.warn('[Audio] Failed to cleanup previous BGM:', error);
      }
    }

    this.currentBGM = new Howl({
      src: [currentTrack],
      loop: false, // 교차 재생이므로 개별 트랙은 반복하지 않음
      volume: this.bgmVolume,
      html5: true,
      onload: () => {
        console.log(
          `[Audio] Alternating BGM loaded (${this.currentTrackIndex + 1}/${this.alternatingTracks.length}): ${currentTrack}`
        );
        if (this.bgmEnabled) {
          this.currentBGM?.play();
        }
      },
      onend: () => {
        // 트랙 종료 시 다음 트랙으로 이동
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.alternatingTracks.length;
        console.log(
          `[Audio] Moving to next track (${this.currentTrackIndex + 1}/${this.alternatingTracks.length})`
        );
        this.playNextAlternatingTrack();
      },
      onloaderror: (id, error) => {
        console.warn(
          `[Audio] Alternating BGM load failed (${this.currentTrackIndex + 1}/${this.alternatingTracks.length}): ${id}`,
          error
        );
        // 에러 발생 시 다음 트랙으로 스킵 (무한 루프 방지)
        console.debug('[Audio] 로드 실패한 트랙 건너뛰기, 다음 트랙으로 이동');
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.alternatingTracks.length;
        // 모든 트랙이 실패하면 중단
        const nextTrack = this.alternatingTracks[this.currentTrackIndex];
        if (nextTrack !== currentTrack) {
          this.playNextAlternatingTrack();
        } else {
          console.warn('[Audio] 모든 교차 재생 트랙 로드 실패');
          this.isAlternatingMode = false;
        }
      },
      onplayerror: (id, error) => {
        // 사용자 인터랙션 없이 재생 시도 시 발생하는 에러는 조용히 무시
        console.debug(
          `[Audio] Alternating BGM play skipped (${this.currentTrackIndex + 1}/${this.alternatingTracks.length}): ${id}`,
          error
        );
        // 재생 에러 발생 시 다음 트랙으로 스킵
        console.debug('[Audio] 재생 실패한 트랙 건너뛰기, 다음 트랙으로 이동');
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.alternatingTracks.length;
        this.playNextAlternatingTrack();
      },
    });
  }

  /**
   * BGM 중지 (페이드 아웃 효과 포함)
   */
  stopBGM(fadeOut: boolean = true): void {
    // 교차 재생 모드 해제
    this.isAlternatingMode = false;
    this.alternatingTracks = [];
    this.currentTrackIndex = 0;

    if (this.currentBGM) {
      if (fadeOut && this.currentBGM.playing()) {
        // 페이드 아웃 후 중지 (참조 저장하여 다른 BGM과 충돌 방지)
        const bgmToStop = this.currentBGM;
        bgmToStop.fade(this.bgmVolume, 0, 500);
        this.currentBGM = null; // 즉시 null로 설정하여 새 BGM 재생 가능
        setTimeout(() => {
          bgmToStop.stop();
          bgmToStop.unload();
        }, 500);
        console.log('[Audio] BGM fading out');
      } else {
        // 즉시 중지
        this.currentBGM.stop();
        this.currentBGM.unload();
        this.currentBGM = null;
        console.log('[Audio] BGM stopped');
      }
    }
  }

  /**
   * SFX pool 정리 (메모리 관리)
   */
  clearSFXPool(): void {
    this.sfxPool.forEach((sfx) => {
      sfx.unload();
    });
    this.sfxPool.clear();
    console.log('[Audio] SFX pool cleared');
  }

  /**
   * BGM 파일 경로를 트랙 이름으로 재생
   */
  playBGMByTrack(track: BGMTrack, loop: boolean = true): void {
    const path = BGM_PATHS[track];
    this.playBGM(path, loop);
    // autoplay 차단 시 재시도를 위해 트랙 정보 저장
    this.pendingBGM = { track, loop };
  }

  /**
   * 대기 중인 BGM 재생 시도 (사용자 인터랙션 발생 시 호출)
   */
  retryPendingBGM(): boolean {
    if (!this.pendingBGM) {
      return false;
    }

    // 현재 BGM이 재생 중이면 재시도 불필요
    if (this.currentBGM && this.currentBGM.playing()) {
      this.pendingBGM = null;
      return false;
    }

    const { track, loop } = this.pendingBGM;
    this.pendingBGM = null; // 먼저 클리어하여 재귀 방지

    // playBGM 직접 호출 (playBGMByTrack 대신)
    const path = BGM_PATHS[track];
    this.playBGM(path, loop);
    return true;
  }

  /**
   * 여러 BGM 트랙을 교차로 재생
   */
  playAlternatingBGMByTracks(tracks: BGMTrack[]): void {
    const paths = tracks.map((track) => BGM_PATHS[track]);
    this.playAlternatingBGM(paths);
  }
}

// 싱글톤 인스턴스 export
export const audioManager = AudioManager.getInstance();
