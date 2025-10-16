/**
 * 플레이어 엔티티
 */

import { Container, Graphics, Text } from 'pixi.js';

import { PLAYER_BALANCE } from '@/config/balance.config';
import { LevelSystem, type LevelUpChoice } from '@/systems/LevelSystem';
import type { InputState } from '@/types/game.types';

export class Player extends Container {
  public id: string = 'player';
  public active: boolean = true;
  public radius: number = PLAYER_BALANCE.radius;

  // 스텟
  public health: number = PLAYER_BALANCE.health;
  public maxHealth: number = PLAYER_BALANCE.health;
  public speed: number = PLAYER_BALANCE.speed;

  // 스탯 배율 (업그레이드로 증가)
  public damageMultiplier: number = 1.0;
  public speedMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public pickupRangeMultiplier: number = 1.0;

  // 레벨 시스템
  private levelSystem: LevelSystem;
  private levelText: Text;

  // 그래픽스
  private graphics: Graphics;

  // 입력 상태
  private currentInput: InputState = { x: 0, y: 0 };

  // 무적 시간 (피격 후)
  private invincibleTime: number = 0;
  private invincibleDuration: number = PLAYER_BALANCE.invincibleDuration;

  // 콜백
  public onLevelUp?: (level: number, choices: LevelUpChoice[]) => void;

  constructor(x: number, y: number) {
    super();

    // PixiJS position 사용
    this.x = x;
    this.y = y;

    // 레벨 시스템 초기화
    this.levelSystem = new LevelSystem();
    this.levelSystem.onLevelUp = (level, choices) => {
      console.log(`🎉 레벨업! Lv.${level}`);
      this.onLevelUp?.(level, choices);
    };

    // 그래픽 생성
    this.graphics = new Graphics();
    this.addChild(this.graphics);

    // 레벨 텍스트
    this.levelText = new Text({
      text: 'Lv.1',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.levelText.anchor.set(0.5);
    this.levelText.y = -this.radius - 20;
    this.addChild(this.levelText);

    this.render();
  }

  /**
   * 입력 설정
   */
  public setInput(input: InputState): void {
    this.currentInput = input;
  }

  /**
   * 데미지 받기
   */
  public takeDamage(amount: number): void {
    // 무적 시간이면 무시
    if (this.invincibleTime > 0) {
      return;
    }

    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }

    // 무적 시간 활성화
    this.invincibleTime = this.invincibleDuration;

    console.log(`플레이어 피격! 체력: ${this.health}/${this.maxHealth}`);
  }

  /**
   * 경험치 획득
   */
  public gainExperience(amount: number): void {
    const leveledUp = this.levelSystem.gainXP(amount);

    if (leveledUp) {
      // 레벨업 효과
      this.playLevelUpEffect();
      // 레벨 텍스트 업데이트
      this.updateLevelText();
    }
  }

  /**
   * 레벨업 선택 처리
   */
  public selectLevelUpChoice(choiceId: string): void {
    this.levelSystem.selectChoice(choiceId);
  }

  /**
   * 스탯 업그레이드 적용
   */
  public applyStatUpgrade(statId: string): void {
    // 스탯 ID 파싱 (예: stat_damage_common -> damage, common)
    const parts = statId.split('_');
    if (parts.length !== 3 || parts[0] !== 'stat') {
      console.warn(`Invalid stat ID: ${statId}`);
      return;
    }

    const statType = parts[1]; // damage, speed, cooldown, health, pickup
    const rarity = parts[2]; // common, rare, epic

    // 등급별 증가량 정의
    const increments: Record<string, Record<string, number>> = {
      damage: { common: 0.02, rare: 0.05, epic: 0.1 },
      speed: { common: 0.03, rare: 0.07, epic: 0.15 },
      cooldown: { common: 0.02, rare: 0.05, epic: 0.1 },
      health: { common: 5, rare: 15, epic: 30 },
      pickup: { common: 0.05, rare: 0.15, epic: 0.3 },
    };

    const increment = increments[statType]?.[rarity];
    if (increment === undefined) {
      console.warn(`Unknown stat type or rarity: ${statType}, ${rarity}`);
      return;
    }

    // 스탯 적용
    switch (statType) {
      case 'damage':
        this.damageMultiplier += increment;
        console.log(`공격력 증가! ${(this.damageMultiplier * 100).toFixed(0)}%`);
        break;
      case 'speed':
        this.speedMultiplier += increment;
        console.log(`이동 속도 증가! ${(this.speedMultiplier * 100).toFixed(0)}%`);
        break;
      case 'cooldown':
        this.cooldownMultiplier -= increment; // 쿨타임은 감소
        console.log(`쿨타임 감소! ${(this.cooldownMultiplier * 100).toFixed(0)}%`);
        break;
      case 'health':
        this.maxHealth += increment;
        this.health = Math.min(this.health + increment, this.maxHealth); // 회복 효과도
        console.log(`최대 체력 증가! ${this.maxHealth}`);
        break;
      case 'pickup':
        this.pickupRangeMultiplier += increment;
        console.log(`획득 범위 증가! ${(this.pickupRangeMultiplier * 100).toFixed(0)}%`);
        break;
    }
  }

  /**
   * 레벨업 효과
   */
  private playLevelUpEffect(): void {
    // TODO: 파티클 효과 추가
    console.log('✨ 레벨업 효과!');
  }

  /**
   * 레벨 텍스트 업데이트
   */
  private updateLevelText(): void {
    const level = this.levelSystem.getLevel();
    this.levelText.text = `Lv.${level}`;
  }

  /**
   * 생존 여부
   */
  public isAlive(): boolean {
    return this.health > 0;
  }

  // Getters for level system
  public getLevel(): number {
    return this.levelSystem.getLevel();
  }

  public getLevelProgress(): number {
    return this.levelSystem.getProgress();
  }

  public getLevelSystem(): LevelSystem {
    return this.levelSystem;
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    // 무적 시간 감소
    if (this.invincibleTime > 0) {
      this.invincibleTime -= deltaTime;
    }

    // 이동 처리
    if (this.currentInput.x !== 0 || this.currentInput.y !== 0) {
      // 대각선 이동 시 속도 정규화
      const length = Math.sqrt(
        this.currentInput.x * this.currentInput.x + this.currentInput.y * this.currentInput.y
      );
      const normalizedX = length > 0 ? this.currentInput.x / length : 0;
      const normalizedY = length > 0 ? this.currentInput.y / length : 0;

      // 스피드 배율 적용
      const effectiveSpeed = this.speed * this.speedMultiplier;
      this.x += normalizedX * effectiveSpeed * deltaTime;
      this.y += normalizedY * effectiveSpeed * deltaTime;
    }

    // 렌더링 업데이트 (무적 시간 깜빡임)
    this.render();
  }

  /**
   * 화면 경계 제한
   */
  public clampToScreen(width: number, height: number): void {
    if (this.x - this.radius < 0) {
      this.x = this.radius;
    }
    if (this.x + this.radius > width) {
      this.x = width - this.radius;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
    }
    if (this.y + this.radius > height) {
      this.y = height - this.radius;
    }
  }

  /**
   * 렌더링
   */
  private render(): void {
    if (this.destroyed || !this.graphics) {
      return;
    }

    this.graphics.clear();

    // 무적 시간이면 깜빡임 효과
    if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
      // 깜빡임 (반투명)
      this.graphics.beginFill(0xff5555, 0.5);
    } else {
      // 일반 (빨간색)
      this.graphics.beginFill(0xff5555);
    }

    this.graphics.drawCircle(0, 0, this.radius);
    this.graphics.endFill();

    // 테두리
    this.graphics.lineStyle(2, 0xffffff);
    this.graphics.drawCircle(0, 0, this.radius);
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.graphics.destroy();
    this.levelText.destroy();
    super.destroy({ children: true });
  }
}
