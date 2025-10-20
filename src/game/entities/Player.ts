/**
 * 플레이어 엔티티
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Text, Texture } from 'pixi.js';

import { PLAYER_BALANCE } from '@/config/balance.config';
import { GAME_CONFIG } from '@/config/game.config';
import { PLAYER_SPRITE_CONFIG } from '@/config/sprite.config';
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

  // 스탯 상한선
  private readonly MAX_DAMAGE_MULTIPLIER = 5.0; // 500% (5배)
  private readonly MAX_SPEED_MULTIPLIER = 2.0; // 200% (2배)
  private readonly MIN_COOLDOWN_MULTIPLIER = 0.3; // 30% (쿨타임 70% 감소)
  private readonly MAX_PICKUP_MULTIPLIER = 5.0; // 500% (5배)
  private readonly MAX_HEALTH = 500; // 최대 체력

  // 레벨 시스템
  private levelSystem: LevelSystem;
  private levelText: Text;

  // 그래픽스
  private graphics?: Graphics;
  private sprite?: AnimatedSprite;
  private frames: Texture[] = [];

  // 입력 상태
  private currentInput: InputState = { x: 0, y: 0 };
  private lastMovingState: boolean = false;

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

    // zIndex 설정
    this.zIndex = GAME_CONFIG.entities.player;

    // 레벨 시스템 초기화
    this.levelSystem = new LevelSystem();
    this.levelSystem.onLevelUp = (level, choices) => {
      console.log(`🎉 레벨업! Lv.${level}`);
      this.onLevelUp?.(level, choices);
    };

    // 그래픽 생성 (히트박스 표시용, 개발 모드에서만)
    if (import.meta.env.DEV) {
      this.graphics = new Graphics();
      this.addChild(this.graphics);
    }

    // 스프라이트 비동기 로드
    this.loadSprite();

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

    // 초기 디버그 렌더링 (스프라이트 로드 전 폴백)
    this.renderDebug();
  }

  /**
   * 스프라이트 비동기 로드
   */
  private async loadSprite(): Promise<void> {
    try {
      const texture = await Assets.load('/assets/shaman-walk.png');

      // 로드 중 destroy될 수 있으므로 체크
      if (this.destroyed) {
        console.log('Player destroyed during sprite load');
        return;
      }

      // 스프라이트시트를 프레임으로 분할 (가로로 나열됨)
      const frameCount = PLAYER_SPRITE_CONFIG.walk.frameCount;
      const frameWidth = texture.width / frameCount;
      const frameHeight = texture.height;

      for (let i = 0; i < frameCount; i++) {
        const frame = new Texture({
          source: texture.source,
          frame: new Rectangle(i * frameWidth, 0, frameWidth, frameHeight),
        });
        this.frames.push(frame);
      }

      // AnimatedSprite 생성
      this.sprite = new AnimatedSprite(this.frames);
      this.sprite.anchor.set(0.5); // 중심점을 중앙으로
      this.sprite.animationSpeed = PLAYER_SPRITE_CONFIG.walk.animationSpeed;
      this.sprite.loop = true;
      this.sprite.visible = true;
      this.sprite.alpha = 1.0;

      // graphics 아래에 추가되도록 보장
      if (this.graphics) {
        const graphicsIndex = this.getChildIndex(this.graphics);
        this.addChildAt(this.sprite, Math.max(0, graphicsIndex));
      } else {
        this.addChildAt(this.sprite, 0);
      }

      // graphics 정리 (스프라이트가 로드되었으므로)
      this.renderDebug();

      console.log('Player sprite loaded successfully:', {
        frameCount,
        width: frameWidth,
        height: frameHeight,
        textureWidth: texture.width,
        textureHeight: texture.height,
        spriteVisible: this.sprite.visible,
        spriteAlpha: this.sprite.alpha,
        childIndex: this.getChildIndex(this.sprite),
      });
    } catch (error) {
      console.error('Failed to load player sprite:', error);
      // 폴백: 기본 그래픽 렌더링 유지
    }
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

    // 스탯 적용 (상한선 체크)
    switch (statType) {
      case 'damage':
        if (this.damageMultiplier >= this.MAX_DAMAGE_MULTIPLIER) {
          console.log(`⚠️ 공격력이 최대치입니다! (${this.MAX_DAMAGE_MULTIPLIER * 100}%)`);
          return;
        }
        this.damageMultiplier = Math.min(
          this.damageMultiplier + increment,
          this.MAX_DAMAGE_MULTIPLIER
        );
        console.log(`⚔️ 공격력 증가! ${(this.damageMultiplier * 100).toFixed(0)}%`);
        break;
      case 'speed':
        if (this.speedMultiplier >= this.MAX_SPEED_MULTIPLIER) {
          console.log(`⚠️ 이동 속도가 최대치입니다! (${this.MAX_SPEED_MULTIPLIER * 100}%)`);
          return;
        }
        this.speedMultiplier = Math.min(
          this.speedMultiplier + increment,
          this.MAX_SPEED_MULTIPLIER
        );
        console.log(`🏃 이동 속도 증가! ${(this.speedMultiplier * 100).toFixed(0)}%`);
        break;
      case 'cooldown':
        if (this.cooldownMultiplier <= this.MIN_COOLDOWN_MULTIPLIER) {
          console.log(`⚠️ 쿨타임이 최소치입니다! (${this.MIN_COOLDOWN_MULTIPLIER * 100}%)`);
          return;
        }
        this.cooldownMultiplier = Math.max(
          this.cooldownMultiplier - increment,
          this.MIN_COOLDOWN_MULTIPLIER
        );
        console.log(`⚡ 쿨타임 감소! ${(this.cooldownMultiplier * 100).toFixed(0)}%`);
        break;
      case 'health': {
        if (this.maxHealth >= this.MAX_HEALTH) {
          console.log(`⚠️ 최대 체력이 한계입니다! (${this.MAX_HEALTH})`);
          return;
        }
        const healthIncrease = Math.min(increment, this.MAX_HEALTH - this.maxHealth);
        this.maxHealth += healthIncrease;
        this.health = Math.min(this.health + healthIncrease, this.maxHealth); // 회복 효과도
        console.log(`❤️ 최대 체력 증가! ${this.maxHealth}`);
        break;
      }
      case 'pickup':
        if (this.pickupRangeMultiplier >= this.MAX_PICKUP_MULTIPLIER) {
          console.log(`⚠️ 획득 범위가 최대치입니다! (${this.MAX_PICKUP_MULTIPLIER * 100}%)`);
          return;
        }
        this.pickupRangeMultiplier = Math.min(
          this.pickupRangeMultiplier + increment,
          this.MAX_PICKUP_MULTIPLIER
        );
        console.log(`🧲 획득 범위 증가! ${(this.pickupRangeMultiplier * 100).toFixed(0)}%`);
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
    const wasInvincible = this.invincibleTime > 0;
    if (this.invincibleTime > 0) {
      this.invincibleTime -= deltaTime;
    }
    const isInvincible = this.invincibleTime > 0;

    // 이동 여부 체크
    const isMoving = this.currentInput.x !== 0 || this.currentInput.y !== 0;

    // 이동 처리
    if (isMoving) {
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

      // 스프라이트 좌우 반전 (왼쪽: scale.x = -1, 오른쪽: scale.x = 1)
      if (this.sprite && normalizedX !== 0) {
        this.sprite.scale.x = normalizedX < 0 ? -1 : 1;
      }
    }

    // 애니메이션 상태 변경 시에만 play/stop
    if (isMoving !== this.lastMovingState) {
      if (isMoving && this.sprite) {
        this.sprite.play();
      } else if (this.sprite) {
        this.sprite.gotoAndStop(0);
      }
      this.lastMovingState = isMoving;
    }

    // 무적 상태 변경 시에만 시각 효과 업데이트
    if (wasInvincible !== isInvincible || isInvincible) {
      this.updateInvincibilityVisuals();
    }
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
   * 무적 시각 효과 업데이트
   */
  private updateInvincibilityVisuals(): void {
    if (!this.sprite) return;

    if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
      this.sprite.alpha = 0.5; // 깜빡임
    } else {
      this.sprite.alpha = 1.0; // 정상
    }
  }

  /**
   * 렌더링 (개발 모드 디버그용)
   */
  private renderDebug(): void {
    if (this.destroyed) {
      return;
    }

    // 스프라이트가 없으면 폴백 그래픽 표시
    if (!this.sprite && this.graphics) {
      this.graphics.clear();

      // 무적 시간이면 깜빡임 효과
      if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill({ color: 0xff5555, alpha: 0.5 });
      } else {
        this.graphics.circle(0, 0, this.radius);
        this.graphics.fill(0xff5555);
      }

      // 테두리
      this.graphics.circle(0, 0, this.radius);
      this.graphics.stroke({ width: 2, color: 0xffffff });
      // TODO: 히트박스 표시, 환경에 따라 결정
      // } else if (this.graphics && import.meta.env.DEV) {
      //   // 개발 모드에서 히트박스만 표시 (스프라이트가 있을 때)
      //   this.graphics.clear();
      //   this.graphics.circle(0, 0, this.radius);
      //   this.graphics.stroke({ width: 1, color: 0xff0000, alpha: 0.3 });
    } else if (this.graphics) {
      // 스프라이트가 있으면 graphics 제거
      this.graphics.clear();
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    // 텍스처 정리
    this.frames.forEach((frame) => frame.destroy(true));
    this.frames = [];

    // 그래픽 요소 정리
    this.graphics?.destroy();
    this.levelText.destroy();
    this.sprite?.destroy({ texture: false });

    super.destroy({ children: true });
  }
}
