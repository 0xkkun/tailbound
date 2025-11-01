# 보스 구현 가이드 - 백호(White Tiger)

> 10분 플레이 시점에 등장하는 백호 보스 구현 가이드

---

## 목차

1. [개요](#개요)
2. [10분 플레이 시점 분석](#10분-플레이-시점-분석)
3. [보스 스펙 설계](#보스-스펙-설계)
4. [공격 패턴](#공격-패턴)
5. [경고 UI 시스템](#경고-ui-시스템)
6. [보상 시스템](#보상-시스템)
7. [구현 파일 구조](#구현-파일-구조)
8. [구현 순서](#구현-순서)
9. [밸런스 조정](#밸런스-조정)

---

## 개요

### 보스 컨셉

- **이름**: 백호 (White Tiger)
- **속성**: 번개 (Lightning)
- **등장 시점**: 10분 (600초)
- **난이도**: 중상급
- **전투 시간**: 2-3분 목표
- **클리어 조건**: 보스 처치 시 스테이지 클리어

### 핵심 특징

- **간결한 패턴**: 탄막 발사 + 번개 돌진 2가지만
- **명확한 경고**: 돌진 전 1.5초 경고선 표시
- **체력 기반 강화**: 50% 이하 시 패턴 강화
- **보상**: Epic 파워업 2개 + 레벨업 2회

---

## 10분 플레이 시점 분석

### 예상 플레이어 상태

#### 레벨 & 성장도

- **레벨**: 28-35 (평균 30레벨)
- **총 경험치**: 약 20,000 XP
- **레벨업 횟수**: 29회

#### 무기 보유 현황

- **무기 개수**: 2-3개
- **무기 레벨**: 평균 3-5레벨
- **예상 무기 조합**:
  - 부적 + 도깨비불 + 목탁
  - 부채바람 + 작두날
  - 등 다양한 조합

#### 스탯 강화도

- **공격력**: 150-300% (기본의 1.5-3배)
- **쿨타임 감소**: 30-50%
- **최대 체력**: 150-250
- **이동 속도**: 110-130%
- **획득 범위**: 150-300%

#### 파워업 보유 현황

- **⚔️ 공격**: 치명타 확률 20-40%, 치명타 피해 200-350%, 공격 범위 120-180%
- **💪 방어**: 피해 감소 10-30%, 체력 재생 1-3/s, 흡혈 5-15%
- **⚙️ 유틸**: 경험치 배수 120-200%, 드롭률 120-180%

#### 예상 DPS

- **최소**: 150 DPS (무기 2개, 약한 강화)
- **평균**: 250-300 DPS (무기 3개, 적당한 강화)
- **최대**: 400+ DPS (무기 3개, 강한 강화 + 치명타)

---

## 보스 스펙 설계

### 기본 스탯

```typescript
// src/config/balance.config.ts
export const ENEMY_BALANCE = {
  boss: {
    health: 12000, // 2-3분 전투 (평균 DPS 250 기준)
    speed: 90, // 플레이어보다 느리지만 위협적
    damage: 60, // 접촉 데미지 (플레이어 체력의 1/3~1/2)
    radius: 90, // 큰 보스 체형
    xpDrop: 1000, // 보스 처치 시 경험치 (2-3레벨업)
    animationSpeed: 0.15,
    knockbackResistance: 0.2, // 넉백 80% 저항
  },
};
```

### 스탯 근거

#### 체력 (12,000)

- **전투 시간 계산**:
  - 최소 DPS 150 → 80초 (1분 20초)
  - 평균 DPS 250 → 48초 (약 1분)
  - 최대 DPS 400 → 30초
- **패턴 회피 시간 고려**: 실제 DPS의 60-70% 적용
- **목표 전투 시간**: 2-3분
- **너무 빨리 잡히지 않도록** 설계

#### 데미지 (60)

- 플레이어 평균 체력: 150-250
- 3-4방 맞으면 사망 (긴장감 유지)
- 돌진 공격: 100 (1-2방 치명적)

#### 속도 (90)

- 플레이어 기본 속도: 250 (강화 시 275-325)
- 보스가 플레이어보다 느려야 회피 가능
- 너무 느리면 긴장감 저하
- 50% 이하 시 110으로 증가 (위협 증가)

#### 넉백 저항 (80%)

- 일반 적: 100% (넉백 O)
- 엘리트: 50% (절반만)
- 보스: 20% (거의 안 밀림)
- 보스의 위압감 표현

---

## 공격 패턴

### 기본 행동: 추적

- 플레이어를 천천히 추적 (속도 90)
- 접촉 시 60 데미지
- 50% 이하 체력일 때 속도 110으로 증가

---

### 패턴 1: 번개 탄막 발사 ⚡

#### 기본 스펙

- **쿨타임**: 3초
- **발사 방향**: 8방향 (45도 간격)
- **투사체 개수**: 8개
- **동시 발사**: 모든 방향 동시 발사

#### 투사체 스펙

```typescript
// BossProjectile
{
  damage: 40,           // 플레이어 체력의 약 1/4~1/5
  speed: 250,           // 회피 가능한 속도
  radius: 12,           // 일반 투사체보다 큼
  color: 0x00FFFF,      // 파란색 번개
  lifetime: 4,          // 4초 후 소멸
  piercing: 0,          // 플레이어 맞으면 소멸
}
```

#### 비주얼

- 파란색 발광 구체
- 번개 이펙트
- 회전 애니메이션 (선택)

#### 체력별 변화

- **100%-50% (Phase 1)**:
  - 8방향 발사
  - 속도: 250

- **50%-0% (Phase 2)**:
  - 12방향 발사 (30도 간격)
  - 속도: 300
  - 더 촘촘하고 빠른 탄막

#### 발사 로직

```typescript
public fireLightningBullets(): void {
  const bulletCount = this.health / this.maxHealth > 0.5 ? 8 : 12;
  const angleStep = (Math.PI * 2) / bulletCount;
  const speed = this.health / this.maxHealth > 0.5 ? 250 : 300;

  for (let i = 0; i < bulletCount; i++) {
    const angle = angleStep * i;
    const direction = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    const projectile = new BossProjectile(
      this.x,
      this.y,
      direction,
      40,  // damage
      speed
    );

    // GameScene에 추가
    this.onFireProjectile?.(projectile);
  }
}
```

---

### 패턴 2: 번개 돌진 ⚡⚡⚡

#### 기본 스펙

- **쿨타임**: 6초 (Phase 1), 4초 (Phase 2)
- **총 지속시간**: 2.8초 (경고 1.5초 + 돌진 0.8초 + 후딜 0.5초)
- **데미지**: 100 (높은 데미지)

#### 3단계 실행

**1단계: 경고 (1.5초)**

- 보스 정지
- 플레이어 방향 계산 및 고정
- 노란색 직선 경고선 표시
- 경고선 점멸 애니메이션 (0.25초 간격)

**2단계: 돌진 (0.8초)**

- 경고선 방향으로 초고속 돌진 (속도 800)
- 경로상 모든 것에 100 데미지
- 번개 잔상 이펙트 생성 (lighting.png)
- 화면 밖으로 나가거나 벽에 부딪히면 정지

**3단계: 후딜레이 (0.5초)**

- 짧은 정지 (무방비)
- 플레이어가 반격할 기회

#### 경고선 스펙

```typescript
// WarningLine
{
  width: 150,           // 넓은 경고선 (보스보다 큼)
  length: 2000,         // 화면 끝까지
  color: 0xFFFF00,      // 노란색
  alpha: 0.5 ↔ 0.8,    // 점멸
  borderColor: 0xFF0000, // 빨간 테두리
  borderWidth: 4,
  blinkInterval: 250,   // 0.25초마다 점멸
}
```

#### 돌진 로직

```typescript
public async performDash(): Promise<void> {
  // 1. 경고 단계
  this.isDashing = true;
  this.dashState = 'warning';

  // 플레이어 방향 계산 (고정)
  const direction = this.getDirectionToPlayer();

  // 경고선 생성
  const warningLine = new WarningLine(
    this.x,
    this.y,
    direction,
    1500 // 경고 시간 (ms)
  );
  this.parent.addChild(warningLine);

  await this.wait(1500); // 1.5초 대기

  // 2. 돌진 단계
  this.dashState = 'dashing';
  this.dashVelocity = {
    x: direction.x * 800,
    y: direction.y * 800,
  };

  // 번개 잔상 생성
  this.createLightningTrail();

  await this.wait(800); // 0.8초 돌진

  // 3. 후딜레이
  this.dashState = 'recovery';
  this.dashVelocity = { x: 0, y: 0 };

  await this.wait(500); // 0.5초 정지

  this.isDashing = false;
  this.dashState = null;
}
```

#### 번개 잔상 이펙트

- `lighting.png` 스프라이트 사용 (13프레임, 104x22)
- 돌진 경로를 따라 생성
- 0.3초마다 생성
- 페이드아웃 애니메이션
- 1초 후 자동 소멸

#### 체력별 변화

- **100%-50%**: 쿨타임 6초, 1회 돌진
- **50%-0%**: 쿨타임 4초, 더 자주 돌진

---

## 경고 UI 시스템

### WarningLine (직선 경고)

#### 파일 구조

```typescript
// src/game/entities/warnings/WarningLine.ts
import { Container, Graphics } from 'pixi.js';

export class WarningLine extends Container {
  private line: Graphics;
  private blinkTimer: number = 0;
  private isVisible: boolean = true;
  private lifetime: number = 0;
  private maxLifetime: number;

  constructor(
    startX: number,
    startY: number,
    direction: { x: number; y: number },
    duration: number = 1500 // ms
  ) {
    super();

    this.x = startX;
    this.y = startY;
    this.maxLifetime = duration / 1000; // 초 단위로 변환

    // 각도 계산
    const angle = Math.atan2(direction.y, direction.x);

    // Graphics 생성
    this.line = new Graphics();
    this.renderLine(angle);
    this.addChild(this.line);
  }

  private renderLine(angle: number): void {
    const length = 2000; // 긴 경고선
    const width = 150;

    this.line.clear();

    // 회전 적용
    this.line.rotation = angle;

    // 중심선 (노란색)
    this.line.rect(0, -width / 2, length, width);
    this.line.fill({ color: 0xffff00, alpha: 0.5 });

    // 테두리 (빨간색)
    this.line.rect(0, -width / 2, length, width);
    this.line.stroke({ color: 0xff0000, width: 4 });
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    // 수명 체크
    if (this.lifetime >= this.maxLifetime) {
      this.destroy();
      return;
    }

    // 점멸 애니메이션
    this.blinkTimer += deltaTime;
    if (this.blinkTimer >= 0.25) {
      this.blinkTimer = 0;
      this.isVisible = !this.isVisible;
      this.line.alpha = this.isVisible ? 0.8 : 0.5;
    }
  }

  public destroy(): void {
    this.line.destroy();
    this.parent?.removeChild(this);
    super.destroy({ children: true });
  }
}
```

#### 사용 예시

```typescript
// WhiteTigerBoss.ts
const warningLine = new WarningLine(
  this.x,
  this.y,
  { x: directionX, y: directionY },
  1500 // 1.5초
);
this.parent.addChild(warningLine);
```

---

## 보상 시스템

### 보스 처치 보상

#### 1. 경험치 드롭

- **경험치량**: 1000 XP
- **레벨업**: 약 2-3레벨 상승
- **획득 방식**: 경험치 젬 드롭 (큰 금색 젬)

#### 2. 보상 상자

**RewardChest 스펙**

```typescript
// src/game/entities/RewardChest.ts
{
  position: { x: bossX, y: bossY }, // 보스 사망 위치
  size: 80,                         // 크기
  color: 0xFFD700,                  // 금색
  pickupRange: 100,                 // 획득 범위
  rewards: {
    healthRestore: 'full',          // 체력 전체 회복
    powerups: [
      { rarity: 'epic', count: 2 }, // Epic 파워업 2개
    ],
    levelUps: 2,                    // 강제 레벨업 2회
  },
}
```

**비주얼**

- 금색 반짝이는 상자
- 회전 애니메이션
- 펄스 발광 효과
- 획득 시 폭발 이펙트

**획득 로직**

```typescript
public checkChestPickup(): void {
  const distance = getDistance(
    { x: this.player.x, y: this.player.y },
    { x: this.chest.x, y: this.chest.y }
  );

  if (distance < this.chest.pickupRange) {
    // 체력 회복
    this.player.health = this.player.maxHealth;

    // Epic 파워업 2개
    for (let i = 0; i < 2; i++) {
      const epicPowerup = this.getRandomEpicPowerup();
      this.player.applyPowerup(epicPowerup.id);
    }

    // 강제 레벨업 2회
    for (let i = 0; i < 2; i++) {
      const choices = this.levelSystem.generateLevelUpChoices();
      this.showLevelUpUI(choices);
    }

    // 상자 제거
    this.chest.destroy();

    // 클리어 UI 표시
    this.showStageClearUI();
  }
}
```

---

### 스테이지 클리어 UI

#### StageClearUI 스펙

```typescript
// src/game/ui/StageClearUI.ts
{
  overlay: {
    color: 0x000000,
    alpha: 0.7,
    width: screenWidth,
    height: screenHeight,
  },

  title: {
    text: 'STAGE CLEAR!',
    fontSize: 80,
    color: 0xFFD700,
    animation: 'scale-bounce', // 튀는 애니메이션
  },

  stats: {
    clearTime: '10:35',        // 클리어 시간
    totalXP: 25000,            // 총 획득 경험치
    level: 32,                 // 최종 레벨
  },

  buttons: [
    {
      text: '다음 스테이지',
      action: 'nextStage',     // 추후 구현
      disabled: true,          // 현재 비활성
    },
    {
      text: '로비로 돌아가기',
      action: 'returnToLobby',
    },
  ],
}
```

#### 레이아웃

```
┌─────────────────────────────────────┐
│                                     │
│         STAGE CLEAR!                │  (금색, 큰 글씨)
│                                     │
│     클리어 타임: 10:35              │
│     총 경험치: 25,000 XP            │
│     최종 레벨: 32                   │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │ 다음 스테이지 │  │ 로비로      ││
│  │  (준비중)    │  │ 돌아가기    ││
│  └──────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

---

## 구현 파일 구조

### 신규 파일 (7개)

#### 1. 보스 엔티티

```
src/game/entities/enemies/WhiteTigerBoss.ts
```

- BaseEnemy 상속
- wt.png 스프라이트 (16프레임)
- 2가지 공격 패턴
- 체력 기반 페이즈 전환

**스프라이트 설정 예시**

```typescript
private static readonly SPRITE_CONFIG: EnemySpriteConfig = {
  assetPath: '/assets/boss/wt.png',
  totalWidth: 768,      // 16프레임 × 48px
  height: 48,           // 프레임 높이
  frameCount: 16,
  scale: 3.0,           // 보스는 크게 표시
};
```

#### 2. 경고선 UI

```
src/game/entities/warnings/WarningLine.ts
```

- Container 기반
- Graphics로 직선 렌더링
- 점멸 애니메이션
- 1.5초 후 자동 소멸

#### 3. 번개 잔상 이펙트

```
src/game/entities/LightningEffect.ts
```

- lighting.png 스프라이트 (13프레임)
- 돌진 경로를 따라 생성
- 페이드아웃 애니메이션
- 1초 후 자동 소멸

**스프라이트 설정 예시**

```typescript
private static readonly SPRITE_CONFIG = {
  assetPath: '/assets/boss/lighting.png',
  totalWidth: 1352,     // 13프레임 × 104px
  height: 22,           // 프레임 높이
  frameCount: 13,
  scale: 2.5,           // 적당한 크기
  animationSpeed: 0.5,  // 빠른 애니메이션
};
```

#### 4. 보스 투사체

```
src/game/entities/BossProjectile.ts
```

- Projectile 상속 또는 별도 구현
- 번개 구체 비주얼
- 크기: radius 12
- 파란색 발광 효과

#### 5. 보상 상자

```
src/game/entities/RewardChest.ts
```

- Container 기반
- 금색 상자 비주얼
- 반짝임 + 회전 애니메이션
- 획득 시 보상 지급

#### 6. 보스 체력바

```
src/game/ui/BossHealthBar.ts
```

- 화면 상단 중앙 배치
- 보스 이름 "백호" 표시
- 페이즈별 색상 변경
- 체력 % 표시

#### 7. 스테이지 클리어 UI

```
src/game/ui/StageClearUI.ts
```

- 반투명 오버레이
- 클리어 텍스트 + 통계
- 버튼 UI (다음 스테이지, 로비)

---

### 수정 파일 (2개)

#### 1. 밸런스 설정

```
src/config/balance.config.ts
```

- boss 스탯 업데이트 (12000 체력 등)

#### 2. 게임 씬

```
src/game/scenes/game/OverworldGameScene.ts
```

- 10분(600초) 타이머 추가
- 보스 스폰 로직
- 보스 처치 감지
- 보상 상자 생성
- 스테이지 클리어 처리

---

## 구현 순서

### 1단계: 경고선 UI (30분)

- [ ] `WarningLine.ts` 생성
- [ ] Graphics로 노란색 직선 렌더링
- [ ] 점멸 애니메이션 구현
- [ ] 수명 타이머 (1.5초 후 소멸)
- [ ] 테스트: 화면에 임시로 표시해보기

### 2단계: 보스 스탯 수정 (10분)

- [ ] `balance.config.ts` 수정
- [ ] boss.health: 500 → 12000
- [ ] boss.speed: 60 → 90
- [ ] boss.damage: 30 → 60
- [ ] boss.radius: 60 → 90
- [ ] boss.xpDrop: 100 → 1000
- [ ] knockbackResistance: 0.2 추가

### 3단계: 백호 보스 기본 구현 (1시간)

- [ ] `WhiteTigerBoss.ts` 생성
- [ ] BaseEnemy 상속
- [ ] 생성자에서 보스 스탯 적용
- [ ] wt.png 스프라이트 로드 (16프레임, 각 48x48)
- [ ] 기본 추적 AI (BaseEnemy 기본 동작)
- [ ] 테스트: 보스 스폰 및 추적 확인

### 4단계: 패턴 1 - 탄막 발사 (1시간)

- [ ] `BossProjectile.ts` 생성
- [ ] 투사체 스펙 설정 (데미지 40, 속도 250, 반경 12)
- [ ] 파란색 번개 구체 비주얼
- [ ] `WhiteTigerBoss.ts`에 `fireLightningBullets()` 메서드 추가
- [ ] 8방향 발사 로직 (45도 간격)
- [ ] 3초 쿨타임 적용
- [ ] 테스트: 탄막 발사 확인

### 5단계: 패턴 2 - 번개 돌진 (2시간)

- [ ] `WhiteTigerBoss.ts`에 `performDash()` 메서드 추가
- [ ] 경고 단계 (1.5초): 플레이어 방향 계산, WarningLine 생성
- [ ] 돌진 단계 (0.8초): 속도 800으로 돌진, 충돌 판정
- [ ] 후딜레이 (0.5초): 짧은 정지
- [ ] 6초 쿨타임 적용
- [ ] 테스트: 돌진 패턴 확인

### 6단계: 번개 잔상 이펙트 (30분)

- [ ] `LightningEffect.ts` 생성
- [ ] lighting.png 스프라이트 로드 (13프레임, 각 104x22)
- [ ] 돌진 중 경로를 따라 생성
- [ ] 페이드아웃 애니메이션
- [ ] 1초 후 자동 소멸
- [ ] 테스트: 돌진 시 잔상 확인

### 7단계: 체력 기반 강화 (30분)

- [ ] 50% 이하 체크 로직
- [ ] Phase 2 전환:
  - [ ] 탄막 8방향 → 12방향
  - [ ] 탄막 속도 250 → 300
  - [ ] 돌진 쿨타임 6초 → 4초
  - [ ] 이동 속도 90 → 110
- [ ] 테스트: 페이즈 전환 확인

### 8단계: 보스 체력바 UI (1시간)

- [ ] `BossHealthBar.ts` 생성
- [ ] 화면 상단 중앙 배치 (y: 30)
- [ ] 보스 이름 "백호" 표시
- [ ] 체력바 (너비: 화면의 60%, 높이: 30)
- [ ] 체력 % 텍스트 표시
- [ ] Phase별 색상 변경 (녹색 → 노란색 → 빨간색)
- [ ] 테스트: 체력바 표시 및 업데이트 확인

### 9단계: 보스 스폰 로직 (1시간)

- [ ] `OverworldGameScene.ts`에 타이머 추가
- [ ] 600초(10분) 도달 시 보스 스폰
- [ ] 보스 등장 연출:
  - [ ] "⚠️ WARNING ⚠️" 텍스트 (5초 전)
  - [ ] "강력한 기운이 느껴진다..." 메시지
  - [ ] 중앙에서 번개 이펙트 + 페이드인
- [ ] 보스 체력바 표시
- [ ] 일반 적 스폰 중단
- [ ] 테스트: 10분 시점 보스 등장 확인

### 10단계: 보상 시스템 (1.5시간)

- [ ] `RewardChest.ts` 생성
- [ ] 금색 상자 비주얼 (Graphics)
- [ ] 반짝임 + 회전 애니메이션
- [ ] 획득 판정 (범위 100px)
- [ ] 보상 지급:
  - [ ] 체력 전체 회복
  - [ ] Epic 파워업 2개 랜덤 지급
  - [ ] 강제 레벨업 2회 (선택지)
- [ ] 보스 처치 시 상자 드롭
- [ ] 테스트: 보스 처치 및 보상 획득

### 11단계: 스테이지 클리어 UI (1시간)

- [ ] `StageClearUI.ts` 생성
- [ ] 반투명 검은 오버레이
- [ ] "STAGE CLEAR!" 텍스트 (금색, 크게)
- [ ] 튀는 애니메이션
- [ ] 통계 표시:
  - [ ] 클리어 타임
  - [ ] 총 경험치
  - [ ] 최종 레벨
- [ ] 버튼 UI:
  - [ ] "다음 스테이지" (비활성)
  - [ ] "로비로 돌아가기" (활성)
- [ ] 게임 일시정지
- [ ] 테스트: 클리어 화면 표시

### 12단계: 밸런스 테스트 및 조정 (2시간)

- [ ] 실제 10분 플레이 테스트
- [ ] 보스 체력 적정성 확인 (2-3분 전투)
- [ ] 탄막 난이도 확인 (회피 가능한지)
- [ ] 돌진 패턴 확인 (경고선 충분한지)
- [ ] 보상 적정성 확인
- [ ] 필요 시 수치 조정

---

## 밸런스 조정

### 보스 체력

#### 너무 빨리 잡힘 (1분 이내)

- 12000 → 15000
- 또는 18000 (3분 이상 전투)

#### 너무 안 잡힘 (5분 이상)

- 12000 → 10000
- 또는 8000 (1-2분 전투)

#### 체력 조정 기준

```
목표 전투 시간 = 보스 체력 / (플레이어 평균 DPS × 회피율)

예시:
- 2분 전투 목표
- 평균 DPS: 250
- 회피율: 60% (패턴 회피 시간 고려)
- 필요 체력: 250 × 120초 × 0.6 = 18,000

현재: 12000 체력 → 약 1.5-2분 전투
```

---

### 탄막 패턴

#### 너무 많음 (회피 불가능)

- Phase 2: 12방향 → 10방향
- 또는 8방향 유지 (속도만 증가)

#### 너무 적음 (긴장감 부족)

- Phase 2: 12방향 → 16방향
- 또는 2줄 발사 (16개 + 16개, 0.5초 간격)

#### 너무 빠름 (반응 불가)

- Phase 2 속도: 300 → 250
- 또는 Phase 1과 동일 (250 유지)

#### 너무 느림 (쉬움)

- Phase 1 속도: 250 → 300
- Phase 2 속도: 300 → 350

#### 쿨타임 조정

- 너무 자주 발사: 3초 → 4초
- 너무 적게 발사: 3초 → 2초

---

### 돌진 패턴

#### 경고 시간

**너무 쉬움 (회피 여유)**

- 경고 1.5초 → 1초
- 또는 0.8초 (고난이도)

**너무 어려움 (반응 불가)**

- 경고 1.5초 → 2초
- 또는 2.5초 (쉬운 난이도)

#### 돌진 속도

**너무 쉬움 (회피 가능)**

- 속도 800 → 1000
- 또는 1200 (매우 빠름)

**너무 어려움 (피할 수 없음)**

- 속도 800 → 600
- 또는 500 (느림)

#### 돌진 데미지

**너무 아픔 (1방 사망)**

- 100 → 80
- 또는 60 (탄막과 동일)

**너무 약함 (위협 부족)**

- 100 → 120
- 또는 150 (즉사급)

#### 쿨타임

**너무 자주 돌진**

- Phase 1: 6초 → 8초
- Phase 2: 4초 → 5초

**너무 적게 돌진**

- Phase 1: 6초 → 4초
- Phase 2: 4초 → 3초

---

### Phase 전환 시점

#### Phase 2 전환 (현재 50%)

**너무 빠름 (강화가 일찍 옴)**

- 50% → 40%
- 또는 30% (최종 페이즈처럼)

**너무 늦음 (변화 부족)**

- 50% → 60%
- 또는 70% (일찍 강화)

---

### 이동 속도

#### 기본 속도 (90)

**너무 느림 (긴장감 부족)**

- 90 → 110
- 또는 120

**너무 빠름 (회피 불가)**

- 90 → 70
- 또는 80

#### Phase 2 속도 (110)

**너무 느림**

- 110 → 130
- 또는 140

**너무 빠름**

- 110 → 100
- 또는 기본 속도 유지 (90)

---

### 보상

#### Epic 파워업 개수

**너무 많음 (지나친 보상)**

- 2개 → 1개
- 또는 1개 Epic + 2개 Rare

**너무 적음 (보상 부족)**

- 2개 → 3개
- 또는 2개 Epic + 1개 Legendary

#### 레벨업 횟수

**너무 많음**

- 2회 → 1회

**너무 적음**

- 2회 → 3회

---

## 참고사항

### 기존 적 구현 참고

- `DokkaebiEnemy.ts`: 탱커형 (높은 체력, 느린 속도)
- `EvilSpiritEnemy.ts`: 원거리 공격형 (투사체 발사)
- `MaidenGhostEnemy.ts`: 원거리 거리 유지형 (후퇴 + 공격)
- `SkeletonEnemy.ts`: 빠른 유리대포형

### 무기 구현 참고

- `docs/design/weapon-implementation-guide.md`: 무기 구현 가이드
- 투사체 생성, 패턴 구현, 스프라이트 로드 등 참고

### 레벨 진행 참고

- `docs/level-design/level-progression.md`: 10분 플레이 시점 분석
- 레벨, 경험치, 스탯 강화도 등 참고

---

**문서 버전**: 1.0
**최종 수정일**: 2025-01-26
**작성자**: 개발팀
