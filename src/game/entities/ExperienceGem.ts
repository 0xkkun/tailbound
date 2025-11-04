/**
 * 경험치 젬 - 적 처치 시 드랍되는 경험치 아이템
 */

import { XP_BALANCE } from '@config/balance.config';
import { GAME_CONFIG } from '@config/game.config';
import { DROP_SPRITE_CONFIG } from '@config/sprite.config';
import { AnimatedSprite, Container, Spritesheet, Text } from 'pixi.js';

import type { Player } from './Player';

export class ExperienceGem extends Container {
  // 경험치 량
  private value: number;

  // 상태
  public active: boolean = true;
  private lifetime: number;

  // 비주얼
  private sprite!: AnimatedSprite;
  private text?: Text;

  // 애니메이션
  private animTime: number = 0;
  private magnetSpeed: number = 0;
  private isBeingCollected: boolean = false;

  constructor(x: number, y: number, value: number, spritesheet: Spritesheet) {
    super();

    this.x = x;
    this.y = y;
    this.value = value;
    this.lifetime = XP_BALANCE.gemLifetime; // 120초(2분)

    // zIndex 설정 (적보다 낮게, 바닥보다는 높게)
    this.zIndex = GAME_CONFIG.entities.drops;

    // 비주얼 생성
    this.createVisual(spritesheet);

    // 디버그 모드에서 경험치 값 표시
    if (import.meta.env.DEV) {
      this.createDebugText();
    }
  }

  /**
   * 비주얼 생성
   */
  private createVisual(spritesheet: Spritesheet): void {
    // 스프라이트 애니메이션 생성
    const textures = spritesheet.animations['spirit-energy'];
    this.sprite = new AnimatedSprite(textures);

    // 애니메이션 설정
    this.sprite.animationSpeed = DROP_SPRITE_CONFIG.spiritEnergy.animationSpeed;
    this.sprite.anchor.set(0.5);
    this.sprite.play();

    // 경험치 양에 따라 크기 조정 (기존 크기: 일반 8px, 엘리트 12px, 보스 15px)
    // 스프라이트 원본 크기를 기준으로 목표 크기에 맞춰 스케일 조정
    const spriteWidth = this.sprite.width;
    let targetSize: number;

    if (this.value >= 100) {
      // 보스 경험치 (16px 반지름 -> 32px 직경)
      targetSize = 32;
    } else if (this.value >= 25) {
      // 엘리트 경험치 (12px 반지름 -> 24px 직경)
      targetSize = 24;
    } else {
      // 일반 경험치 (8px 반지름 -> 16px 직경)
      targetSize = 16;
    }

    const scale = targetSize / spriteWidth;
    this.sprite.scale.set(scale);

    this.addChild(this.sprite);
  }

  /**
   * 디버그 텍스트 생성
   */
  private createDebugText(): void {
    this.text = new Text({
      text: `${this.value}`,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.text.resolution = 2; // 고해상도 렌더링
    this.text.anchor.set(0.5);
    this.text.y = -20;
    this.addChild(this.text);
  }

  /**
   * 업데이트
   */
  public update(deltaTime: number, player: Player): void {
    if (!this.active) return;

    // 수명 감소
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }

    // 깜빡임 효과 (수명이 10초 미만일 때)
    if (this.lifetime < 10) {
      this.alpha = 0.5 + Math.sin(this.lifetime * 10) * 0.5;
    }

    // 애니메이션
    this.animTime += deltaTime;
    this.sprite.rotation = Math.sin(this.animTime * 2) * 0.1;

    // 플레이어와의 거리 계산
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 자석 범위 체크 (기본 80픽셀 * 플레이어 배율) - 한번 수집 시작하면 계속 추적
    const effectivePickupRadius = XP_BALANCE.pickupRadius * player.pickupRangeMultiplier;
    if (!this.isBeingCollected && distance < effectivePickupRadius) {
      this.isBeingCollected = true;
    }

    // 수집 중이면 플레이어에게 빨려들어감
    if (this.isBeingCollected) {
      // 자석 속도 빠르게 증가 (가속도: 2000)
      this.magnetSpeed = Math.min(this.magnetSpeed + deltaTime * 2000, XP_BALANCE.gemSpeed);

      const moveDistance = this.magnetSpeed * deltaTime;
      const ratio = Math.min(moveDistance / distance, 1); // ratio가 1을 넘지 않도록

      this.x += dx * ratio;
      this.y += dy * ratio;

      // 수집 중일 때 시각 효과
      this.scale.set(0.8 + Math.sin(this.animTime * 10) * 0.2);

      // 충분히 가까워지면 획득 (수집 거리: 60픽셀)
      if (distance < 60) {
        this.collect(player);
      }
    }
  }

  /**
   * 경험치 젬 수집
   */
  private collect(player: Player): void {
    if (!this.active) return;

    // 플레이어에게 경험치 부여
    player.gainExperience(this.value);

    // 수집 효과
    this.playCollectEffect();

    // 비활성화
    this.active = false;
  }

  /**
   * 수집 이펙트
   */
  private playCollectEffect(): void {
    // TODO: 파티클 효과 추가
    console.log(`💎 경험치 획득: +${this.value}XP`);
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.sprite?.destroy();
    this.text?.destroy();
    super.destroy();
  }

  // Getters
  public getValue(): number {
    return this.value;
  }

  public isActive(): boolean {
    return this.active;
  }
}
