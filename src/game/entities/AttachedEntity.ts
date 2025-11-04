/**
 * 플레이어에 부착되는 엔티티 베이스 클래스
 *
 * 플레이어 주변 고정 위치에 배치되는 엔티티 (작두날, 방패 등)
 * OrbitalEntity와 달리 회전하지 않고 고정된 상대 위치를 유지
 */

import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Texture } from 'pixi.js';

import type { Player } from './Player';

export type AttachmentPosition = 'left' | 'right' | 'top' | 'bottom' | 'forward';

export interface AttachedEntityConfig {
  position: AttachmentPosition;
  offsetDistance: number;
  damage?: number;
  radius?: number;
  radiusX?: number; // 타원형 히트박스의 가로 반지름
  radiusY?: number; // 타원형 히트박스의 세로 반지름
  color?: number;
}

export class AttachedEntity extends Container {
  public active: boolean = true;
  public damage: number = 10;
  public radius: number = 64; // 충돌 판정 크기 (원형, 하위 호환)
  public radiusX: number = 64; // 타원형 히트박스의 가로 반지름
  public radiusY: number = 64; // 타원형 히트박스의 세로 반지름

  protected attachmentPosition: AttachmentPosition;
  protected offsetDistance: number;

  // 시각화
  protected visual: Graphics | AnimatedSprite;
  private hitboxGraphic?: Graphics; // 히트박스 시각화 (디버그용)

  // 공격 애니메이션 상태
  private isAttacking: boolean = false;
  private attackDuration: number = 0; // 공격 애니메이션 지속 시간
  private hitEnemies: Map<string, number> = new Map(); // 적 ID -> 타격 횟수
  private maxHitsPerEnemy: number = 2; // 적당 최대 타격 횟수

  constructor(config: AttachedEntityConfig) {
    super();

    this.attachmentPosition = config.position;
    this.offsetDistance = config.offsetDistance;
    this.damage = config.damage ?? 10;

    // 타원형 히트박스 설정
    if (config.radiusX !== undefined && config.radiusY !== undefined) {
      this.radiusX = config.radiusX;
      this.radiusY = config.radiusY;
      this.radius = Math.max(config.radiusX, config.radiusY); // 하위 호환용
    } else {
      this.radius = config.radius ?? 64;
      this.radiusX = this.radius;
      this.radiusY = this.radius;
    }

    const color = config.color ?? 0xff0000;

    // 플레이스홀더 그래픽 (이미지 없을 때)
    this.visual = new Graphics();
    (this.visual as Graphics).ellipse(0, 0, this.radiusX, this.radiusY);
    (this.visual as Graphics).fill(color);
    this.addChild(this.visual);

    // 히트박스 시각화 추가 (테스트 모드에서만)
    const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';
    if (isTestMode) {
      this.createHitboxGraphic();
    }
  }

  /**
   * 히트박스 시각화 생성 (디버그용)
   */
  private createHitboxGraphic(): void {
    this.hitboxGraphic = new Graphics();
    this.hitboxGraphic.ellipse(0, 0, this.radiusX, this.radiusY);
    this.hitboxGraphic.stroke({ width: 2, color: 0xff0000, alpha: 0.6 }); // 빨간색 테두리
    this.hitboxGraphic.ellipse(0, 0, this.radiusX, this.radiusY);
    this.hitboxGraphic.fill({ color: 0xff0000, alpha: 0.15 }); // 반투명 빨간색 채우기
    this.addChild(this.hitboxGraphic);
  }

  /**
   * 플레이어 기준 상대 위치 업데이트
   */
  public update(deltaTime: number, player: Player): void {
    const offset = this.calculateOffset(player);
    this.x = player.x + offset.x;
    this.y = player.y + offset.y;

    // forward 위치일 때 플레이어 좌우 방향에 따라 회전
    if (this.attachmentPosition === 'forward' && this.visual instanceof AnimatedSprite) {
      // 좌우만 판단 (위아래 무시)
      const isRight = player.lastDirection.x >= 0;
      this.visual.rotation = isRight ? Math.PI / 2 : -Math.PI / 2; // 오른쪽: 90도, 왼쪽: -90도
    }

    // 공격 애니메이션 처리
    if (this.isAttacking) {
      this.attackDuration -= deltaTime;
      if (this.attackDuration <= 0) {
        this.isAttacking = false;
        this.visible = false; // 공격 끝나면 숨김

        // 애니메이션 정지
        if (this.visual instanceof AnimatedSprite) {
          this.visual.stop();
          this.visual.currentFrame = 0;
        }
      }
    }

    // 서브클래스에서 추가 로직 구현 가능
    this.updateCustom(deltaTime, player);
  }

  /**
   * 공격 애니메이션 시작
   */
  public startAttack(duration: number = 0.3): void {
    this.isAttacking = true;
    this.attackDuration = duration;
    this.visible = true;

    // 새 공격 시작 시 타격 기록 초기화
    this.hitEnemies.clear();

    if (this.visual instanceof AnimatedSprite) {
      this.visual.gotoAndPlay(0);
    }
  }

  /**
   * 공격 중인지 확인
   */
  public isAttackActive(): boolean {
    return this.isAttacking;
  }

  /**
   * 적을 타격했는지 확인 (타격 횟수 제한)
   */
  public canHitEnemy(enemyId: string): boolean {
    const hitCount = this.hitEnemies.get(enemyId) ?? 0;
    return hitCount < this.maxHitsPerEnemy;
  }

  /**
   * 적 타격 기록
   */
  public recordHit(enemyId: string): void {
    const hitCount = this.hitEnemies.get(enemyId) ?? 0;
    this.hitEnemies.set(enemyId, hitCount + 1);
  }

  /**
   * 위치에 따른 오프셋 계산
   */
  protected calculateOffset(player: Player): { x: number; y: number } {
    switch (this.attachmentPosition) {
      case 'left':
        return { x: -this.offsetDistance, y: 0 };
      case 'right':
        return { x: this.offsetDistance, y: 0 };
      case 'top':
        return { x: 0, y: -this.offsetDistance };
      case 'bottom':
        return { x: 0, y: this.offsetDistance };
      case 'forward': {
        // 플레이어가 바라보는 좌우 방향으로만 오프셋 (위아래 무시)
        const horizontalDirection = player.lastDirection.x >= 0 ? 1 : -1;
        return {
          x: horizontalDirection * this.offsetDistance,
          y: 0,
        };
      }
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * 서브클래스에서 오버라이드 가능한 커스텀 업데이트
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected updateCustom(_deltaTime: number, _player: Player): void {
    // 서브클래스에서 구현
  }

  /**
   * 스프라이트 시트를 애니메이션으로 로드
   */
  public async loadSpriteSheet(
    path: string,
    frameWidth: number,
    frameHeight: number,
    totalFrames: number,
    columns: number,
    options?: {
      animationSpeed?: number;
      loop?: boolean;
      flipX?: boolean;
      flipY?: boolean;
      rotation?: number; // 라디안 단위
      scale?: number; // 스프라이트 크기 배율
      reverse?: boolean; // 프레임 역순 재생
    }
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

      // 역순 재생 옵션
      if (options?.reverse) {
        frames.reverse();
      }

      // Graphics 제거하고 AnimatedSprite로 교체
      this.removeChild(this.visual);
      if (this.visual instanceof Graphics) {
        this.visual.destroy();
      }

      this.visual = new AnimatedSprite(frames);
      this.visual.anchor.set(0.5);
      this.visual.animationSpeed = options?.animationSpeed ?? 0.5;
      this.visual.loop = options?.loop ?? false; // 기본적으로 한 번만 재생

      // 애니메이션 완료 콜백 - 마지막 프레임 잔상 제거
      this.visual.onComplete = () => {
        this.visible = false;
        this.isAttacking = false;
      };

      // 스케일 적용 (기본값 1)
      const baseScale = options?.scale ?? 1;

      // 좌우/상하 반전 (스케일 값에 방향 적용)
      const scaleX = (options?.flipX ? -1 : 1) * baseScale;
      const scaleY = (options?.flipY ? -1 : 1) * baseScale;
      this.visual.scale.set(scaleX, scaleY);

      // 회전 (라디안)
      if (options?.rotation !== undefined) {
        this.visual.rotation = options.rotation;
      }

      // 처음에는 보이지 않음 (공격할 때만 재생)
      this.visible = false;

      this.addChild(this.visual);

      console.log(`AttachedEntity 스프라이트 로드: ${path} (${this.attachmentPosition})`);
    } catch (error) {
      console.warn('AttachedEntity 스프라이트 로드 실패:', error);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.visual) {
      this.visual.destroy();
    }
    super.destroy({ children: true });
  }
}
