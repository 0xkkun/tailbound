# 유물 시스템 통합 가이드

> 구미호의 눈물 유물을 게임에 추가하는 방법

---

## 1단계: 게임 씬에 ArtifactSystem 추가

```typescript
// src/game/scenes/OverworldGameScene.ts

import { ArtifactSystem } from '@systems/ArtifactSystem';
import { FoxTearArtifact } from '@artifacts/list/FoxTearArtifact';

export class OverworldGameScene extends Container {
  private artifactSystem!: ArtifactSystem;

  async create() {
    // ... 기존 코드 (플레이어 생성 등)

    // 유물 매니저 초기화
    this.artifactSystem = new ArtifactSystem(this.player, this);

    console.log('✅ ArtifactSystem initialized');
  }

  update(delta: number) {
    // ... 기존 업데이트 로직

    // 유물 업데이트
    this.artifactSystem.update(delta);
  }
}
```

---

## 2단계: 플레이어 이벤트와 연결

### CombatSystem에서 onHit 이벤트 발행

```typescript
// src/systems/CombatSystem.ts

export class CombatSystem {
  checkProjectileCollisions() {
    // ... 기존 충돌 체크 코드

    if (/* 적과 충돌 */) {
      const damage = projectile.damage;
      enemy.takeDamage(damage, this.player);

      // 🆕 유물 이벤트 발행: onHit
      if (this.scene.artifactSystem) {
        this.scene.artifactSystem.triggerHit(enemy, damage);
      }
    }
  }
}
```

### Player에서 onKill 이벤트 발행

```typescript
// src/game/entities/Player.ts

export class Player extends Container {
  public onEnemyKilled(enemy: Enemy): void {
    // ... 기존 경험치 획득 로직

    // 🆕 유물 이벤트 발행: onKill
    if (this.scene?.artifactSystem) {
      this.scene.artifactSystem.triggerKill(enemy);
    }
  }
}
```

또는 Enemy의 die() 메서드에서:

```typescript
// src/game/entities/enemies/BaseEnemy.ts

export class BaseEnemy extends Container {
  public die(): void {
    // ... 기존 사망 처리

    // 🆕 유물 이벤트 발행
    if (this.scene?.artifactSystem) {
      this.scene.artifactSystem.triggerKill(this);
    }

    this.destroy();
  }
}
```

---

## 3단계: 테스트용 단축키 추가

게임 씬에 테스트용 단축키를 추가해서 유물을 쉽게 테스트할 수 있어:

```typescript
// src/game/scenes/OverworldGameScene.ts

export class OverworldGameScene extends Container {
  private setupTestKeybinds(): void {
    // F1 키: 구미호의 눈물 추가
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        const artifact = new FoxTearArtifact();
        const added = this.artifactSystem.add(artifact);

        if (added) {
          console.log('🦊 구미호의 눈물 추가됨!');
        }
      }

      // F2 키: 현재 유물 목록 출력
      if (e.key === 'F2') {
        const artifacts = this.artifactSystem.getAll();
        console.log('📜 현재 유물 목록:', artifacts.map(a => a.data.name));
      }

      // F3 키: 모든 유물 제거
      if (e.key === 'F3') {
        this.artifactSystem.cleanup();
        console.log('🗑️ 모든 유물 제거됨');
      }
    });
  }

  async create() {
    // ... 기존 코드

    // 개발 모드에서만 테스트 단축키 활성화
    if (import.meta.env.DEV) {
      this.setupTestKeybinds();
      console.log('🔧 Test keybinds: F1 (Add FoxTear), F2 (List), F3 (Clear)');
    }
  }
}
```

---

## 4단계: Enemy AI 수정 (선택사항)

매혹된 적이 다른 적을 공격하지 않도록 Enemy AI를 수정해야 해. 하지만 기본 구현만으로도 작동은 하니까 나중에 해도 돼.

```typescript
// src/game/entities/enemies/BaseEnemy.ts

export class BaseEnemy extends Container {
  update(delta: number) {
    // 매혹된 적은 플레이어를 추적하지 않음
    if (this.isCharmed) {
      // 유물에서 자동으로 타겟팅하므로 여기선 아무것도 안함
      return;
    }

    // 일반 적: 플레이어 추적
    this.chasePlayer(delta);
  }

  takeDamage(damage: number, source: any): void {
    // 매혹된 적은 다른 적의 공격을 받지 않음
    if (this.isCharmed && source?.team === 'enemy') {
      return; // 피해 무시
    }

    // 일반 피해 처리
    this.health -= damage;
    // ...
  }
}
```

---

## 5단계: 테스트 시나리오

### 테스트 1: 유물 추가
1. 게임 시작
2. **F1** 키 누르기
3. 콘솔에 "🦊 구미호의 눈물 추가됨!" 확인

### 테스트 2: 매혹 발동
1. 적들을 공격
2. 10% 확률로 적이 **핑크색**으로 변하고 **머리 위에 하트** 뜸
3. 매혹된 적이 **다른 적을 공격** (핑크색 라인)
4. **3초 후** 원래대로 복귀

### 테스트 3: 매혹 해제
1. 매혹된 적을 죽이기
2. 즉시 원래 색으로 돌아오고 하트 사라짐

### 테스트 4: 유물 목록
1. **F2** 키 누르기
2. 콘솔에 현재 유물 목록 출력

### 테스트 5: 유물 제거
1. **F3** 키 누르기
2. 모든 유물 제거되고 매혹 효과 사라짐

---

## 6단계: 디버그 팁

### 매혹 확률 높이기 (테스트용)

```typescript
// src/game/artifacts/list/FoxTearArtifact.ts

// 테스트용: 확률을 100%로
private readonly CHARM_CHANCE = 1.0; // 10% → 100%

// 테스트 후 다시 0.1로 되돌리기!
```

### 매혹 시간 늘리기 (테스트용)

```typescript
// 테스트용: 매혹 시간을 10초로
private readonly CHARM_DURATION = 10.0; // 3초 → 10초
```

### 콘솔 로그 확인

```
✅ ArtifactSystem initialized
🦊 구미호의 눈물 추가됨!
💕 [FoxTear] skeleton is charmed!
💔 [FoxTear] Charm released
```

---

## 7단계: 빌드 & 실행

```bash
# 타입 체크
npm run type-check

# 개발 서버 실행
npm run dev

# 브라우저에서 테스트
# - F1: 유물 추가
# - 적 공격해서 매혹 발동 확인
# - F2: 유물 목록 확인
# - F3: 유물 제거
```

---

## 문제 해결

### 문제 1: "scene is not defined"
**해결**: 씬에서 artifactSystem를 제대로 초기화했는지 확인

### 문제 2: 매혹이 안됨
**해결**:
- CombatSystem에서 `triggerHit` 호출 확인
- 확률을 1.0으로 올려서 테스트
- 콘솔에 "💕 charmed" 메시지 나오는지 확인

### 문제 3: 하트가 안보임
**해결**:
- `enemy.parent`가 존재하는지 확인
- zIndex 문제일 수 있으니 하트의 zIndex 올리기

### 문제 4: 매혹된 적이 공격 안함
**해결**:
- `scene.enemies` 배열이 제대로 채워져 있는지 확인
- 콘솔에 "Performing charm attack" 로그 추가해서 확인

---

## 다음 단계

1. ✅ 기본 작동 확인
2. ✅ 매혹 효과 테스트
3. 🔲 Enemy AI 수정 (매혹된 적 무시)
4. 🔲 UI 추가 (보유 유물 표시)
5. 🔲 다른 유물 추가

---

**작성일**: 2025-11-11
**테스트 난이도**: ⭐⭐ (쉬움)
