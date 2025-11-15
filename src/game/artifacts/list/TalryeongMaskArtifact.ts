/**
 * 탈령의 가면 유물
 * N마리 적 처치 시 5초간 버서커 모드 (통제 불가, 매우 강력함)
 */

import { CDN_ASSETS } from '@config/assets.config';
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import { getDistanceSquared } from '@game/utils/collision';
import type { LevelUpChoice } from '@systems/LevelSystem';
import gsap from 'gsap';
import { Graphics } from 'pixi.js';

import { BaseArtifact } from '../base/BaseArtifact';

export class TalryeongMaskArtifact extends BaseArtifact {
  // ====== 밸런스 상수 ======
  private readonly KILLS_REQUIRED = 50; // 50마리 처치 필요
  private readonly BERSERK_DURATION = 5.0; // 5초 지속
  private readonly BERSERK_COOLDOWN = 30.0; // 30초 재사용 대기
  private readonly DAMAGE_MULTIPLIER = 5.0; // 공격력 500% (매우 강력)
  private readonly SPEED_MULTIPLIER = 3; // 이동속도 300%
  private readonly COOLDOWN_MULTIPLIER = 0.5; // 쿨다운 50% (2배 빠름)
  private readonly MAX_HEALTH_MULTIPLIER = 3.0; // 최대 체력 300%
  private readonly HEALTH_AFTER_BERSERK = 50; // 버서커 종료 후 고정 체력

  // 상태 관리
  private killCount: number = 0;
  private isBerserk: boolean = false;
  private berserkTimer: number = 0;
  private berserkCooldownTimer: number = 0; // 버서커 재사용 대기시간

  // 시각 효과
  private auraEffect: Graphics | null = null;
  private originalPlayerTint: number = 0xffffff;

  // 원래 최대 체력 (버서커 해제 시 복구용)
  private originalMaxHealth: number = 0;

  // 성능 최적화: 타겟 캐싱
  private lastPathfindTime: number = 0;
  private cachedTarget: BaseEnemy | null = null;
  private readonly PATHFIND_INTERVAL = 0.1; // 100ms (10 FPS)

  // 레벨업 큐 (버서커 중 레벨업 저장)
  private pendingLevelUps: Array<{
    level: number;
    choices: LevelUpChoice[];
  }> = [];

  constructor() {
    super({
      id: 'talryeong_mask',
      name: '탈령의 가면',
      tier: 3,
      rarity: 'epic',
      category: 'offensive',
      description:
        '50마리 처치 시 5초간 조작 불가의 버서커 모드 진입 (종료 후 체력 50 고정, 재사용 30초)',
      iconPath: CDN_ASSETS.artifact.talryeongMask,
      color: 0x8b0000, // 다크 레드
      weaponCategories: [], // 플레이어 강화 (모든 무기)
    });
  }

  /**
   * 적 처치 시 호출
   */
  public onKill(enemy: BaseEnemy): void {
    // 버서커 모드 중에는 카운트 안함
    if (this.isBerserk) return;

    // 쿨다운 중에는 카운트 안함
    if (this.berserkCooldownTimer > 0) {
      if (import.meta.env.DEV) {
        console.log(`👹 [TalryeongMask] Cooldown: ${this.berserkCooldownTimer.toFixed(1)}초 남음`);
      }
      return;
    }

    // 처치 카운트 증가
    this.killCount++;

    if (import.meta.env.DEV) {
      console.log(`👹 [TalryeongMask] Kill count: ${this.killCount}/${this.KILLS_REQUIRED}`);
    }

    // N마리 달성 시 버서커 모드 활성화
    if (this.killCount >= this.KILLS_REQUIRED) {
      this.activateBerserk();
    }

    void enemy; // 미사용 경고 제거
  }

  /**
   * 매 프레임 업데이트
   */
  public update(delta: number): void {
    // 쿨다운 타이머 감소
    if (this.berserkCooldownTimer > 0) {
      this.berserkCooldownTimer -= delta;
    }

    // 버서커 모드가 아니면 조기 종료
    if (!this.isBerserk) return;

    // 버서커 타이머 감소
    this.berserkTimer -= delta;

    // 타이머 바 업데이트
    if (this.player && this.player.showBerserkTimer) {
      this.player.showBerserkTimer(this.berserkTimer, this.BERSERK_DURATION);
    }

    // 타이머 종료 시 버서커 해제
    if (this.berserkTimer <= 0) {
      this.deactivateBerserk();
    }

    // 버서커 모드: 자동으로 가장 가까운 적을 향해 돌진
    this.updateBerserkMovement();

    // 오오라 이펙트 업데이트 (맥동 효과)
    if (this.auraEffect && this.player) {
      this.auraEffect.x = this.player.x;
      this.auraEffect.y = this.player.y;
      this.auraEffect.alpha = 0.3 + Math.sin(performance.now() / 100) * 0.2;
    }
  }

  /**
   * 버서커 자동 이동 (가장 가까운 적에게 돌격)
   * 성능 최적화: 100ms마다만 타겟 재탐색 (10 FPS)
   */
  private updateBerserkMovement(): void {
    if (!this.player || !this.scene) return;

    const now = performance.now() / 1000; // 초 단위로 변환

    // 100ms마다 또는 타겟이 죽었을 때만 재탐색
    if (
      now - this.lastPathfindTime > this.PATHFIND_INTERVAL ||
      !this.cachedTarget?.isAlive() ||
      !this.cachedTarget?.active
    ) {
      this.cachedTarget = this.findNearestEnemy();
      this.lastPathfindTime = now;
    }

    // 타겟이 없으면 정지
    if (!this.cachedTarget) {
      this.player.setInput({ x: 0, y: 0 }, true);
      return;
    }

    // 타겟을 향한 방향 계산
    const dx = this.cachedTarget.x - this.player.x;
    const dy = this.cachedTarget.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.1) {
      // 거의 도착했으면 정지
      this.player.setInput({ x: 0, y: 0 }, true);
      return;
    }

    // 방향 정규화
    const dirX = dx / distance;
    const dirY = dy / distance;

    // 플레이어 입력 강제 설정 (force=true로 controlLocked 무시)
    this.player.setInput({ x: dirX, y: dirY }, true);
  }

  /**
   * 가장 가까운 적 찾기 (O(n) 탐색, sqrt 제거로 성능 최적화)
   */
  private findNearestEnemy(): BaseEnemy | null {
    if (!this.player || !this.scene) return null;

    const aliveEnemies = this.scene.enemies.filter((e) => e.isAlive() && e.active);

    if (aliveEnemies.length === 0) {
      return null;
    }

    let nearestEnemy = aliveEnemies[0];
    let minDistanceSquared = getDistanceSquared(this.player, nearestEnemy);

    for (let i = 1; i < aliveEnemies.length; i++) {
      const enemy = aliveEnemies[i];
      const distanceSquared = getDistanceSquared(this.player, enemy);
      if (distanceSquared < minDistanceSquared) {
        minDistanceSquared = distanceSquared;
        nearestEnemy = enemy;
      }
    }

    return nearestEnemy;
  }

  /**
   * 버서커 모드 활성화
   */
  private activateBerserk(): void {
    if (!this.player || !this.scene) return;

    if (import.meta.env.DEV) {
      console.log(`🔥 [TalryeongMask] BERSERK MODE ACTIVATED!`);
    }

    // 상태 설정
    this.isBerserk = true;
    this.berserkTimer = this.BERSERK_DURATION;
    this.killCount = 0; // 카운트 리셋

    // 원래 최대 체력 저장
    this.originalMaxHealth = this.player.maxHealth;

    // 최대 체력 증가 (300%)
    this.player.maxHealth = Math.floor(this.originalMaxHealth * this.MAX_HEALTH_MULTIPLIER);

    // 현재 체력을 새로운 최대 체력으로 회복
    this.player.health = this.player.maxHealth;

    if (import.meta.env.DEV) {
      console.log(
        `💪 [TalryeongMask] HP: ${this.originalMaxHealth} → ${this.player.maxHealth} (300%)`
      );
    }

    // 플레이어 스탯 버프 적용
    this.applyBerserkBuffs();

    // 시각 효과 적용
    this.applyBerserkVisuals();

    // 화면 효과 활성화 (레드 오버레이 + 카메라 쉐이크)
    if (this.scene?.startBerserkScreenEffect) {
      this.scene.startBerserkScreenEffect();
    }

    // 조작 불가 상태 활성화
    if (this.player.setControlLocked) {
      this.player.setControlLocked(true);
    }
  }

  /**
   * 버서커 모드 해제
   */
  private deactivateBerserk(): void {
    if (!this.player || !this.scene) return;

    if (import.meta.env.DEV) {
      console.log(`💤 [TalryeongMask] Berserk mode deactivated`);
    }

    // 상태 해제
    this.isBerserk = false;
    this.berserkTimer = 0;

    // 쿨다운 시작
    this.berserkCooldownTimer = this.BERSERK_COOLDOWN;
    if (import.meta.env.DEV) {
      console.log(`⏰ [TalryeongMask] Cooldown started: ${this.BERSERK_COOLDOWN}초`);
    }

    // 최대 체력 복구
    this.player.maxHealth = this.originalMaxHealth;

    // 현재 체력을 고정값(50)으로 설정 (단, maxHealth보다 크지 않게)
    this.player.health = Math.min(this.HEALTH_AFTER_BERSERK, this.player.maxHealth);

    if (import.meta.env.DEV) {
      console.log(
        `💔 [TalryeongMask] HP: ${this.player.health}/${this.player.maxHealth} (고정 50)`
      );
    }

    // 플레이어 스탯 버프 제거
    this.removeBerserkBuffs();

    // 시각 효과 제거
    this.removeBerserkVisuals();

    // 타이머 바 제거
    if (this.player.hideBerserkTimer) {
      this.player.hideBerserkTimer();
    }

    // 화면 효과 종료 (레드 오버레이 + 카메라 쉐이크)
    if (this.scene?.stopBerserkScreenEffect) {
      this.scene.stopBerserkScreenEffect();
    }

    // 조작 불가 상태 해제
    if (this.player.setControlLocked) {
      this.player.setControlLocked(false);
    }

    // 버서커 중 쌓인 레벨업 반환 (씬에서 처리)
    this.flushPendingLevelUps();
  }

  /**
   * 레벨업 큐에 추가 (버서커 중 호출)
   */
  public queueLevelUp(level: number, choices: LevelUpChoice[]): void {
    this.pendingLevelUps.push({ level, choices });

    if (import.meta.env.DEV) {
      console.log(
        `👹 [TalryeongMask] 레벨업 큐 추가: 레벨 ${level} (총 ${this.pendingLevelUps.length}개 대기)`
      );
    }
  }

  /**
   * 쌓인 레벨업 처리 (버서커 종료 후)
   */
  private flushPendingLevelUps(): void {
    if (this.pendingLevelUps.length === 0) return;

    if (import.meta.env.DEV) {
      console.log(`👹 [TalryeongMask] 버서커 종료 - ${this.pendingLevelUps.length}개 레벨업 처리`);
    }

    // 씬이 없으면 경고하고 큐만 비움
    if (!this.scene) {
      console.warn(
        `👹 [TalryeongMask] 씬이 없어 레벨업 큐를 처리할 수 없습니다. (${this.pendingLevelUps.length}개 레벨업 손실)`
      );
      this.pendingLevelUps = [];
      return;
    }

    // 씬의 onBerserkLevelUpsReady 콜백 호출
    this.scene.onBerserkLevelUpsReady?.(this.pendingLevelUps);

    // 큐 비우기
    this.pendingLevelUps = [];
  }

  /**
   * 버서커 스탯 버프 적용
   */
  private applyBerserkBuffs(): void {
    if (!this.player) return;

    // 스탯 배율 적용 (Player 클래스에 구현 필요)
    if (this.player.applyStatMultipliers) {
      this.player.applyStatMultipliers({
        damage: this.DAMAGE_MULTIPLIER,
        moveSpeed: this.SPEED_MULTIPLIER,
        cooldown: this.COOLDOWN_MULTIPLIER,
      });
    }
  }

  /**
   * 버서커 스탯 버프 제거
   */
  private removeBerserkBuffs(): void {
    if (!this.player) return;

    // 스탯 배율 제거 (원래대로)
    if (this.player.applyStatMultipliers) {
      this.player.applyStatMultipliers({
        damage: 1.0,
        moveSpeed: 1.0,
        cooldown: 1.0,
      });
    }
  }

  /**
   * 버서커 시각 효과 적용
   */
  private applyBerserkVisuals(): void {
    if (!this.player || !this.scene) return;

    // 플레이어 색상 변경 (빨간색)
    this.originalPlayerTint = this.player.tint;
    this.player.tint = 0xff0000;

    // 오오라 이펙트 생성
    this.auraEffect = new Graphics();
    this.auraEffect.circle(0, 0, 80);
    this.auraEffect.fill({ color: 0xff0000, alpha: 0.3 });
    this.auraEffect.x = this.player.x;
    this.auraEffect.y = this.player.y;
    this.auraEffect.zIndex = -1; // 플레이어 뒤에 표시

    this.scene.addChild(this.auraEffect);
  }

  /**
   * 버서커 시각 효과 제거
   */
  private removeBerserkVisuals(): void {
    if (!this.player) return;

    // 플레이어 색상 복구
    this.player.tint = this.originalPlayerTint;

    // 오오라 이펙트 제거
    if (this.auraEffect && !this.auraEffect.destroyed) {
      gsap.to(this.auraEffect, {
        alpha: 0,
        duration: 0.5,
        onComplete: () => {
          if (this.auraEffect && !this.auraEffect.destroyed) {
            this.auraEffect.destroy();
          }
          this.auraEffect = null;
        },
      });
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    // GSAP 애니메이션 즉시 종료 (메모리 릭 방지)
    if (this.auraEffect) {
      gsap.killTweensOf(this.auraEffect);
      if (!this.auraEffect.destroyed) {
        this.auraEffect.destroy();
      }
      this.auraEffect = null;
    }

    // 버서커 모드 강제 해제
    if (this.isBerserk) {
      this.deactivateBerserk();
    }

    super.cleanup();
  }

  /**
   * 버서커 모드 여부 반환 (디버그용)
   */
  public isBerserkMode(): boolean {
    return this.isBerserk;
  }

  /**
   * 현재 처치 카운트 반환 (UI용)
   */
  public getKillCount(): number {
    return this.killCount;
  }

  /**
   * 남은 버서커 시간 반환 (UI용)
   */
  public getBerserkTimeRemaining(): number {
    return this.berserkTimer;
  }
}
