# 파워업 시스템 (Powerup System)

> 레벨업 시 선택 가능한 모든 파워업 강화 옵션

---

## 📊 전체 파워업 목록

총 **10종**의 파워업이 존재하며, 각각 **3가지 등급** (일반/희귀/에픽)으로 제공됩니다.

### 파워업 등급

| 등급 | 영문 | 색상 | 획득 난이도 |
|------|------|------|------------|
| 일반 | Common | 흰색 | 높음 |
| 희귀 | Rare | 파란색 | 중간 |
| 에픽 | Epic | 보라색 | 낮음 |

---

## ⚔️ 공격 파워업 (4종)

### 1. 무력 (Damage)

**효과**: 모든 무기의 피해량 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +2% | `stat_damage_common` |
| 희귀 | +5% | `stat_damage_rare` |
| 에픽 | +10% | `stat_damage_epic` |

- **최대치**: 500% (5배)
- **기본값**: 100% (1배)
- **아이콘**: `/assets/power-up/attack-power.png`

---

### 2. 신속 (Cooldown)

**효과**: 모든 무기의 쿨타임 감소

| 등급 | 감소량 | ID |
|------|--------|-----|
| 일반 | -2% | `stat_cooldown_common` |
| 희귀 | -5% | `stat_cooldown_rare` |
| 에픽 | -10% | `stat_cooldown_epic` |

- **최대치**: 70% 감소 (쿨타임 30% 유지)
- **기본값**: 100% (감소 없음)
- **아이콘**: `/assets/power-up/attack-speed.png`

---

### 3. 필살 (Critical Rate)

**효과**: 치명타 발동 확률 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +5% | `powerup_crit_rate_common` |
| 희귀 | +10% | `powerup_crit_rate_rare` |
| 에픽 | +20% | `powerup_crit_rate_epic` |

- **최대치**: 100% (모든 공격이 치명타)
- **기본값**: 5%
- **아이콘**: `/assets/power-up/crit-rate.png`

---

### 4. 극살 (Critical Damage)

**효과**: 치명타 발동 시 피해량 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +20% | `powerup_crit_damage_common` |
| 희귀 | +50% | `powerup_crit_damage_rare` |
| 에픽 | +100% | `powerup_crit_damage_epic` |

- **최대치**: 650% (기본 150% + 추가 500%)
- **기본값**: 150% (1.5배)
- **아이콘**: `/assets/power-up/crit-damage.png`

---

## 💪 방어 파워업 (3종)

### 5. 생명력 (Health)

**효과**: 최대 체력 증가 및 즉시 회복

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +5 HP | `stat_health_common` |
| 희귀 | +15 HP | `stat_health_rare` |
| 에픽 | +30 HP | `stat_health_epic` |

- **최대치**: 500 HP
- **기본값**: 100 HP
- **특징**: 획득 시 증가한 만큼 즉시 회복
- **아이콘**: `/assets/power-up/health.png`

---

### 6. 강체 (Damage Reduction)

**효과**: 받는 모든 피해 감소

| 등급 | 감소량 | ID |
|------|--------|-----|
| 일반 | -3% | `powerup_damage_reduction_common` |
| 희귀 | -8% | `powerup_damage_reduction_rare` |
| 에픽 | -15% | `powerup_damage_reduction_epic` |

- **최대치**: 80% 감소 (피해 20%만 받음)
- **기본값**: 0% (감소 없음)
- **아이콘**: `/assets/power-up/damage-reduction.png`

---

### 7. 호흡 (Breathing)

**효과**: 초당 최대 체력의 일정 비율만큼 체력 자동 회복

| 등급 | 초당 회복률 | 100 HP 기준 | 500 HP 기준 | ID |
|------|------------|------------|------------|-----|
| 일반 | 0.5%/초 | 0.5 HP/초 | 2.5 HP/초 | `powerup_breathing_common` |
| 희귀 | 1.2%/초 | 1.2 HP/초 | 6.0 HP/초 | `powerup_breathing_rare` |
| 에픽 | 2.5%/초 | 2.5 HP/초 | 12.5 HP/초 | `powerup_breathing_epic` |

- **최대치**: 없음 (누적 가능)
- **기본값**: 0% (비활성)
- **특징**:
  - 최대 체력에 비례하여 회복량이 증가
  - 생명력 파워업과 강력한 시너지 효과
  - 중복 획득 시 회복률이 누적됨
- **아이콘**: `/assets/power-up/health-generate.png`

---

## ⚙️ 유틸리티 파워업 (3종)

### 8. 경신 (Speed)

**효과**: 플레이어 이동 속도 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +3% | `stat_speed_common` |
| 희귀 | +7% | `stat_speed_rare` |
| 에픽 | +15% | `stat_speed_epic` |

- **최대치**: 200% (2배)
- **기본값**: 100% (1배)
- **아이콘**: `/assets/power-up/speed.png`

---

### 9. 영혼 흡인 (Pickup Range)

**효과**: 경험치 젬 획득 범위 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +5% | `stat_pickup_common` |
| 희귀 | +15% | `stat_pickup_rare` |
| 에픽 | +30% | `stat_pickup_epic` |

- **최대치**: 500% (5배)
- **기본값**: 100% (1배)
- **아이콘**: `/assets/power-up/pickup-range.png`

---

### 10. 수련 (XP Gain)

**효과**: 경험치 획득량 증가

| 등급 | 증가량 | ID |
|------|--------|-----|
| 일반 | +5% | `powerup_xp_gain_common` |
| 희귀 | +12% | `powerup_xp_gain_rare` |
| 에픽 | +25% | `powerup_xp_gain_epic` |

- **최대치**: 300% (3배)
- **기본값**: 100% (1배)
- **아이콘**: `/assets/power-up/xp-gain.png`

---

## 📋 전체 파워업 요약표

| # | 이름 | 카테고리 | 일반 | 희귀 | 에픽 | 최대치 |
|---|------|---------|------|------|------|--------|
| 1 | 무력 | 공격 | +2% | +5% | +10% | 500% |
| 2 | 신속 | 공격 | -2% | -5% | -10% | 70% 감소 |
| 3 | 필살 | 공격 | +5% | +10% | +20% | 100% |
| 4 | 극살 | 공격 | +20% | +50% | +100% | 650% |
| 5 | 생명력 | 방어 | +5 HP | +15 HP | +30 HP | 500 HP |
| 6 | 강체 | 방어 | -3% | -8% | -15% | 80% |
| 7 | 호흡 | 방어 | 0.5%/s | 1.2%/s | 2.5%/s | 없음 |
| 8 | 경신 | 유틸 | +3% | +7% | +15% | 200% |
| 9 | 영혼 흡인 | 유틸 | +5% | +15% | +30% | 500% |
| 10 | 수련 | 유틸 | +5% | +12% | +25% | 300% |

---

## 🔧 구현 파일 위치

### 설정 파일
- **`/src/config/powerups.config.ts`**: 모든 파워업의 메타데이터 및 수치 정의

### 적용 로직
- **`/src/game/entities/Player.ts`**:
  - `applyStatUpgrade()`: 기본 스탯 적용 (무력, 신속, 생명력, 경신, 영혼 흡인)
  - `applyPowerup()`: 추가 파워업 적용 (필살, 극살, 강체, 호흡, 수련)

### 레벨업 시스템
- **`/src/systems/LevelSystem.ts`**: 레벨업 시 선택지 생성

---

## 💡 설계 원칙

1. **명확한 분류**: 공격 / 방어 / 유틸리티로 구분
2. **등급별 차등**: 높은 등급일수록 강력한 효과
3. **밸런스 제한**: 모든 파워업에 최대치 설정 (호흡 제외)
4. **스택 가능**: 같은 파워업을 여러 번 획득하여 누적 가능
5. **i18n 지원**: 다국어 표시 (`powerup.{id}` 형식)

---

## 🎮 사용 예시

### 레벨업 시 선택
```typescript
// 플레이어가 "필살 (에픽)" 선택
player.applyPowerup('powerup_crit_rate_epic');
// → 치명타 확률 +20%

// 플레이어가 "무력 (희귀)" 선택
player.applyStatUpgrade('stat_damage_rare');
// → 공격력 +5%
```

### 전투 시 적용
```typescript
// 치명타 판정
const { isCritical, damageMultiplier } = player.rollCritical();
// isCritical: true/false (player.criticalRate 확률)
// damageMultiplier: player.damageMultiplier * (isCritical ? player.criticalDamage : 1.0)

// 최종 데미지 계산
const finalDamage = baseDamage * damageMultiplier;

// 피해 받을 때
const actualDamage = incomingDamage * (1 - player.damageReduction);
player.takeDamage(actualDamage);
```

---

**문서 버전**: 3.0
**최종 수정일**: 2025-10-26
**작성자**: 개발팀
