/**
 * GameAnalytics Service
 *
 * 앱인토스(Apps in Toss) Analytics 통합을 위한 게임 분석 서비스입니다.
 * 모든 주요 게임 이벤트를 추적하고 로깅합니다.
 *
 * ⚠️ 중요: Analytics를 직접 import하지 마세요!
 * 항상 tossAppBridge의 safe wrapper 함수를 사용해야 합니다.
 *
 * @see docs/implementation/ANALYTICS_INTEGRATION.md
 */

import { ANALYTICS_CONFIG } from '@config/analytics.config';
import type { DeathCause } from '@type/game.types';
import { safeAnalyticsClick, safeAnalyticsImpression } from '@utils/tossAppBridge';

export class GameAnalytics {
  private static sessionStartTime: number | null = null;
  private static isInitialized = false;

  // 세션 추적 변수
  private static sessionId: string | null = null;
  private static sessionCounter: number = 0;
  private static eventSequence: number = 0;

  /**
   * Analytics 서비스 초기화
   * 앱 시작 시 한 번만 호출됩니다.
   */
  static initialize(): void {
    if (this.isInitialized) {
      console.warn('[GameAnalytics] Already initialized');
      return;
    }

    // 세션 ID 생성 (고유한 세션 식별자)
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 누적 플레이 횟수 (localStorage에서 불러오기)
    try {
      const storedCount = localStorage.getItem(ANALYTICS_CONFIG.STORAGE_KEYS.SESSION_COUNT);
      const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;

      // NaN 체크
      this.sessionCounter = isNaN(parsedCount) ? 1 : parsedCount + 1;

      localStorage.setItem(
        ANALYTICS_CONFIG.STORAGE_KEYS.SESSION_COUNT,
        this.sessionCounter.toString()
      );
    } catch (error) {
      // localStorage 사용 불가 시 (Private Browsing, SSR 등)
      console.warn('[GameAnalytics] localStorage unavailable:', error);
      this.sessionCounter = 1;
    }

    this.isInitialized = true;
    console.log('[GameAnalytics] Service initialized', {
      sessionId: this.sessionId,
      sessionNumber: this.sessionCounter,
    });

    // 앱 시작 노출 이벤트
    safeAnalyticsImpression({
      item_id: 'app_launch',
      screen: 'loading',
      ...this.getCommonParams(),
    });
  }

  /**
   * 공통 파라미터 반환
   * 모든 이벤트에 자동으로 포함됩니다.
   */
  private static getCommonParams(): {
    session_id: string | null;
    session_number: number;
    event_sequence: number;
    timestamp: number;
  } {
    return {
      session_id: this.sessionId,
      session_number: this.sessionCounter,
      event_sequence: ++this.eventSequence,
      timestamp: Date.now(),
    };
  }

  /**
   * 게임 시작 추적
   * 로비에서 게임 시작 버튼을 눌렀을 때 호출됩니다.
   */
  static trackGameStart(): void {
    this.sessionStartTime = Date.now();

    safeAnalyticsClick({
      button_name: 'game_start',
      screen: 'lobby',
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Game session started');
  }

  /**
   * 게임 종료 추적
   * 승리 또는 패배 시 호출됩니다.
   *
   * @param result - 게임 결과 ('victory' | 'defeat')
   * @param stats - 게임 통계
   */
  static trackGameEnd(
    result: 'victory' | 'defeat',
    stats: {
      survived_seconds: number;
      level: number;
      kills: number;
      score: number;
    }
  ): void {
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
      ...this.getCommonParams(),
    });

    console.log(`[GameAnalytics] Game ended: ${result}`, {
      duration,
      ...stats,
    });

    // 세션 시간 초기화
    this.sessionStartTime = null;
  }

  /**
   * 레벨업 선택 추적
   * 플레이어가 레벨업 시 무기/파워업을 선택했을 때 호출됩니다.
   *
   * @param choice_type - 선택 유형 ('weapon' | 'powerup')
   * @param choice_id - 선택한 아이템 ID
   * @param player_level - 현재 플레이어 레벨
   */
  static trackLevelUpChoice(
    choice_type: 'weapon' | 'powerup',
    choice_id: string,
    player_level: number
  ): void {
    safeAnalyticsClick({
      button_name: 'level_up_choice',
      screen: 'level_up_modal',
      choice_type,
      choice_id,
      player_level,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Level up choice:', {
      choice_type,
      choice_id,
      player_level,
    });
  }

  /**
   * 보스 등장 추적
   * 보스가 스폰되었을 때 호출됩니다.
   *
   * @param bossName - 보스 이름
   * @param playerLevel - 현재 플레이어 레벨
   */
  static trackBossAppear(bossName: string, playerLevel: number): void {
    safeAnalyticsImpression({
      item_id: `boss_${bossName}`,
      screen: 'game',
      boss_name: bossName,
      player_level: playerLevel,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Boss appeared:', {
      bossName,
      playerLevel,
    });
  }

  /**
   * 보스 처치 추적
   * 보스가 처치되었을 때 호출됩니다.
   *
   * @param bossName - 보스 이름
   * @param playerLevel - 현재 플레이어 레벨
   * @param timeToDefeat - 보스 처치까지 걸린 시간 (초)
   */
  static trackBossDefeated(bossName: string, playerLevel: number, timeToDefeat: number): void {
    safeAnalyticsClick({
      button_name: 'boss_defeated',
      screen: 'game',
      boss_name: bossName,
      player_level: playerLevel,
      time_to_defeat: timeToDefeat,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Boss defeated:', {
      bossName,
      playerLevel,
      timeToDefeat,
    });
  }

  /**
   * 설정 변경 추적
   * 플레이어가 설정을 변경했을 때 호출됩니다.
   *
   * @param setting_name - 설정 이름 ('bgm_volume' | 'sfx_volume' | 'vibration')
   * @param value - 변경된 값
   */
  static trackSettingsChange(
    setting_name: 'bgm_volume' | 'sfx_volume' | 'vibration',
    value: number | boolean
  ): void {
    safeAnalyticsClick({
      button_name: 'settings_change',
      screen: 'settings',
      setting_name,
      value: typeof value === 'boolean' ? (value ? 1 : 0) : value,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Settings changed:', {
      setting_name,
      value,
    });
  }

  /**
   * 무기 획득 추적
   * 플레이어가 새로운 무기를 획득했을 때 호출됩니다.
   *
   * @param weaponId - 무기 ID
   * @param playerLevel - 현재 플레이어 레벨
   */
  static trackWeaponAcquired(weaponId: string, playerLevel: number): void {
    safeAnalyticsImpression({
      item_id: `weapon_${weaponId}`,
      screen: 'game',
      weapon_id: weaponId,
      player_level: playerLevel,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Weapon acquired:', {
      weaponId,
      playerLevel,
    });
  }

  /**
   * 파워업 획득 추적
   * 플레이어가 파워업을 획득했을 때 호출됩니다.
   *
   * @param powerupId - 파워업 ID
   * @param playerLevel - 현재 플레이어 레벨
   */
  static trackPowerupAcquired(powerupId: string, playerLevel: number): void {
    safeAnalyticsImpression({
      item_id: `powerup_${powerupId}`,
      screen: 'game',
      powerup_id: powerupId,
      player_level: playerLevel,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Powerup acquired:', {
      powerupId,
      playerLevel,
    });
  }

  /**
   * 화면 노출 추적
   * 주요 화면이 표시되었을 때 호출됩니다.
   *
   * @param screen - 화면 이름
   */
  static trackScreenView(screen: string): void {
    safeAnalyticsImpression({
      item_id: `screen_${screen}`,
      screen,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Screen view:', screen);
  }

  /**
   * 커스텀 이벤트 추적
   * 특수한 게임 이벤트를 추적할 때 사용합니다.
   *
   * @param eventName - 이벤트 이름
   * @param params - 추가 파라미터
   */
  static trackCustomEvent(
    eventName: string,
    params: Record<string, string | number | boolean | null | undefined>
  ): void {
    safeAnalyticsClick({
      button_name: eventName,
      ...params,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Custom event:', eventName, params);
  }

  /**
   * 게임 오버 액션 추적
   * 게임 오버 화면에서 재시작 또는 로비 버튼을 눌렀을 때 호출됩니다.
   *
   * @param action - 액션 종류 ('restart' | 'lobby')
   * @param previousStats - 이전 게임 결과 통계
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

    console.log('[GameAnalytics] Game over action:', {
      action,
      ...previousStats,
    });
  }

  /**
   * 플레이어 사망 추적
   * 플레이어가 사망했을 때 호출됩니다.
   *
   * @param cause - 사망 원인 ('enemy_contact' | 'boss_projectile' | 'boss_dash' | 'boss_fire_aoe')
   * @param playerLevel - 사망 시 플레이어 레벨
   * @param survivedSeconds - 생존 시간 (초)
   */
  static trackPlayerDeath(
    cause: DeathCause | null,
    playerLevel: number,
    survivedSeconds: number
  ): void {
    safeAnalyticsClick({
      button_name: 'player_death',
      screen: 'game',
      death_cause: cause,
      player_level: playerLevel,
      survived_seconds: survivedSeconds,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Player death:', {
      cause,
      playerLevel,
      survivedSeconds,
    });
  }

  /**
   * 최종 빌드 스냅샷 추적
   * 게임 종료 시 플레이어의 최종 빌드를 기록합니다.
   *
   * @param buildSnapshot - 빌드 정보
   */
  static trackFinalBuild(buildSnapshot: {
    weapons: string[]; // 무기 ID 목록
    powerups: Record<string, number>; // 파워업 ID: 스택 수
    stats: {
      max_health: number;
      damage_multiplier: number;
      cooldown_multiplier: number;
      speed_multiplier: number;
      pickup_range_multiplier: number;
    };
  }): void {
    safeAnalyticsClick({
      button_name: 'final_build',
      screen: 'game_over',
      weapons: buildSnapshot.weapons.join(','),
      powerups: JSON.stringify(buildSnapshot.powerups),
      max_health: buildSnapshot.stats.max_health,
      damage_multiplier: buildSnapshot.stats.damage_multiplier,
      cooldown_multiplier: buildSnapshot.stats.cooldown_multiplier,
      speed_multiplier: buildSnapshot.stats.speed_multiplier,
      pickup_range_multiplier: buildSnapshot.stats.pickup_range_multiplier,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Final build:', buildSnapshot);
  }

  /**
   * 설정 모달 접근 추적
   * 설정 모달을 열었을 때 호출됩니다.
   *
   * @param source - 접근 경로 ('lobby' | 'game')
   */
  static trackSettingsModalOpen(source: 'lobby' | 'game'): void {
    safeAnalyticsImpression({
      item_id: 'settings_modal',
      screen: source,
      ...this.getCommonParams(),
    });

    console.log('[GameAnalytics] Settings modal opened from:', source);
  }
}
