/**
 * 투사체 엔티티 (무기가 발사하는 공격체)
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import { GAME_CONFIG } from '@/config/game.config';
import type { Vector2 } from '@/types/game.types';

import { Player } from './Player';

export class Projectile extends Container {
  public id: string;
  public active: boolean = true;
  public radius: number = 8;

  // 투사체 속성
  public damage: number = 15;
  public speed: number = 500; // 픽셀/초
  public lifeTime: number = 3; // 3초 후 자동 소멸
  private elapsedTime: number = 0;

  // 이동 방향
  private direction: Vector2;

  // 관통력
  public piercing: number = 1; // 1이면 적 1마리 관통 후 소멸, Infinity면 무제한
  private hitEnemies: Set<string> = new Set(); // 이미 맞힌 적 ID 기록

  // 관통 데미지 감소 시스템
  public damageDecayEnabled: boolean = false; // 관통 시 데미지 감소 활성화 여부
  public damageDecayMin: number = 0.33; // 최소 데미지 비율 (33%)
  private baseDamage: number = 15; // 초기 데미지 (감쇠 계산용)

  // 치명타 및 흡혈 (파워업 시스템)
  public isCritical: boolean = false; // 치명타 여부
  public playerRef?: Player; // Player 참조 (흡혈용)

  // 시각 효과
  private visual: Graphics | AnimatedSprite;

  constructor(id: string, x: number, y: number, direction: Vector2, color: number = 0xffff00) {
    super();

    this.id = id;
    this.direction = direction;
    this.x = x;
    this.y = y;

    // zIndex 설정
    this.zIndex = GAME_CONFIG.entities.projectile;

    // 그래픽 생성 (스프라이트 로드 전 폴백)
    this.visual = new Graphics();
    this.addChild(this.visual);

    this.render(color);
  }

  /**
   * 데미지 설정 (baseDamage도 함께 설정)
   */
  public setDamage(damage: number): void {
    this.damage = damage;
    this.baseDamage = damage;
  }

  /**
   * 현재 관통 횟수에 따른 실제 데미지 계산
   */
  public getCurrentDamage(): number {
    if (!this.damageDecayEnabled) {
      return this.damage;
    }

    const hitCount = this.hitEnemies.size;
    if (hitCount === 0) {
      return this.baseDamage;
    }

    // 선형 감소: 관통할 때마다 일정 비율 감소
    // 5회 관통 시 최소값(33%)에 도달하도록 설정
    const decayRate = (1 - this.damageDecayMin) / 5; // (1 - 0.33) / 5 = 0.134
    const damageMultiplier = Math.max(this.damageDecayMin, 1 - decayRate * hitCount);

    return this.baseDamage * damageMultiplier;
  }

  /**
   * 적 히트 처리 (관통 고려)
   */
  public hitEnemy(enemyId: string): void {
    this.hitEnemies.add(enemyId);

    // Infinity 관통이면 계속 날아감
    if (this.piercing === Infinity) {
      return;
    }

    // 관통 횟수 초과 시 비활성화
    if (this.hitEnemies.size >= this.piercing) {
      this.active = false;
    }
  }

  /**
   * 이미 맞힌 적인지 확인 (중복 피해 방지)
   */
  public hasHitEnemy(enemyId: string): boolean {
    return this.hitEnemies.has(enemyId);
  }

  /**
   * 적 히트 처리 (구버전 호환성 - deprecated)
   * @deprecated hitEnemy(enemyId)를 사용하세요
   */
  public onHit(): void {
    // 구버전 호환성을 위해 임시 ID 사용
    this.hitEnemy(`legacy_${this.hitEnemies.size}`);
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number): void {
    if (!this.active) {
      return;
    }

    // 이동
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;

    // 생명 시간 체크
    this.elapsedTime += deltaTime;
    if (this.elapsedTime >= this.lifeTime) {
      this.active = false;
    }
  }

  /**
   * 화면 밖 체크
   */
  public isOutOfBounds(width: number, height: number): boolean {
    // destroyed된 경우 안전하게 처리
    if (!this.active || this.destroyed) {
      return true;
    }

    return this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100;
  }

  /**
   * 렌더링
   */
  private render(color: number): void {
    if (this.destroyed || !(this.visual instanceof Graphics)) {
      return;
    }

    this.visual.clear();

    // 원형 투사체 (부적 이미지 대신)
    this.visual.beginFill(color);
    this.visual.drawCircle(0, 0, this.radius);
    this.visual.endFill();

    // 테두리
    this.visual.lineStyle(2, 0xffffff);
    this.visual.drawCircle(0, 0, this.radius);
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
      this.visual.animationSpeed = 0.5; // 애니메이션 속도
      this.visual.loop = true;
      this.visual.play();

      this.addChild(this.visual);

      console.log(`Projectile 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('Projectile 스프라이트 시트 로드 실패:', error);
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
