/**
 * 게임 씬 - 메인 게임 로직
 */

import { Container, Graphics, Text } from 'pixi.js';

import { Enemy } from '@/game/entities/Enemy';
import { Player } from '@/game/entities/Player';
import { Projectile } from '@/game/entities/Projectile';
import { Talisman } from '@/game/weapons/Talisman';
import { CombatSystem } from '@/systems/CombatSystem';
import { SpawnSystem } from '@/systems/SpawnSystem';
import type { GameResult, InputState } from '@/types/game.types';

export class GameScene extends Container {
  // 화면 크기
  private screenWidth: number;
  private screenHeight: number;

  // 레이어
  private gameLayer: Container;
  private uiLayer: Container;

  // 엔티티
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];

  // 무기
  private weapons: Talisman[] = [];

  // 시스템
  private combatSystem: CombatSystem;
  private spawnSystem: SpawnSystem;

  // 게임 상태
  private gameTime: number = 0;
  private enemiesKilled: number = 0;
  private isGameOver: boolean = false;

  // 게임 루프
  private gameLoopId?: number;
  private lastTime: number = 0;

  // 입력 상태
  private keys: Set<string> = new Set();

  // UI 요소
  private healthText!: Text;
  private scoreText!: Text;
  private timeText!: Text;

  // 콜백
  public onGameOver?: (result: GameResult) => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 레이어 초기화
    this.gameLayer = new Container();
    this.uiLayer = new Container();
    this.addChild(this.gameLayer);
    this.addChild(this.uiLayer);

    // 시스템 초기화
    this.combatSystem = new CombatSystem();
    this.spawnSystem = new SpawnSystem(screenWidth, screenHeight);

    // 게임 초기화
    this.initGame();
    this.initUI();
    this.setupInput();

    // 게임 루프 시작
    this.startGameLoop();
  }

  /**
   * 게임 초기화
   */
  private initGame(): void {
    // 배경
    const bg = new Graphics();
    bg.beginFill(0x0a0a15);
    bg.drawRect(0, 0, this.screenWidth, this.screenHeight);
    bg.endFill();
    this.gameLayer.addChild(bg);

    // 플레이어 생성
    this.player = new Player(this.screenWidth / 2, this.screenHeight / 2);
    this.gameLayer.addChild(this.player);

    // 초기 무기: 부적
    const talisman = new Talisman();
    this.weapons.push(talisman);

    console.log('게임 시작!');
  }

  /**
   * UI 초기화
   */
  private initUI(): void {
    // 체력 텍스트
    this.healthText = new Text('HP: 100/100', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xff5555,
      fontWeight: 'bold',
    });
    this.healthText.x = 20;
    this.healthText.y = 20;
    this.uiLayer.addChild(this.healthText);

    // 점수 텍스트
    this.scoreText = new Text('처치: 0', {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
    });
    this.scoreText.x = 20;
    this.scoreText.y = 55;
    this.uiLayer.addChild(this.scoreText);

    // 시간 텍스트
    this.timeText = new Text('0:00', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.timeText.anchor.set(0.5, 0);
    this.timeText.x = this.screenWidth / 2;
    this.timeText.y = 20;
    this.uiLayer.addChild(this.timeText);
  }

  /**
   * 입력 설정
   */
  private setupInput(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 정리 시 이벤트 제거
    this.once('destroyed', () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
  }

  /**
   * 입력 상태 계산
   */
  private getInputState(): InputState {
    let x = 0;
    let y = 0;

    // WASD / 방향키
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;

    return { x, y };
  }

  /**
   * 게임 루프 시작
   */
  private startGameLoop(): void {
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaTime = (currentTime - this.lastTime) / 1000; // 초 단위
      this.lastTime = currentTime;

      this.update(deltaTime);

      this.gameLoopId = requestAnimationFrame(loop);
    };

    this.gameLoopId = requestAnimationFrame(loop);
  }

  /**
   * 업데이트
   */
  private update(deltaTime: number): void {
    if (this.isGameOver) {
      return;
    }

    // 게임 시간 증가
    this.gameTime += deltaTime;

    // 1. 입력 처리
    const input = this.getInputState();
    this.player.setInput(input);

    // 2. 플레이어 업데이트
    this.player.update(deltaTime);
    this.player.clampToScreen(this.screenWidth, this.screenHeight);

    // 3. 무기 업데이트 및 발사
    for (const weapon of this.weapons) {
      weapon.update(deltaTime);

      // 발사
      const playerPos = { x: this.player.x, y: this.player.y };
      const newProjectiles = weapon.fire(playerPos, this.enemies);
      for (const proj of newProjectiles) {
        this.projectiles.push(proj);
        this.gameLayer.addChild(proj);
      }
    }

    // 4. 투사체 업데이트
    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);
    }

    // 5. 적 업데이트
    for (const enemy of this.enemies) {
      const playerPos = { x: this.player.x, y: this.player.y };
      enemy.setTarget(playerPos);
      enemy.update(deltaTime);
    }

    // 6. 적 스폰
    this.spawnSystem.update(deltaTime, this.enemies, this.gameTime);

    // 새로 생성된 적 게임 레이어에 추가
    for (const enemy of this.enemies) {
      if (!enemy.parent) {
        this.gameLayer.addChild(enemy);
      }
    }

    // 7. 전투 시스템 (충돌 및 데미지)
    const killed = this.combatSystem.update(this.player, this.enemies, this.projectiles);
    this.enemiesKilled += killed;

    // 8. 정리 (죽은 엔티티 제거)
    this.cleanup();

    // 9. UI 업데이트
    this.updateUI();

    // 10. 난이도 증가 (10초마다)
    if (Math.floor(this.gameTime) % 10 === 0 && this.gameTime > 1) {
      // 스폰 속도 증가 (중복 방지를 위해 소수점 체크)
      if (this.gameTime % 1 < deltaTime * 2) {
        this.spawnSystem.increaseSpawnRate();
      }
    }

    // 11. 게임 오버 체크
    if (!this.player.isAlive() && !this.isGameOver) {
      this.handleGameOver();
    }
  }

  /**
   * 정리 (죽은 엔티티 제거)
   */
  private cleanup(): void {
    // 죽은 적 제거
    const deadEnemies = this.enemies.filter((e) => !e.active || !e.isAlive());
    for (const enemy of deadEnemies) {
      this.gameLayer.removeChild(enemy);
      enemy.destroy();
    }
    this.enemies = this.enemies.filter((e) => e.active && e.isAlive());

    // 비활성 투사체 제거
    const activeProjectiles: Projectile[] = [];
    for (const proj of this.projectiles) {
      if (!proj.active || proj.isOutOfBounds(this.screenWidth, this.screenHeight)) {
        // 비활성화된 투사체 제거
        this.gameLayer.removeChild(proj);
        proj.destroy();
      } else {
        // 활성 투사체 유지
        activeProjectiles.push(proj);
      }
    }
    this.projectiles = activeProjectiles;
  }

  /**
   * UI 업데이트
   */
  private updateUI(): void {
    // 체력
    this.healthText.text = `HP: ${Math.floor(this.player.health)}/${this.player.maxHealth}`;

    // 점수
    this.scoreText.text = `처치: ${this.enemiesKilled}`;

    // 시간
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = Math.floor(this.gameTime % 60);
    this.timeText.text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * 게임 오버 처리
   */
  private handleGameOver(): void {
    this.isGameOver = true;

    console.log('=== 게임 오버 ===');
    console.log(`생존 시간: ${Math.floor(this.gameTime)}초`);
    console.log(`처치한 적: ${this.enemiesKilled}마리`);

    // 게임 오버 UI 표시
    const gameOverText = new Text('GAME OVER', {
      fontFamily: 'Arial',
      fontSize: 72,
      fill: 0xff0000,
      fontWeight: 'bold',
    });
    gameOverText.anchor.set(0.5);
    gameOverText.x = this.screenWidth / 2;
    gameOverText.y = this.screenHeight / 2;
    this.uiLayer.addChild(gameOverText);

    // 콜백 호출
    if (this.onGameOver) {
      const result: GameResult = {
        score: this.enemiesKilled * 100,
        time: Math.floor(this.gameTime),
        enemiesKilled: this.enemiesKilled,
      };

      // 3초 후 콜백 호출
      setTimeout(() => {
        this.onGameOver?.(result);
      }, 3000);
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    // 게임 루프 중지
    if (this.gameLoopId !== undefined) {
      cancelAnimationFrame(this.gameLoopId);
    }

    // 엔티티 정리
    this.player?.destroy();
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    for (const proj of this.projectiles) {
      proj.destroy();
    }

    // 부모 destroy
    super.destroy({ children: true });

    console.log('GameScene 정리 완료');
  }
}
