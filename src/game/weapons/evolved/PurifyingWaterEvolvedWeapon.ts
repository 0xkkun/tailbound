/**
 * 정화수 진화 무기 - 청자 상감운학문 매병
 *
 * 타입: 투척형 (Throwable)
 * 진화 조건: 정화수 레벨 7 + 청자 상감운학문 매병 유물 보유
 * 강화 효과: 데미지 140%, 범위 증가, 투척 개수 증가, 지속시간 증가, 플레이어 귀환
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE, WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import type { Player } from '@game/entities/Player';
import type { WaterBottle } from '@game/entities/WaterBottle';
import type { WaterSplash } from '@game/entities/WaterSplash';
import type { Vector2 } from '@type/game.types';

import { PurifyingWaterWeapon } from '../PurifyingWaterWeapon';

export class PurifyingWaterEvolvedWeapon extends PurifyingWaterWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.purifying_water;

  // 스플래시 추적 (귀환 메커니즘용) - private으로 encapsulation
  private activeSplashes: WaterSplash[] = [];
  private readonly MAX_SPLASH_TRACKING = 50; // 메모리 안전을 위한 최대 추적 개수

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '청자 상감운학문 매병';

    console.log(
      `✨ [PurifyingWaterEvolved] 정화수 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 투척: ${this.throwCount}, 범위: ${this.aoeRadius.toFixed(0)})`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('purifying_water', this.level);
    const config = WEAPON_BALANCE.purifying_water;

    // 데미지
    this.damage = stats.damage * this.balance.damageMultiplier;
    this.cooldown = stats.cooldown;

    // 투척 개수
    const throwSteps = Math.floor((this.level - 1) / config.levelScaling.throwCountInterval);
    const baseCount = Math.min(config.projectileCount + throwSteps, config.maxThrowCount);
    const maxCount = config.maxThrowCount + this.balance.maxThrowIncrease;
    this.throwCount = Math.min(baseCount + this.balance.throwIncrease, maxCount);

    // 범위
    const aoeSteps = Math.floor((this.level - 1) / config.levelScaling.aoeRadiusIncreaseInterval);
    const baseRadius = config.aoeRadius + aoeSteps * config.levelScaling.aoeRadiusPerLevel;
    this.aoeRadius = baseRadius * this.balance.aoeMultiplier;
  }

  /**
   * 물병 발사 (진화 에셋 적용)
   */
  public async fire(
    playerPos: Vector2,
    enemies: BaseEnemy[],
    player?: Player
  ): Promise<WaterBottle[]> {
    // 부모 클래스의 fire 호출
    const bottles = await super.fire(playerPos, enemies, player);

    // 진화 에셋으로 교체 (청자 매병 유물 아이콘 사용)
    for (const bottle of bottles) {
      await bottle.loadSprite(CDN_ASSETS.artifact.celadonCraneVase);
    }

    return bottles;
  }

  /**
   * 스플래시 생성 시 귀환 메커니즘 설정
   * (OverworldGameScene에서 호출)
   */
  public setupSplashReturn(splash: WaterSplash, player: Player): void {
    const config = WEAPON_BALANCE.purifying_water;

    // Proactive cleanup: 새 스플래시 추가 전 비활성 스플래시 정리
    this.cleanupSplashes();

    // 지속시간 증가 (balance config 사용)
    const extendedLifetime = config.splashLifetime * this.balance.lifetimeMultiplier;
    splash.setMaxLifetime(extendedLifetime);

    // 귀환 속도 설정 (balance config 사용)
    splash.setReturnSpeed(this.balance.returnSpeed);

    // 귀환 메커니즘 활성화
    splash.shouldReturnToPlayer = true;
    splash.playerRef = player;

    // 귀환 완료 콜백: self-removal + 로그
    splash.onReturnComplete = () => {
      this.removeSplashFromTracking(splash);
      console.log(`💧✨ [PurifyingWaterEvolved] 스플래시 귀환 완료!`);
    };

    this.activeSplashes.push(splash);

    // 메모리 안전: 최대 개수 초과 시 경고 (정상 플레이에서는 발생 안해야 함)
    if (this.activeSplashes.length > this.MAX_SPLASH_TRACKING) {
      console.warn(
        `[PurifyingWaterEvolved] activeSplashes exceeded ${this.MAX_SPLASH_TRACKING}, forcing cleanup`
      );
      this.cleanupSplashes();
    }
  }

  /**
   * 특정 스플래시를 추적 배열에서 제거
   */
  private removeSplashFromTracking(splash: WaterSplash): void {
    const index = this.activeSplashes.indexOf(splash);
    if (index > -1) {
      this.activeSplashes.splice(index, 1);
    }
  }

  /**
   * 비활성 스플래시 정리
   */
  public cleanupSplashes(): void {
    this.activeSplashes = this.activeSplashes.filter((splash) => splash.active);
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    console.log(
      `✨ [PurifyingWaterEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 투척: ${this.throwCount}, 범위: ${this.aoeRadius.toFixed(0)})`
    );
  }

  /**
   * 진화 전 정리 작업 (WeaponLifecycle 인터페이스)
   */
  public onBeforeEvolution?(): void {
    // 진화 시 기존 스플래시 정리
    this.activeSplashes = [];
    console.log(`🧹 [PurifyingWaterEvolved] 진화 전 정리 완료`);
  }

  /**
   * 진화 후 초기화 작업 (WeaponLifecycle 인터페이스)
   */
  public async onAfterEvolution?(): Promise<void> {
    // 진화 무기 초기 상태 설정
    console.log(`✨ [PurifyingWaterEvolved] 진화 완료 - 귀환 메커니즘 활성화`);
  }
}
