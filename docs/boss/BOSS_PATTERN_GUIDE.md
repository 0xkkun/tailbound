# 보스 패턴 가이드

## 개요
백호 보스에 3가지 불꽃 기반 패턴을 추가합니다.

---

## 1. 기본 공격 (원거리 불꽃)

### 설명
보스가 플레이어에게 다가가는 동안 일정 간격으로 불꽃을 발사하는 기본 공격입니다.

### 스프라이트 정보
- **파일**: `public/assets/boss/boss-fireball.png`
- **크기**: 64x64px
- **프레임 수**: 10프레임
- **프레임 배치**: 가로로 10개 (총 640x64px)

### 구현 상세

#### 발사 타이밍
- 쿨다운: 2초마다 발사
- 보스가 이동 중일 때도 발사 가능

#### 투사체 속성
- **속도**: 200px/s
- **데미지**: 30
- **크기**: 원본 64x64 (스케일 1.0)
- **생명 시간**: 3초
- **범위**: 반지름 20px (충돌 판정)

#### 발사 패턴
- 플레이어 방향으로 단일 투사체 발사
- 정확도: 100% (플레이어 위치 조준)

### 필요한 클래스
```typescript
// FireballProjectile.ts
class FireballProjectile extends Container {
  // 스프라이트 애니메이션 (10프레임)
  // 직선 이동
  // 플레이어 충돌 감지
}
```

---

## 2. 나선형 불꽃 공격

### 설명
보스가 10회 피격당하면 발동하는 특수 패턴입니다. 보스를 중심으로 시계방향 나선형으로 불꽃을 발사합니다.

### 스프라이트 정보

#### 불꽃 투사체
- **파일**: `public/assets/boss/boss-fireball.png`
- **크기**: 64x64px
- **프레임 수**: 10프레임

#### 스킬 차징 이펙트
- **파일**: `public/assets/boss/boss-skill-effect.png`
- **크기**: 59x49px
- **프레임 수**: 15프레임
- **프레임 배치**: 가로로 15개 (총 885x49px)

### 구현 상세

#### 발동 조건
- 보스가 10회 피격을 받을 때 (누적 피격 횟수 추적 필요)
- 한 번 발동 후 카운터 리셋

#### 예고 단계 (2초)
```typescript
// SpiralChargeEffect.ts
class SpiralChargeEffect extends Container {
  private sprite: AnimatedSprite; // boss-skill-effect.png
  private timer: number = 0;
  private duration: number = 2.0;

  constructor(boss: WhiteTigerBoss) {
    super();

    // 보스 위치에 생성
    this.x = boss.x;
    this.y = boss.y;

    // 스프라이트 생성 (15프레임)
    // 원본 크기: 59x49
    // 보스를 감쌀 수 있도록 스케일 조정 (보스 크기에 따라)
    const scale = 3.0; // 보스가 144px 정도이므로 3배 확대
    this.sprite.scale.set(scale, scale);

    // 애니메이션 설정
    this.sprite.animationSpeed = 0.25; // 15프레임을 2초 동안 (7.5 fps)
    this.sprite.loop = true;
    this.sprite.play();

    // 보스도 빨갛게 변경
    boss.tint = 0xff0000;
  }

  update(deltaTime: number, boss: WhiteTigerBoss) {
    this.timer += deltaTime;

    // 보스 위치 추적
    this.x = boss.x;
    this.y = boss.y;

    // 2초 후 제거
    if (this.timer >= this.duration) {
      // 보스 색상 복구
      boss.tint = 0xffffff;
      this.destroy();
      return true; // 완료
    }
    return false; // 진행 중
  }
}
```

```typescript
// WhiteTigerBoss.ts
private startSpiralAttack(): void {
  this.isChargingSpiral = true;
  this.spiralChargeTimer = 0;

  // 차징 이펙트 생성 콜백
  this.onCreateChargeEffect?.(this);
}

private updateSpiralCharge(deltaTime: number): void {
  this.spiralChargeTimer += deltaTime;

  // 2초 차징 완료 후 발사
  if (this.spiralChargeTimer >= 2.0) {
    this.executeSpiralAttack();
    this.isChargingSpiral = false;
    this.spiralChargeTimer = 0;
  }
}
```

#### 나선형 발사 패턴
- **총 발사 개수**: 48발 (나선형 4바퀴)
- **발사 간격**: 0.05초 (총 2.4초 동안 발사)
- **각도 증가량**: 30도씩 회전
- **속도 증가**: 발사마다 5px/s씩 증가 (150 → 385px/s)

#### 나선형 계산 공식
```typescript
// i번째 발사 (0~47)
const baseAngle = 0; // 시작 각도 (오른쪽)
const angleIncrement = (Math.PI / 6); // 30도 (PI/6 라디안)
const angle = baseAngle + (angleIncrement * i);

const direction = {
  x: Math.cos(angle),
  y: Math.sin(angle)
};

const speed = 150 + (i * 5); // 속도 증가
```

#### 투사체 속성
- **데미지**: 40
- **크기**: 64x64 (스케일 1.0)
- **생명 시간**: 4초
- **범위**: 반지름 20px

### 상태 관리
```typescript
// WhiteTigerBoss.ts
private hitCount: number = 0;
private isChargingSpiral: boolean = false;
private spiralChargeTimer: number = 0;
public onCreateChargeEffect?: (boss: WhiteTigerBoss) => void;

// takeDamage 오버라이드
public takeDamage(damage: number): void {
  super.takeDamage(damage);
  this.hitCount++;

  if (this.hitCount >= 10 && !this.isChargingSpiral) {
    this.startSpiralAttack();
  }
}
```

---

## 3. 장판기 (AOE)

### 설명
보스가 30회 피격당하면 발동하는 광역 공격입니다. 랜덤 위치에 불 장판을 생성하며, 경고 후 실제 데미지를 줍니다.

### 스프라이트 정보
- **파일**: `public/assets/boss/boss-AOE.png`
- **크기**: 100x100px
- **프레임 수**: 61프레임
- **프레임 배치**: 8x8 그리드 (총 800x800px, 마지막 행에 5프레임)
- **프레임 속도**: 30.5 fps (2초 동안 61프레임)

### 구현 상세

#### 발동 조건
- 보스가 30회 피격을 받을 때
- 한 번 발동 후 카운터 리셋

#### 장판 크기
- **표시 크기**: 플레이어 캐릭터 반지름 × 6 (지름 기준 3배)
- **충돌 범위**: 표시 크기와 동일

#### 생성 위치 (총 5개)
1. 보스 주변: 랜덤 2개
   - 보스로부터 반지름 100~300px 범위
   - 랜덤 각도

2. 플레이어 주변: 랜덤 3개
   - 플레이어로부터 반지름 50~200px 범위
   - 랜덤 각도

```typescript
// 보스 주변
for (let i = 0; i < 2; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 100 + Math.random() * 200;
  const x = boss.x + Math.cos(angle) * distance;
  const y = boss.y + Math.sin(angle) * distance;
  createAOEWarning(x, y);
}

// 플레이어 주변
for (let i = 0; i < 3; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 50 + Math.random() * 150;
  const x = player.x + Math.cos(angle) * distance;
  const y = player.y + Math.sin(angle) * distance;
  createAOEWarning(x, y);
}
```

#### 경고 단계 (3초)
```typescript
// AOEWarning.ts
class AOEWarning extends Graphics {
  private timer: number = 0;
  private duration: number = 3.0;
  private finalRadius: number; // 장판 크기

  update(deltaTime: number) {
    this.timer += deltaTime;
    const progress = this.timer / this.duration; // 0.0 ~ 1.0

    // 원이 점점 커짐
    const currentRadius = this.finalRadius * progress;

    // 빨간색 원 (테두리만)
    this.clear();
    this.circle(0, 0, currentRadius);
    this.stroke({
      width: 3,
      color: 0xff0000,
      alpha: 0.8
    });

    // 3초 후 장판 생성
    if (this.timer >= this.duration) {
      this.onSpawnAOE?.();
      this.destroy();
    }
  }
}
```

#### 장판 단계 (2초)
```typescript
// FireAOE.ts
class FireAOE extends Container {
  private sprite: AnimatedSprite; // 61프레임
  private duration: number = 2.0;
  private timer: number = 0;
  private damagedPlayers: Set<string> = new Set(); // 틱 데미지 방지

  constructor(x: number, y: number, radius: number) {
    super();
    this.x = x;
    this.y = y;

    // 스프라이트 생성 (boss-AOE.png)
    // 61프레임 애니메이션
    // 8x8 그리드에서 61프레임 추출
    this.sprite.animationSpeed = 0.5; // 30.5 fps
    this.sprite.loop = false;
    this.sprite.play();

    // 크기 조정 (플레이어 반지름 × 6)
    const scale = (radius * 2) / 100; // 100은 원본 크기
    this.sprite.scale.set(scale, scale);
  }

  update(deltaTime: number, player: Player) {
    this.timer += deltaTime;

    // 플레이어 충돌 감지 (1회만)
    if (!this.damagedPlayers.has(player.id) && checkCollision(player)) {
      player.takeDamage(50);
      this.damagedPlayers.add(player.id);
    }

    // 2초 후 제거
    if (this.timer >= this.duration) {
      this.destroy();
      return true; // 완료
    }
    return false; // 진행 중
  }
}
```

#### 투사체 속성
- **데미지**: 50 (진입 시 1회만)
- **지속 시간**: 2초
- **틱 데미지 방지**: 플레이어가 장판 안에 있어도 1회만 피해

### 상태 관리
```typescript
// WhiteTigerBoss.ts
private hitCountForAOE: number = 0;

public takeDamage(damage: number): void {
  super.takeDamage(damage);

  // 나선형 공격용
  this.hitCount++;
  if (this.hitCount >= 10 && !this.isChargingSpiral) {
    this.startSpiralAttack();
    this.hitCount = 0;
  }

  // 장판 공격용
  this.hitCountForAOE++;
  if (this.hitCountForAOE >= 30) {
    this.startAOEAttack();
    this.hitCountForAOE = 0;
  }
}
```

---

## 클래스 구조

```
src/game/entities/
├── BossProjectile.ts (기존 - 번개)
├── FireballProjectile.ts (신규 - 불꽃)
├── FireAOE.ts (신규 - 불 장판)
├── SpiralChargeEffect.ts (신규 - 나선형 차징 이펙트)
└── warnings/
    ├── WarningLine.ts (기존 - 돌진 경고)
    └── AOEWarning.ts (신규 - 장판 경고)

src/game/entities/enemies/
└── WhiteTigerBoss.ts (수정)
    - 기본 불꽃 공격 추가
    - 나선형 공격 추가
    - 장판 공격 추가
    - 피격 카운터 추가

src/systems/
└── BossSystem.ts (수정)
    - FireballProjectile 배열 추가
    - FireAOE 배열 추가
    - AOEWarning 배열 추가
    - SpiralChargeEffect 추가 (단일 인스턴스)
    - 각 엔티티 업데이트 및 충돌 처리
```

---

## 구현 순서

### Phase 1: 기본 불꽃 공격
1. `FireballProjectile.ts` 클래스 생성
   - 스프라이트 애니메이션 (10프레임)
   - 직선 이동 로직
   - 충돌 판정

2. `WhiteTigerBoss.ts` 수정
   - 기본 공격 타이머 추가
   - `fireBasicFireball()` 메서드 추가

3. `BossSystem.ts` 수정
   - `fireballProjectiles` 배열 추가
   - 업데이트 및 충돌 처리

### Phase 2: 나선형 공격
1. `SpiralChargeEffect.ts` 클래스 생성
   - 스프라이트 애니메이션 (15프레임)
   - 보스 위치 추적
   - 2초 타이머
   - 보스 tint 변경

2. `WhiteTigerBoss.ts` 수정
   - 피격 카운터 추가
   - `startSpiralAttack()` 메서드
   - `updateSpiralCharge()` 메서드 (차징 중)
   - `executeSpiralAttack()` 메서드 (발사)
   - `onCreateChargeEffect` 콜백 추가

3. 나선형 발사 로직 구현
   - 시간차 발사 (0.05초)
   - 각도 및 속도 계산

4. `BossSystem.ts` 수정
   - `spiralChargeEffect` 변수 추가
   - 차징 이펙트 생성 콜백 연결
   - 차징 이펙트 업데이트

### Phase 3: 장판 공격
1. `AOEWarning.ts` 클래스 생성
   - 빨간색 원 경고 (3초)
   - 크기 증가 애니메이션

2. `FireAOE.ts` 클래스 생성
   - 스프라이트 애니메이션 (61프레임, 8x8 그리드)
   - 2초 지속
   - 충돌 판정
   - 틱 데미지 방지 (Set 사용)

3. `WhiteTigerBoss.ts` 수정
   - 피격 카운터 (30회)
   - `startAOEAttack()` 메서드
   - 랜덤 위치 생성 로직

4. `BossSystem.ts` 수정
   - `aoeWarnings` 배열
   - `fireAOEs` 배열
   - 업데이트 및 충돌 처리
   - 틱 데미지 방지 로직

---

## 스프라이트 프레임 배치 참고

### boss-fireball.png (640x64)
```
[0][1][2][3][4][5][6][7][8][9]
```
- 프레임당 64x64px
- 가로로 10개 배치

### boss-skill-effect.png (885x49)
```
[0][1][2][3][4][5][6][7][8][9][10][11][12][13][14]
```
- 프레임당 59x49px
- 가로로 15개 배치

### boss-AOE.png (800x800)
```
[0][1][2][3][4][5][6][7]
[8][9][10][11][12][13][14][15]
[16][17][18][19][20][21][22][23]
[24][25][26][27][28][29][30][31]
[32][33][34][35][36][37][38][39]
[40][41][42][43][44][45][46][47]
[48][49][50][51][52][53][54][55]
[56][57][58][59][60]
```
- 프레임당 100x100px
- 8x8 그리드 (마지막 행 5개)

---

## 테스트 체크리스트

### 기본 불꽃 공격
- [ ] 보스가 2초마다 불꽃을 발사하는가?
- [ ] 불꽃이 플레이어를 정확히 조준하는가?
- [ ] 불꽃 애니메이션이 정상 재생되는가?
- [ ] 충돌 시 데미지가 정상 적용되는가?
- [ ] 불꽃이 3초 후 또는 화면 밖에서 제거되는가?

### 나선형 공격
- [ ] 10회 피격 시 정확히 발동하는가?
- [ ] 차징 이펙트(boss-skill-effect.png)가 보스를 감싸는가?
- [ ] 보스가 2초간 빨갛게 변하는가?
- [ ] 차징 이펙트가 보스 위치를 추적하는가? (넉백 시)
- [ ] 2초 후 나선형 발사가 시작되는가?
- [ ] 나선형 패턴이 시계방향으로 회전하는가?
- [ ] 48발이 모두 발사되는가?
- [ ] 속도가 점진적으로 증가하는가?
- [ ] 발동 후 카운터가 리셋되는가?

### 장판 공격
- [ ] 30회 피격 시 정확히 발동하는가?
- [ ] 경고 원이 5개 생성되는가?
- [ ] 경고 원이 3초 동안 점점 커지는가?
- [ ] 3초 후 불 장판이 생성되는가?
- [ ] 장판 애니메이션이 정상 재생되는가?
- [ ] 2초 후 장판이 제거되는가?
- [ ] 플레이어가 장판에 진입 시 1회만 피해를 받는가?
- [ ] 보스 주변 2개, 플레이어 주변 3개가 정확히 생성되는가?

---

## 주의사항

1. **피격 카운터 동기화**
   - 나선형 공격 (10회)와 장판 공격 (30회)의 카운터는 별도로 관리
   - 두 공격이 동시에 발동되지 않도록 우선순위 설정

2. **메모리 관리**
   - 모든 투사체와 장판은 비활성화 시 즉시 제거
   - 스프라이트 리소스는 preload에서 미리 로드
   - 차징 이펙트는 완료 후 즉시 destroy

3. **틱 데미지 방지**
   - 장판 공격은 플레이어가 안에 있어도 1회만 피해
   - `Set<string>` 사용하여 피해를 입은 플레이어 ID 추적

4. **성능 최적화**
   - 장판 경고는 최대 5개로 제한
   - 나선형 공격은 화면 밖 투사체를 즉시 제거
   - 차징 이펙트는 한 번에 1개만 존재

5. **밸런스 조정**
   - 피격 횟수, 데미지, 쿨타임은 테스트 후 조정 가능
   - 현재 값은 초안이며 플레이 테스트 필요

6. **차징 이펙트 스케일**
   - boss-skill-effect.png는 59x49로 작으므로 보스(144px)를 감싸려면 3배 확대
   - 보스 크기에 따라 동적으로 스케일 조정 가능
