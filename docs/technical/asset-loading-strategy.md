# 에셋 로딩 전략

## 개요

게임 에셋을 CDN에서 단계별로 로딩하여 초기 로딩 시간을 최소화하고 사용자 경험을 개선합니다.

## CDN 설정

- **CDN URL**: `https://cdn.tailbound.xyz`
- **배포**: CloudFront
- **오리진**: AWS S3 버킷 (`cdn.tailbound.xyz`)
- **HTTPS**: CloudFront SSL 자동 지원
- **CORS**: CloudFront Response Headers Policy 설정됨
- **캐시 TTL**: Default 24시간 (권장: 1년)

## 로컬 vs CDN 에셋

### 로컬 에셋 (번들 포함)
초기 HTML 렌더링에 필요한 최소한의 에셋만 로컬에 보관:

```
public/
├── favicon.png           # 파비콘
├── og-image.png          # Open Graph 이미지
├── apple-touch-icon.png  # 애플 터치 아이콘
└── assets/
    └── gui/
        ├── bg-main.png   # 로딩 배경
        └── title.png     # 로딩 로고
```

### CDN 에셋
모든 게임 에셋 (~70개 파일):
- 플레이어/적 스프라이트
- 무기/아이템 이미지
- 타일/맵 에셋
- UI 요소
- 오디오 파일

## 로딩 플로우 타임라인

### 전체 흐름

```
[0초] 페이지 로드
  └─ HTML 로딩 화면 표시 (bg-main.png, title.png - 로컬 번들)

[0-2초] React 앱 마운트 + CDN 에셋 로딩
  ├─ Critical 로드 (7개) ← 블로킹
  ├─ High 로드 (17개) ← 블로킹
  └─ 총 24개 에셋 로드 완료

[2초] "PRESS TO START" 표시
  └─ HTML 로딩 화면 위에 오버레이

[사용자 클릭] 게임 시작
  ├─ HTML 로딩 화면 페이드아웃
  ├─ 로비 화면 (LobbyScene) 표시
  └─ 백그라운드: Medium (21개) + Low (26개) 로드 시작
```

### 1️⃣ HTML 로딩 화면 (즉시 표시)

**파일**: `index.html`
**위치**: 로컬 번들 (`public/assets/gui/`)

```html
<div id="loading-screen">
  <div class="loading-background" style="background-image: url('/assets/gui/bg-main.png')">
  <img src="/assets/gui/title.png" class="loading-logo" />
</div>
```

**에셋**:
- `bg-main.png` - 로딩 배경 이미지
- `title.png` - 설화 로고

**특징**:
- HTML 파싱 즉시 표시
- 로컬 번들이므로 다운로드 대기 없음
- CDN 에셋 로딩 중에도 계속 표시

### 2️⃣ Critical (필수) - 7개 에셋

**로딩 시점**: React 앱 마운트 후 즉시 (블로킹)
**구현**: `GameContainer.tsx` useEffect
**목적**: 게임 플레이에 필수적인 최소 에셋

```typescript
// src/config/assets.config.ts
critical: [
  CDN_ASSETS.player.shaman,           // 플레이어 기본
  CDN_ASSETS.player.shamanWalk,       // 플레이어 걷기
  CDN_ASSETS.tile.tile1,              // 타일 1
  CDN_ASSETS.tile.tile2,              // 타일 2
  CDN_ASSETS.tile.tile3,              // 타일 3
  CDN_ASSETS.gui.bgButton,            // UI 버튼 배경
  CDN_ASSETS.gui.settings,            // 설정 아이콘
]
```

**특징**:
- `await assetLoader.loadCritical()` - 완료까지 대기
- 로딩 완료 전까지 "PRESS TO START" 표시 안됨
- 예상 로딩 시간: ~1초

### 3️⃣ High (높음) - 17개 에셋

**로딩 시점**: Critical 완료 직후 (블로킹)
**목적**: 초반 스테이지에서 사용하는 에셋

```typescript
high: [
  // 초반 적 (3)
  CDN_ASSETS.enemy.skeletonWalk,
  CDN_ASSETS.enemy.dokkaebiGreenWalk,
  CDN_ASSETS.enemy.foxOrangeWalk,

  // 기본 무기 (2)
  CDN_ASSETS.weapon.talisman,
  CDN_ASSETS.weapon.mocktak,

  // 드롭 아이템 (4)
  CDN_ASSETS.drop.spiritEnergy1,
  CDN_ASSETS.drop.spiritEnergy2,
  CDN_ASSETS.drop.spiritEnergy3,
  CDN_ASSETS.drop.soul,

  // 기본 파워업 (4)
  CDN_ASSETS.powerUp.attackPower,
  CDN_ASSETS.powerUp.attackSpeed,
  CDN_ASSETS.powerUp.moveSpeed,
  CDN_ASSETS.powerUp.healthPlus,

  // 인게임 UI (4)
  CDN_ASSETS.gui.back,
  CDN_ASSETS.gui.resume,
  CDN_ASSETS.gui.restart,
  CDN_ASSETS.gui.sound,
]
```

**특징**:
- `await assetLoader.loadHigh()` - 완료까지 대기
- 로딩 완료 후 `onAssetsLoaded()` 콜백 호출
- "PRESS TO START" 표시됨
- 예상 로딩 시간: ~1초

### 4️⃣ Medium (중간) - 21개 에셋

**로딩 시점**: 백그라운드 (게임 플레이 중, 논블로킹)
**목적**: 중반 스테이지에서 사용하는 에셋

```typescript
medium: [
  // 중반 적 (10)
  CDN_ASSETS.enemy.dokkaebiBlueWalk,
  CDN_ASSETS.enemy.dokkaebiRedWalk,
  CDN_ASSETS.enemy.foxWhiteWalk,
  CDN_ASSETS.enemy.maskGreenWalk,
  CDN_ASSETS.enemy.maskRedWalk,
  CDN_ASSETS.enemy.womanGhostRedWalk,
  CDN_ASSETS.enemy.womanGhostWhiteWalk,
  CDN_ASSETS.enemy.womanGhostRedAttack,
  CDN_ASSETS.enemy.womanGhostWhiteAttack,
  CDN_ASSETS.enemy.womanGhostProjectile,

  // 중반 무기 (3)
  CDN_ASSETS.weapon.jakdu,
  CDN_ASSETS.weapon.dokkabiFire,
  CDN_ASSETS.weapon.wind,

  // 고급 파워업 (6)
  CDN_ASSETS.powerUp.healthGenerate,
  CDN_ASSETS.powerUp.magnetic,
  CDN_ASSETS.powerUp.drain,
  CDN_ASSETS.powerUp.kill,
  CDN_ASSETS.powerUp.criticalChance,
  CDN_ASSETS.powerUp.criticalDamage,

  // UI (2)
  CDN_ASSETS.gui.bgStage,
  CDN_ASSETS.gui.shamanSignature,
]
```

**특징**:
- `assetLoader.loadInBackground(['medium', 'low'])` - 비동기
- 사용자가 게임을 플레이하는 동안 로드
- 게임 플레이에 영향 없음

### 5️⃣ Low (낮음) - 26개 에셋

**로딩 시점**: 백그라운드 (게임 플레이 중, 논블로킹)
**목적**: 후반 스테이지/보스전 에셋

```typescript
low: [
  // 후반 적 (6)
  CDN_ASSETS.enemy.grimReaperWalk,
  CDN_ASSETS.enemy.waterGhostWalk,
  CDN_ASSETS.enemy.totemWalk,
  CDN_ASSETS.enemy.evilSpirit,
  CDN_ASSETS.enemy.evilSpiritAttack,
  CDN_ASSETS.enemy.enemyFireball,

  // 보스 에셋 (10)
  CDN_ASSETS.boss.bossAOE,
  CDN_ASSETS.boss.bossSkillEffect,
  CDN_ASSETS.boss.bossToeAttack,
  CDN_ASSETS.boss.lighting,
  CDN_ASSETS.boss.wt,
  CDN_ASSETS.boss.wtIdle,
  CDN_ASSETS.boss.bossDragon,
  CDN_ASSETS.boss.bossFire,
  CDN_ASSETS.boss.bossSoulball,
  CDN_ASSETS.boss.bossTiger,

  // 레어 파워업 (3)
  CDN_ASSETS.powerUp.damageReduction,
  CDN_ASSETS.powerUp.experienceBoost,
  CDN_ASSETS.powerUp.giftbox,

  // 후반 타일/UI (6)
  CDN_ASSETS.tile.tileDeco,
  CDN_ASSETS.tile.tileGreen1,
  CDN_ASSETS.tile.outlineBottom,
  CDN_ASSETS.tile.outlineLeft,
  CDN_ASSETS.tile.outlineRight,
  CDN_ASSETS.gui.titleFan,

  // NPC (1)
  CDN_ASSETS.npc.monk,
]
```

**특징**:
- Medium과 함께 백그라운드 로드
- 플레이어가 보스까지 도달하기 전에 완료
- 필요시 개별 엔티티에서 동적 로딩

## 로딩 단계 요약

| 단계 | 타이밍 | 에셋 수 | 블로킹 | 설명 |
|------|--------|---------|--------|------|
| **HTML** | 즉시 | 2개 | - | 로컬 번들 (bg-main, title) |
| **Critical** | 0-1초 | 7개 | ✅ | 플레이어, 타일, 기본 UI |
| **High** | 1-2초 | 17개 | ✅ | 초반 적, 무기, 드롭 |
| **Medium** | 백그라운드 | 21개 | ❌ | 중반 적, 고급 아이템 |
| **Low** | 백그라운드 | 26개 | ❌ | 후반 적, 보스 |

**전체 CDN 에셋**: 71개
**게임 시작 전 필수**: 24개 (Critical + High)

## 구현

### AssetLoader 서비스

```typescript
import { assetLoader } from '@/services/assetLoader';

// 필수 에셋 로드
await assetLoader.loadCritical();

// 높은 우선순위 에셋 로드
await assetLoader.loadHigh();

// 백그라운드에서 나머지 로드
assetLoader.loadInBackground(['medium', 'low']);
```

### 진행률 추적

```typescript
assetLoader.onProgress((progress) => {
  console.log(`${progress.phase}: ${progress.percentage}%`);
  // 로딩 바 업데이트 등
});
```

### 동적 에셋 로딩

특정 에셋이 필요한 경우:

```typescript
// 단일 에셋
await assetLoader.loadAsset('https://cdn.tailbound.xyz/assets/boss/boss-dragon.png');

// 여러 에셋
await assetLoader.loadAssets([
  'https://cdn.tailbound.xyz/assets/boss/boss-dragon.png',
  'https://cdn.tailbound.xyz/assets/boss/boss-fire.png',
]);
```

## 성능 최적화

### 번들 크기 감소
- **변경 전**: ~50MB (이미지 포함)
- **변경 후**: ~5MB (로딩 화면만)
- **개선**: 90% 감소

### 초기 로딩 시간
- **변경 전**: 전체 에셋 다운로드 대기 (5-10초)
- **변경 후**: 필수 에셋만 로드 (1-2초)
- **개선**: 70-80% 단축

### 캐싱 전략
- 브라우저 캐싱: CDN 에셋 자동 캐싱
- Service Worker: 추후 추가 가능
- PixiJS Assets 캐싱: 자동 처리

## 모니터링

### 로딩 실패 처리
```typescript
try {
  await assetLoader.loadPhase('critical');
} catch (error) {
  console.error('Critical assets failed to load', error);
  // 폴백 또는 에러 화면 표시
}
```

### 로딩 시간 측정
```typescript
console.time('asset-loading');
await assetLoader.loadCritical();
console.timeEnd('asset-loading');
```

## 향후 개선 사항

1. **스프라이트 시트 통합**
   - 개별 PNG → 텍스처 아틀라스
   - HTTP 요청 횟수 감소
   - 드로우콜 최적화

2. **WebP 포맷 지원**
   - PNG → WebP (30% 용량 감소)
   - Fallback 제공

3. **프리로드 힌트**
   ```html
   <link rel="preload" href="https://cdn.tailbound.xyz/assets/player/shaman.png" as="image">
   ```

4. **Service Worker 캐싱**
   - 오프라인 지원
   - 더 빠른 재방문

5. **Lazy Loading 개선**
   - Intersection Observer 활용
   - 화면에 보이는 에셋만 우선 로드

## 배포 체크리스트

- [ ] S3 버킷에 모든 에셋 업로드 완료
- [ ] CORS 설정 확인 (필요시)
- [ ] CDN URL 환경 변수 설정
- [ ] 로컬 에셋 제거 확인 (로딩 화면 제외)
- [ ] 프로덕션 빌드 테스트
- [ ] 네트워크 스로틀링 테스트 (느린 3G)
- [ ] 에셋 로딩 실패 시나리오 테스트
