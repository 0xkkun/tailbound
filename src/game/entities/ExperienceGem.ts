/**
 * 경험치 젬 - 적 처치 시 드랍되는 경험치 아이템
 */

import { Container, Graphics, Text } from 'pixi.js';

import { XP_BALANCE } from '@/config/balance.config';

import type { Player } from './Player';

export class ExperienceGem extends Container {
  // 경험치 량
  private value: number;

  // 상태
  public active: boolean = true;
  private lifetime: number;

  // 비주얼
  private gem!: Graphics;
  private glow!: Graphics;
  private text?: Text;

  // 애니메이션
  private animTime: number = 0;
  private magnetSpeed: number = 0;
  private isBeingCollected: boolean = false;

  constructor(x: number, y: number, value: number) {
    super();

    this.x = x;
    this.y = y;
    this.value = value;
    this.lifetime = XP_BALANCE.gemLifetime; // 120초(2분)

    // 비주얼 생성
    this.createVisual();

    // 디버그 모드에서 경험치 값 표시
    if (import.meta.env.DEV) {
      this.createDebugText();
    }
  }

  /**
   * 비주얼 생성
   */
  private createVisual(): void {
    // 발광 효과
    this.glow = new Graphics();
    this.addChild(this.glow);

    // 젬 본체
    this.gem = new Graphics();
    this.addChild(this.gem);

    this.updateVisual();
  }

  /**
   * 비주얼 업데이트 (경험치 양에 따라)
   */
  private updateVisual(): void {
    // 경험치 양에 따라 색상과 크기 결정
    let color: number;
    let glowColor: number;
    let size: number;

    if (this.value >= 100) {
      // 보스 경험치 (금색)
      color = 0xffd700;
      glowColor = 0xffff00;
      size = 15;
    } else if (this.value >= 25) {
      // 엘리트 경험치 (보라색)
      color = 0x9370db;
      glowColor = 0xda70d6;
      size = 12;
    } else {
      // 일반 경험치 (녹색)
      color = 0x00ff00;
      glowColor = 0x00ff00;
      size = 8;
    }

    // 발광 효과
    this.glow.clear();
    this.glow.beginFill(glowColor, 0.3);
    this.glow.drawCircle(0, 0, size * 2);
    this.glow.endFill();

    // 젬 본체 (육각형)
    this.gem.clear();
    this.gem.beginFill(color);
    this.drawHexagon(this.gem, size);
    this.gem.endFill();
  }

  /**
   * 육각형 그리기
   */
  private drawHexagon(graphics: Graphics, size: number): void {
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;

    graphics.moveTo(size, 0);
    for (let i = 1; i <= sides; i++) {
      const angle = angleStep * i;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      graphics.lineTo(x, y);
    }
    graphics.closePath();
  }

  /**
   * 디버그 텍스트 생성
   */
  private createDebugText(): void {
    this.text = new Text({
      text: `${this.value}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
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
    this.gem.rotation = Math.sin(this.animTime * 2) * 0.1;
    this.gem.scale.set(1 + Math.sin(this.animTime * 3) * 0.1);

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
    this.gem?.destroy();
    this.glow?.destroy();
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
