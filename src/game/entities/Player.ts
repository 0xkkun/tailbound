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

  // 기존 스탯 배율 (업그레이드로 증가)
  public damageMultiplier: number = 1.0;
  public speedMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public pickupRangeMultiplier: number = 1.0;

  // 새로운 파워업 스탯 (⚔️ 공격)
  public criticalRate: number = 0; // 치명타 확률 (0.0 ~ 1.0)
  public criticalDamage: number = 1.5; // 치명타 배율 (기본 1.5배 = 150%)
  public areaMultiplier: number = 1.0; // 공격 범위 배수

  // 새로운 파워업 스탯 (💪 방어)
  public damageReduction: number = 0; // 피해 감소 (0.0 ~ 0.8)
  public healthRegen: number = 0; // 초당 체력 재생
  public lifeSteal: number = 0; // 흡혈 비율 (0.0 ~ 0.5)
  public shieldCooldown: number = 0; // 보호막 쿨타임 (0 = 비활성)
  public shieldTimer: number = 0; // 보호막 타이머
  public hasShield: boolean = false; // 현재 보호막 활성 여부
  public dodgeRate: number = 0; // 회피 확률 (0.0 ~ 0.75)

  // 새로운 파워업 스탯 (⚙️ 유틸)
  public xpMultiplier: number = 1.0; // 경험치 획득량 배수
  public dropRateMultiplier: number = 1.0; // 아이템 드롭률 배수
  public luckMultiplier: number = 1.0; // 높은 등급 확률 배수

  // 복합 파워업 타이머
  public breathingTimer: number = 0; // 호흡 타이머
  public breathingInterval: number = 0; // 호흡 주기 (0 = 비활성)
  public breathingHealAmount: number = 0; // 호흡 회복량
  public meditationEnabled: boolean = false; // 선정 활성화
  public stillTime: number = 0; // 정지 시간 누적
  public hasRevive: boolean = false; // 부활 가능 여부

  // 스탯 상한선
  private readonly MAX_DAMAGE_MULTIPLIER = 5.0; // 500% (5배)
  private readonly MAX_SPEED_MULTIPLIER = 2.0; // 200% (2배)
  private readonly MIN_COOLDOWN_MULTIPLIER = 0.3; // 30% (쿨타임 70% 감소)
  private readonly MAX_PICKUP_MULTIPLIER = 5.0; // 500% (5배)
  private readonly MAX_HEALTH = 500; // 최대 체력
  private readonly MAX_CRITICAL_RATE = 1.0; // 100% 치명타
  private readonly MAX_CRITICAL_DAMAGE = 6.5; // 기본 1.5 + 최대 5.0 = 650%
  private readonly MAX_AREA_MULTIPLIER = 3.0; // 300% (3배 크기)
  private readonly MAX_DAMAGE_REDUCTION = 0.8; // 최대 80% 감소
  private readonly MAX_HEALTH_REGEN = 10.0; // 최대 10 HP/s
  private readonly MAX_LIFE_STEAL = 0.5; // 최대 50%
  private readonly MIN_SHIELD_COOLDOWN = 5; // 최소 5초
  private readonly MAX_DODGE_RATE = 0.75; // 최대 75%
  private readonly MAX_XP_MULTIPLIER = 3.0; // 최대 300%
  private readonly MAX_DROP_RATE_MULTIPLIER = 3.0; // 최대 300%
  private readonly MAX_LUCK_MULTIPLIER = 2.0; // 최대 200%

  // 레벨 시스템
  private levelSystem: LevelSystem;
  private levelText: Text;

  // 그래픽스
  private graphics?: Graphics;
  private sprite?: AnimatedSprite;
  private frames: Texture[] = [];
  private shadow: Graphics; // 그림자
  private healthBarBg: Graphics; // 체력바 배경
  private healthBarFill: Graphics; // 체력바 채움
  private shieldIndicator: Graphics; // 보호막 표시

  // 입력 상태
  private currentInput: InputState = { x: 0, y: 0 };
  private lastMovingState: boolean = false;

  // 마지막 이동 방향 (작두 같은 무기가 바라보는 방향으로 사용)
  public lastDirection: { x: number; y: number } = { x: 1, y: 0 }; // 기본: 오른쪽

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

    // 그림자 생성 (가장 아래 레이어, 발밑에 배치)
    this.shadow = new Graphics();
    this.shadow.ellipse(
      this.radius * 0.02,
      this.radius * 0.8,
      this.radius * 0.6,
      this.radius * 0.18
    );
    this.shadow.fill({ color: 0x000000, alpha: 0.3 });
    this.addChild(this.shadow);

    // 체력바 생성 (캐릭터 위, 몹과 동일한 스타일)
    const healthBarWidth = this.radius * 2;
    const healthBarHeight = GAME_CONFIG.ui.healthBarHeight; // 몹과 동일한 두께
    const healthBarY = -this.radius - GAME_CONFIG.ui.healthBarOffset; // 캐릭터 위

    // 체력바 배경 (빨간색)
    this.healthBarBg = new Graphics();
    this.healthBarBg.rect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    this.healthBarBg.fill({ color: 0xff0000 });
    this.healthBarBg.visible = false; // 초기에는 숨김 (풀피)
    this.addChild(this.healthBarBg);

    // 체력바 채움 (녹색)
    this.healthBarFill = new Graphics();
    this.healthBarFill.rect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    this.healthBarFill.fill({ color: 0x00ff00 });
    this.healthBarFill.visible = false; // 초기에는 숨김 (풀피)
    this.addChild(this.healthBarFill);

    // 보호막 인디케이터 (체력바 왼쪽 위에 하늘색 원)
    this.shieldIndicator = new Graphics();
    this.shieldIndicator.circle(0, 0, 6); // 반지름 6px
    this.shieldIndicator.fill({ color: 0x00ffff }); // 하늘색
    this.shieldIndicator.stroke({ color: 0xffffff, width: 1.5 }); // 흰색 테두리
    this.shieldIndicator.x = -healthBarWidth / 2 - 10; // 체력바 왼쪽
    this.shieldIndicator.y = healthBarY + healthBarHeight / 2; // 체력바 중앙 높이
    this.shieldIndicator.visible = false; // 초기에는 숨김
    this.addChild(this.shieldIndicator);

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
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.levelText.resolution = 2; // 고해상도 렌더링
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
      const texture = await Assets.load('/assets/player/shaman-walk.png');

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
      // 이미지가 왼쪽으로 치우쳐 있어서 앵커를 조정 (0.5에서 0.4로)
      this.sprite.anchor.set(0.4, 0.5); // x축 앵커를 왼쪽으로 이동
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

    // 1. 회피 판정 (회피율이 있으면)
    if (this.dodgeRate > 0) {
      if (Math.random() < this.dodgeRate) {
        console.log(`🌀 회피! (${(this.dodgeRate * 100).toFixed(0)}%)`);
        this.showFloatingText('회피!', 0x00ffff, 16);
        return; // 완전 회피
      }
    }

    // 2. 보호막 체크 (호신부 파워업)
    if (this.hasShield) {
      this.hasShield = false; // 보호막 소모
      this.shieldTimer = 0; // 쿨타임 다시 시작
      this.shieldIndicator.visible = false; // 인디케이터 숨김
      this.showFloatingText('보호됨!', 0x00ffff, 16); // 텍스트 표시
      return; // 피해 완전 흡수
    }

    // 3. 피해 감소 적용 (강체 파워업)
    let finalDamage = amount;
    if (this.damageReduction > 0) {
      finalDamage *= 1 - this.damageReduction;
      // console.log(`🛡️ 피해 감소! ${amount.toFixed(1)} → ${finalDamage.toFixed(1)}`);
    }

    // 4. 최종 피해 적용
    this.health -= finalDamage;

    // 5. 부활 체크 (혼백 파워업)
    if (this.health <= 0) {
      if (this.hasRevive) {
        // 부활 발동
        this.health = this.maxHealth * 0.5; // 최대 체력 50%로 부활
        this.hasRevive = false; // 부활 소모
        this.invincibleTime = 2.0; // 2초 무적
        // console.log('👻 혼백 발동! 부활! (최대 체력 50%)');
        return;
      }

      this.health = 0;
    }

    // 무적 시간 활성화
    this.invincibleTime = this.invincibleDuration;

    console.log(
      `플레이어 피격! 데미지: ${finalDamage.toFixed(1)} | 체력: ${this.health.toFixed(0)}/${this.maxHealth}`
    );
  }

  /**
   * 경험치 획득
   */
  public gainExperience(amount: number): void {
    // 경험치 배수 적용 (수련 파워업)
    const finalAmount = amount * this.xpMultiplier;
    const leveledUp = this.levelSystem.gainXP(finalAmount);

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
   * 파워업 적용 (새로운 파워업 시스템)
   */
  public applyPowerup(powerupId: string): void {
    // ID 파싱: powerup_<type>_<rarity> 또는 powerup_<name>
    const parts = powerupId.split('_');
    if (parts.length < 2 || parts[0] !== 'powerup') {
      console.warn(`Invalid powerup ID: ${powerupId}`);
      return;
    }

    // 복합 파워업 (고정 ID)
    if (parts.length === 3 && parts[1] !== 'crit' && parts[1] !== 'damage') {
      this.applyHybridPowerup(powerupId);
      return;
    }

    const type = parts[1]; // crit, area, damage, health, life, shield, dodge, xp, drop, luck
    const subtype = parts[2]; // rate, damage, reduction, regen, steal 등
    const rarity = parts[3]; // common, rare, epic

    // ⚔️ 공격 강화
    if (type === 'crit') {
      if (subtype === 'rate') {
        // 치명타 확률
        const increments = { common: 0.05, rare: 0.1, epic: 0.2 };
        const increment = increments[rarity as keyof typeof increments];
        if (!increment) return;

        if (this.criticalRate >= this.MAX_CRITICAL_RATE) {
          console.log(`⚠️ 치명타 확률이 최대치입니다! (${this.MAX_CRITICAL_RATE * 100}%)`);
          return;
        }
        this.criticalRate = Math.min(this.criticalRate + increment, this.MAX_CRITICAL_RATE);
        console.log(`💥 치명타 확률 증가! ${(this.criticalRate * 100).toFixed(0)}%`);
      } else if (subtype === 'damage') {
        // 치명타 피해량
        const increments = { common: 0.2, rare: 0.5, epic: 1.0 };
        const increment = increments[rarity as keyof typeof increments];
        if (!increment) return;

        if (this.criticalDamage >= this.MAX_CRITICAL_DAMAGE) {
          console.log(`⚠️ 치명타 피해량이 최대치입니다! (${this.MAX_CRITICAL_DAMAGE * 100}%)`);
          return;
        }
        this.criticalDamage = Math.min(this.criticalDamage + increment, this.MAX_CRITICAL_DAMAGE);
        console.log(`💢 치명타 피해량 증가! ${(this.criticalDamage * 100).toFixed(0)}%`);
      }
    } else if (type === 'area') {
      // 공격 범위
      const increments = { common: 0.05, rare: 0.12, epic: 0.25 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.areaMultiplier >= this.MAX_AREA_MULTIPLIER) {
        console.log(`⚠️ 공격 범위가 최대치입니다! (${this.MAX_AREA_MULTIPLIER * 100}%)`);
        return;
      }
      this.areaMultiplier = Math.min(this.areaMultiplier + increment, this.MAX_AREA_MULTIPLIER);
      console.log(`🌊 공격 범위 증가! ${(this.areaMultiplier * 100).toFixed(0)}%`);
    }
    // 💪 생존/방어
    else if (type === 'damage' && subtype === 'reduction') {
      // 피해 감소
      const increments = { common: 0.03, rare: 0.08, epic: 0.15 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.damageReduction >= this.MAX_DAMAGE_REDUCTION) {
        console.log(`⚠️ 피해 감소가 최대치입니다! (${this.MAX_DAMAGE_REDUCTION * 100}%)`);
        return;
      }
      this.damageReduction = Math.min(this.damageReduction + increment, this.MAX_DAMAGE_REDUCTION);
      console.log(`🛡️ 피해 감소 증가! ${(this.damageReduction * 100).toFixed(0)}%`);
    } else if (type === 'health' && subtype === 'regen') {
      // 체력 재생
      const increments = { common: 0.2, rare: 0.5, epic: 1.0 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.healthRegen >= this.MAX_HEALTH_REGEN) {
        console.log(`⚠️ 체력 재생이 최대치입니다! (${this.MAX_HEALTH_REGEN}/s)`);
        return;
      }
      this.healthRegen = Math.min(this.healthRegen + increment, this.MAX_HEALTH_REGEN);
      console.log(`💚 체력 재생 증가! ${this.healthRegen.toFixed(1)}/s`);
    } else if (type === 'life' && subtype === 'steal') {
      // 흡혈
      const increments = { common: 0.02, rare: 0.05, epic: 0.1 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.lifeSteal >= this.MAX_LIFE_STEAL) {
        console.log(`⚠️ 흡혈이 최대치입니다! (${this.MAX_LIFE_STEAL * 100}%)`);
        return;
      }
      this.lifeSteal = Math.min(this.lifeSteal + increment, this.MAX_LIFE_STEAL);
      console.log(`🩸 흡혈 증가! ${(this.lifeSteal * 100).toFixed(0)}%`);
    } else if (type === 'shield') {
      // 보호막
      const cooldowns = { common: 30, rare: 20, epic: 10 };
      const cooldown = cooldowns[rarity as keyof typeof cooldowns];
      if (!cooldown) return;

      if (this.shieldCooldown > 0 && this.shieldCooldown <= this.MIN_SHIELD_COOLDOWN) {
        console.log(`⚠️ 보호막 쿨타임이 최소치입니다! (${this.MIN_SHIELD_COOLDOWN}초)`);
        return;
      }

      // 처음 획득 또는 쿨타임 감소
      if (this.shieldCooldown === 0) {
        this.shieldCooldown = cooldown;
        this.shieldTimer = cooldown; // 즉시 준비됨
        this.hasShield = true; // 즉시 보호막 1개 지급
        console.log(`🛡️ 보호막 획득! (${cooldown}초마다 발동, 즉시 1개 지급)`);
      } else {
        this.shieldCooldown = Math.max(cooldown, this.MIN_SHIELD_COOLDOWN);
        this.hasShield = true; // 보호막 업그레이드 시에도 1개 지급
        console.log(`🛡️ 보호막 쿨타임 감소! ${this.shieldCooldown}초 (보호막 1개 지급)`);
      }
    } else if (type === 'dodge') {
      // 회피
      const increments = { common: 0.03, rare: 0.07, epic: 0.15 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.dodgeRate >= this.MAX_DODGE_RATE) {
        console.log(`⚠️ 회피 확률이 최대치입니다! (${this.MAX_DODGE_RATE * 100}%)`);
        return;
      }
      this.dodgeRate = Math.min(this.dodgeRate + increment, this.MAX_DODGE_RATE);
      console.log(`🌀 회피 확률 증가! ${(this.dodgeRate * 100).toFixed(0)}%`);
    }
    // ⚙️ 유틸리티
    else if (type === 'xp' && subtype === 'gain') {
      // 경험치 획득량
      const increments = { common: 0.05, rare: 0.12, epic: 0.25 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.xpMultiplier >= this.MAX_XP_MULTIPLIER) {
        console.log(`⚠️ 경험치 배수가 최대치입니다! (${this.MAX_XP_MULTIPLIER * 100}%)`);
        return;
      }
      this.xpMultiplier = Math.min(this.xpMultiplier + increment, this.MAX_XP_MULTIPLIER);
      console.log(`📚 경험치 획득량 증가! ${(this.xpMultiplier * 100).toFixed(0)}%`);
    } else if (type === 'drop' && subtype === 'rate') {
      // 드롭률
      const increments = { common: 0.05, rare: 0.12, epic: 0.25 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.dropRateMultiplier >= this.MAX_DROP_RATE_MULTIPLIER) {
        console.log(`⚠️ 드롭률이 최대치입니다! (${this.MAX_DROP_RATE_MULTIPLIER * 100}%)`);
        return;
      }
      this.dropRateMultiplier = Math.min(
        this.dropRateMultiplier + increment,
        this.MAX_DROP_RATE_MULTIPLIER
      );
      console.log(`🎁 아이템 드롭률 증가! ${(this.dropRateMultiplier * 100).toFixed(0)}%`);
    } else if (type === 'luck') {
      // 행운 (높은 등급 확률)
      const increments = { common: 0.1, rare: 0.2, epic: 0.4 };
      const increment = increments[rarity as keyof typeof increments];
      if (!increment) return;

      if (this.luckMultiplier >= this.MAX_LUCK_MULTIPLIER) {
        console.log(`⚠️ 행운이 최대치입니다! (${this.MAX_LUCK_MULTIPLIER * 100}%)`);
        return;
      }
      this.luckMultiplier = Math.min(this.luckMultiplier + increment, this.MAX_LUCK_MULTIPLIER);
      console.log(`🍀 행운 증가! ${(this.luckMultiplier * 100).toFixed(0)}%`);
    } else {
      console.warn(`Unknown powerup type: ${type}_${subtype}`);
    }
  }

  /**
   * 복합 파워업 적용 (하이브리드)
   */
  private applyHybridPowerup(powerupId: string): void {
    switch (powerupId) {
      case 'powerup_inner_power': {
        // 내공: 공격력 +3%, 흡혈 +3%
        this.damageMultiplier = Math.min(this.damageMultiplier + 0.03, this.MAX_DAMAGE_MULTIPLIER);
        this.lifeSteal = Math.min(this.lifeSteal + 0.03, this.MAX_LIFE_STEAL);
        console.log(
          `🔥 내공 수련! 공격력 ${(this.damageMultiplier * 100).toFixed(0)}%, 흡혈 ${(this.lifeSteal * 100).toFixed(0)}%`
        );
        break;
      }
      case 'powerup_mental_technique': {
        // 심법: 치명타 확률 +7%, 쿨타임 -5%
        this.criticalRate = Math.min(this.criticalRate + 0.07, this.MAX_CRITICAL_RATE);
        this.cooldownMultiplier = Math.max(
          this.cooldownMultiplier - 0.05,
          this.MIN_COOLDOWN_MULTIPLIER
        );
        console.log(
          `✨ 심법 깨달음! 치명타 ${(this.criticalRate * 100).toFixed(0)}%, 쿨타임 ${(this.cooldownMultiplier * 100).toFixed(0)}%`
        );
        break;
      }
      case 'powerup_vitality': {
        // 정기: 최대 체력 +10, 재생 +0.3/s
        const healthIncrease = Math.min(10, this.MAX_HEALTH - this.maxHealth);
        this.maxHealth += healthIncrease;
        this.health = Math.min(this.health + healthIncrease, this.maxHealth);
        this.healthRegen = Math.min(this.healthRegen + 0.3, this.MAX_HEALTH_REGEN);
        console.log(`💪 정기 강화! 체력 ${this.maxHealth}, 재생 ${this.healthRegen.toFixed(1)}/s`);
        break;
      }
      case 'powerup_fortune': {
        // 운기: 드롭률 +15%, 치명타 +5%, 흡입 범위 +10%
        this.dropRateMultiplier = Math.min(
          this.dropRateMultiplier + 0.15,
          this.MAX_DROP_RATE_MULTIPLIER
        );
        this.criticalRate = Math.min(this.criticalRate + 0.05, this.MAX_CRITICAL_RATE);
        this.pickupRangeMultiplier = Math.min(
          this.pickupRangeMultiplier + 0.1,
          this.MAX_PICKUP_MULTIPLIER
        );
        console.log(
          `🌟 운기 상승! 드롭 ${(this.dropRateMultiplier * 100).toFixed(0)}%, 치명타 ${(this.criticalRate * 100).toFixed(0)}%, 흡입 ${(this.pickupRangeMultiplier * 100).toFixed(0)}%`
        );
        break;
      }
      case 'powerup_breathing': {
        // 호흡: 5초마다 체력 10 회복
        this.breathingInterval = 5;
        this.breathingHealAmount = 10;
        this.breathingTimer = 5; // 즉시 발동
        console.log(`🌬️ 호흡법 습득! 5초마다 체력 10 회복`);
        break;
      }
      case 'powerup_meditation': {
        // 선정: 정지 시 재생 +2/s, 쿨타임 -20%
        this.meditationEnabled = true;
        console.log(`🧘 선정 개방! 정지 시 재생 및 쿨타임 보너스`);
        break;
      }
      case 'powerup_revive': {
        // 혼백: 부활 1회
        if (this.hasRevive) {
          console.log(`⚠️ 이미 혼백을 보유하고 있습니다!`);
          return;
        }
        this.hasRevive = true;
        console.log(`👻 혼백 획득! 사망 시 1회 부활 (최대 체력 50%)`);
        break;
      }
      default:
        console.warn(`Unknown hybrid powerup: ${powerupId}`);
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

  /**
   * 치명타 판정 (무기가 호출)
   * @returns 치명타 여부와 최종 데미지 배율
   */
  public rollCritical(): { isCritical: boolean; damageMultiplier: number } {
    const isCritical = Math.random() < this.criticalRate;
    if (isCritical) {
      // 치명타 텍스트 표시
      this.showFloatingText('치명타!', 0xff0000, 18);
      return {
        isCritical: true,
        damageMultiplier: this.damageMultiplier * this.criticalDamage,
      };
    }
    return {
      isCritical: false,
      damageMultiplier: this.damageMultiplier,
    };
  }

  /**
   * 흡혈 처리 (무기가 피해를 입힌 후 호출)
   * @param damage 가한 피해량
   */
  public applyLifeSteal(damage: number): void {
    if (this.lifeSteal <= 0) return;

    const healAmount = damage * this.lifeSteal;
    this.heal(healAmount);
  }

  /**
   * 체력 회복 (상한선 체크)
   * @param amount 회복량
   */
  public heal(amount: number): void {
    if (amount <= 0) return;

    this.health = Math.min(this.health + amount, this.maxHealth);
    this.updateHealthBar();
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
   * 플로팅 텍스트 표시 (치명타, 회피 등)
   */
  private showFloatingText(text: string, color: number, fontSize: number = 16): void {
    const floatingText = new Text({
      text,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize,
        fill: color,
        fontWeight: 'bold',
      },
    });
    floatingText.resolution = 2;
    floatingText.anchor.set(0.5);
    floatingText.x = this.x;
    floatingText.y = this.y - 30; // 플레이어 위에 표시

    // 부모에 추가
    if (this.parent) {
      this.parent.addChild(floatingText);
    }

    // 애니메이션: 위로 올라가면서 페이드아웃
    const duration = 1.0; // 1초
    let elapsed = 0;
    const startY = floatingText.y;

    const animate = (delta: number) => {
      elapsed += delta;
      const progress = elapsed / duration;

      if (progress >= 1.0) {
        floatingText.destroy();
        return;
      }

      // 위로 올라가기
      floatingText.y = startY - progress * 50;
      // 페이드아웃
      floatingText.alpha = 1.0 - progress;
    };

    // Ticker에 애니메이션 등록
    floatingText.onRender = () => {
      animate(0.016); // 약 60fps
    };
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
      // 입력값의 방향만 추출 (크기는 무시하고 항상 일정한 속도로 이동)
      const inputLength = Math.sqrt(
        this.currentInput.x * this.currentInput.x + this.currentInput.y * this.currentInput.y
      );

      // 방향 정규화 (항상 길이 1로 만들어 속도를 일정하게 유지)
      const directionX = inputLength > 0 ? this.currentInput.x / inputLength : 0;
      const directionY = inputLength > 0 ? this.currentInput.y / inputLength : 0;

      // 스피드 배율 적용 (방향만 사용하므로 항상 동일한 속도)
      const effectiveSpeed = this.speed * this.speedMultiplier;
      this.x += directionX * effectiveSpeed * deltaTime;
      this.y += directionY * effectiveSpeed * deltaTime;

      // 마지막 이동 방향 저장
      this.lastDirection = { x: directionX, y: directionY };

      // 스프라이트 좌우 반전 (왼쪽: scale.x = -1, 오른쪽: scale.x = 1)
      if (this.sprite && directionX !== 0) {
        this.sprite.scale.x = directionX < 0 ? -1 : 1;
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

    // ===== 파워업 시스템 업데이트 =====

    // 1. 체력 재생 (회복 파워업)
    if (this.healthRegen > 0) {
      this.heal(this.healthRegen * deltaTime);
    }

    // 2. 호흡 시스템 (주기적 체력 회복)
    if (this.breathingInterval > 0) {
      this.breathingTimer += deltaTime;
      if (this.breathingTimer >= this.breathingInterval) {
        this.heal(this.breathingHealAmount);
        this.breathingTimer -= this.breathingInterval; // 누적 방지
        // console.log(`🌬️ 호흡 회복! +${this.breathingHealAmount} HP`);
      }
    }

    // 3. 보호막 시스템 (호신부 파워업)
    if (this.shieldCooldown > 0) {
      this.shieldTimer += deltaTime;
      if (this.shieldTimer >= this.shieldCooldown) {
        this.hasShield = true;
        this.shieldTimer = 0;
        // console.log('🛡️ 보호막 준비됨!');
      }
    }

    // 보호막 인디케이터 업데이트
    this.shieldIndicator.visible = this.hasShield;

    // 4. 선정 시스템 (정지 시 버프)
    if (this.meditationEnabled) {
      if (isMoving) {
        this.stillTime = 0; // 이동 중이면 초기화
      } else {
        this.stillTime += deltaTime;
        // 1초 이상 정지 시 선정 효과 발동 (쿨타임 -20%, 재생 +2/s)
        if (this.stillTime >= 1.0) {
          // 재생 보너스 (이미 위에서 healthRegen 적용됨, 추가 +2/s)
          this.heal(2.0 * deltaTime);
          // 쿨타임 보너스는 무기 시스템에서 player.stillTime 체크하여 적용
        }
      }
    }

    // 체력바 업데이트
    this.updateHealthBar();
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
   * 체력바 업데이트
   */
  private updateHealthBar(): void {
    const healthRatio = this.health / this.maxHealth;

    // 풀피면 체력바 숨김
    if (healthRatio >= 1.0) {
      this.healthBarBg.visible = false;
      this.healthBarFill.visible = false;
      return;
    }

    // 체력이 감소하면 체력바 표시
    this.healthBarBg.visible = true;
    this.healthBarFill.visible = true;

    // 체력바 크기 업데이트 (몹과 동일한 스타일)
    const healthBarWidth = this.radius * 2;
    const healthBarHeight = GAME_CONFIG.ui.healthBarHeight;
    const healthBarY = -this.radius - GAME_CONFIG.ui.healthBarOffset;

    // 체력바 배경 재렌더링 (보호막 활성 시 파란 테두리)
    this.healthBarBg.clear();
    this.healthBarBg.rect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    this.healthBarBg.fill({ color: 0xff0000 });

    // 보호막이 활성화되어 있으면 파란 테두리 추가
    if (this.hasShield) {
      this.healthBarBg.rect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
      this.healthBarBg.stroke({ color: 0x00bfff, width: 2 }); // 진한 하늘색 테두리
    }

    this.healthBarFill.clear();
    this.healthBarFill.rect(
      -healthBarWidth / 2,
      healthBarY,
      healthBarWidth * healthRatio,
      healthBarHeight
    );
    this.healthBarFill.fill({ color: 0x00ff00 });
  }

  /**
   * 체력바 숨기기 (게임오버 시)
   */
  public hideHealthBar(): void {
    this.healthBarBg.visible = false;
    this.healthBarFill.visible = false;
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
    this.shadow.destroy();
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.levelText.destroy();
    this.sprite?.destroy({ texture: false });

    super.destroy({ children: true });
  }
}
