/**
 * 도깨비불 무기
 *
 * 타입: 궤도형 (Orbital)
 * 플레이어 주변을 맴도는 푸른 불꽃
 */

import type { Container } from 'pixi.js';

import { calculateWeaponStats } from '@/game/data/weapons';
import type { BaseEnemy } from '@/game/entities/enemies';
import { OrbitalEntity } from '@/game/entities/OrbitalEntity';
import type { Player } from '@/game/entities/Player';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class DokkaebiFireWeapon extends Weapon {
  private orbitals: OrbitalEntity[] = [];
  private orbitalCount: number = 1;
  private orbitalRadius: number = 80;
  private angularSpeed: number = 3.5; // rad/s (2.0 -> 3.5로 75% 증가)

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
    const isMaxCount = this.orbitalCount >= 5; // 5개 도달 여부

    // 레벨에 따른 깜박임 간격 계산 (레벨업할수록 짧아짐)
    const blinkOnDuration = Math.max(2.0, 5.0 - (this.level - 1) * 1.0); // 최소 2.0초
    const blinkOffDuration = Math.max(1.2, 3.0 - (this.level - 1) * 0.6); // 최소 1.2초

    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i;
      const orbital = new OrbitalEntity(
        angle,
        this.orbitalRadius,
        this.angularSpeed,
        0x00ffff // 청록색 (도깨비불)
      );
      orbital.damage = this.damage;
      orbital.blinkEnabled = !isMaxCount; // 5개 이상이면 깜박임 비활성화
      orbital.blinkOnDuration = blinkOnDuration; // 레벨에 따라 조정된 간격
      orbital.blinkOffDuration = blinkOffDuration;

      // 도깨비불 스프라이트 로드 (6x5 = 30 프레임, 각 프레임 48x48)
      await orbital.loadSpriteSheet('/assets/weapon/dokkabi-fire.png', 48, 48, 30, 6);

      this.orbitals.push(orbital);
      gameLayer.addChild(orbital);
    }

    const blinkStatus = isMaxCount ? '(항상 켜짐)' : `(${blinkOnDuration.toFixed(1)}초/${blinkOffDuration.toFixed(1)}초)`;
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

    // 레벨업 효과
    if (this.orbitalCount < 5) {
      this.orbitalCount++; // 매 레벨마다 개수 +1 (최대 5개)
    }

    if (this.level % 3 === 0) {
      this.orbitalRadius += 10; // 3레벨마다 반경 +10
    }

    // 레벨업 시 회전속도도 증가 (레벨당 +0.1, 최대 5.5)
    this.angularSpeed = Math.min(5.5, 3.5 + (this.level - 1) * 0.1);

    // 5개 이상이면 깜박임 비활성화
    const shouldDisableBlink = this.orbitalCount >= 5;

    // 레벨에 따른 깜박임 간격 계산 (레벨업할수록 짧아짐)
    const blinkOnDuration = Math.max(2.0, 5.0 - (this.level - 1) * 1.0); // 최소 2.0초
    const blinkOffDuration = Math.max(1.2, 3.0 - (this.level - 1) * 0.6); // 최소 1.2초

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
