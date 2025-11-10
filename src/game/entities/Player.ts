/**
 * 플레이어 엔티티
 */
import { CDN_ASSETS, CDN_BASE_URL } from '@config/assets.config';
import { PLAYER_BALANCE, POWERUP_BALANCE } from '@config/balance.config';
import { GAME_CONFIG } from '@config/game.config';
import { parsePowerupId, POWERUPS_CONFIG } from '@config/powerups.config';
import { PLAYER_SPRITE_CONFIG } from '@config/sprite.config';
import { hapticManager } from '@services/hapticManager';
import { LevelSystem, type LevelUpChoice } from '@systems/LevelSystem';
import type { DeathCause, InputState } from '@type/game.types';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Text, Texture } from 'pixi.js';

export class Player extends Container {
  public id: string = 'player';
  public active: boolean = true;
  public radius: number = PLAYER_BALANCE.radius;

  // 스텟
  public health: number = PLAYER_BALANCE.health;
  public maxHealth: number = PLAYER_BALANCE.health;
  public speed: number = PLAYER_BALANCE.speed;

  // 기존 스탯 배율 (업그레이드로 증가)
  public damageMultiplier: number = PLAYER_BALANCE.initialStats.damageMultiplier;
  public speedMultiplier: number = PLAYER_BALANCE.initialStats.speedMultiplier;
  public cooldownMultiplier: number = PLAYER_BALANCE.initialStats.cooldownMultiplier;
  public pickupRangeMultiplier: number = PLAYER_BALANCE.initialStats.pickupRangeMultiplier;

  // 새로운 파워업 스탯 (⚔️ 공격)
  public criticalRate: number = PLAYER_BALANCE.initialStats.criticalRate;
  public criticalDamage: number = PLAYER_BALANCE.initialStats.criticalDamage;

  // 새로운 파워업 스탯 (💪 방어)
  public damageReduction: number = PLAYER_BALANCE.initialStats.damageReduction;

  // 새로운 파워업 스탯 (⚙️ 유틸)
  public xpMultiplier: number = PLAYER_BALANCE.initialStats.xpMultiplier;

  // 호흡 파워업 (N초 동안 피격 없을 때 초당 최대 체력 % 회복)
  public healthRegenRate: number = 0; // 초당 회복률 (0.01 = 1%)
  private lastHitTime: number = 0; // 마지막 피격 시간 (초)
  private totalElapsedTime: number = 0; // 게임 시작 이후 경과 시간 (초)

  // 스탯 상한선 (balance.config.ts에서 관리)
  private readonly MAX_DAMAGE_MULTIPLIER = PLAYER_BALANCE.maxStats.damageMultiplier;
  private readonly MAX_SPEED_MULTIPLIER = PLAYER_BALANCE.maxStats.speedMultiplier;
  private readonly MIN_COOLDOWN_MULTIPLIER = PLAYER_BALANCE.minStats.cooldownMultiplier;
  private readonly MAX_PICKUP_MULTIPLIER = PLAYER_BALANCE.maxStats.pickupRangeMultiplier;
  private readonly MAX_HEALTH = PLAYER_BALANCE.maxStats.maxHealth;
  private readonly MAX_CRITICAL_RATE = PLAYER_BALANCE.maxStats.criticalRate;
  private readonly MAX_CRITICAL_DAMAGE = PLAYER_BALANCE.maxStats.criticalDamage;
  private readonly MAX_DAMAGE_REDUCTION = PLAYER_BALANCE.maxStats.damageReduction;
  private readonly MAX_XP_MULTIPLIER = PLAYER_BALANCE.maxStats.xpMultiplier;

  // 레벨 시스템
  private levelSystem: LevelSystem;
  private levelText: Text;

  // 그래픽스
  private graphics?: Graphics;
  private idleSprite?: AnimatedSprite;
  private walkSprite?: AnimatedSprite;
  private idleFrames: Texture[] = [];
  private walkFrames: Texture[] = [];
  private shadow: Graphics; // 그림자
  private healthBarBg: Graphics; // 체력바 배경
  private healthBarFill: Graphics; // 체력바 채움

  // 입력 상태
  private currentInput: InputState = { x: 0, y: 0 };
  private lastMovingState: boolean = false;

  // 마지막 이동 방향 (작두 같은 무기가 바라보는 방향으로 사용)
  public lastDirection: { x: number; y: number } = { x: 1, y: 0 }; // 기본: 오른쪽

  // 무적 시간 (피격 후)
  private invincibleTime: number = 0;
  private invincibleDuration: number = PLAYER_BALANCE.invincibleDuration;

  // 사망 원인 추적 (Analytics용)
  private lastDamageCause: DeathCause | null = null;

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
      // Idle 스프라이트 로드
      const idleTexture = await Assets.load(CDN_ASSETS.player.shamanIdle);

      // 로드 중 destroy될 수 있으므로 체크
      if (this.destroyed) {
        console.log('Player destroyed during sprite load');
        return;
      }

      // Idle 스프라이트시트를 프레임으로 분할
      const idleFrameCount = PLAYER_SPRITE_CONFIG.idle.frameCount;
      const idleFrameWidth = idleTexture.width / idleFrameCount;
      const idleFrameHeight = idleTexture.height;

      for (let i = 0; i < idleFrameCount; i++) {
        const frame = new Texture({
          source: idleTexture.source,
          frame: new Rectangle(i * idleFrameWidth, 0, idleFrameWidth, idleFrameHeight),
        });
        this.idleFrames.push(frame);
      }

      // Idle AnimatedSprite 생성
      this.idleSprite = new AnimatedSprite(this.idleFrames);
      this.idleSprite.anchor.set(0.5, 0.5);
      this.idleSprite.animationSpeed = PLAYER_SPRITE_CONFIG.idle.animationSpeed;
      this.idleSprite.loop = true;
      this.idleSprite.play();
      this.idleSprite.alpha = 1.0;

      // Walk 스프라이트 로드
      const walkTexture = await Assets.load(`${CDN_BASE_URL}/assets/player/shaman-walk.png`);

      if (this.destroyed) {
        console.log('Player destroyed during sprite load');
        return;
      }

      // Walk 스프라이트시트를 프레임으로 분할
      const walkFrameCount = PLAYER_SPRITE_CONFIG.walk.frameCount;
      const walkFrameWidth = walkTexture.width / walkFrameCount;
      const walkFrameHeight = walkTexture.height;

      for (let i = 0; i < walkFrameCount; i++) {
        const frame = new Texture({
          source: walkTexture.source,
          frame: new Rectangle(i * walkFrameWidth, 0, walkFrameWidth, walkFrameHeight),
        });
        this.walkFrames.push(frame);
      }

      // Walk AnimatedSprite 생성
      this.walkSprite = new AnimatedSprite(this.walkFrames);
      this.walkSprite.anchor.set(0.4, 0.5); // x축 앵커를 왼쪽으로 이동
      this.walkSprite.animationSpeed = PLAYER_SPRITE_CONFIG.walk.animationSpeed;
      this.walkSprite.loop = true;
      this.walkSprite.visible = false; // 초기에는 숨김
      this.walkSprite.alpha = 1.0;

      // graphics 아래에 추가되도록 보장
      const insertIndex = this.graphics ? Math.max(0, this.getChildIndex(this.graphics)) : 0;
      this.addChildAt(this.idleSprite, insertIndex);
      this.addChildAt(this.walkSprite, insertIndex);

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
  public takeDamage(amount: number, cause?: DeathCause): void {
    // 무적 시간이면 무시
    if (this.invincibleTime > 0) {
      return;
    }

    // 사망 원인 저장
    if (cause) {
      this.lastDamageCause = cause;
    }

    // 피해 감소 적용 (강체 파워업)
    let finalDamage = amount;
    if (this.damageReduction > 0) {
      finalDamage *= 1 - this.damageReduction;
      // console.log(`🛡️ 피해 감소! ${amount.toFixed(1)} → ${finalDamage.toFixed(1)}`);
    }

    // 최종 피해 적용
    this.health -= finalDamage;

    // 피격 시간 기록 (호흡 파워업용)
    this.lastHitTime = this.totalElapsedTime;

    if (this.health <= 0) {
      this.health = 0;
      // 사망 시 햅틱/오디오 피드백
      hapticManager.onPlayerDeath();
    } else {
      // 피격 시 햅틱/오디오 피드백
      hapticManager.onPlayerHit();
    }

    // 무적 시간 활성화
    this.invincibleTime = this.invincibleDuration;

    console.log(
      `플레이어 피격! 데미지: ${finalDamage.toFixed(1)} | 체력: ${this.health.toFixed(0)}/${this.maxHealth}${cause ? ` | 원인: ${cause}` : ''}`
    );
  }

  /**
   * 마지막 사망 원인 반환
   */
  public getLastDamageCause(): DeathCause | null {
    return this.lastDamageCause;
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
   * 파워업 적용 (통합된 파워업 시스템)
   *
   * @param powerupId - 파워업 ID (예: "powerup_damage_common", "stat_health_rare")
   *
   * 지원하는 ID 형식:
   * - 새 형식: powerup_<type>_<rarity> (예: powerup_damage_common)
   * - 구 형식: stat_<type>_<rarity> (호환성, 예: stat_damage_common)
   * - 언더스코어 타입: powerup_crit_rate_common, powerup_damage_reduction_epic
   */
  public applyPowerup(powerupId: string): void {
    // 파워업 ID 파싱 (헬퍼 함수 사용)
    const parsed = parsePowerupId(powerupId);
    if (!parsed) {
      console.warn(`Invalid powerup ID: ${powerupId}`);
      return;
    }

    const { type, rarity } = parsed;

    // 파워업 메타데이터 가져오기
    const powerupMeta = POWERUPS_CONFIG[type];
    const increment = powerupMeta.increment[rarity];

    // 각 파워업별 적용 로직
    switch (type) {
      // ⚔️ 공격 파워업
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

      case 'crit_rate':
        if (this.criticalRate >= this.MAX_CRITICAL_RATE) {
          console.log(`⚠️ 치명타 확률이 최대치입니다! (${this.MAX_CRITICAL_RATE * 100}%)`);
          return;
        }
        this.criticalRate = Math.min(this.criticalRate + increment, this.MAX_CRITICAL_RATE);
        console.log(`💥 치명타 확률 증가! ${(this.criticalRate * 100).toFixed(0)}%`);
        break;

      case 'crit_damage':
        if (this.criticalDamage >= this.MAX_CRITICAL_DAMAGE) {
          console.log(`⚠️ 치명타 피해량이 최대치입니다! (${this.MAX_CRITICAL_DAMAGE * 100}%)`);
          return;
        }
        this.criticalDamage = Math.min(this.criticalDamage + increment, this.MAX_CRITICAL_DAMAGE);
        console.log(`💢 치명타 피해량 증가! ${(this.criticalDamage * 100).toFixed(0)}%`);
        break;

      // 💪 방어 파워업
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

      case 'damage_reduction':
        if (this.damageReduction >= this.MAX_DAMAGE_REDUCTION) {
          console.log(`⚠️ 피해 감소가 최대치입니다! (${this.MAX_DAMAGE_REDUCTION * 100}%)`);
          return;
        }
        this.damageReduction = Math.min(
          this.damageReduction + increment,
          this.MAX_DAMAGE_REDUCTION
        );
        console.log(`🛡️ 피해 감소 증가! ${(this.damageReduction * 100).toFixed(0)}%`);
        break;

      case 'breathing':
        this.healthRegenRate += increment;
        console.log(
          `🌬️ 호흡 강화! 초당 최대 체력의 ${(this.healthRegenRate * 100).toFixed(1)}% 회복`
        );
        break;

      // ⚙️ 유틸리티 파워업
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

      case 'xp_gain':
        if (this.xpMultiplier >= this.MAX_XP_MULTIPLIER) {
          console.log(`⚠️ 경험치 배수가 최대치입니다! (${this.MAX_XP_MULTIPLIER * 100}%)`);
          return;
        }
        this.xpMultiplier = Math.min(this.xpMultiplier + increment, this.MAX_XP_MULTIPLIER);
        console.log(`📚 경험치 획득량 증가! ${(this.xpMultiplier * 100).toFixed(0)}%`);
        break;

      default:
        console.warn(`Unhandled powerup type: ${type}`);
    }
  }

  /**
   * @deprecated 하위 호환성을 위해 유지. applyPowerup() 사용 권장
   */
  public applyStatUpgrade(statId: string): void {
    this.applyPowerup(statId);
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

  public getTotalXP(): number {
    return this.levelSystem.getTotalXP();
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
    // 경과 시간 업데이트
    this.totalElapsedTime += deltaTime;

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
      if (directionX !== 0) {
        const scaleX = directionX < 0 ? -1 : 1;
        if (this.idleSprite) this.idleSprite.scale.x = scaleX;
        if (this.walkSprite) this.walkSprite.scale.x = scaleX;
      }
    }

    // 애니메이션 상태 변경 시 스프라이트 전환
    if (isMoving !== this.lastMovingState) {
      if (isMoving) {
        // 이동 시작: walk 스프라이트 표시, idle 숨김
        if (this.walkSprite) {
          this.walkSprite.visible = true;
          this.walkSprite.play();
        }
        if (this.idleSprite) {
          this.idleSprite.visible = false;
        }
      } else {
        // 정지: idle 스프라이트 표시, walk 숨김
        if (this.idleSprite) {
          this.idleSprite.visible = true;
          this.idleSprite.play();
        }
        if (this.walkSprite) {
          this.walkSprite.visible = false;
          this.walkSprite.gotoAndStop(0);
        }
      }
      this.lastMovingState = isMoving;
    }

    // 무적 상태 변경 시에만 시각 효과 업데이트
    if (wasInvincible !== isInvincible || isInvincible) {
      this.updateInvincibilityVisuals();
    }

    // ===== 파워업 시스템 업데이트 =====

    // 호흡 시스템 (피격 후 N초 이상 경과 시 초당 % 기반 체력 재생)
    if (this.healthRegenRate > 0) {
      const timeSinceLastHit = this.totalElapsedTime - this.lastHitTime;
      const regenDelay = POWERUP_BALANCE.breathing.regenDelay;

      if (timeSinceLastHit >= regenDelay) {
        const regenAmount = this.maxHealth * this.healthRegenRate * deltaTime;
        this.heal(regenAmount);
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
    const alpha =
      this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0 ? 0.5 : 1.0;

    if (this.idleSprite) this.idleSprite.alpha = alpha;
    if (this.walkSprite) this.walkSprite.alpha = alpha;
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

    // 체력바 배경 재렌더링
    this.healthBarBg.clear();
    this.healthBarBg.rect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    this.healthBarBg.fill({ color: 0xff0000 });

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
    if (!this.idleSprite && !this.walkSprite && this.graphics) {
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
    this.idleFrames.forEach((frame) => frame.destroy(true));
    this.walkFrames.forEach((frame) => frame.destroy(true));
    this.idleFrames = [];
    this.walkFrames = [];

    // 그래픽 요소 정리
    this.graphics?.destroy();
    this.shadow.destroy();
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.levelText.destroy();
    this.idleSprite?.destroy({ texture: false });
    this.walkSprite?.destroy({ texture: false });

    super.destroy({ children: true });
  }
}
