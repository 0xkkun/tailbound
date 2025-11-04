/**
 * 궤도형 엔티티
 *
 * 플레이어 주변을 회전하며 적과 접촉 시 피해를 주는 엔티티
 * 사용: 도깨비불, 방어막 등
 */

import { TICK_DAMAGE_BALANCE } from '@config/balance.config';
import { AnimatedSprite, Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';

import type { Player } from './Player';

export class OrbitalEntity extends Container {
  public active: boolean = true;
  public damage: number = 10;
  public radius: number = 22.5; // 엔티티 크기 (충돌 판정) - 궤도 반경 비율에 맞춰 증가 (15 * 1.5 = 22.5)
  public angularSpeed: number; // 회전 속도 (rad/s) - public으로 변경

  private orbitAngle: number; // 현재 각도 (라디안)
  private orbitRadius: number; // 궤도 반경

  // 틱 데미지 시스템
  private tickInterval: number = TICK_DAMAGE_BALANCE.orbital; // 틱 간격
  private enemyLastHitTime: Map<string, number> = new Map(); // 각 적의 마지막 피해 시간
  private lifetime: number = 0; // 누적 시간

  // 깜박임 시스템 (최대 개수 전까지)
  public blinkEnabled: boolean = true; // 깜박임 활성화 여부
  public blinkOnDuration: number = 5.0; // 켜져있는 시간 (초) - 더 길게 조정
  public blinkOffDuration: number = 3.0; // 꺼져있는 시간 (초) - 더 길게 조정
  private blinkTimer: number = 0; // 깜박임 타이머
  private isBlinkOn: boolean = true; // 현재 켜짐 상태

  // 사라짐 애니메이션
  private fadeOutDuration: number = 0.5; // 페이드아웃 시간 (초)
  private fadeOutTimer: number = 0; // 페이드아웃 타이머
  private isFadingOut: boolean = false; // 페이드아웃 중

  // 시각화
  private orb: Graphics | Sprite | AnimatedSprite;

  constructor(angle: number, orbitRadius: number, angularSpeed: number, color: number = 0x00ffff) {
    super();

    this.orbitAngle = angle;
    this.orbitRadius = orbitRadius;
    this.angularSpeed = angularSpeed;

    // 플레이스홀더 그래픽 (이미지 없을 때)
    this.orb = new Graphics();
    (this.orb as Graphics).beginFill(color);
    (this.orb as Graphics).drawCircle(0, 0, this.radius);
    (this.orb as Graphics).endFill();
    this.addChild(this.orb);
  }

  /**
   * 플레이어 주변을 회전
   */
  public update(deltaTime: number, player: Player): void {
    // 누적 시간 증가
    this.lifetime += deltaTime;

    // 깜박임 처리
    if (this.blinkEnabled) {
      this.blinkTimer += deltaTime;

      if (this.isBlinkOn) {
        // 켜진 상태
        this.scale.set(1.0); // 정상 크기
        this.visible = true;
        this.isFadingOut = false;
        this.fadeOutTimer = 0;

        // 일정 시간이 지나면 페이드아웃 시작
        if (this.blinkTimer >= this.blinkOnDuration) {
          this.isBlinkOn = false;
          this.isFadingOut = true;
          this.blinkTimer = 0;
          this.fadeOutTimer = 0;
        }
      } else {
        // 꺼진 상태 또는 페이드아웃 중
        if (this.isFadingOut) {
          // 페이드아웃 애니메이션 (점점 작아짐)
          this.fadeOutTimer += deltaTime;
          const progress = Math.min(this.fadeOutTimer / this.fadeOutDuration, 1.0);
          const scale = 1.0 - progress; // 1.0 -> 0.0
          this.scale.set(scale);
          this.alpha = scale; // 투명도도 함께 감소

          if (progress >= 1.0) {
            // 페이드아웃 완료
            this.isFadingOut = false;
            this.visible = false;
            this.scale.set(1.0);
            this.alpha = 1.0;
          }
        } else {
          // 완전히 꺼진 상태
          this.visible = false;

          // 일정 시간이 지나면 다시 켜짐
          if (this.blinkTimer >= this.blinkOffDuration) {
            this.isBlinkOn = true;
            this.blinkTimer = 0;
          }
        }
      }
    } else {
      // 깜박임 비활성화 시 항상 표시
      this.visible = true;
      this.scale.set(1.0);
      this.alpha = 1.0;
    }

    // 각도 증가 (반시계 방향)
    this.orbitAngle += this.angularSpeed * deltaTime;

    // 각도가 2π를 넘으면 정규화
    if (this.orbitAngle > Math.PI * 2) {
      this.orbitAngle -= Math.PI * 2;
    }

    // 위치 계산 (플레이어 중심으로 회전)
    this.x = player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.y = player.y + Math.sin(this.orbitAngle) * this.orbitRadius;

    // 회전 애니메이션 (선택)
    this.rotation += deltaTime * 2;
  }

  /**
   * 적이 이번 틱에 데미지를 받을 수 있는지 확인
   */
  public canHitEnemy(enemyId: string): boolean {
    const lastHitTime = this.enemyLastHitTime.get(enemyId) || 0;
    return this.lifetime - lastHitTime >= this.tickInterval;
  }

  /**
   * 적에게 피해를 준 시간 기록
   */
  public recordEnemyHit(enemyId: string): void {
    this.enemyLastHitTime.set(enemyId, this.lifetime);
  }

  /**
   * 이미지 교체 (추후)
   */
  public async loadTexture(path: string): Promise<void> {
    try {
      const loadedTexture = await Assets.load(path);

      // Graphics 제거하고 Sprite로 교체
      this.removeChild(this.orb);
      (this.orb as Graphics).destroy();

      this.orb = new Sprite(loadedTexture);
      (this.orb as Sprite).anchor.set(0.5);
      this.addChild(this.orb);

      console.log(`궤도 엔티티 텍스처 로드: ${path}`);
    } catch (error) {
      console.warn('궤도 엔티티 텍스처 로드 실패:', error);
    }
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
      this.removeChild(this.orb);
      if (this.orb instanceof Graphics) {
        this.orb.destroy();
      }

      this.orb = new AnimatedSprite(frames);
      this.orb.anchor.set(0.5);
      (this.orb as AnimatedSprite).animationSpeed = 0.3; // 애니메이션 속도
      (this.orb as AnimatedSprite).play();
      this.addChild(this.orb);

      console.log(`궤도 엔티티 스프라이트 시트 로드: ${path}`);
    } catch (error) {
      console.warn('궤도 엔티티 스프라이트 시트 로드 실패:', error);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (this.orb) {
      this.orb.destroy();
    }
    super.destroy({ children: true });
  }
}
