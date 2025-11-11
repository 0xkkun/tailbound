# 유물 시스템 (Artifact System)

> 2분마다 등장하는 엘리트 처치 시 획득하는 세션 전용 강력한 파워업

**작성일**: 2025-11-11
**상태**: 📝 설계 중
**우선순위**: Phase 3 - 콘텐츠 확장

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [엘리트 몬스터](#엘리트-몬스터)
3. [유물 아이디어](#유물-아이디어)
4. [시각적 연출](#시각적-연출)
5. [기술 구현](#기술-구현)

---

## 시스템 개요

### 핵심 컨셉

**"10분에 4번의 선택, 빌드를 완성하라"**

현재 게임은:
- 레벨업으로 **배율 파워업** 획득 (damage +10%, cooldown -10% 등)
- 무기는 **레벨 단위 강화** (데미지 +5, 쿨타임 -0.05초)
- 치명타, 피해감소 등 **조건부 효과**는 파워업으로만 가능

유물은 이 시스템 위에:
- **극단적인 배율** 제공 (epic 파워업 이상)
- **특수 메커니즘** 추가 (게임 플레이 변화)
- **무기 특화** 버프 (특정 무기만 강화)
- **조건부 폭발적 효과** (상황에 따라 극대화)

### 획득 타이밍 & 밸런스

```
시간    엘리트    플레이어 예상 상태                  유물 티어
─────────────────────────────────────────────────────────
2분     ①       Lv 3-5, 무기 2개, 파워업 2-3개      Tier 1 (기본)
4분     ②       Lv 7-10, 무기 3개, 파워업 5-8개     Tier 2 (강화)
6분     ③       Lv 12-15, 무기 4개, 파워업 10-15개  Tier 3 (특화)
8분     ④       Lv 18-22, 무기 5개, 파워업 15-20개  Tier 4 (극한)
```

**선택 시스템**: 3개 유물 중 1개 선택 (레벨업 UI 재사용)

---

## 엘리트 몬스터

### 스탯 (기존 적 대비)

```typescript
체력: Medium 티어 × 2배 = 105 × 2 = 210 HP
공격력: Medium 티어 × 1.5배 = 35 × 1.5 = 52 데미지
이동속도: 타입별 기본 속도 × 1.1배
크기: 1.3배 (반지름 ×1.3)
경험치: 일반 적 × 8배

특수:
- 넉백 저항 50%
- 붉은 틴팅 (0xff3300)
- 외곽 발광 애니메이션
```

### 등장 패턴

**타이밍**: 정확히 120초, 240초, 360초, 480초

**경고 (10초 전)**:
- 화면 테두리 붉은 깜빡임 (alpha 사인파)
- 텍스트: "강력한 기운이 느껴진다..." (중앙 상단)
- 효과음: 으스스한 드론 사운드

**스폰**:
- 플레이어로부터 800px 거리, 랜덤 방향
- 화면 흔들림 (intensity 5, duration 0.3초)
- 붉은 플래시 (0.2초)

**처치 보상**:
- 유물 선택 UI (시간 정지)
- 경험치 젬 대량 드롭 (레벨업 보장)
- 골드 50-100

### 엘리트 타입 (기존 적 기반)

| 타입 | 베이스 몬스터 | 특징 |
|------|--------------|------|
| 엘리트 도깨비 | 도깨비 | 느리지만 매우 단단함 (HP 350) |
| 엘리트 탈령 | 탈령 | 빠르고 강력한 공격 (52 데미지) |
| 엘리트 여우 | 여우 | 균형잡힌 위협 |
| 엘리트 저승사자 | 저승사자 | 가장 위험 (빠름 + 강함) |

---

## 유물 아이디어

### 설계 원칙

1. **기존 시스템 활용**: `player.damageMultiplier`, `cooldownMultiplier` 등 직접 조작
2. **숫자가 명확**: "공격력 +50%", "쿨타임 -30%" 등 정량적
3. **조건부 강력**: 특정 상황에서 폭발적 효과
4. **무기 시너지**: 특정 무기와 강한 조합
5. **트레이드오프**: 강력한 대가로 리스크

---

### 🔴 Tier 1: 기본 강화 (2분)

> 초반 빌드 방향 설정, 안정적인 효과

#### 💪 전사의 심장 (Warrior's Heart)
```typescript
효과:
- maxHealth +50 (100 → 150)
- 체력 50% 이하 시 damageMultiplier +0.3 추가

시너지: 탱커 빌드, 맹호의 이빨 컨셉
색상: 빨강 (0xff0000)
```

#### ⚡ 신속의 부적 (Swift Talisman)
```typescript
효과:
- 부적 무기 레벨 +2
- 부적 쿨타임 추가 -20%

조건: 부적 무기 보유 시에만 등장
시너지: 부적 특화 빌드
색상: 노랑 (0xffff00)
```

#### 🔥 작열하는 혼백 (Blazing Soul)
```typescript
효과:
- 도깨비불 데미지 +50%
- 도깨비불 회전속도 +30%

조건: 도깨비불 무기 보유 시에만 등장
시너지: 도깨비불 특화 빌드
색상: 주황 (0xff6600)
```

#### 📿 축복의 염주 (Blessed Rosary)
```typescript
효과:
- xpMultiplier +0.3 (총 1.3배)
- pickupRangeMultiplier +0.5 (총 1.5배)

시너지: 성장 가속 빌드
색상: 청록 (0x40e0d0)
```

#### 🎯 명중의 눈동자 (Aiming Eye)
```typescript
효과:
- criticalRate +0.15 (15%)
- 투사체 무기 (부적, 작두날, 부채바람, 정화수) 속도 +30%

시너지: 치명타 빌드, 원거리 빌드
색상: 파랑 (0x4169e1)
```

---

### 🟠 Tier 2: 특화 강화 (4분)

> 빌드 방향을 극대화, 명확한 선택

#### ⚡ 뇌신의 북 (Thunder God's Drum)
```typescript
효과:
- 적 처치 시 15% 확률로 번개 연쇄
  - 반경 300px 내 최대 3명
  - 각 연쇄마다 80% 피해
- 번개 이펙트 (LightningEffect 재사용)

시너지: 고화력 빌드, 무리 제거
색상: 청록 (0x00ffff)
구현: player.onKill 이벤트에 훅
```

#### 🛡️ 현무의 비늘 (Genbu's Scale)
```typescript
효과:
- damageReduction +0.2 (20% 피해 감소)
- 피격 시 1초간 이동속도 +50% (쿨타임 3초)

시너지: 생존 빌드, 카이팅
색상: 청록 (0x00bfff)
구현: player.takeDamage 후처리에 버프 추가
```

#### 🌙 영혼 수확자 (Soul Reaper)
```typescript
효과:
- 적 처치 시 스택 +1 (최대 100스택)
- 스택당 damageMultiplier +0.01 (최대 +1.0 = 100%)
- 피격 시 스택 -20

시너지: 노히트 빌드, 회피 플레이
색상: 보라 (0x9370db)
구현: player 내부 artifactStacks 변수 추가
UI: 화면에 스택 표시
```

#### 🔨 도깨비 방망이 (Dokkaebi Mallet)
```typescript
효과:
- 모든 골드 드롭 +100%
- 레벨업 시 체력 50% 회복

시너지: 상점 활용, 안정적 성장
색상: 갈색 (0xa0522d)
구현: 골드 드롭 시 2배 적용, levelUp 이벤트 훅
```

#### 💨 바람의 깃털 (Wind Feather)
```typescript
효과:
- speedMultiplier +0.4 (총 1.4배)
- 이동 속도 10% 증가당 공격력 +5% (최대 +20%)

시너지: 백호 세트, 기동형 빌드
색상: 하얀색 (0xffffff)
구현: damageMultiplier에 speedMultiplier 기반 보너스 추가
```

#### 🔮 시간의 수정구 (Time Crystal)
```typescript
효과:
- cooldownMultiplier -0.25 추가 (최소 0.3 한도 내)
- 모든 무기 쿨타임 추가 -15%

시너지: 쿨타임 빌드, 스킬 난사
색상: 보라 (0x9370db)
구현: cooldownMultiplier 직접 조작
```

---

### 🟣 Tier 3: 극한 특화 (6분)

> 빌드 완성, 게임 체인저

#### 💀 죽음의 표식 (Mark of Death)
```typescript
효과:
- 피격한 적에게 5초간 "표식" 디버프
- 표식 붙은 적이 받는 모든 피해 +40%
- 표식 붙은 적 처치 시 주변 200px 적에게 표식 전염

시너지: 연쇄 학살, 광역 공격
색상: 검은 보라 (0x4b0082)
구현: Enemy에 markOfDeath 상태 추가, takeDamage에 배율 적용
시각: 적 위에 해골 아이콘 (Graphics)
```

#### 🪶 불사조의 깃털 (Phoenix Feather)
```typescript
효과:
- 치명상 시 체력 50% 부활 (게임당 1회)
- 부활 시 3초 무적 + 주변 400px 넉백

시너지: 공격형 빌드 보험
색상: 금색 (0xffd700)
구현: player.takeDamage에서 hp <= 0 체크, artifactReviveUsed 플래그
시각: 부활 시 금색 플래시 + 파티클 폭발
```

#### 🔥 화룡의 숨결 (Fire Dragon's Breath)
```typescript
효과:
- 모든 공격에 화상 부여 (3초간 초당 기본 피해의 30%)
- 화상 최대 3스택 중첩

시너지: 다단히트 무기 (도깨비불, 부적)
색상: 진한 주황 (0xff4500)
구현: Enemy에 burnStacks 배열, update에서 틱 데미지
시각: 불타는 이펙트 (빨간 파티클)
```

#### 🗡️ 처형인의 도끼 (Executioner's Axe)
```typescript
효과:
- 적 체력 25% 이하 시 즉사
- 처형 시 주변 250px 적 2초간 공포 (이동속도 -60%)

시너지: 마무리 특화
색상: 회색 (0x808080)
구현: Enemy.takeDamage에서 체력 비율 체크
시각: 처형 시 큰 검은 X 마크
```

#### 📖 지혜의 서 (Book of Wisdom)
```typescript
효과:
- 모든 무기 레벨 +1 (최대 레벨 제외)
- 광역 무기 (목탁, AoE) 범위 +30%
- 스킬 피해 +25%

시너지: 다무기 빌드, 광역 특화
색상: 파란색 (0x1e90ff)
구현: 무기 배열 순회하며 level++, 범위 관련 변수 조작
```

#### 🎲 행운의 별 (Lucky Star)
```typescript
효과:
- 모든 드롭 확률 +50%
- 레벨업 선택지 +1개 (3개 → 4개)
- 치명타 확률 +10%

시너지: RNG 극복, 안정적 성장
색상: 금색 (0xffd700)
구현: LevelUpSystem에서 선택지 개수 조절
```

---

### 🔴 Tier 4: 변형형 (8분)

> 극단적 효과, 게임 플레이 자체를 바꿈

#### 😈 광전사의 가면 (Berserker's Mask)
```typescript
효과:
- maxHealth × 0.5 (체력 절반)
- damageMultiplier +1.5 (150% 추가)
- 공격 속도 +40%

위험: 유리대포, 한 방에 죽을 수 있음
시너지: 회피 빌드, 원거리 무기
색상: 진한 빨강 (0x8b0000)
구현: maxHealth 직접 조작, hp도 비례 감소
```

#### 🌑 그림자의 망토 (Shadow Cloak)
```typescript
효과:
- 적 뒤에서 공격 시 피해 +150%
- 이동 속도 +30%
- 시야 범위 -30% (카메라 줌인)

위험: 시야 감소로 위험 감지 어려움
시너지: 기동형 빌드, 암살 플레이
색상: 검은 보라 (0x2f1b3c)
구현: 투사체 적중 시 각도 계산 (뒤: 120도 범위)
시각: 카메라 줌 레벨 조정
```

#### 🔄 환생의 구슬 (Rebirth Orb)
```typescript
효과:
- 치명상 시 체력 30% 부활 (게임당 2회)
- 부활 시 5초 무적
- 부활마다 maxHealth -20% (영구)

위험: 부활 반복 시 최대 체력 급감
시너지: 공격형 빌드
색상: 하얀색 (0xffffff)
구현: artifactReviveCount 카운터, maxHealth 감소
시각: 부활마다 다른 이펙트 (1회: 하얀색, 2회: 회색)
```

#### ⚖️ 균형의 저울 (Balance Scale)
```typescript
효과:
- 가장 높은 배율 스탯 +50%
- 나머지 배율 스탯 -30%

적용 대상:
- damageMultiplier
- speedMultiplier
- cooldownMultiplier (역수 적용)

위험: 밸런스 붕괴, 편향된 빌드 강제
시너지: 원스탯 극특화
색상: 금색 (0xd4af37)
구현: 3개 배율 비교 후 최댓값 찾아 조작
```

#### 💀 저주받은 목걸이 (Cursed Amulet)
```typescript
효과:
- 체력 1 고정 (회복 불가)
- 모든 공격이 적 즉사 (보스 제외)
- 피격 시 즉시 게임 오버

위험: 극한의 난이도, 한 번이라도 맞으면 끝
시너지: 완벽한 회피 플레이
색상: 검은색 (0x000000)
구현: maxHealth = 1, hp = 1, 회복 차단
      투사체 적중 시 enemy.hp = 0
시각: 화면 테두리 계속 어두움, 긴장감 연출
```

#### 🎲 혼돈의 주사위 (Chaos Dice)
```typescript
효과:
- 5초마다 랜덤 효과 발동 (3초 지속)

효과 풀:
- 공격력 +200%
- 공격력 -70%
- 이동 속도 +100%
- 이동 속도 -80%
- 무적
- 체력 1 (3초만)
- 주변 모든 적 빙결
- 화면 밖 적 10마리 스폰

위험: 완전 랜덤, 예측 불가
시너지: 없음 (재미 전용)
색상: 무지개 (애니메이션으로 색상 변화)
구현: 5초 타이머, 효과 배열에서 랜덤 선택
시각: 주사위 굴리기 애니메이션
```

---

## 시각적 연출

### 최소 에셋 전략

**필수 에셋**: 각 유물당 32x32 PNG 아이콘 1개
**나머지**: 색상 + Graphics API + 애니메이션

### 유물 선택 UI

**구조**: LevelUpUI 완전 재사용

```typescript
// src/game/ui/ArtifactSelectionUI.ts
// LevelUpUI.ts 복사 후 약간 수정

class ArtifactSelectionUI extends LevelUpUI {
  // 거의 동일, 차이점:
  // - 제목: "엘리트 처치! 유물을 선택하세요"
  // - 배경 오버레이: 더 어둡게 (0.9 alpha)
  // - 카드 등장 애니메이션: 조금 더 느리게 (0.4초)
}
```

**등급별 색상** (기존 파워업 팔레트 사용):

| 티어 | 등급 | 배경 | 테두리 | 뱃지 |
|------|------|------|--------|------|
| T1 | Rare | `0xf0ecf7` | `0xa782e2` | `0x8041e4` |
| T2 | Epic | `0xf4ebee` | `0xde8092` | `0xd3294a` |
| T3-4 | Legendary | `0xfef5e7` | `0xd4af37` | `0xd4af37` |

### 보유 유물 슬롯 UI

**위치**: 화면 좌하단

```
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 💪 │ │ ⚡ │ │ 🔥 │ │    │  ← 4개 슬롯 (60x60)
└────┘ └────┘ └────┘ └────┘
  T1     T2     T3     비어있음
```

**슬롯 애니메이션**:
```typescript
// 호흡 (sin 함수)
scale = 1.0 + Math.sin(time * 2) * 0.04
alpha = 0.9 + Math.sin(time * 3) * 0.1

// 등급별 테두리 색상
borderColor = artifact.rarity.borderColor
```

### 엘리트 몬스터 연출

**등장 전 (10초)**:
```typescript
// 화면 테두리 (Graphics, 전체 화면 크기)
const border = new Graphics()
border.rect(0, 0, width, height)
border.stroke({ width: 20, color: 0xff0000 })
border.alpha = 0.3 + Math.sin(time * 5) * 0.3

// 경고 텍스트
const warning = new Text({
  text: "강력한 기운이 느껴진다...",
  style: {
    fontSize: 32,
    fill: 0xff0000,
    stroke: { color: 0x000000, width: 3 }
  }
})
warning.anchor.set(0.5)
warning.x = width / 2
warning.y = 100
warning.alpha = 0.7 + Math.sin(time * 4) * 0.3
```

**엘리트 시각 효과**:
```typescript
// 크기
elite.scale.set(1.3)

// 틴팅
elite.setSpriteTint(0xff3300)

// 외곽 발광 (Graphics)
const aura = new Graphics()
aura.circle(0, 0, elite.radius + 15)
aura.stroke({
  width: 4,
  color: 0xff0000,
  alpha: 0.7
})
elite.addChild(aura)

// 호흡 애니메이션
aura.scale = 1.0 + Math.sin(time * 3) * 0.15
aura.alpha = 0.5 + Math.sin(time * 4) * 0.3
```

**체력바** (화면 상단 중앙):
```typescript
// 배경
const hpBarBg = new Graphics()
hpBarBg.rect(0, 0, 400, 30)
hpBarBg.fill(0x000000)

// 체력
const hpBar = new Graphics()
hpBar.rect(0, 0, 400 * (elite.hp / elite.maxHp), 30)
hpBar.fill(0xff0000)

// 텍스트
const hpText = new Text({
  text: `엘리트 ${elite.typeName} ${elite.hp}/${elite.maxHp}`,
  style: { fontSize: 18, fill: 0xffffff }
})
```

**처치 시**:
```typescript
// 슬로우 모션
game.timeScale = 0.3
setTimeout(() => game.timeScale = 1.0, 300)

// 화면 흔들림
screenShake(intensity: 8, duration: 0.4)

// 플래시
flash(color: 0xffffff, duration: 0.2)

// 파티클 폭발
for (let i = 0; i < 15; i++) {
  const particle = new Graphics()
  particle.circle(0, 0, 3)
  particle.fill(0xff0000)
  // ... 랜덤 방향으로 날아감
}

// 유물 선택 UI
artifactSelectionUI.show(3 artifacts)
```

---

## 기술 구현

### Phase 1: 엘리트 시스템 (3-4일)

```typescript
// src/systems/EliteSpawnSystem.ts
export class EliteSpawnSystem {
  private spawnTimes = [120, 240, 360, 480] // 2, 4, 6, 8분
  private spawnedElites = new Set<number>()
  private warningActive = false

  update(gameTime: number) {
    for (const spawnTime of this.spawnTimes) {
      // 경고 (10초 전)
      if (gameTime >= spawnTime - 10 &&
          gameTime < spawnTime &&
          !this.spawnedElites.has(spawnTime)) {
        if (!this.warningActive) {
          this.showWarning()
          this.warningActive = true
        }
      }

      // 스폰
      if (gameTime >= spawnTime &&
          !this.spawnedElites.has(spawnTime)) {
        this.spawnElite(spawnTime)
        this.spawnedElites.add(spawnTime)
        this.warningActive = false
      }
    }
  }

  showWarning() {
    // 테두리 + 텍스트
    this.scene.showEliteWarning()
  }

  spawnElite(spawnTime: number) {
    // 티어 결정
    const tier = Math.floor(spawnTime / 120) // 1-4

    // 타입 랜덤 선택
    const types = ['dokkaebi', 'mask', 'fox', 'grimReaper']
    const type = types[Math.floor(Math.random() * types.length)]

    // 엘리트 생성
    const elite = new EliteEnemy(type, tier)

    // 플레이어로부터 800px 거리
    const angle = Math.random() * Math.PI * 2
    const x = this.player.x + Math.cos(angle) * 800
    const y = this.player.y + Math.sin(angle) * 800

    elite.x = x
    elite.y = y

    this.scene.addEnemy(elite)

    // 효과
    this.scene.screenShake(5, 0.3)
    this.scene.flash(0xff0000, 0.2)
  }
}

// src/game/entities/enemies/EliteEnemy.ts
export class EliteEnemy extends BaseEnemy {
  constructor(type: string, tier: number) {
    super(type)

    // 스탯 조정
    const baseMediumHP = 105
    const baseMediumDamage = 35

    this.maxHp = baseMediumHP * 2
    this.hp = this.maxHp
    this.damage = baseMediumDamage * 1.5
    this.speed *= 1.1
    this.knockbackResistance = 0.5
    this.xpDrop *= 8

    // 시각 효과
    this.scale.set(1.3)
    this.setSpriteTint(0xff3300)
    this.createAura()
  }

  createAura() {
    const aura = new Graphics()
    aura.circle(0, 0, this.radius + 15)
    aura.stroke({ width: 4, color: 0xff0000, alpha: 0.7 })
    this.addChild(aura)

    // 호흡 애니메이션
    let time = 0
    this.on('tick', (delta) => {
      time += delta
      aura.scale.set(1.0 + Math.sin(time * 3) * 0.15)
      aura.alpha = 0.5 + Math.sin(time * 4) * 0.3
    })
  }

  onDeath() {
    super.onDeath()

    // 유물 선택 UI
    this.scene.showArtifactSelection(this.tier)

    // 효과
    this.scene.screenShake(8, 0.4)
    this.scene.flash(0xffffff, 0.2)
    this.scene.timeScale = 0.3
    setTimeout(() => this.scene.timeScale = 1.0, 300)
  }
}
```

### Phase 2: 유물 UI (2-3일)

```typescript
// src/game/ui/ArtifactSelectionUI.ts
// LevelUpUI.ts 기반으로 거의 동일

export class ArtifactSelectionUI extends Container {
  show(tier: number) {
    // 티어에 맞는 유물 3개 랜덤 선택
    const artifacts = this.selectArtifacts(tier, 3)

    // 카드 생성 (LevelUpUI와 동일)
    artifacts.forEach((artifact, index) => {
      const card = this.createCard(artifact, index)
      this.addChild(card)
    })

    // 배경 오버레이
    const overlay = new Graphics()
    overlay.rect(0, 0, width, height)
    overlay.fill({ color: 0x000000, alpha: 0.9 })
    this.addChildAt(overlay, 0)
  }

  selectArtifacts(tier: number, count: number) {
    const pool = ARTIFACTS.filter(a => a.tier === tier)
    return this.randomSample(pool, count)
  }

  createCard(artifact: Artifact, index: number) {
    // LevelUpUI.createOptionCard와 거의 동일
    const card = new Container()

    // 배경 (등급별 색상)
    const bg = new Graphics()
    bg.roundRect(0, 0, 280, 360, 10)
    bg.fill(artifact.rarity.bgColor)
    bg.stroke({ width: 3, color: artifact.rarity.borderColor })

    // 아이콘 (32x32 PNG)
    const icon = Sprite.from(artifact.iconPath)
    icon.width = 64
    icon.height = 64
    icon.x = 108
    icon.y = 80

    // 등급 뱃지
    // 이름, 설명 텍스트
    // ...

    // 호버 & 클릭 이벤트
    card.interactive = true
    card.on('pointerover', () => this.onHover(card))
    card.on('pointerout', () => this.onHoverExit(card))
    card.on('pointerdown', () => this.onSelect(artifact))

    // 등장 애니메이션
    card.scale.set(0)
    gsap.to(card.scale, {
      x: 1.2, y: 1.2,
      duration: 0.3,
      delay: index * 0.1,
      ease: 'back.out',
      onComplete: () => {
        gsap.to(card.scale, {
          x: 1.0, y: 1.0,
          duration: 0.1
        })
      }
    })

    return card
  }

  onSelect(artifact: Artifact) {
    // 효과
    this.selectedCard.tint = 0xffffff
    gsap.to(this.selectedCard, {
      alpha: 0,
      scale: 1.5,
      y: this.selectedCard.y - 100,
      duration: 0.5
    })

    // 유물 적용
    this.scene.artifactSystem.addArtifact(artifact)

    // UI 닫기
    this.hide()
  }
}
```

### Phase 3: 유물 시스템 (5-7일)

```typescript
// src/systems/ArtifactSystem.ts
export class ArtifactSystem {
  private artifacts: Artifact[] = []
  private player: Player

  addArtifact(artifact: Artifact) {
    this.artifacts.push(artifact)
    this.applyEffect(artifact)
    this.ui.addArtifactToSlot(artifact)
  }

  applyEffect(artifact: Artifact) {
    switch (artifact.id) {
      case 'warrior_heart':
        this.player.maxHealth += 50
        this.player.addDamageModifier(() => {
          return this.player.hp <= this.player.maxHealth * 0.5 ? 0.3 : 0
        })
        break

      case 'swift_talisman':
        const talisman = this.player.weapons.find(w => w.id === 'weapon_talisman')
        if (talisman) {
          talisman.level += 2
          talisman.cooldown *= 0.8
        }
        break

      case 'thunder_drum':
        this.player.onKill.add((enemy: Enemy) => {
          if (Math.random() < 0.15) {
            this.triggerLightningChain(enemy)
          }
        })
        break

      case 'soul_reaper':
        this.player.soulStacks = 0
        this.player.onKill.add(() => {
          this.player.soulStacks = Math.min(100, this.player.soulStacks + 1)
        })
        this.player.addDamageModifier(() => {
          return this.player.soulStacks * 0.01
        })
        this.player.onTakeDamage.add(() => {
          this.player.soulStacks = Math.max(0, this.player.soulStacks - 20)
        })
        break

      case 'phoenix_feather':
        this.player.phoenixReviveUsed = false
        this.player.onTakeDamage.add((damage, source) => {
          if (this.player.hp <= 0 && !this.player.phoenixReviveUsed) {
            this.player.hp = this.player.maxHealth * 0.5
            this.player.phoenixReviveUsed = true
            this.player.invincible = true
            setTimeout(() => this.player.invincible = false, 3000)
            // 넉백 효과
            this.knockbackNearbyEnemies(400)
            // 시각 효과
            this.scene.flash(0xffd700, 0.5)
            this.spawnReviveParticles()
          }
        })
        break

      case 'mark_of_death':
        this.player.weapons.forEach(weapon => {
          weapon.onHit.add((enemy: Enemy) => {
            enemy.markOfDeath = {
              duration: 5.0,
              source: this.player
            }
          })
        })
        Enemy.prototype.takeDamage = (function(original) {
          return function(damage, source) {
            if (this.markOfDeath && this.markOfDeath.duration > 0) {
              damage *= 1.4
            }
            const result = original.call(this, damage, source)
            if (this.hp <= 0 && this.markOfDeath) {
              // 전염
              const nearby = this.scene.getEnemiesNear(this, 200)
              nearby.forEach(e => {
                e.markOfDeath = {
                  duration: 5.0,
                  source: this.markOfDeath.source
                }
              })
            }
            return result
          }
        })(Enemy.prototype.takeDamage)
        break

      case 'berserker_mask':
        this.player.maxHealth *= 0.5
        this.player.hp = Math.min(this.player.hp, this.player.maxHealth)
        this.player.damageMultiplier += 1.5
        this.player.weapons.forEach(w => w.cooldown *= 0.6)
        break

      // ... 나머지 유물들
    }
  }

  triggerLightningChain(origin: Enemy) {
    const nearby = this.scene.getEnemiesNear(origin, 300)
    let currentTarget = origin
    let damage = origin.lastDamageTaken

    for (let i = 0; i < Math.min(3, nearby.length); i++) {
      const nextTarget = nearby[i]
      if (nextTarget === currentTarget) continue

      damage *= 0.8
      nextTarget.takeDamage(damage, this.player)

      // 번개 이펙트
      const lightning = new LightningEffect(currentTarget, nextTarget)
      this.scene.addChild(lightning)

      currentTarget = nextTarget
    }
  }
}
```

### Phase 4: 보유 유물 UI (2일)

```typescript
// src/game/ui/ArtifactSlotsUI.ts
export class ArtifactSlotsUI extends Container {
  private slots: Container[] = []

  constructor() {
    super()
    this.x = 20
    this.y = window.innerHeight - 120

    for (let i = 0; i < 4; i++) {
      const slot = this.createEmptySlot()
      slot.x = i * 70
      this.slots.push(slot)
      this.addChild(slot)
    }
  }

  createEmptySlot() {
    const slot = new Container()

    const bg = new Graphics()
    bg.roundRect(0, 0, 60, 60, 8)
    bg.stroke({ width: 2, color: 0x666666, alpha: 0.5 })
    slot.addChild(bg)

    return slot
  }

  addArtifactToSlot(artifact: Artifact, index: number) {
    const slot = this.slots[index]

    // 아이콘
    const icon = Sprite.from(artifact.iconPath)
    icon.width = 48
    icon.height = 48
    icon.x = 6
    icon.y = 6
    icon.name = 'icon'
    slot.addChild(icon)

    // 등급 테두리
    const border = new Graphics()
    border.roundRect(0, 0, 60, 60, 8)
    border.stroke({
      width: 3,
      color: artifact.rarity.borderColor
    })
    border.name = 'border'
    slot.addChild(border)

    // 호흡 애니메이션
    let time = 0
    slot.on('tick', (delta) => {
      time += delta
      icon.scale.set(1.0 + Math.sin(time * 2) * 0.04)
      border.alpha = 0.9 + Math.sin(time * 3) * 0.1
    })

    // 툴팁 (호버 시)
    slot.interactive = true
    slot.on('pointerover', () => {
      this.showTooltip(artifact, slot)
    })
    slot.on('pointerout', () => {
      this.hideTooltip()
    })
  }

  showTooltip(artifact: Artifact, slot: Container) {
    const tooltip = new Container()

    // 배경
    const bg = new Graphics()
    bg.roundRect(0, 0, 250, 120, 8)
    bg.fill(0x000000)
    bg.stroke({ width: 2, color: artifact.rarity.borderColor })
    tooltip.addChild(bg)

    // 텍스트
    const text = new Text({
      text: `${artifact.name}\n\n${artifact.description}`,
      style: {
        fontSize: 14,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 230
      }
    })
    text.x = 10
    text.y = 10
    tooltip.addChild(text)

    // 위치
    tooltip.x = slot.x
    tooltip.y = -130

    this.tooltipContainer = tooltip
    this.addChild(tooltip)
  }
}
```

---

## 구현 우선순위

### ✅ Milestone 1: 엘리트 시스템 (3-4일)
- [ ] EliteSpawnSystem 구현
- [ ] EliteEnemy 클래스
- [ ] 경고 UI (테두리 + 텍스트)
- [ ] 체력바 UI (화면 상단)
- [ ] 처치 시 연출 (슬로우모션, 플래시)

### ✅ Milestone 2: 유물 UI (2-3일)
- [ ] ArtifactSelectionUI (LevelUpUI 복사)
- [ ] 카드 레이아웃 및 애니메이션
- [ ] 등급별 색상 적용
- [ ] 선택 시 이펙트

### ✅ Milestone 3: 기본 유물 (5-7일)
- [ ] ArtifactSystem 구조
- [ ] Tier 1 유물 5개
- [ ] Tier 2 유물 6개
- [ ] Tier 3 유물 6개
- [ ] Tier 4 유물 6개 (최소 3개만 먼저)

### ✅ Milestone 4: 보유 UI (2일)
- [ ] ArtifactSlotsUI (화면 좌하단)
- [ ] 슬롯 애니메이션
- [ ] 툴팁 표시

### ✅ Milestone 5: 폴리싱 (3-4일)
- [ ] 유물 아이콘 제작 (32x32 PNG × 23개)
- [ ] 특수 효과 이펙트 (번개, 화상, 표식 등)
- [ ] 밸런스 조정
- [ ] 버그 수정

**총 예상 기간**: 2-3주

---

## 데이터 구조

```typescript
// src/data/artifacts.ts
export interface Artifact {
  id: string
  name: string
  tier: 1 | 2 | 3 | 4
  rarity: 'rare' | 'epic' | 'legendary'
  iconPath: string
  description: string
  effects: ArtifactEffect[]
}

export interface ArtifactEffect {
  type: 'stat' | 'passive' | 'special'
  trigger?: 'always' | 'on_kill' | 'on_hit' | 'on_damage'
  value?: number
  condition?: (player: Player) => boolean
}

export const ARTIFACTS: Artifact[] = [
  {
    id: 'warrior_heart',
    name: '전사의 심장',
    tier: 1,
    rarity: 'rare',
    iconPath: 'assets/artifacts/warrior_heart.png',
    description: '최대 체력 +50\n체력 50% 이하 시 공격력 +30%',
    effects: [
      { type: 'stat', trigger: 'always', value: 50 },
      { type: 'passive', trigger: 'always' }
    ]
  },
  // ...
]
```

---

**작성자**: 개발팀
**버전**: 2.0
**최종 수정**: 2025-11-11
**상태**: 구현 준비 완료
