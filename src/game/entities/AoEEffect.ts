/**
 * 광역 공격 이펙트
 *
 * 일정 범위에 피해를 주는 AoE (Area of Effect) 엔티티
 * 사용: 목탁 소리, 폭발, 마법진 등
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

export class AoEEffect extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 100;

  private lifetime: number = 0;
  private maxLifetime: number = 0.5; // 0.5초 동안 표시
  private hitEnemies: Set<string> = new Set(); // 이미 맞힌 적 ID 추적 (한 번만 맞히는 AoE용)

  // 틱 데미지 시스템 (지속 데미지용)
  private tickInterval: number = 0; // 0이면 틱 데미지 사용 안 함
  private enemyLastHitTime: Map<string, number> = new Map(); // 각 적의 마지막 피해 시간

  // 시작 지연
  private startDelay: number = 0;
  private delayTimer: number = 0;
  private isStarted: boolean = false;

  // 시각 효과
  private visual: Graphics | AnimatedSprite;
  private color: number;
  private useSprite: boolean = false;

  // 따라다닐 대상
  private followTarget?: { x: number; y: number };

  constructor(x: number, y: number, radius: number, damage: number, color: number = 0xffa500) {
    super();

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;
    this.color = color;

    // 시각 효과 (확장되는 원)
    this.visual = new Graphics();
    this.addChild(this.visual);

    // 처음에는 숨김
    this.visible = false;

    this.render();
  }

  /**
   * 시작 지연 설정
   */
  public setStartDelay(delay: number): void {
    this.startDelay = delay;
  }

  /**
   * 틱 데미지 간격 설정 (0보다 크면 틱 데미지 활성화)
   */
  public setTickInterval(interval: number): void {
    this.tickInterval = interval;
  }

  /**
   * 따라다닐 대상 설정
   */
  public setFollowTarget(target: { x: number; y: number }): void {
    this.followTarget = target;
  }

  /**
   * 업데이트 (확장 애니메이션 + 페이드아웃)
   */
  public update(deltaTime: number): void {
    // 따라다닐 대상이 있으면 위치 업데이트
    if (this.followTarget) {
      this.x = this.followTarget.x;
      this.y = this.followTarget.y;
    }

    // 시작 지연 처리
    if (!this.isStarted) {
      this.delayTimer += deltaTime;
      if (this.delayTimer >= this.startDelay) {
        this.isStarted = true;
        this.visible = true;

        // 스프라이트 애니메이션이면 재생 시작
        if (this.visual instanceof AnimatedSprite) {
          this.visual.play();
        }
      } else {
        return; // 아직 시작 안 됨
      }
    }

    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 스프라이트 애니메이션 사용 시 페이드아웃만 적용
    if (this.useSprite) {
      const progress = this.lifetime / this.maxLifetime;
      // 페이드아웃 (100% -> 50%)
      this.alpha = 0.8 - progress * 0.4;
      return;
    }

    // Graphics 사용 시 기존 로직
    const progress = this.lifetime / this.maxLifetime;

    // 페이드아웃 효과
    this.alpha = 1 - progress;

    // 확장 애니메이션 (50% → 100%)
    const scale = 0.5 + progress * 0.5;
    this.scale.set(scale);
  }

  /**
   * 시각 효과 렌더링
   */
  private render(): void {
    if (this.visual instanceof Graphics) {
      this.visual.clear();

      // 반투명 채우기 + 외곽선
      this.visual.circle(0, 0, this.radius);
      this.visual.fill({ color: this.color, alpha: 0.3 });
      this.visual.circle(0, 0, this.radius);
      this.visual.stroke({ width: 4, color: this.color, alpha: 0.8 });
    }
  }

  /**
   * 특정 적이 이미 이 AoE에 맞았는지 확인 (한 번만 맞히는 AoE용)
   */
  public hasHitEnemy(enemyId: string): boolean {
    return this.hitEnemies.has(enemyId);
  }

  /**
   * 적을 맞힌 것으로 기록 (한 번만 맞히는 AoE용)
   */
  public markEnemyHit(enemyId: string): void {
    this.hitEnemies.add(enemyId);
  }

  /**
   * 틱 데미지: 적이 이번 틱에 데미지를 받을 수 있는지 확인
   */
  public canHitEnemyThisTick(enemyId: string): boolean {
    if (this.tickInterval <= 0) {
      // 틱 데미지 사용 안 함 - 한 번만 맞히는 로직 사용
      return !this.hasHitEnemy(enemyId);
    }

    const lastHitTime = this.enemyLastHitTime.get(enemyId) || 0;
    return this.lifetime - lastHitTime >= this.tickInterval;
  }

  /**
   * 틱 데미지: 적에게 피해를 준 시간 기록
   */
  public recordEnemyHit(enemyId: string): void {
    if (this.tickInterval > 0) {
      this.enemyLastHitTime.set(enemyId, this.lifetime);
    } else {
      // 틱 데미지 사용 안 함 - 한 번만 맞히는 로직 사용
      this.markEnemyHit(enemyId);
    }
  }

  /**
   * 이펙트가 시작되었는지 확인 (지연 후)
   */
  public isEffectStarted(): boolean {
    return this.isStarted;
  }

  /**
   * 스프라이트 시트를 애니메이션으로 로드
   */
  public async loadSpriteSheet(
    path: string,
    frameWidth: number,
    frameHeight: number,
    totalFrames: number,
    columns: number
  ): Promise<void> {
    try {
      const baseTexture = await Assets.load(path);

      // 프레임 텍스처 배열 생성
      const frames: Texture[] = [];
      for (let i = 0; i < totalFrames; i++) {
        const x = (i % columns) * frameWidth;
        const y = Math.floor(i / columns) * frameHeight;

        const frame = new Texture({
          source: baseTexture.source,
          frame: new Rectangle(x, y, frameWidth, frameHeight),
        });
        frames.push(frame);
      }

      // Graphics 제거하고 AnimatedSprite로 교체
      this.removeChild(this.visual);
      if (this.visual instanceof Graphics) {
        this.visual.destroy();
      }

      this.visual = new AnimatedSprite(frames);
      this.visual.anchor.set(0.5);
      this.visual.loop = false; // 한 번만 재생
      this.visual.animationSpeed = 0.8; // 애니메이션 속도
      this.visual.onComplete = () => {
        this.active = false; // 애니메이션 끝나면 비활성화
      };

      // 반지름에 맞춰 스케일 조정
      const spriteSize = Math.max(frameWidth, frameHeight);
      const targetScale = (this.radius * 2) / spriteSize;
      this.visual.scale.set(targetScale);

      // 지연이 없으면 바로 재생, 있으면 update에서 재생
      if (this.startDelay === 0) {
        this.visible = true;
        this.isStarted = true;
        this.visual.play();
      }

      this.addChild(this.visual);

      this.useSprite = true;
      this.maxLifetime = totalFrames / (60 * this.visual.animationSpeed); // 애니메이션 길이에 맞춤

      console.log(`AoE 이펙트 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('AoE 이펙트 스프라이트 시트 로드 실패:', error);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    super.destroy({ children: true });
  }
}
