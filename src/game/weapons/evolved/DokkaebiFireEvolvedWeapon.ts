/**
 * 도깨비불 진화 무기 - 금관총 금관
 *
 * 타입: 궤도형 (Orbital) - 안쪽/바깥쪽 이중 궤도
 * 진화 조건: 도깨비불 레벨 7 + 금관총 금관 유물 보유
 * 강화 효과: 데미지 150%, 이중 궤도(안쪽/바깥쪽), 회전 속도 증가
 */
import { CDN_ASSETS } from '@config/assets.config';
import { WEAPON_BALANCE, WEAPON_EVOLUTION_BALANCE } from '@config/balance.config';
import { calculateWeaponStats, WEAPON_DATA } from '@game/data/weapons';
import { OrbitalEntity } from '@game/entities/OrbitalEntity';
import type { Player } from '@game/entities/Player';
import { audioManager } from '@services/audioManager';
import type { Container } from 'pixi.js';

import { DokkaebiFireWeapon } from '../DokkaebiFireWeapon';

export class DokkaebiFireEvolvedWeapon extends DokkaebiFireWeapon {
  // 진화 무기 밸런스 (중앙 집중식 관리)
  private readonly balance = WEAPON_EVOLUTION_BALANCE.dokkaebi_fire;

  constructor(baseLevel: number = 7) {
    super();

    // 진화 무기 플래그 설정
    this.isEvolved = true;

    // 기존 레벨 복원
    this.level = baseLevel;

    // 스탯 업데이트
    this.updateEvolvedStats();

    // 이름 변경
    this.name = '금관총 금관';

    console.log(
      `✨ [DokkaebiFireEvolved] 도깨비불 진화! Lv.${this.level} (데미지: ${this.damage.toFixed(1)}, 이중 궤도)`
    );
  }

  /**
   * 진화 무기 스탯 업데이트 (공통 로직)
   */
  private updateEvolvedStats(): void {
    const stats = calculateWeaponStats('dokkaebi_fire', this.level);
    const config = WEAPON_BALANCE.dokkaebi_fire;

    // 데미지
    this.damage = stats.damage * this.balance.damageMultiplier;

    // 궤도 개수: 2개 시작 + 레벨당 +1 (각 궤도당)
    const baseCount = Math.min(2 + (this.level - 1), config.maxOrbitalCount);
    const maxCount = config.maxOrbitalCount + this.balance.maxOrbitalIncrease;
    this.orbitalCount = Math.min(baseCount + this.balance.orbitalIncrease, maxCount);

    // 회전 속도
    const baseSpeed = Math.min(
      config.maxAngularSpeed,
      config.baseAngularSpeed + (this.level - 1) * config.levelScaling.angularSpeedPerLevel
    );
    const maxSpeed = config.maxAngularSpeed * this.balance.maxSpeedMultiplier;
    this.angularSpeed = Math.min(baseSpeed * this.balance.speedMultiplier, maxSpeed);

    // 궤도 반지름
    const radiusSteps = Math.floor((this.level - 1) / config.levelScaling.radiusIncreaseInterval);
    this.orbitalRadius = config.orbitalRadius + radiusSteps * config.levelScaling.radiusPerLevel;
  }

  /**
   * 이중 궤도 생성 (진화 에셋 사용)
   * 안쪽 궤도: 시계방향 회전
   * 바깥쪽 궤도: 반시계방향 회전 (1.5배 반지름)
   */
  public async spawnOrbitals(gameLayer: Container): Promise<void> {
    // 기존 모든 궤도 제거 (부모 클래스의 orbitals 배열 사용)
    for (const orbital of this.getOrbitals()) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }

    const angleStep = (Math.PI * 2) / this.orbitalCount;
    const config = WEAPON_BALANCE.dokkaebi_fire;

    // 안쪽 궤도 생성 (시계방향)
    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i;
      const orbital = new OrbitalEntity(angle, this.orbitalRadius, this.angularSpeed, 0x00ffff);
      orbital.damage = this.damage;
      orbital.radius = config.projectileRadius;
      orbital.blinkEnabled = false; // 진화 무기는 항상 켜짐

      orbital.weaponCategories = WEAPON_DATA.dokkaebi_fire.categories;

      // 진화 에셋 사용
      await orbital.loadSpriteSheet(CDN_ASSETS.weapon.dokkabiFire_evolved, 48, 48, 30, 6);

      orbital.setOnHitSound(() => {
        audioManager.playDokkaebiFireSound();
      });

      // 부모 클래스의 getOrbitals()가 반환하는 배열에 추가
      this.getOrbitals().push(orbital);
      gameLayer.addChild(orbital);
    }

    // 바깥쪽 궤도 생성 (반시계방향, 1.5배 반지름)
    const outerRadius = this.orbitalRadius * this.balance.outerRadiusMultiplier;
    const outerAngularSpeed = -this.angularSpeed; // 반대 방향

    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i + angleStep * this.balance.outerAngleOffset; // 안쪽 궤도와 엇갈리게 시작
      const orbital = new OrbitalEntity(angle, outerRadius, outerAngularSpeed, 0x00ffff);
      orbital.damage = this.damage;
      orbital.radius = config.projectileRadius;
      orbital.blinkEnabled = false; // 진화 무기는 항상 켜짐

      orbital.weaponCategories = WEAPON_DATA.dokkaebi_fire.categories;

      // 진화 에셋 사용
      await orbital.loadSpriteSheet(CDN_ASSETS.weapon.dokkabiFire_evolved, 48, 48, 30, 6);

      orbital.setOnHitSound(() => {
        audioManager.playDokkaebiFireSound();
      });

      // 부모 클래스의 getOrbitals()가 반환하는 배열에 추가
      this.getOrbitals().push(orbital);
      gameLayer.addChild(orbital);
    }

    console.log(
      `🔥 [DokkaebiFireEvolved] 진화 궤도 생성 - 안쪽 x${this.orbitalCount} + 바깥쪽 x${this.orbitalCount} = 총 ${this.getOrbitals().length}개`
    );
  }

  /**
   * 레벨업 (진화 무기 배율 적용)
   */
  public levelUp(): void {
    this.level++;

    // 스탯 업데이트 (공통 로직 재사용)
    this.updateEvolvedStats();

    // 모든 궤도의 데미지와 회전속도 업데이트
    const orbitals = this.getOrbitals();
    const halfCount = orbitals.length / 2;

    for (let i = 0; i < orbitals.length; i++) {
      const orbital = orbitals[i];
      orbital.damage = this.damage;

      // 안쪽 궤도 (첫 번째 절반)
      if (i < halfCount) {
        orbital.angularSpeed = this.angularSpeed;
      } else {
        // 바깥쪽 궤도 (두 번째 절반) - 반대 방향
        orbital.angularSpeed = -this.angularSpeed;
      }
    }

    console.log(
      `✨ [DokkaebiFireEvolved] 레벨 ${this.level}! (데미지: ${this.damage.toFixed(1)}, 이중 궤도: ${this.orbitalCount}x2, 속도: ${this.angularSpeed.toFixed(2)})`
    );
  }

  /**
   * 매 프레임 업데이트
   */
  public updateOrbitals(deltaTime: number, player: Player): void {
    // 부모 클래스의 updateOrbitals 호출
    super.updateOrbitals(deltaTime, player);
  }

  /**
   * 진화 후 초기화 작업 (WeaponLifecycle 인터페이스 구현)
   */
  public async onAfterEvolution(gameLayer: Container): Promise<void> {
    await this.spawnOrbitals(gameLayer);
  }
}
