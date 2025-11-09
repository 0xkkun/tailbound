/**
 * 게임 오브젝트 타입 정의
 */

import { Container } from 'pixi.js';

/**
 * 2D 벡터 (위치, 속도 등에 사용)
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * 게임 오브젝트 베이스 인터페이스
 * PixiJS Container를 상속하므로 position은 Container의 것을 사용
 */
export interface GameObject {
  id: string;
  active: boolean;
  radius: number; // 충돌 감지용

  // 위치 접근 메서드 (PixiJS position과 호환)
  getPosition(): Vector2;

  update(deltaTime: number): void;
  destroy(): void;
}

/**
 * 입력 상태 (키보드/터치)
 */
export interface InputState {
  x: number; // -1 (왼쪽) ~ 0 (정지) ~ 1 (오른쪽)
  y: number; // -1 (위) ~ 0 (정지) ~ 1 (아래)
}

/**
 * 게임 결과
 */
export interface GameResult {
  score: number;
  time: number;
  enemiesKilled: number;
}

/**
 * 엔티티 타입
 */
export type EntityType = 'player' | 'enemy' | 'projectile' | 'pickup';

/**
 * 게임 씬 베이스 인터페이스
 */
export interface GameSceneInterface extends Container {
  update(deltaTime: number): void;
  destroy(): void;
}

/**
 * 플레이어 사망 원인 타입
 * Analytics 추적용
 */
export type DeathCause = 'enemy_contact' | 'boss_projectile' | 'boss_dash' | 'boss_fire_aoe';
