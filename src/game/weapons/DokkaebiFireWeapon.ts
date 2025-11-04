/**
 * 도깨비불 무기
 *
 * 타입: 궤도형 (Orbital)
 * 플레이어 주변을 맴도는 푸른 불꽃
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { WEAPON_BALANCE } from '@config/balance.config';
import { calculateWeaponStats } from '@game/data/weapons';
import type { BaseEnemy } from '@game/entities/enemies';
import { OrbitalEntity } from '@game/entities/OrbitalEntity';
import type { Player } from '@game/entities/Player';
import type { Vector2 } from '@type/game.types';
import type { Container } from 'pixi.js';

import { Weapon } from './Weapon';

export class DokkaebiFireWeapon extends Weapon {
  private orbitals: OrbitalEntity[] = [];
  private orbitalCount: number = 2; // 초기 개수 2개로 증가
  private orbitalRadius: number = WEAPON_BALANCE.dokkaebi_fire.orbitalRadius;
  private angularSpeed: number = WEAPON_BALANCE.dokkaebi_fire.baseAngularSpeed;

  constructor() {
    const stats = calculateWeaponStats('dokkaebi_fire', 1);
    super('도깨비불', stats.damage, stats.cooldown);
  }

  /**
   * 투사체형이 아니므로 fire는 빈 배열 반환
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public fire(_playerPos: Vector2, _enemies: BaseEnemy[], _player?: Player): never[] {
    return [];
  }

  /**
   * 궤도 생성 (무기 추가 시 또는 레벨업 시 호출)
   */
  public async spawnOrbitals(gameLayer: Container): Promise<void> {
    // 기존 궤도 제거
    for (const orbital of this.orbitals) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }
    this.orbitals = [];

    // 새 궤도 생성
    const angleStep = (Math.PI * 2) / this.orbitalCount;
    const config = WEAPON_BALANCE.dokkaebi_fire;
    const isMaxCount = this.orbitalCount >= config.maxOrbitalCount;

    // 레벨에 따른 깜박임 간격 계산 (레벨업할수록 짧아짐)
    const blinkOnDuration = Math.max(
      config.blinkOnDurationMin,
      config.blinkOnDurationBase - (this.level - 1) * config.levelScaling.blinkOnReductionPerLevel
    );
    const blinkOffDuration = Math.max(
      config.blinkOffDurationMin,
      config.blinkOffDurationBase - (this.level - 1) * config.levelScaling.blinkOffReductionPerLevel
    );

    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i;
      const orbital = new OrbitalEntity(
        angle,
        this.orbitalRadius,
        this.angularSpeed,
        0x00ffff // 청록색 (도깨비불)
      );
      orbital.damage = this.damage;
      orbital.radius = config.projectileRadius; // 히트박스 크기 설정 (스프라이트 로드 전에 설정)
      orbital.blinkEnabled = !isMaxCount; // 5개 이상이면 깜박임 비활성화
      orbital.blinkOnDuration = blinkOnDuration; // 레벨에 따라 조정된 간격
      orbital.blinkOffDuration = blinkOffDuration;

      // 도깨비불 스프라이트 로드 (6x5 = 30 프레임, 각 프레임 48x48)
      // radius 설정 후 로드하므로 스프라이트 크기가 radius에 맞춰짐
      await orbital.loadSpriteSheet(
        `${CDN_BASE_URL}/assets/weapon/dokkabi-fire.png`,
        48,
        48,
        30,
        6
      );

      this.orbitals.push(orbital);
      gameLayer.addChild(orbital);
    }

    const blinkStatus = isMaxCount
      ? '(항상 켜짐)'
      : `(${blinkOnDuration.toFixed(1)}초/${blinkOffDuration.toFixed(1)}초)`;
    console.log(`🔥 도깨비불 x${this.orbitalCount} 생성 ${blinkStatus}`);
  }

  /**
   * 매 프레임 업데이트
   */
  public updateOrbitals(deltaTime: number, player: Player): void {
    for (const orbital of this.orbitals) {
      orbital.update(deltaTime, player);
    }
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('dokkaebi_fire', this.level);
    this.damage = stats.damage;

    const config = WEAPON_BALANCE.dokkaebi_fire;

    // 레벨업 효과
    if (this.orbitalCount < config.maxOrbitalCount) {
      this.orbitalCount++; // 매 레벨마다 개수 +1 (최대 설정값까지)
    }

    if (this.level % config.levelScaling.radiusIncreaseInterval === 0) {
      this.orbitalRadius += config.levelScaling.radiusPerLevel;
    }

    // 레벨업 시 회전속도도 증가
    this.angularSpeed = Math.min(
      config.maxAngularSpeed,
      config.baseAngularSpeed + (this.level - 1) * config.levelScaling.angularSpeedPerLevel
    );

    // 최대 개수 도달 시 깜박임 비활성화
    const shouldDisableBlink = this.orbitalCount >= config.maxOrbitalCount;

    // 레벨에 따른 깜박임 간격 계산 (레벨업할수록 짧아짐)
    const blinkOnDuration = Math.max(
      config.blinkOnDurationMin,
      config.blinkOnDurationBase - (this.level - 1) * config.levelScaling.blinkOnReductionPerLevel
    );
    const blinkOffDuration = Math.max(
      config.blinkOffDurationMin,
      config.blinkOffDurationBase - (this.level - 1) * config.levelScaling.blinkOffReductionPerLevel
    );

    // 모든 궤도의 데미지, 회전속도, 깜박임 상태 업데이트
    for (const orbital of this.orbitals) {
      orbital.damage = this.damage;
      orbital.angularSpeed = this.angularSpeed;
      orbital.blinkEnabled = !shouldDisableBlink;
      orbital.blinkOnDuration = blinkOnDuration;
      orbital.blinkOffDuration = blinkOffDuration;
    }

    const blinkStatus = shouldDisableBlink
      ? '항상 켜짐'
      : `${blinkOnDuration.toFixed(1)}초/${blinkOffDuration.toFixed(1)}초`;
    console.log(
      `🔥 도깨비불 레벨 ${this.level}! (개수: ${this.orbitalCount}, 속도: ${this.angularSpeed.toFixed(1)}, ${blinkStatus})`
    );
  }

  /**
   * 궤도 접근자
   */
  public getOrbitals(): OrbitalEntity[] {
    return this.orbitals;
  }

  /**
   * 정리
   */
  public destroyOrbitals(gameLayer: Container): void {
    for (const orbital of this.orbitals) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }
    this.orbitals = [];
  }
}
