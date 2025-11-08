/**
 * 정화수 스플래시 이펙트
 *
 * 정화수가 착탄한 위치에서 범위 피해를 주는 엔티티
 */

import { WEAPON_BALANCE } from '@config/balance.config';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { BaseEnemy } from './enemies';
import type { Player } from './Player';

export class WaterSplash extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number;
  public isCritical: boolean = false;
  public playerRef?: Player;

  private lifetime: number = 0;
  private maxLifetime: number;
  private damageInterval: number; // 피해 주기
  private damageTimer: number = 0; // 피해 타이머
  private knockbackForce: number;
  private hasDealtInitialDamage: boolean = false; // 착지 즉시 데미지 처리 여부

  private visual: Graphics | AnimatedSprite;
  private color: number;
  private useSprite: boolean = false;

  constructor(x: number, y: number, radius: number, color: number = 0x00bfff) {
    super();

    const config = WEAPON_BALANCE.purifying_water;

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.maxLifetime = config.splashLifetime;
    this.damageInterval = config.damageInterval;
    this.knockbackForce = config.knockbackForce;

    // 시각 효과 (기본 원)
    this.visual = new Graphics();
    this.addChild(this.visual);

    this.render();
  }

  /**
   * 업데이트 (설치형 DoT 구역)
   * @returns 처치된 적 목록 (경험치 젬 드랍용)
   */
  public update(deltaTime: number, enemies: BaseEnemy[]): BaseEnemy[] {
    const killedEnemies: BaseEnemy[] = [];
    this.lifetime += deltaTime;

    // 수명 체크 (조기 리턴으로 불필요한 연산 방지)
    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return killedEnemies;
    }

    this.damageTimer += deltaTime;

    // 착지 즉시 데미지 처리 또는 피해 주기가 되었을 때 적 순회
    const shouldDealDamage = !this.hasDealtInitialDamage || this.damageTimer >= this.damageInterval;

    if (shouldDealDamage) {
      if (this.damageTimer >= this.damageInterval) {
        this.damageTimer = 0; // 타이머 리셋
      }
      this.hasDealtInitialDamage = true; // 초기 데미지 처리 완료 표시

      // 반지름 제곱 (Math.sqrt 연산 최소화)
      // NOTE: 원형 충돌 감지 사용. 복잡한 적 형태는 추후 AABB/Polygon 충돌로 업그레이드 가능
      const splashConfig = WEAPON_BALANCE.purifying_water;
      const enemyRadiusEstimate = splashConfig.enemyRadiusEstimate;
      const radiusSquared =
        (this.radius + enemyRadiusEstimate) * (this.radius + enemyRadiusEstimate);

      for (const enemy of enemies) {
        if (!enemy.active || !enemy.isAlive()) continue;

        // 거리 체크 (제곱 거리로 비교하여 Math.sqrt 최소화)
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= radiusSquared) {
          // 실제 거리 계산 (범위 내에 있을 때만)
          const distance = Math.sqrt(distanceSquared);

          if (distance <= this.radius + enemy.radius) {
            // 피해 적용 (DoT이므로 매 틱마다)
            enemy.takeDamage(this.damage, this.isCritical);

            // 적이 죽었는지 확인
            if (!enemy.isAlive()) {
              enemy.active = false;
              killedEnemies.push(enemy);
            }

            // 넉백 (약하게)
            const angle = Math.atan2(dy, dx);
            const knockbackDir = {
              x: Math.cos(angle),
              y: Math.sin(angle),
            };
            enemy.applyKnockback(knockbackDir, this.knockbackForce);
          }
        }
      }
    }

    // 페이드아웃 (설치형이므로 천천히)
    const progress = this.lifetime / this.maxLifetime;
    this.alpha = this.useSprite ? 1 - progress * 0.3 : 1 - progress * 0.5;

    return killedEnemies;
  }

  /**
   * 시각 효과 렌더링
   */
  private render(): void {
    if (this.visual instanceof Graphics) {
      this.visual.clear();
      this.visual.circle(0, 0, this.radius);
      this.visual.fill({ color: this.color, alpha: 0.5 });
      this.visual.circle(0, 0, this.radius);
      this.visual.stroke({ width: 3, color: this.color, alpha: 0.9 });
    }
  }

  /**
   * 스프라이트 시트 로드 (64x48, 16프레임)
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
      this.visual.loop = true; // 설치형이므로 계속 재생
      this.visual.animationSpeed = 0.2; // 애니메이션 속도 (살짝 느리게)

      // 반지름에 맞춰 스케일 조정
      const spriteSize = Math.max(frameWidth, frameHeight);
      const targetScale = (this.radius * 2) / spriteSize;
      this.visual.scale.set(targetScale);

      this.visual.play();
      this.addChild(this.visual);

      this.useSprite = true;
      // maxLifetime은 config에서 이미 설정되어 있으므로 변경하지 않음 (5초)

      console.log(`💧 정화수 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('정화수 스프라이트 시트 로드 실패:', error);
    }
  }

  /**
   * 완료 여부
   */
  public isComplete(): boolean {
    return !this.active;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.visual.destroy();
    super.destroy({ children: true });
  }
}
