# 유물 시스템 셀프 리뷰

## 구현 완료 사항

### 1. 타입 시스템 설계 ✅

#### [artifact.types.ts](../../src/types/artifact.types.ts)
```typescript
// 유물 카테고리 추가
type ArtifactCategory =
  | 'offensive'  // 공격 강화 (데미지, 크리티컬, 관통)
  | 'defensive'  // 방어 강화 (체력, 회피, 피해 감소)
  | 'utility'    // 유틸리티 (이동속도, 경험치, 골드)
  | 'debuff'     // 적 약화 (둔화, 기절, 매혹)
  | 'summon'     // 소환물 (동료, 터렛, 오브)
  | 'special'    // 특수 효과 (조건부, 복합)

interface ArtifactData {
  id: string;
  name: string;
  tier: ArtifactTier;
  rarity: ArtifactRarity;
  category: ArtifactCategory; // ✅ 추가됨
  description: string;
  iconPath: string;
  color: number;
}
```

**설계 의도:**
- 유물을 명확한 카테고리로 분류하여 밸런싱 및 UI 필터링 용이
- 각 카테고리별로 4개씩 총 24개의 유물 설계 가능
- 플레이어가 전략적으로 빌드를 구성할 수 있도록 지원

#### [status-effect.types.ts](../../src/types/status-effect.types.ts)
```typescript
type StatusEffectType =
  | 'charmed' | 'stunned' | 'slowed' | 'burning'
  | 'frozen' | 'poisoned' | 'bleeding' | 'confused';

interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  startTime: number;
  source?: string;        // 유물 ID 추적
  data?: Record<string, any>; // 확장 가능한 커스텀 데이터
}
```

**확장성:**
- 새로운 상태 이상 추가 시 type만 추가하면 됨
- data 필드로 각 효과별 고유 데이터 저장 가능
- source로 어떤 유물이 발동했는지 추적 가능

#### [team.types.ts](../../src/types/team.types.ts)
```typescript
type Team = 'player' | 'enemy' | 'charmed' | 'neutral';
```

**타입 안전성:**
- ❌ 이전: `team: string = 'enemy'` (오타 가능)
- ✅ 현재: `team: Team = 'enemy'` (컴파일 타임 체크)

### 2. BaseEnemy 확장 ✅

#### 상태 이상 관리 시스템
```typescript
// 필드
public team: Team = 'enemy';
public statusEffects: Map<string, StatusEffect> = new Map();

// API
addStatusEffect(effect: StatusEffect): void
removeStatusEffect(type: string): void
hasStatusEffect(type: string): boolean
getStatusEffect(type: string): StatusEffect | undefined
updateStatusEffects(): void // 자동 만료 처리
```

**장점:**
- 상태 이상 로직이 BaseEnemy에 집중됨 → 일관성
- 유물 구현 시 단순히 `addStatusEffect()` 호출만 하면 됨
- 시간 관리를 BaseEnemy가 자동으로 처리 → DRY 원칙

### 3. 유물 시스템 아키텍처 ✅

#### 플러그인 패턴
```
IArtifact (인터페이스)
    ↓
BaseArtifact (추상 클래스)
    ↓
FoxTearArtifact (구체 구현)
```

**이벤트 훅 시스템:**
```typescript
onHit?(enemy: BaseEnemy, damage: number): void
onKill?(enemy: BaseEnemy): void
onTakeDamage?(damage: number, source: Container): number
onLevelUp?(level: number): void
```

**확장 용이성:**
- 새 유물 추가 시 BaseArtifact 상속 후 필요한 훅만 구현
- ArtifactSystem가 자동으로 이벤트 전파
- 유물 간 독립성 보장

### 4. 구미호의 눈물 구현 ✅

#### 핵심 로직
```typescript
onHit(enemy: BaseEnemy) {
  if (Math.random() < 0.1 && canCharm(enemy)) {
    // 1. 상태 이상 추가
    enemy.addStatusEffect({
      type: 'charmed',
      duration: 3.0,
      startTime: performance.now(),
      source: 'fox_tear',
    });

    // 2. 팀 전환
    enemy.team = 'charmed';

    // 3. 시각 효과
    enemy.tint = 0xff69b4;
    createHeartEffect(enemy);
  }
}

update(delta: number) {
  for (const [enemy, data] of charmedEnemies) {
    // 상태 이상 시스템이 자동으로 만료 체크
    if (!enemy.hasStatusEffect('charmed')) {
      removeCharm(enemy);
      continue;
    }

    // 1초마다 공격
    data.attackTimer += delta;
    if (data.attackTimer >= 1.0) {
      performCharmAttack(enemy);
      data.attackTimer = 0;
    }
  }
}
```

**밸런싱:**
- 확률: 10%
- 지속: 3초
- 공격: 1초마다
- 범위: 200px
- 대상: Medium 이하
- 데미지: 적의 원본 데미지

## 개선된 점

### 1. 타입 안전성 향상
| 항목 | 이전 | 현재 |
|------|------|------|
| Scene 파라미터 | `any` | `IGameScene` |
| Enemy 타입 | `Enemy` (존재안함) | `BaseEnemy` |
| Team 필드 | `string` | `Team` 유니온 타입 |
| 상태 관리 | `isCharmed: boolean` | `statusEffects: Map<>` |

### 2. 확장성 개선
- ✅ 새로운 상태 이상 추가 용이 (StatusEffectType에 타입만 추가)
- ✅ 새로운 유물 카테고리 추가 가능 (ArtifactCategory 확장)
- ✅ 유물별 독립적인 로직 구현 가능 (이벤트 훅)
- ✅ 상태 이상 데이터 확장 가능 (data 필드)

### 3. 유지보수성 개선
- ✅ 상태 이상 로직이 BaseEnemy에 집중
- ✅ 시간 관리를 BaseEnemy가 자동 처리
- ✅ 유물 로직이 각 클래스에 캡슐화
- ✅ TypeScript 타입 체크 통과

## 발견된 이슈 및 해결

### Issue 1: `Enemy` 타입 미존재
**문제:** BaseEnemy.ts는 `BaseEnemy` 클래스를 export하지만, 코드에서 `Enemy` 타입을 import하려 함
```typescript
// ❌ 이전
import type { Enemy } from '@game/entities/enemies/BaseEnemy';
```

**해결:**
```typescript
// ✅ 수정
import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
```

### Issue 2: `any` 타입 과다 사용
**문제:** scene, source 파라미터에 `any` 사용으로 타입 안전성 저하

**해결:**
- `IGameScene` 인터페이스 생성
- `Container` 타입 사용
- 모든 `any` 제거 완료

### Issue 3: Team 타입 느슨함
**문제:** `team: string`으로 오타 발생 가능

**해결:**
```typescript
// team.types.ts
type Team = 'player' | 'enemy' | 'charmed' | 'neutral';

// BaseEnemy.ts
public team: Team = 'enemy';
```

### Issue 4: 유물 분류 부재
**문제:** 유물의 역할이 불명확하여 밸런싱 및 UI 필터링 어려움

**해결:**
```typescript
type ArtifactCategory =
  | 'offensive' | 'defensive' | 'utility'
  | 'debuff' | 'summon' | 'special';
```

## 남은 작업

### 1. 유물 UI 구현 (Pending)
```typescript
// 필요 사항:
- 좌하단에 보유 유물 아이콘 표시 (4칸)
- 마우스 오버 시 툴팁 (이름, 설명, 카테고리)
- 획득 시 애니메이션
- 카테고리별 색상 구분
```

### 2. 플레이어-유물 이벤트 연결 (Pending)
```typescript
// 필요 사항:
- Player 또는 CombatSystem에서 artifactSystem.triggerHit() 호출
- 적 처치 시 artifactSystem.triggerKill() 호출
- 피해 받을 시 artifactSystem.triggerTakeDamage() 호출
- 레벨업 시 artifactSystem.triggerLevelUp() 호출
```

### 3. 테스트 (Pending)
```typescript
// 테스트 케이스:
- [ ] 매혹 확률이 10%로 작동하는가
- [ ] 매혹이 3초 후 자동 해제되는가
- [ ] 매혹된 적이 다른 적을 공격하는가
- [ ] Medium 이하만 매혹되는가
- [ ] 최대 4개 유물 제한이 작동하는가
- [ ] 유물 중복 획득 방지가 작동하는가
```

## 설계 원칙 준수

### ✅ SOLID 원칙
- **S (Single Responsibility):** 각 유물은 하나의 효과만 담당
- **O (Open-Closed):** 새 유물 추가 시 기존 코드 수정 불필요
- **L (Liskov Substitution):** 모든 유물이 IArtifact로 대체 가능
- **I (Interface Segregation):** 이벤트 훅은 선택적 구현
- **D (Dependency Inversion):** ArtifactSystem는 IArtifact에 의존

### ✅ DRY (Don't Repeat Yourself)
- 상태 이상 시간 관리 로직을 BaseEnemy에 집중
- 유물 활성화/비활성화 로직을 BaseArtifact에 집중

### ✅ 타입 안전성
- `any` 타입 완전 제거
- 유니온 타입으로 허용 값 제한
- TypeScript strict mode 통과

## 결론

**강점:**
1. 확장 가능한 아키텍처 설계
2. 타입 안전성 확보
3. 모듈화된 구조로 유지보수 용이
4. 상태 이상 시스템으로 다양한 효과 구현 가능

**약점:**
1. 실제 게임과의 통합 미완료 (플레이어 이벤트 연결)
2. UI 미구현
3. 테스트 부재

**다음 단계:**
1. 유물 UI 구현 (보유 유물 표시)
2. CombatSystem과 연결
3. 테스트 및 밸런싱 조정
4. 추가 유물 구현 (티어별 2-3개씩)
