# 경계(境界) 맵 시스템 구현 가이드

> 상계와 하계 사이의 휴식 공간 - 포탈, NPC, 대화 시스템

---

## 목차

1. [개요](#개요)
2. [게임 플로우](#게임-플로우)
3. [시스템 설계](#시스템-설계)
4. [포탈 시스템](#포탈-시스템)
5. [NPC 시스템](#npc-시스템)
6. [대화 시스템](#대화-시스템)
7. [경계 맵 씬](#경계-맵-씬)
8. [임시 에셋 처리](#임시-에셋-처리)
9. [구현 가이드](#구현-가이드)
10. [개발 체크리스트](#개발-체크리스트)

---

## 개요

### 목적
경계(境界)는 상계(스테이지 1)와 하계(스테이지 2) 사이의 휴식 공간입니다. 플레이어는 이곳에서:
- 장비 정리 및 판매
- 스텟 확인
- 저승의 상인(NPC)과 거래
- 다음 스테이지로 진입

### 핵심 기능
1. **포탈 생성**: 스테이지 1 종료 후 일정 시간이 지나면 플레이어 시점 근처에 포탈 생성
2. **포탈 진입**: 플레이어가 포탈에 접근하면 경계 맵으로 전환
3. **NPC 상호작용**: NPC에게 가까이 가면 대화 시나리오 자동 진행
4. **시간 제한**: 30초~1분의 휴식 시간 제공

### 참고 문서
- [CORE_DESIGN.md](../CORE_DESIGN.md) - 경계 스펙 (라인 408-418)
- [start-lobby.md](./start-lobby.md) - UI 컴포넌트 구조 참고

---

## 게임 플로우

### 전체 흐름

```
[스테이지 1 - 상계 10분]
         ↓
    보스 처치
         ↓
    포탈 생성 (5초 후)
         ↓
플레이어가 포탈 접근
         ↓
  [경계 맵 진입]
         ↓
    NPC 등장
         ↓
 NPC에게 접근
         ↓
   대화 시작
         ↓
  상점/장비 정리
         ↓
    준비 완료
         ↓
[스테이지 2 - 하계 10분]
```

### 상태 전환

```typescript
type GamePhase =
  | 'lobby'          // 로비 화면
  | 'playing_stage1' // 상계 (스테이지 1)
  | 'boundary'       // 경계 (휴식 시간)
  | 'playing_stage2' // 하계 (스테이지 2)
  | 'game_over'      // 게임 종료
  | 'victory';       // 승리
```

---

## 시스템 설계

### 아키텍처 개요

```
OverworldGameScene (Stage 1)
    ↓ (5초 경과 - 테스트용)
PortalSpawner
    ↓ (포탈 생성)
Portal (Entity)
    ↓ (플레이어 접근)
BoundaryGameScene (extends BaseGameScene)
    ↓
NPC (Entity)
    ↓ (플레이어 접근)
DialogSystem
    ↓
DialogUI
```

### 주요 클래스

| 클래스 | 역할 | 위치 | 상태 |
|--------|------|------|------|
| `Portal` | 포탈 엔티티 (충돌 감지, 진입 처리) | `src/game/entities/Portal.ts` | ✅ 구현 완료 |
| `PortalSpawner` | 포탈 생성 시스템 | `src/systems/PortalSpawner.ts` | ✅ 구현 완료 |
| `BaseGameScene` | 게임 씬 공통 기반 클래스 | `src/game/scenes/game/BaseGameScene.ts` | ✅ 구현 완료 |
| `OverworldGameScene` | 상계 맵 씬 (전투) | `src/game/scenes/game/OverworldGameScene.ts` | ✅ 구현 완료 |
| `BoundaryGameScene` | 경계 맵 씬 (NPC) | `src/game/scenes/game/BoundaryGameScene.ts` | ✅ 구현 완료 |
| `NPC` | NPC 엔티티 (근접 감지, 대화 트리거) | `src/game/entities/NPC.ts` | ✅ 구현 완료 |
| `DialogSystem` | 대화 시나리오 관리 | `src/systems/DialogSystem.ts` | ✅ 구현 완료 |
| `DialogUI` | 대화 UI 표시 | `src/game/ui/DialogUI.ts` | ✅ 구현 완료 |
| `PortalIndicator` | 포탈 위치 인디케이터 UI | `src/game/ui/PortalIndicator.ts` | ✅ 구현 완료 |

---

## 포탈 시스템

### 포탈 생성 조건

**트리거**:
- 스테이지 1 보스 처치 후 5초 경과
- 플레이어 시점 기준 400-600px 거리에 생성
- 화면에 보이는 위치에 배치

**생성 위치 계산**:
```typescript
// 플레이어 기준 랜덤 각도와 거리
const angle = Math.random() * Math.PI * 2;
const distance = 400 + Math.random() * 200; // 400-600px

const portalX = player.x + Math.cos(angle) * distance;
const portalY = player.y + Math.sin(angle) * distance;
```

### Portal 클래스

```typescript
// src/game/entities/Portal.ts
import { Container, Graphics, Text } from 'pixi.js';

export class Portal extends Container {
  private graphic: Graphics;
  private labelText: Text;
  private animationTime: number = 0;
  private interactionRadius: number = 80; // 진입 가능 거리

  public onEnter?: () => void;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    this.graphic = this.createPortalGraphic();
    this.labelText = this.createLabel();

    this.addChild(this.graphic);
    this.addChild(this.labelText);
  }

  /**
   * 임시 포탈 그래픽 (placeholder)
   */
  private createPortalGraphic(): Graphics {
    const g = new Graphics();

    // 외곽 원 (회전 효과용)
    g.lineStyle(4, 0x9966ff, 0.8);
    g.drawCircle(0, 0, 60);

    // 내부 원 (빛나는 효과)
    g.beginFill(0x9966ff, 0.3);
    g.drawCircle(0, 0, 50);
    g.endFill();

    // 중앙 별 모양
    g.beginFill(0xffffff, 0.9);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * 15;
      const y = Math.sin(angle) * 15;
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.endFill();

    return g;
  }

  /**
   * 포탈 라벨
   */
  private createLabel(): Text {
    const text = new Text('경계로 가는 문', {
      fontFamily: 'Nanum Gothic',
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 2,
        color: 0x000000,
        distance: 2,
      },
    });
    text.anchor.set(0.5, 0);
    text.y = 75;
    return text;
  }

  /**
   * 애니메이션 업데이트 (회전 효과)
   */
  public update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // 회전 애니메이션
    this.graphic.rotation = this.animationTime * 0.5;

    // 펄스 효과 (크기 변화)
    const scale = 1 + Math.sin(this.animationTime * 2) * 0.1;
    this.graphic.scale.set(scale);
  }

  /**
   * 플레이어가 포탈 범위 안에 있는지 확인
   */
  public checkPlayerCollision(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.interactionRadius) {
      this.onEnter?.();
      return true;
    }
    return false;
  }

  /**
   * 포탈 제거
   */
  public destroy(): void {
    this.graphic.destroy();
    this.labelText.destroy();
    super.destroy({ children: true });
  }
}
```

### PortalSpawner 시스템

```typescript
// src/systems/PortalSpawner.ts
import { Portal } from '@/game/entities/Portal';
import type { Player } from '@/game/entities/Player';

export class PortalSpawner {
  private portal: Portal | null = null;
  private spawnDelay: number = 5; // 5초 대기
  private elapsedTime: number = 0;
  private hasSpawned: boolean = false;

  /**
   * 보스 처치 후 호출
   */
  public triggerSpawn(): void {
    this.elapsedTime = 0;
    this.hasSpawned = false;
  }

  /**
   * 매 프레임 업데이트
   */
  public update(deltaTime: number, player: Player): Portal | null {
    if (this.hasSpawned || this.portal) {
      return null;
    }

    this.elapsedTime += deltaTime;

    // 5초 경과 시 포탈 생성
    if (this.elapsedTime >= this.spawnDelay) {
      this.portal = this.spawnPortalNearPlayer(player);
      this.hasSpawned = true;
      return this.portal;
    }

    return null;
  }

  /**
   * 플레이어 근처에 포탈 생성
   */
  private spawnPortalNearPlayer(player: Player): Portal {
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 200; // 400-600px

    const portalX = player.x + Math.cos(angle) * distance;
    const portalY = player.y + Math.sin(angle) * distance;

    return new Portal(portalX, portalY);
  }

  /**
   * 리셋
   */
  public reset(): void {
    this.portal?.destroy();
    this.portal = null;
    this.elapsedTime = 0;
    this.hasSpawned = false;
  }
}
```

### GameScene 통합

```typescript
// GameScene.ts에 추가
import { PortalSpawner } from '@/systems/PortalSpawner';
import { Portal } from '@/game/entities/Portal';

export class GameScene extends Container {
  // ...
  private portalSpawner: PortalSpawner;
  private portal: Portal | null = null;

  public onEnterBoundary?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    // ...
    this.portalSpawner = new PortalSpawner();
  }

  /**
   * 보스 처치 시 호출
   */
  private onBossDefeated(): void {
    console.log('보스 처치! 포탈 생성 준비...');
    this.portalSpawner.triggerSpawn();
  }

  /**
   * 게임 루프에 추가
   */
  private update(deltaTime: number): void {
    // ...

    // 포탈 생성 확인
    if (!this.portal) {
      const newPortal = this.portalSpawner.update(deltaTime, this.player);
      if (newPortal) {
        this.portal = newPortal;
        this.portal.onEnter = () => {
          this.onEnterBoundary?.();
        };
        this.gameLayer.addChild(this.portal);
      }
    }

    // 포탈 애니메이션 및 충돌 체크
    if (this.portal) {
      this.portal.update(deltaTime);
      this.portal.checkPlayerCollision(this.player.x, this.player.y);
    }
  }
}
```

---

## NPC 시스템

### NPC 클래스

```typescript
// src/game/entities/NPC.ts
import { Container, Graphics, Text } from 'pixi.js';

export interface NPCData {
  id: string;
  name: string;
  dialogId: string; // 대화 시나리오 ID
}

export class NPC extends Container {
  private graphic: Graphics;
  private nameText: Text;
  private interactionRadius: number = 100;
  private isPlayerNearby: boolean = false;

  public data: NPCData;
  public onInteract?: (npc: NPC) => void;

  constructor(x: number, y: number, data: NPCData) {
    super();

    this.x = x;
    this.y = y;
    this.data = data;

    this.graphic = this.createNPCGraphic();
    this.nameText = this.createNameText();

    this.addChild(this.graphic);
    this.addChild(this.nameText);
  }

  /**
   * 임시 NPC 그래픽 (placeholder)
   */
  private createNPCGraphic(): Graphics {
    const g = new Graphics();

    // 몸체 (삼각형 모양 - 두건을 쓴 상인)
    g.beginFill(0x4a4a4a);
    g.moveTo(0, -40);
    g.lineTo(-25, 20);
    g.lineTo(25, 20);
    g.lineTo(0, -40);
    g.endFill();

    // 얼굴 (원형)
    g.beginFill(0xf5deb3);
    g.drawCircle(0, -20, 12);
    g.endFill();

    // 눈 (두 개의 점)
    g.beginFill(0x000000);
    g.drawCircle(-5, -20, 2);
    g.drawCircle(5, -20, 2);
    g.endFill();

    return g;
  }

  /**
   * NPC 이름 텍스트
   */
  private createNameText(): Text {
    const text = new Text(this.data.name, {
      fontFamily: 'Nanum Gothic',
      fontSize: 12,
      fill: 0xd4af37,
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 2,
        color: 0x000000,
        distance: 2,
      },
    });
    text.anchor.set(0.5, 0);
    text.y = 30;
    return text;
  }

  /**
   * 플레이어 근접 체크
   */
  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const wasNearby = this.isPlayerNearby;
    this.isPlayerNearby = distance <= this.interactionRadius;

    // 플레이어가 처음 근처로 왔을 때만 트리거
    if (this.isPlayerNearby && !wasNearby) {
      this.onInteract?.(this);
      return true;
    }

    return false;
  }

  /**
   * NPC 제거
   */
  public destroy(): void {
    this.graphic.destroy();
    this.nameText.destroy();
    super.destroy({ children: true });
  }
}
```

---

## 대화 시스템

### 대화 데이터 구조

```typescript
// src/types/dialog.types.ts

/**
 * 대화 노드 (한 줄의 대사)
 */
export interface DialogNode {
  id: string;
  speaker: string;      // NPC 이름
  text: string;         // 대사 내용
  nextId?: string;      // 다음 대화 노드 ID (없으면 종료)
}

/**
 * 대화 시나리오
 */
export interface DialogScenario {
  id: string;
  nodes: DialogNode[];
  startNodeId: string;  // 시작 노드 ID
}
```

### 대화 데이터 예시

```typescript
// src/data/dialogs.ts
import type { DialogScenario } from '@/types/dialog.types';

export const BOUNDARY_MERCHANT_DIALOG: DialogScenario = {
  id: 'boundary_merchant',
  startNodeId: 'node_1',
  nodes: [
    {
      id: 'node_1',
      speaker: '저승의 상인',
      text: '잘 왔다, 나그네여. 여기는 상계와 하계의 경계이니라.',
      nextId: 'node_2',
    },
    {
      id: 'node_2',
      speaker: '저승의 상인',
      text: '하계로 가는 길은 험난하니, 준비를 단단히 하거라.',
      nextId: 'node_3',
    },
    {
      id: 'node_3',
      speaker: '저승의 상인',
      text: '필요한 물건이 있으면 거래하고, 준비가 되면 저 문을 통과하거라.',
      // nextId 없음 = 대화 종료
    },
  ],
};
```

### DialogSystem 클래스

```typescript
// src/systems/DialogSystem.ts
import type { DialogScenario, DialogNode } from '@/types/dialog.types';

export class DialogSystem {
  private currentScenario: DialogScenario | null = null;
  private currentNode: DialogNode | null = null;
  private onDialogChange?: (node: DialogNode | null) => void;
  private onDialogEnd?: () => void;

  /**
   * 대화 시작
   */
  public startDialog(
    scenario: DialogScenario,
    onDialogChange: (node: DialogNode | null) => void,
    onDialogEnd: () => void
  ): void {
    this.currentScenario = scenario;
    this.onDialogChange = onDialogChange;
    this.onDialogEnd = onDialogEnd;

    // 첫 번째 노드 찾기
    const startNode = scenario.nodes.find(n => n.id === scenario.startNodeId);
    if (startNode) {
      this.currentNode = startNode;
      this.onDialogChange?.(this.currentNode);
    }
  }

  /**
   * 다음 대사로 진행
   */
  public nextDialog(): void {
    if (!this.currentNode || !this.currentScenario) return;

    // 다음 노드가 있으면 진행
    if (this.currentNode.nextId) {
      const nextNode = this.currentScenario.nodes.find(
        n => n.id === this.currentNode!.nextId
      );
      if (nextNode) {
        this.currentNode = nextNode;
        this.onDialogChange?.(this.currentNode);
        return;
      }
    }

    // 다음 노드가 없으면 대화 종료
    this.endDialog();
  }

  /**
   * 대화 종료
   */
  public endDialog(): void {
    this.currentNode = null;
    this.currentScenario = null;
    this.onDialogChange?.(null);
    this.onDialogEnd?.(���;
  }

  /**
   * 현재 대화 노드 가져오기
   */
  public getCurrentNode(): DialogNode | null {
    return this.currentNode;
  }

  /**
   * 대화 진행 중인지 확인
   */
  public isActive(): boolean {
    return this.currentNode !== null;
  }
}
```

### DialogUI 클래스

```typescript
// src/game/ui/DialogUI.ts
import { Container, Graphics, Text } from 'pixi.js';
import type { DialogNode } from '@/types/dialog.types';

export class DialogUI extends Container {
  private background: Graphics;
  private speakerText: Text;
  private contentText: Text;
  private continueText: Text;

  public onClick?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.background = this.createBackground(screenWidth, screenHeight);
    this.speakerText = this.createSpeakerText();
    this.contentText = this.createContentText(screenWidth);
    this.continueText = this.createContinueText(screenWidth);

    this.addChild(this.background);
    this.addChild(this.speakerText);
    this.addChild(this.contentText);
    this.addChild(this.continueText);

    this.setupInteraction();
    this.visible = false;
  }

  /**
   * 대화 창 배경
   */
  private createBackground(width: number, height: number): Graphics {
    const g = new Graphics();

    const boxHeight = 150;
    const boxY = height - boxHeight - 20;

    // 반투명 검은 배경
    g.beginFill(0x000000, 0.85);
    g.lineStyle(3, 0xd4af37, 0.8);
    g.drawRect(20, boxY, width - 40, boxHeight);
    g.endFill();

    return g;
  }

  /**
   * 화자 이름 텍스트
   */
  private createSpeakerText(): Text {
    const text = new Text('', {
      fontFamily: 'Nanum Gothic',
      fontSize: 16,
      fill: 0xd4af37,
      fontWeight: 'bold',
    });
    text.x = 40;
    text.y = window.innerHeight - 150;
    return text;
  }

  /**
   * 대사 내용 텍스트
   */
  private createContentText(screenWidth: number): Text {
    const text = new Text('', {
      fontFamily: 'Nanum Gothic',
      fontSize: 14,
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: screenWidth - 80,
    });
    text.x = 40;
    text.y = window.innerHeight - 120;
    return text;
  }

  /**
   * "클릭하여 계속..." 텍스트
   */
  private createContinueText(screenWidth: number): Text {
    const text = new Text('▼ 클릭하여 계속 ▼', {
      fontFamily: 'Nanum Gothic',
      fontSize: 12,
      fill: 0xaaaaaa,
    });
    text.anchor.set(1, 1);
    text.x = screenWidth - 40;
    text.y = window.innerHeight - 30;
    return text;
  }

  /**
   * 클릭 인터랙션 설정
   */
  private setupInteraction(): void {
    this.interactive = true;
    this.hitArea = new Graphics()
      .beginFill(0xffffff)
      .drawRect(0, 0, window.innerWidth, window.innerHeight)
      .endFill()
      .geometry;

    this.on('pointerdown', () => {
      this.onClick?.();
    });
  }

  /**
   * 대화 노드 표시
   */
  public showDialog(node: DialogNode): void {
    this.speakerText.text = node.speaker;
    this.contentText.text = node.text;
    this.visible = true;
  }

  /**
   * 대화 창 숨기기
   */
  public hide(): void {
    this.visible = false;
  }

  /**
   * 제거
   */
  public destroy(): void {
    this.removeAllListeners();
    super.destroy({ children: true });
  }
}
```

---

## 경계 맵 씬

### BoundaryScene 클래스

```typescript
// src/game/scenes/BoundaryScene.ts
import { Container, Graphics, Text } from 'pixi.js';
import { NPC } from '@/game/entities/NPC';
import type { NPCData } from '@/game/entities/NPC';
import { DialogSystem } from '@/systems/DialogSystem';
import { DialogUI } from '@/game/ui/DialogUI';
import { BOUNDARY_MERCHANT_DIALOG } from '@/data/dialogs';
import type { Player } from '@/game/entities/Player';

export class BoundaryScene extends Container {
  private screenWidth: number;
  private screenHeight: number;

  private background: Graphics;
  private titleText: Text;
  private npc: NPC;
  private player: Player;

  private dialogSystem: DialogSystem;
  private dialogUI: DialogUI;

  private isDialogActive: boolean = false;

  public onContinueToStage2?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 배경 생성
    this.background = this.createBackground();
    this.addChild(this.background);

    // 타이틀
    this.titleText = this.createTitle();
    this.addChild(this.titleText);

    // 플레이어 (간단한 표현)
    this.player = this.createPlayer();
    this.addChild(this.player);

    // NPC 생성
    const merchantData: NPCData = {
      id: 'merchant_boundary',
      name: '저승의 상인',
      dialogId: 'boundary_merchant',
    };
    this.npc = new NPC(screenWidth / 2, screenHeight / 2 - 100, merchantData);
    this.npc.onInteract = (npc) => this.startDialog(npc);
    this.addChild(this.npc);

    // 대화 시스템
    this.dialogSystem = new DialogSystem();
    this.dialogUI = new DialogUI(screenWidth, screenHeight);
    this.dialogUI.onClick = () => this.dialogSystem.nextDialog();
    this.addChild(this.dialogUI);

    // 게임 루프 시작
    this.startGameLoop();
  }

  /**
   * 배경 생성
   */
  private createBackground(): Graphics {
    const g = new Graphics();

    // 그라데이션 효과 (어두운 보라색 → 검은색)
    g.beginFill(0x2b1b3d);
    g.drawRect(0, 0, this.screenWidth, this.screenHeight / 2);
    g.endFill();

    g.beginFill(0x0a0a0a);
    g.drawRect(0, this.screenHeight / 2, this.screenWidth, this.screenHeight / 2);
    g.endFill();

    return g;
  }

  /**
   * 타이틀
   */
  private createTitle(): Text {
    const text = new Text('경계 (境界)', {
      fontFamily: 'Nanum Gothic',
      fontSize: 32,
      fill: 0xffffff,
      fontWeight: 'bold',
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 4,
        color: 0x000000,
        distance: 3,
      },
    });
    text.anchor.set(0.5, 0);
    text.x = this.screenWidth / 2;
    text.y = 40;
    return text;
  }

  /**
   * 플레이어 생성 (간단한 원)
   */
  private createPlayer(): Player {
    // Player 클래스를 사용하거나 간단한 Graphics로 대체
    const playerGraphic = new Graphics();
    playerGraphic.beginFill(0xffffff);
    playerGraphic.drawCircle(0, 0, 20);
    playerGraphic.endFill();
    playerGraphic.x = this.screenWidth / 2;
    playerGraphic.y = this.screenHeight / 2 + 100;

    // 임시로 Graphics를 Player처럼 사용
    return playerGraphic as unknown as Player;
  }

  /**
   * 대화 시작
   */
  private startDialog(npc: NPC): void {
    if (this.isDialogActive) return;

    this.isDialogActive = true;
    this.dialogSystem.startDialog(
      BOUNDARY_MERCHANT_DIALOG,
      (node) => {
        if (node) {
          this.dialogUI.showDialog(node);
        } else {
          this.dialogUI.hide();
        }
      },
      () => {
        this.isDialogActive = false;
        console.log('대화 종료');
        // TODO: 상점 UI 열기 또는 다음 스테이지 진입
      }
    );
  }

  /**
   * 게임 루프
   */
  private startGameLoop(): void {
    const update = () => {
      // NPC 근접 체크
      if (!this.isDialogActive) {
        this.npc.checkPlayerProximity(this.player.x, this.player.y);
      }

      requestAnimationFrame(update);
    };
    update();
  }

  /**
   * 씬 제거
   */
  public destroy(): void {
    this.dialogUI.destroy();
    this.npc.destroy();
    super.destroy({ children: true });
  }
}
```

---

## 임시 에셋 처리

### Placeholder 그래픽 가이드

에셋이 없는 동안 다음과 같은 임시 그래픽을 사용합니다:

#### 포탈 (Portal)
- **외곽 원**: 보라색 테두리 (`0x9966ff`)
- **내부 원**: 반투명 보라색 채우기
- **중앙 별**: 흰색 별 모양
- **애니메이션**: 회전 + 펄스 효과

```typescript
// 임시 포탈 그래픽
g.lineStyle(4, 0x9966ff, 0.8);
g.drawCircle(0, 0, 60);
g.beginFill(0x9966ff, 0.3);
g.drawCircle(0, 0, 50);
```

#### NPC (상인)
- **몸체**: 회색 삼각형 (두건을 쓴 모습)
- **얼굴**: 베이지색 원 (`0xf5deb3`)
- **눈**: 검은 점 2개
- **이름**: 금색 텍스트 (`0xd4af37`)

```typescript
// 임시 NPC 그래픽
g.beginFill(0x4a4a4a);
g.moveTo(0, -40);
g.lineTo(-25, 20);
g.lineTo(25, 20);
g.endFill();
```

#### 대화 창 (DialogUI)
- **배경**: 반투명 검은색 (`0x000000, 0.85`)
- **테두리**: 금색 (`0xd4af37`)
- **화자 이름**: 금색 텍스트
- **대사**: 흰색 텍스트

### 에셋 교체 시 변경 사항

향후 실제 에셋으로 교체 시:

1. **Portal.ts**:
   ```typescript
   // createPortalGraphic() 메서드를 다음으로 교체:
   private createPortalSprite(): Sprite {
     const sprite = Sprite.from('/assets/portal/portal.png');
     sprite.anchor.set(0.5);
     return sprite;
   }
   ```

2. **NPC.ts**:
   ```typescript
   // createNPCGraphic() 메서드를 다음으로 교체:
   private createNPCSprite(): Sprite {
     const sprite = Sprite.from('/assets/npcs/merchant.png');
     sprite.anchor.set(0.5, 1);
     return sprite;
   }
   ```

3. **DialogUI.ts**:
   - 배경 이미지 추가 (장식적인 프레임)
   - 폰트 교체 (픽셀 폰트 또는 전통 서예 폰트)

---

## 구현 가이드

### Step 1: 타입 정의 (15분)

```bash
# 1. 대화 타입 정의
src/types/dialog.types.ts

# 2. NPC 데이터 타입 (NPC.ts에 포함)
```

### Step 2: 대화 데이터 작성 (20분)

```bash
# 대화 시나리오 작성
src/data/dialogs.ts
```

### Step 3: Portal 구현 (1시간)

```bash
# 1. Portal 엔티티 생성
src/game/entities/Portal.ts

# 2. PortalSpawner 시스템 생성
src/systems/PortalSpawner.ts

# 3. GameScene에 통합
```

### Step 4: NPC 구현 (1시간)

```bash
# 1. NPC 엔티티 생성
src/game/entities/NPC.ts
```

### Step 5: 대화 시스템 구현 (1.5시간)

```bash
# 1. DialogSystem 생성
src/systems/DialogSystem.ts

# 2. DialogUI 생성
src/game/ui/DialogUI.ts
```

### Step 6: BoundaryScene 구현 (2시간)

```bash
# 1. BoundaryScene 생성
src/game/scenes/BoundaryScene.ts

# 2. App.tsx에 통합 (페이즈 전환)
```

### Step 7: 테스트 (1시간)

```bash
# 1. 포탈 생성 확인
# 2. 포탈 진입 확인
# 3. NPC 근접 감지 확인
# 4. 대화 시스템 확인
# 5. 대화 UI 표시 확인
```

---

## 개발 체크리스트

### Phase 1: 포탈 시스템 ✅ 완료
- [x] `Portal.ts` 엔티티 구현
- [x] `PortalSpawner.ts` 시스템 구현
- [x] OverworldGameScene에 포탈 생성 로직 추가
- [x] 포탈 애니메이션 (회전, 펄스) 구현
- [x] 플레이어 충돌 감지 구현
- [x] 포탈 진입 시 씬 전환 구현
- [x] 포탈 인디케이터 UI 구현 (화면 밖 포탈 위치 표시)
- [x] 포탈 즉시 생성 (5초 딜레이 제거)

### Phase 2: NPC 시스템 ✅ 완료
- [x] `NPC.ts` 엔티티 구현
- [x] NPC 그래픽 (placeholder) 생성
- [x] 플레이어 근접 감지 구현
- [x] 근접 시 대화 트리거 구현
- [x] NPC 이름 표시 위치 조정 (y: 30 → 5)

### Phase 3: 대화 시스템 ✅ 완료
- [x] `dialog.types.ts` 타입 정의
- [x] `dialogs.ts` 대화 데이터 작성
- [x] `DialogSystem.ts` 구현
- [x] `DialogUI.ts` 구현
- [x] 대화 진행 로직 (next, end) 구현
- [x] 클릭 인터랙션 구현
- [x] 대화 오버레이 추가 (반투명 배경)
- [x] 초상화 시스템 구현
- [x] UI 정렬 개선 (패딩 통일, 레이어 순서 조정)
- [x] 대화 중 조이스틱 비활성화

### Phase 4: 경계 씬 ✅ 완료
- [x] `BoundaryGameScene.ts` 구현
- [x] BaseGameScene 상속 구조로 리팩토링
- [x] 배경 및 타이틀 생성
- [x] NPC 배치
- [x] 대화 시스템 통합
- [x] GameContainer.tsx에 경계 페이즈 추가
- [x] 플레이어 상태 스냅샷 시스템 구현

### Phase 5: 테스트 및 디버깅 ✅ 완료
- [x] 스테이지 1 → 경계 전환 테스트
- [x] 포탈 생성 위치 확인
- [x] NPC 근접 감지 거리 조정
- [x] 대화 진행 흐름 테스트
- [x] 대화 UI 레이아웃 확인
- [x] 캐릭터 z-index 레이어 버그 수정
- [x] 씬 전환 시 플레이어 스탯 유지 확인

### Phase 6: 아키텍처 개선 ✅ 완료
- [x] BaseGameScene 추상 클래스 설계
- [x] OverworldGameScene이 BaseGameScene 상속
- [x] BoundaryGameScene이 BaseGameScene 상속
- [x] 월드 크기 상수를 game.config.ts로 이동
- [x] 공통 시스템 추출 (Player, Camera, Input, VirtualJoystick)
- [x] 코드 중복 제거 (약 100줄 이상)

### Phase 7: 폴리싱 (선택적)
- [ ] 포탈 파티클 효과 추가
- [ ] NPC 애니메이션 (idle) 추가
- [ ] 대화 타이핑 효과 추가
- [ ] 배경 음악/효과음 추가

---

## 구현 완료 상세 내역

### 1. 아키텍처 개선 (2025-10-18)

#### BaseGameScene 추상 클래스 도입
**목적**: 게임 씬 간 공통 로직 추상화 및 코드 중복 제거

**구조**:
```typescript
// src/game/scenes/game/BaseGameScene.ts
export abstract class BaseGameScene extends Container {
  // 공통 필드
  protected screenWidth: number;
  protected screenHeight: number;
  protected worldWidth: number;
  protected worldHeight: number;
  protected gameLayer: Container;
  protected uiLayer: Container;
  protected player!: Player;
  protected cameraSystem: CameraSystem;
  protected virtualJoystick?: VirtualJoystick;
  protected keys: Set<string> = new Set();

  // 추상 메서드 (자식 클래스가 구현)
  protected abstract createPlayer(): void;
  protected abstract initScene(): Promise<void>;
  protected abstract updateScene(deltaTime: number): void;

  // 공통 메서드
  protected async loadAssets(): Promise<void>;
  protected restorePlayerState(snapshot: PlayerSnapshot): void;
  protected updatePlayer(deltaTime: number): void;
  protected getInputState(): InputState;
}
```

**주요 기능**:
- **공통 시스템 관리**: Player, Camera, Input, VirtualJoystick
- **비동기 초기화 플로우**: loadAssets → createPlayer → restorePlayerState → initScene → startGameLoop
- **플레이어 상태 복원**: PlayerSnapshot을 통한 씬 간 상태 전달
- **입력 처리 통합**: 키보드 + 조이스틱 통합 입력 처리
- **모바일 지원**: 자동 터치 디바이스 감지 및 VirtualJoystick 생성

**리팩토링 효과**:
- OverworldGameScene: ~100줄 코드 감소
- BoundaryGameScene: 처음부터 BaseGameScene 기반으로 간결하게 구현 (193줄 → 147줄)
- 코드 유지보수성 향상

#### 씬 구조 재편성
**변경 전**:
```
src/game/scenes/
  ├── LobbyScene.ts
  ├── GameScene.ts
  └── BoundaryScene.ts
```

**변경 후**:
```
src/game/scenes/
  ├── LobbyScene.ts              # 로비 (독립적)
  └── game/                      # 인게임 씬 그룹
      ├── BaseGameScene.ts       # 공통 기반 클래스
      ├── OverworldGameScene.ts  # 상계 (전투)
      ├── BoundaryGameScene.ts   # 경계 (NPC)
      └── UnderworldGameScene.ts # 하계 (미래)
```

**명명 규칙**:
- 로비: `LobbyScene` (게임 외부)
- 인게임: `{Type}GameScene` (게임 내부)
- 디렉토리: `scenes/game/` (인게임 씬 그룹화)

### 2. 설정 파일 관리 개선

#### game.config.ts 구조 변경
**변경 전**:
```typescript
world: {
  width: 3200,
  height: 2400,
}
```

**변경 후**:
```typescript
world: {
  overworld: {   // 상계 (전투 맵)
    width: 3200,
    height: 2400,
  },
  boundary: {    // 경계 (NPC 맵)
    width: 1200,
    height: 900,
  },
  underworld: {  // 하계 (미래)
    width: 3200,
    height: 2400,
  },
}
```

**효과**:
- 하드코딩된 상수 제거
- 씬별 월드 크기 명확한 구분
- 설정 변경 용이성 향상

### 3. 포탈 시스템 개선

#### 즉시 생성 모드 (테스트용)
**변경 사항**:
- 기존: 보스 처치 후 5초 대기 → 포탈 생성
- 현재: `triggerSpawn(player)` 호출 시 즉시 생성

```typescript
// PortalSpawner.ts
public triggerSpawn(player: Player): Portal | null {
  if (this.hasSpawned || this.portal) {
    return null;
  }
  this.portal = this.spawnPortalNearPlayer(player);
  this.hasSpawned = true;
  return this.portal;
}
```

**테스트 트리거**:
```typescript
// OverworldGameScene.ts
if (this.gameTime >= 5 && !this.portalSpawnTriggered) {
  const newPortal = this.portalSpawner.triggerSpawn(this.player);
  // ...
}
```

#### 포탈 인디케이터 UI
**위치**: `src/game/ui/PortalIndicator.ts`

**기능**:
- 포탈이 화면 밖에 있을 때 방향 표시
- 화면 가장자리에 화살표 렌더링
- 포탈과의 거리 표시

### 4. 대화 시스템 개선

#### DialogUI 개선 사항
1. **오버레이 추가**:
   ```typescript
   // 반투명 검은색 전체 화면 오버레이
   g.rect(0, 0, screenWidth, screenHeight);
   g.fill({ color: 0x000000, alpha: 0.5 });
   ```

2. **초상화 시스템**:
   - NPC 초상화 표시
   - 둥근 테두리 (8px radius)
   - 대화창과 정렬된 레이아웃

3. **레이어 순서**:
   ```
   1. overlay (맨 아래)
   2. portraitContainer
   3. dialogBox (맨 위)
   ```

4. **패딩 통일**: 모든 요소 20px 패딩 사용

5. **대화 중 입력 차단**: VirtualJoystick 비활성화
   ```typescript
   this.virtualJoystick?.setVisible(false); // 대화 시작
   this.virtualJoystick?.setVisible(true);  // 대화 종료
   ```

### 5. BoundaryGameScene 구현 세부사항

#### 플레이어 상태 유지
```typescript
constructor(screenWidth, screenHeight, playerSnapshot) {
  super({
    screenWidth,
    screenHeight,
    worldWidth: GAME_CONFIG.world.boundary.width,
    worldHeight: GAME_CONFIG.world.boundary.height,
    playerSnapshot,  // 상태 자동 복원
  });
}
```

**복원되는 상태**:
- health, maxHealth
- damageMultiplier, cooldownMultiplier
- speedMultiplier, pickupRangeMultiplier
- totalXP (레벨 자동 계산)

#### 레이어 순서 버그 수정
**문제**: 배경이 플레이어 위에 렌더링되어 캐릭터가 보이지 않음

**원인**: `createPlayer()` 메서드에서 player를 먼저 addChild한 후 background를 addChild

**해결**:
```typescript
protected createPlayer(): void {
  // 1. 배경 먼저 (z-index 맨 아래)
  const bg = new Graphics();
  this.gameLayer.addChild(bg);

  // 2. 경계선
  const border = new Graphics();
  this.gameLayer.addChild(border);

  // 3. 플레이어 (배경 위에)
  this.player = new Player(...);
  this.gameLayer.addChild(this.player);
}
```

### 6. NPC 시스템 개선

#### 이름 표시 위치 조정
**변경 사항**: 캐릭터와 이름 간격 축소
```typescript
// Before
text.y = 30;  // 너무 멀음

// After
text.y = 5;   // 적절한 간격
```

### 7. 파일 변경 내역

#### Git 통계
```
18 files changed
2822 insertions(+)
241 deletions(-)
```

**순 증가**: +2581 줄 (새로운 시스템 구현)

#### 새로 추가된 파일 (8개)
1. `src/game/scenes/game/BaseGameScene.ts` (301 줄) - 게임 씬 기반 클래스
2. `src/game/scenes/game/BoundaryGameScene.ts` (169 줄) - 경계 맵 씬
3. `src/game/ui/DialogUI.ts` (310 줄) - 대화 UI
4. `src/game/ui/PortalIndicator.ts` (171 줄) - 포탈 위치 인디케이터
5. `src/game/entities/Portal.ts` (126 줄) - 포탈 엔티티
6. `src/game/entities/NPC.ts` (100 줄) - NPC 엔티티
7. `src/systems/PortalSpawner.ts` (53 줄) - 포탈 생성 시스템
8. `src/systems/DialogSystem.ts` (76 줄) - 대화 시스템

#### 데이터 파일 추가 (2개)
- `src/data/dialogs.ts` (33 줄) - 대화 시나리오 데이터
- `src/types/dialog.types.ts` (22 줄) - 대화 타입 정의

#### 에셋 추가 (1개)
- `public/assets/monk.png` - 플레이어 초상화 (1.2KB)

#### 이동/리팩토링된 파일 (1개)
- `src/game/scenes/GameScene.ts` → `src/game/scenes/game/OverworldGameScene.ts`
  - 343 줄 삭제, BaseGameScene 상속으로 전환
  - 중복 코드 제거

#### 수정된 파일 (5개)
1. `src/config/game.config.ts` (+17 줄) - 월드 크기 구조 변경
2. `src/components/GameContainer.tsx` (+66 줄) - 씬 전환 로직, import 경로 변경
3. `src/hooks/useGameState.ts` (+39 줄) - PlayerSnapshot, GamePhase 추가
4. `src/game/entities/enemies/BaseEnemy.ts` (+14 줄) - 소규모 개선
5. `src/systems/LevelSystem.ts` (+15 줄) - setTotalXP 메서드 추가

#### 문서 업데이트 (1개)
- `docs/dev/boundary.md` (+1208 줄) - 구현 완료 상세 내역 추가

---

## 참고 문서

- [CORE_DESIGN.md](../CORE_DESIGN.md) - 경계 스펙
- [start-lobby.md](./start-lobby.md) - UI 컴포넌트 참고
- [architecture.md](../technical/architecture.md) - 시스템 아키텍처

---

## 주의사항

### 1. 페이즈 관리
```typescript
// useGameState.ts에 'boundary' 페이즈 추가
export type GamePhase = 'lobby' | 'playing_stage1' | 'boundary' | 'playing_stage2' | 'game_over';
```

### 2. 포탈 생성 타이밍
- 보스 처치 후 5초 대기
- 플레이어가 안전한 위치에 포탈 생성
- 화면 밖이 아닌 화면 안에 생성

### 3. NPC 근접 감지
- 너무 가까우면 플레이어가 지나치기 쉬움 → 100px 권장
- 한 번만 트리거되도록 플래그 관리

### 4. 대화 UI 반응형
- 모바일 대응 (화면 크기에 따라 폰트 크기 조정)
- wordWrap 활용하여 긴 대사 처리

### 5. 메모리 관리
- 씬 전환 시 이전 씬의 엔티티 제거
- `destroy()` 메서드 호출 필수

---

## 향후 확장 계획

### 상점 시스템 추가
- NPC와 대화 후 상점 UI 열기
- 골드로 아이템/장비 구매
- 장비 판매 기능

### 장비 정리 UI
- 인벤토리에서 불필요한 장비 판매
- 장비 비교 기능

### 스텟 확인 UI
- 현재 스텟 표시
- 장착 중인 장비 효과 표시

### 하계 진입 포탈
- 준비 완료 후 하계로 가는 포탈 생성
- 포탈 진입 시 스테이지 2로 전환

---

**문서 버전**: 2.0
**최종 수정일**: 2025-10-18
**작성자**: 개발팀
**상태**: 구현 완료

---

## 변경 이력

| 날짜 | 변경 사항 | 작성자 |
|------|----------|--------|
| 2025-10-18 (v1.0) | 초기 문서 작성 | 개발팀 |
| 2025-10-18 (v2.0) | Phase 1-6 구현 완료, 아키텍처 개선 반영 | 개발팀 |

### v2.0 주요 변경사항
- ✅ 전체 시스템 구현 완료 (Portal, NPC, Dialog, BoundaryScene)
- ✅ BaseGameScene 추상 클래스 도입
- ✅ OverworldGameScene 및 BoundaryGameScene 리팩토링
- ✅ 씬 구조 재편성 (`scenes/game/` 디렉토리)
- ✅ 설정 파일 관리 개선 (`game.config.ts`)
- ✅ UI 개선 (오버레이, 초상화, 정렬, 조이스틱 제어)
- ✅ 버그 수정 (레이어 순서, 포탈 생성, NPC 이름 위치)
- ✅ 코드 품질 개선 (중복 제거, 약 100줄 감소)
