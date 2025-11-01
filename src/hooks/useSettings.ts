/**
 * useSettings - 오디오 및 햅틱 설정 통합 Hook
 *
 * AudioManager와 HapticManager를 React에서 사용하기 위한 Hook입니다.
 * - 실시간 설정 상태 동기화
 * - 토글 및 볼륨 제어 메서드 제공
 */

import { useEffect, useState } from 'react';

import { audioManager } from '../services/audioManager';
import { hapticManager } from '../services/hapticManager';

interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

interface HapticSettings {
  enabled: boolean;
}

interface UseSettingsReturn {
  // Audio settings
  audio: AudioSettings;
  toggleBGM: () => void;
  toggleSFX: () => void;
  setBGMVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;

  // Haptic settings
  haptic: HapticSettings;
  toggleHaptic: () => void;
}

/**
 * 오디오 및 햅틱 설정을 관리하는 Hook
 *
 * @example
 * ```tsx
 * function SettingsScreen() {
 *   const { audio, haptic, toggleBGM, toggleHaptic, setBGMVolume } = useSettings();
 *
 *   return (
 *     <div>
 *       <Toggle checked={audio.bgmEnabled} onChange={toggleBGM} />
 *       <Slider value={audio.bgmVolume} onChange={setBGMVolume} />
 *       <Toggle checked={haptic.enabled} onChange={toggleHaptic} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useSettings(): UseSettingsReturn {
  // Audio state
  const [audio, setAudio] = useState<AudioSettings>({
    bgmEnabled: audioManager.isBGMEnabled(),
    sfxEnabled: audioManager.isSFXEnabled(),
    bgmVolume: audioManager.getBGMVolume(),
    sfxVolume: audioManager.getSFXVolume(),
  });

  // Haptic state
  const [haptic, setHaptic] = useState<HapticSettings>({
    enabled: hapticManager.isEnabled(),
  });

  // LocalStorage 변경 감지 (다른 탭/창에서 설정 변경 시)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('bgm_') || e.key?.startsWith('sfx_')) {
        setAudio((prev) => ({
          ...prev,
          bgmEnabled: audioManager.isBGMEnabled(),
          sfxEnabled: audioManager.isSFXEnabled(),
          bgmVolume: audioManager.getBGMVolume(),
          sfxVolume: audioManager.getSFXVolume(),
        }));
      }

      if (e.key === 'haptic_enabled') {
        setHaptic({
          enabled: hapticManager.isEnabled(),
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Audio control methods
  const toggleBGM = () => {
    const newState = audioManager.toggleBGM();
    setAudio((prev) => ({ ...prev, bgmEnabled: newState }));
  };

  const toggleSFX = () => {
    const newState = audioManager.toggleSFX();
    setAudio((prev) => ({ ...prev, sfxEnabled: newState }));
  };

  const setBGMVolume = (volume: number) => {
    audioManager.setBGMVolume(volume);
    setAudio((prev) => ({ ...prev, bgmVolume: volume }));
  };

  const setSFXVolume = (volume: number) => {
    audioManager.setSFXVolume(volume);
    setAudio((prev) => ({ ...prev, sfxVolume: volume }));
  };

  // Haptic control methods
  const toggleHaptic = () => {
    const newState = hapticManager.toggle();
    setHaptic({ enabled: newState });
  };

  return {
    audio,
    toggleBGM,
    toggleSFX,
    setBGMVolume,
    setSFXVolume,
    haptic,
    toggleHaptic,
  };
}
