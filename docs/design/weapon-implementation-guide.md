# 무기 구현 가이드

> 새로운 무기를 추가하는 방법과 이미지 교체 가이드

---

## 목차
1. [개요](#개요)
2. [무기 추가 체크리스트](#무기-추가-체크리스트)
3. [단계별 구현 가이드](#단계별-구현-가이드)
4. [무기 타입별 구현 방법](#무기-타입별-구현-방법)
5. [이미지 교체 가이드](#이미지-교체-가이드)
6. [예제 코드](#예제-코드)

---

## 개요

### 무기 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│   game/data/weapons.ts                  │
│   - 무기 데이터 정의                     │
│   - 밸런스 수치 관리                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   game/weapons/[WeaponName].ts          │
│   - 무기 로직 구현                       │
│   - 발사/공격 패턴                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   game/entities/Projectile.ts 또는      │
│   커스텀 엔티티 (Orbital, AoE 등)        │
└─────────────────────────────────────────┘
```

### 설계 원칙

1. **데이터 중심 설계**: 밸런스 수치는 `game/data/weapons.ts`에 집중
2. **로직 분리**: 무기 클래스는 행동 패턴만 구현
3. **이미지 독립성**: Graphics로 플레이스홀더 → 이미지로 쉽게 교체
4. **확장 가능**: 새 무기 타입 추가 시 기존 코드 수정 최소화

---

## 무기 추가 체크리스트

새 무기를 추가할 때 다음 단계를 따르세요:

### ✅ 1단계: 데이터 정의
- [ ] `src/game/data/weapons.ts`에 무기 데이터 추가
- [ ] `WeaponType`에 타입 추가
- [ ] `WEAPON_DATA` 객체에 스펙 정의
- [ ] 레벨 스케일링 공식 확인

### ✅ 2단계: 무기 클래스 구현
- [ ] `src/game/weapons/[WeaponName].ts` 파일 생성
- [ ] `Weapon` 베이스 클래스 상속
- [ ] `fire()` 메서드 구현 (발사 로직)
- [ ] `update()` 메서드 오버라이드 (필요 시)
- [ ] `levelUp()` 메서드 구현

### ✅ 3단계: 엔티티 구현 (필요 시)
- [ ] Projectile 사용 OR 커스텀 엔티티 생성
- [ ] 궤도형/AoE는 커스텀 엔티티 필요
- [ ] 충돌 감지 로직
- [ ] 렌더링 (Graphics 플레이스홀더)

### ✅ 4단계: 통합
- [ ] `LevelSystem.ts`의 선택지에 추가
- [ ] `GameScene.ts`의 `addWeapon()` switch문에 추가
- [ ] i18n 번역 추가 (`ko.json`)

### ✅ 5단계: 테스트
- [ ] 빌드 확인 (`pnpm run build`)
- [ ] 발사/공격 확인
- [ ] 레벨업 시 스탯 증가 확인
- [ ] 성능 테스트 (다수 발사체)

### ✅ 6단계: 이미지 교체 (선택)
- [ ] 이미지 파일 준비
- [ ] `public/assets/weapons/` 폴더에 배치
- [ ] 무기 클래스에서 이미지 로드
- [ ] Graphics → Sprite 교체

---

## 단계별 구현 가이드

### 1단계: 데이터 정의

**파일**: `src/game/data/weapons.ts`

```typescript
// 1. WeaponType에 추가
export type WeaponType = 'talisman' | 'dokkaebi' | 'moktak' | 'jakdu' | '새무기이름';

// 2. WEAPON_DATA에 추가
export const WEAPON_DATA: Record<WeaponType, WeaponData> = {
  // ... 기존 무기들

  새무기이름: {
    id: 'weapon_새무기',
    name: '새 무기',
    description: '무기 설명',
    type: 'projectile', // 또는 'orbital', 'aoe', 'melee'

    // 밸런스 수치
    baseDamage: 20,
    baseCooldown: 1.5,
    projectileSpeed: 400,
    piercing: 0,

    // 레벨 스케일링
    levelScaling: {
      damage: 5,              // 레벨당 데미지 +5
      cooldownReduction: 0.1, // 레벨당 쿨타임 -0.1초
      piercingPerLevel: 1,    // 5레벨마다 관통 +1
    },

    // 최대 레벨 및 진화
    maxLevel: 5,
    evolution: {
      name: '진화된 이름',
      description: '진화 설명',
      bonusEffect: '특별 효과',
    },
  },
};
```

**주의사항**:
- `id`는 'weapon_' 접두사 사용 (LevelSystem에서 파싱)
- `type`은 무기 타입 결정 (projectile/orbital/aoe/melee)
- `levelScaling`은 `calculateWeaponStats()` 함수에서 자동 계산

---

### 2단계: 무기 클래스 구현

**파일**: `src/game/weapons/[WeaponName].ts`

#### 기본 구조

```typescript
import { calculateWeaponStats } from '@/game/data/weapons';
import type { Enemy } from '@/game/entities/Enemy';
import { Projectile } from '@/game/entities/Projectile';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class NewWeapon extends Weapon {
  // 무기별 고유 속성 (선택)
  private someProperty: number = 0;

  constructor() {
    // 데이터에서 초기 스탯 로드
    const stats = calculateWeaponStats('새무기이름', 1);
    super('새 무기', stats.damage, stats.cooldown);
  }

  /**
   * 발사/공격 메서드 (필수 구현)
   */
  public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    // 쿨다운 체크
    if (!this.canFire()) {
      return [];
    }

    // 발사 로직 구현
    const projectiles: Projectile[] = [];

    // TODO: 무기별 로직 작성

    // 쿨다운 리셋
    this.resetCooldown();

    return projectiles;
  }

  /**
   * 레벨업 메서드 (필수 구현)
   */
  public levelUp(): void {
    super.levelUp();

    // 데이터에서 새 스탯 계산
    const stats = calculateWeaponStats('새무기이름', this.level);
    this.damage = stats.damage;
    this.cooldown = stats.cooldown;

    // 무기별 추가 효과
    console.log(`새 무기 레벨 ${this.level}!`);
  }

  /**
   * 업데이트 메서드 (선택 - 필요 시 오버라이드)
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // 추가 업데이트 로직 (궤도형 등)
  }
}
```

---

## 무기 타입별 구현 방법

### 타입 1: 투사체형 (Projectile)

**예시**: 부적 (Talisman)

**특징**:
- 직선/곡선으로 날아가는 투사체
- `Projectile` 엔티티 사용
- 타겟 추적 또는 방향 설정

**구현 방법**:

```typescript
public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
  if (!this.canFire()) return [];

  const projectiles: Projectile[] = [];

  // 가장 가까운 적 찾기
  const target = this.findClosestEnemy(playerPos, enemies);

  if (!target) return []; // 적 없으면 발사 안 함

  // 방향 계산
  const direction = getDirection(playerPos, { x: target.x, y: target.y });

  // 투사체 생성
  const projectile = new Projectile(
    `weapon_${this.name}_${Date.now()}`,
    playerPos.x,
    playerPos.y,
    direction,
    0xffff00 // 색상 (이미지 없을 때)
  );
  projectile.damage = this.damage;
  projectiles.push(projectile);

  this.resetCooldown();
  return projectiles;
}

private findClosestEnemy(playerPos: Vector2, enemies: Enemy[]): Enemy | null {
  let closest: Enemy | null = null;
  let minDistance = Infinity;

  for (const enemy of enemies) {
    if (!enemy.active || !enemy.isAlive()) continue;

    const distance = getDistance(playerPos, { x: enemy.x, y: enemy.y });
    if (distance < minDistance) {
      minDistance = distance;
      closest = enemy;
    }
  }

  return closest;
}
```

---

### 타입 2: 궤도형 (Orbital)

**예시**: 도깨비불 (DokkaebiFireWeapon)

**특징**:
- 플레이어 주변을 회전
- 커스텀 엔티티 필요 (`OrbitalEntity`)
- 접촉 시 피해

**필요 엔티티**: `src/game/entities/OrbitalEntity.ts`

```typescript
import { Container, Graphics } from 'pixi.js';
import type { Player } from './Player';

export class OrbitalEntity extends Container {
  public active: boolean = true;
  public damage: number = 10;

  private angle: number;         // 현재 각도
  private angularSpeed: number;  // 회전 속도 (rad/s)
  private radius: number;        // 궤도 반경
  private orb: Graphics;

  constructor(
    angle: number,
    radius: number,
    angularSpeed: number,
    color: number = 0x00ffff
  ) {
    super();

    this.angle = angle;
    this.radius = radius;
    this.angularSpeed = angularSpeed;

    // 시각화 (플레이스홀더)
    this.orb = new Graphics();
    this.orb.beginFill(color);
    this.orb.drawCircle(0, 0, 15);
    this.orb.endFill();
    this.addChild(this.orb);
  }

  /**
   * 플레이어 주변을 회전
   */
  public update(deltaTime: number, player: Player): void {
    // 각도 증가
    this.angle += this.angularSpeed * deltaTime;

    // 위치 계산 (플레이어 중심으로 회전)
    this.x = player.x + Math.cos(this.angle) * this.radius;
    this.y = player.y + Math.sin(this.angle) * this.radius;
  }

  public destroy(): void {
    this.orb.destroy();
    super.destroy();
  }
}
```

**무기 클래스**:

```typescript
export class DokkaebiFireWeapon extends Weapon {
  private orbitals: OrbitalEntity[] = [];
  private orbitalCount: number = 1;

  public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    // 궤도형은 fire가 아닌 생성 시 궤도 배치
    return [];
  }

  /**
   * 무기 생성 시 또는 레벨업 시 호출
   */
  public spawnOrbitals(player: Player, gameLayer: Container): void {
    // 기존 궤도 제거
    for (const orbital of this.orbitals) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }
    this.orbitals = [];

    // 새 궤도 생성
    const angleStep = (Math.PI * 2) / this.orbitalCount;

    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i;
      const orbital = new OrbitalEntity(angle, 80, 2.0, 0x00ffff);
      orbital.damage = this.damage;

      this.orbitals.push(orbital);
      gameLayer.addChild(orbital);
    }
  }

  /**
   * 매 프레임 업데이트
   */
  public update(deltaTime: number, player: Player): void {
    super.update(deltaTime);

    for (const orbital of this.orbitals) {
      orbital.update(deltaTime, player);
    }
  }

  public levelUp(): void {
    super.levelUp();

    // 레벨업 시 개수 증가
    if (this.level % 2 === 0) {
      this.orbitalCount++;
    }
  }
}
```

**GameScene 통합**:

```typescript
// GameScene.ts에서
private dokkaebiWeapon?: DokkaebiFireWeapon;

private addWeapon(weaponId: string): void {
  switch (weaponId) {
    case 'weapon_dokkaebi': {
      const weapon = new DokkaebiFireWeapon();
      weapon.spawnOrbitals(this.player, this.gameLayer); // 궤도 생성
      this.dokkaebiWeapon = weapon;
      this.weapons.push(weapon);
      break;
    }
  }
}

// update() 메서드에서
if (this.dokkaebiWeapon) {
  this.dokkaebiWeapon.update(deltaTime, this.player);
}
```

---

### 타입 3: 광역형 (AoE)

**예시**: 목탁 소리 (MoktakSoundWeapon)

**특징**:
- 주기적으로 광역 공격 발동
- 범위 내 모든 적 피해
- 시각 이펙트 (파동)

**커스텀 엔티티**: `src/game/entities/AoEEffect.ts`

```typescript
import { Container, Graphics } from 'pixi.js';

export class AoEEffect extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 100;

  private lifetime: number = 0;
  private maxLifetime: number = 0.5; // 0.5초 동안 표시
  private circle: Graphics;
  private hasDealtDamage: boolean = false;

  constructor(x: number, y: number, radius: number, damage: number) {
    super();

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.damage = damage;

    // 시각 효과 (확장되는 원)
    this.circle = new Graphics();
    this.addChild(this.circle);

    this.render();
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 페이드아웃 효과
    const progress = this.lifetime / this.maxLifetime;
    this.alpha = 1 - progress;

    // 확장 애니메이션
    const scale = 0.5 + progress * 0.5;
    this.scale.set(scale);
  }

  private render(): void {
    this.circle.clear();
    this.circle.lineStyle(4, 0xffa500, 0.8);
    this.circle.drawCircle(0, 0, this.radius);
  }

  public hasHitEnemy(): boolean {
    return this.hasDealtDamage;
  }

  public markAsHit(): void {
    this.hasDealtDamage = true;
  }

  public destroy(): void {
    this.circle.destroy();
    super.destroy();
  }
}
```

**무기 클래스**:

```typescript
export class MoktakSoundWeapon extends Weapon {
  public fire(playerPos: Vector2, enemies: Enemy[]): AoEEffect[] {
    if (!this.canFire()) return [];

    // 광역 이펙트 생성
    const effect = new AoEEffect(
      playerPos.x,
      playerPos.y,
      150, // 반경 150픽셀
      this.damage
    );

    this.resetCooldown();
    return [effect];
  }
}
```

**GameScene에서 AoE 처리**:

```typescript
private aoeEffects: AoEEffect[] = [];

// 무기 발사 시
const newAoEs = moktakWeapon.fire(playerPos, this.enemies);
for (const aoe of newAoEs) {
  this.aoeEffects.push(aoe);
  this.gameLayer.addChild(aoe);
}

// update()에서 AoE 업데이트
for (const aoe of this.aoeEffects) {
  aoe.update(deltaTime);

  // 범위 내 적 피해 (한 번만)
  if (!aoe.hasHitEnemy()) {
    for (const enemy of this.enemies) {
      const distance = getDistance(
        { x: aoe.x, y: aoe.y },
        { x: enemy.x, y: enemy.y }
      );

      if (distance <= aoe.radius) {
        enemy.takeDamage(aoe.damage);
      }
    }
    aoe.markAsHit();
  }
}

// 비활성 AoE 제거
this.aoeEffects = this.aoeEffects.filter(aoe => {
  if (!aoe.active) {
    this.gameLayer.removeChild(aoe);
    aoe.destroy();
    return false;
  }
  return true;
});
```

---

### 타입 4: 근접형 (Melee)

**예시**: 작두날 (JakduBladeWeapon)

**특징**:
- 플레이어 주변 일정 각도 휘두르기
- 애니메이션 (회전)
- 범위 내 적 즉시 피해

**커스텀 엔티티**: `src/game/entities/MeleeSwing.ts`

```typescript
import { Container, Graphics } from 'pixi.js';

export class MeleeSwing extends Container {
  public active: boolean = true;
  public damage: number = 0;
  public radius: number = 0;
  public startAngle: number = 0;
  public sweepAngle: number = Math.PI; // 180도

  private lifetime: number = 0;
  private maxLifetime: number = 0.3;
  private blade: Graphics;
  private hasDealtDamage: Set<string> = new Set();

  constructor(
    x: number,
    y: number,
    startAngle: number,
    radius: number,
    damage: number
  ) {
    super();

    this.x = x;
    this.y = y;
    this.startAngle = startAngle;
    this.radius = radius;
    this.damage = damage;

    this.blade = new Graphics();
    this.addChild(this.blade);

    this.render();
  }

  public update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 회전 애니메이션
    const progress = this.lifetime / this.maxLifetime;
    this.rotation = this.startAngle + this.sweepAngle * progress;

    // 페이드아웃
    this.alpha = 1 - progress;
  }

  private render(): void {
    this.blade.clear();
    this.blade.beginFill(0xff0000, 0.5);
    this.blade.moveTo(0, 0);
    this.blade.arc(0, 0, this.radius, 0, this.sweepAngle);
    this.blade.lineTo(0, 0);
    this.blade.endFill();
  }

  public hasHitEnemy(enemyId: string): boolean {
    return this.hasDealtDamage.has(enemyId);
  }

  public markEnemyHit(enemyId: string): void {
    this.hasDealtDamage.add(enemyId);
  }

  public destroy(): void {
    this.blade.destroy();
    super.destroy();
  }
}
```

---

## 이미지 교체 가이드

### 플레이스홀더 → 이미지 전환

#### 1. 이미지 파일 준비

```
public/
└── assets/
    └── weapons/
        ├── talisman.png        # 32x32 px
        ├── dokkaebi-orb.png    # 24x24 px
        ├── moktak-wave.png     # 64x64 px
        └── jakdu-blade.png     # 48x48 px
```

#### 2. PixiJS Assets 로드

**무기 클래스에서**:

```typescript
import { Assets, Sprite } from 'pixi.js';

export class Talisman extends Weapon {
  private spriteTexture: any = null;

  constructor() {
    super('부적', 15, 1.0);
    this.loadTexture();
  }

  private async loadTexture(): Promise<void> {
    try {
      this.spriteTexture = await Assets.load('/assets/weapons/talisman.png');
      console.log('부적 텍스처 로드 완료');
    } catch (error) {
      console.warn('부적 이미지 로드 실패, 플레이스홀더 사용:', error);
      this.spriteTexture = null;
    }
  }

  public fire(playerPos: Vector2, enemies: Enemy[]): Projectile[] {
    // ... 기존 코드

    const projectile = new Projectile(...);

    // 이미지가 있으면 Sprite 사용, 없으면 Graphics
    if (this.spriteTexture) {
      const sprite = new Sprite(this.spriteTexture);
      sprite.anchor.set(0.5);
      projectile.removeChildren(); // 기본 Graphics 제거
      projectile.addChild(sprite);
    }
    // else: 기본 Graphics 사용 (노란 원)

    return [projectile];
  }
}
```

#### 3. 조건부 렌더링 패턴

**Projectile 클래스 수정** (`src/game/entities/Projectile.ts`):

```typescript
export class Projectile extends Container {
  private graphics?: Graphics;
  private sprite?: Sprite;

  constructor(
    id: string,
    x: number,
    y: number,
    direction: Vector2,
    color: number = 0xffffff,
    texture?: any // 선택적 텍스처
  ) {
    super();

    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;

    // 텍스처가 있으면 Sprite, 없으면 Graphics
    if (texture) {
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.addChild(this.sprite);
    } else {
      this.graphics = new Graphics();
      this.graphics.beginFill(color);
      this.graphics.drawCircle(0, 0, this.radius);
      this.graphics.endFill();
      this.addChild(this.graphics);
    }
  }
}
```

**사용**:

```typescript
// 이미지 있을 때
const projectile = new Projectile(id, x, y, dir, 0xffffff, this.spriteTexture);

// 이미지 없을 때 (플레이스홀더)
const projectile = new Projectile(id, x, y, dir, 0xffff00);
```

---

## 예제 코드

### 완전한 무기 구현 예시: 도깨비불

```typescript
// src/game/weapons/DokkaebiFireWeapon.ts
import { calculateWeaponStats } from '@/game/data/weapons';
import type { Enemy } from '@/game/entities/Enemy';
import type { Player } from '@/game/entities/Player';
import { OrbitalEntity } from '@/game/entities/OrbitalEntity';
import type { Container } from 'pixi.js';
import type { Vector2 } from '@/types/game.types';

import { Weapon } from './Weapon';

export class DokkaebiFireWeapon extends Weapon {
  private orbitals: OrbitalEntity[] = [];
  private orbitalCount: number = 1;
  private orbitalRadius: number = 80;
  private angularSpeed: number = 2.0; // rad/s

  constructor() {
    const stats = calculateWeaponStats('dokkaebi', 1);
    super('도깨비불', stats.damage, stats.cooldown);
  }

  /**
   * 투사체형이 아니므로 fire는 빈 배열 반환
   */
  public fire(playerPos: Vector2, enemies: Enemy[]): never[] {
    return [];
  }

  /**
   * 궤도 생성 (무기 추가 시 또는 레벨업 시 호출)
   */
  public spawnOrbitals(player: Player, gameLayer: Container): void {
    // 기존 궤도 제거
    for (const orbital of this.orbitals) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }
    this.orbitals = [];

    // 새 궤도 생성
    const angleStep = (Math.PI * 2) / this.orbitalCount;

    for (let i = 0; i < this.orbitalCount; i++) {
      const angle = angleStep * i;
      const orbital = new OrbitalEntity(
        angle,
        this.orbitalRadius,
        this.angularSpeed,
        0x00ffff // 청록색
      );
      orbital.damage = this.damage;

      this.orbitals.push(orbital);
      gameLayer.addChild(orbital);
    }

    console.log(`도깨비불 x${this.orbitalCount} 생성`);
  }

  /**
   * 매 프레임 업데이트
   */
  public updateOrbitals(deltaTime: number, player: Player): void {
    for (const orbital of this.orbitals) {
      orbital.update(deltaTime, player);
    }
  }

  /**
   * 레벨업
   */
  public levelUp(): void {
    super.levelUp();

    const stats = calculateWeaponStats('dokkaebi', this.level);
    this.damage = stats.damage;

    // 레벨업 효과
    if (this.level % 2 === 0 && this.orbitalCount < 8) {
      this.orbitalCount++; // 짝수 레벨마다 개수 +1 (최대 8개)
    }

    if (this.level % 3 === 0) {
      this.orbitalRadius += 10; // 3레벨마다 반경 +10
    }

    console.log(`🔥 도깨비불 레벨 ${this.level}! (개수: ${this.orbitalCount})`);
  }

  /**
   * 궤도 접근자
   */
  public getOrbitals(): OrbitalEntity[] {
    return this.orbitals;
  }

  /**
   * 정리
   */
  public destroy(gameLayer: Container): void {
    for (const orbital of this.orbitals) {
      gameLayer.removeChild(orbital);
      orbital.destroy();
    }
    this.orbitals = [];
  }
}
```

---

## 통합 체크리스트

### GameScene.ts 수정사항

```typescript
// 1. 무기 인스턴스 변수 추가
private dokkaebiWeapon?: DokkaebiFireWeapon;

// 2. addWeapon() switch문에 추가
private addWeapon(weaponId: string): void {
  switch (weaponId) {
    case 'weapon_dokkaebi': {
      const weapon = new DokkaebiFireWeapon();
      weapon.spawnOrbitals(this.player, this.gameLayer);
      this.dokkaebiWeapon = weapon;
      this.weapons.push(weapon);
      console.log('도깨비불 무기 추가 완료!');
      break;
    }
    // ... 다른 무기들
  }
}

// 3. update() 메서드에서 궤도형 업데이트
private update(deltaTime: number): void {
  // ... 기존 코드

  // 도깨비불 궤도 업데이트
  if (this.dokkaebiWeapon) {
    this.dokkaebiWeapon.updateOrbitals(deltaTime, this.player);
  }

  // ... 나머지 코드
}

// 4. 충돌 감지 (CombatSystem 또는 GameScene에서)
private checkOrbitalCollisions(): void {
  if (!this.dokkaebiWeapon) return;

  for (const orbital of this.dokkaebiWeapon.getOrbitals()) {
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;

      const distance = getDistance(
        { x: orbital.x, y: orbital.y },
        { x: enemy.x, y: enemy.y }
      );

      if (distance < orbital.radius + enemy.radius) {
        enemy.takeDamage(orbital.damage);
        // 지속 피해이므로 쿨타임 필요 (추가 구현)
      }
    }
  }
}
```

---

## 다음 단계

무기 구현 후:

1. **테스트**: 발사/공격 동작 확인
2. **밸런스 조정**: `game/data/weapons.ts`에서 수치 조정
3. **i18n 추가**: `src/i18n/locales/ko.json`에 번역 추가
4. **이미지 교체**: 에셋 준비 후 Sprite로 전환
5. **진화 시스템**: 최대 레벨 시 특수 효과 추가

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-17
**작성자**: 개발팀
