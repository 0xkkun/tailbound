# 문서 폴더 구조 가이드

> 이 문서는 프로젝트의 문서 구조와 각 폴더의 목적을 설명합니다.

---

## 전체 폴더 구조 (dev 제외)

```
docs/
├── CORE_DESIGN.md              # 핵심 게임 디자인 문서 (항상 참고)
├── FOLDER_STRUCTURE.md         # 본 문서 (폴더 구조 가이드)
├── README.md                   # 문서 인덱스 및 개요
│
├── concept/                    # 초기 컨셉 및 회의록 (참고용)
│   ├── game-concept.md
│   └── initial-design.md
│
├── design/                     # 시스템별 상세 설계
│   ├── combat-system.md        # 전투 시스템 설계
│   ├── stat-system.md          # 스텟 시스템 설계
│   ├── equipment-system.md     # 장비 시스템 설계
│   ├── skill-system.md         # 스킬 시스템 설계
│   ├── enemy-ai.md             # 적 AI 설계
│   ├── spawn-system.md         # 스폰 시스템 설계
│   ├── progression-system.md   # 진행 및 메타 시스템 설계
│   └── ui-ux.md               # UI/UX 설계
│
├── level-design/               # 레벨 디자인 (스테이지별)
│   ├── upper-world/           # 상계 (현세)
│   │   ├── hanok-village.md   # 한옥 마을 레벨 디자인
│   │   ├── bamboo-forest.md   # 대나무 숲 레벨 디자인
│   │   └── palace.md          # 궁궐 레벨 디자인
│   │
│   ├── lower-world/           # 하계 (저승)
│   │   ├── yellow-spring-road.md    # 황천길 레벨 디자인
│   │   ├── infernal-garden.md       # 지옥의 정원 레벨 디자인
│   │   └── palace-of-the-dead.md    # 망자의 궁전 레벨 디자인
│   │
│   └── templates/
│       └── level-template.md  # 레벨 디자인 템플릿
│
├── balance/                    # 밸런스 데이터 및 조정 기록
│   ├── weapons.md             # 무기 밸런스
│   ├── enemies.md             # 적 밸런스
│   ├── stats.md               # 스텟 밸런스
│   ├── equipment.md           # 장비 밸런스
│   ├── difficulty.md          # 난이도 밸런스
│   └── changelog.md           # 밸런스 변경 기록
│
├── art/                        # 아트 가이드
│   ├── art-style-guide.md     # 아트 스타일 가이드
│   ├── color-palette.md       # 컬러 팔레트
│   ├── character-sprites.md   # 캐릭터 스프라이트 사양
│   ├── enemy-sprites.md       # 적 스프라이트 사양
│   ├── ui-assets.md           # UI 에셋 사양
│   └── vfx.md                 # VFX 이펙트 가이드
│
├── audio/                      # 오디오 가이드
│   ├── music.md               # 음악 가이드
│   └── sfx.md                 # 효과음 가이드
│
├── technical/                  # 기술 문서
│   ├── architecture.md        # 코드 아키텍처
│   ├── pixijs-setup.md        # PixiJS 설정 가이드
│   ├── build-deploy.md        # 빌드 및 배포 가이드
│   └── optimization.md        # 최적화 가이드
│
└── workflow/                   # 작업 프로세스
    ├── git-workflow.md        # Git 작업 흐름
    ├── task-management.md     # 태스크 관리 방식
    └── code-review.md         # 코드 리뷰 가이드
```

---

## 각 폴더 설명

### 1. 루트 레벨 문서

#### `CORE_DESIGN.md` ⭐

- **목적**: 프로젝트의 핵심 게임 디자인 문서
- **내용**: 게임의 모든 핵심 시스템과 디자인 결정 사항
- **사용**: 개발 중 항상 참고해야 하는 기준 문서
- **업데이트**: 중요한 디자인 변경 시 즉시 업데이트

#### `FOLDER_STRUCTURE.md`

- **목적**: 문서 폴더 구조 가이드 (본 문서)
- **내용**: 각 폴더의 목적과 사용법
- **사용**: 새로운 문서 작성 시 어디에 배치할지 확인

#### `README.md`

- **목적**: 문서 인덱스 및 프로젝트 개요
- **내용**: 각 문서로의 링크, 프로젝트 소개, 빠른 참조
- **사용**: 문서 허브로 활용

---

### 2. `concept/` - 초기 컨셉 및 회의록

**목적**: 프로젝트 초기 단계의 아이디어와 회의 내용 보관

**파일 예시**:

- `game-concept.md`: 최초 게임 컨셉 문서
- `initial-design.md`: 초기 디자인 회의록
- `brainstorming-YYMMDD.md`: 브레인스토밍 회의록

**사용 방법**:

- 회의 후 즉시 작성
- 날짜를 파일명에 포함 (예: `meeting-20251013.md`)
- 결정 사항은 `CORE_DESIGN.md`에 반영

**주의사항**:

- 이 폴더의 문서는 참고용이며, 최종 결정 사항은 `CORE_DESIGN.md` 참조
- 오래된 아이디어와 최신 디자인이 다를 수 있음

---

### 3. `design/` - 시스템별 상세 설계

**목적**: 각 게임 시스템의 상세한 설계 문서

**권장 파일**:

- `combat-system.md`: 전투 시스템 (데미지 계산, 피격 판정 등)
- `stat-system.md`: 스텟 시스템 (힘/민첩/지능 상세 효과)
- `equipment-system.md`: 장비 시스템 (접두사/접미사 목록, 생성 로직)
- `skill-system.md`: 스킬 시스템 (무기 상세 스펙, 업그레이드 트리)
- `enemy-ai.md`: 적 AI (행동 패턴, 상태 머신)
- `spawn-system.md`: 스폰 시스템 (스폰 로직, 타이밍)
- `progression-system.md`: 진행 시스템 (레벨업, 메타 진행도)
- `ui-ux.md`: UI/UX (화면 레이아웃, 상호작용)

**사용 방법**:

- `CORE_DESIGN.md`의 내용을 더 상세하게 작성
- 구현에 필요한 수식, 알고리즘, 데이터 구조 포함
- 코드 작성 전 설계 단계에서 작성

**작성 형식**:

```markdown
# [시스템명] 상세 설계

## 개요

[시스템의 목적과 핵심 기능]

## 요구사항

[필수 기능 목록]

## 설계

[상세 설계 내용]

## 데이터 구조

[필요한 데이터 구조]

## 알고리즘

[핵심 알고리즘]

## 구현 시 주의사항

[개발자가 알아야 할 사항]
```

---

### 4. `level-design/` - 레벨 디자인 (스테이지별) ⭐

**목적**: 각 스테이지의 레벨 디자인 문서

**폴더 구조**:

```
level-design/
├── stage-1/              # 스테이지 1 (10분)
│   ├── hanok-village.md # 한옥 마을
│   └── bamboo-forest.md # 대나무 숲
│
├── stage-2/              # 스테이지 2 (10분)
│   ├── palace.md        # 궁궐
│   ├── temple.md        # 산사
│   └── afterlife.md     # 저승길
│
└── templates/
    └── level-template.md # 레벨 디자인 템플릿
```

**각 레벨 디자인 문서 포함 사항**:

1. **레벨 개요**
   - 레벨 이름, 테마, 분위기
   - 난이도, 예상 플레이 타임

2. **맵 레이아웃**
   - 맵 크기, 지형 특징
   - 장애물 배치
   - 전략적 포인트

3. **적 스폰 계획**
   - 시간별 스폰 계획 (0-3분, 3-6분 등)
   - 적 타입 및 수량
   - 보스 등장 타이밍

4. **랜덤 이벤트 배치**
   - 이벤트 타입 (제단, 상인 등)
   - 배치 위치 및 빈도

5. **비주얼 및 아트**
   - 배경 타일셋
   - 색감 및 분위기
   - 참고 이미지

6. **사운드**
   - 배경 음악
   - 환경 효과음

**사용 방법**:

- 새로운 스테이지 추가 시 `templates/level-template.md`를 복사하여 작성
- 파일명은 레벨 이름으로 (예: `hanok-village.md`)
- 맵 레이아웃은 ASCII 아트 또는 이미지로 표현

**예시**:

```markdown
# 한옥 마을 (Hanok Village)

## 레벨 개요

- **스테이지**: 1
- **테마**: 조선시대 한옥 마을의 밤
- **난이도**: 쉬움
- **플레이 타임**: 10분

## 맵 레이아웃

- **크기**: 2000x2000 픽셀
- **지형**: 골목길, 기와집, 담장
- **장애물**: 담장, 우물, 항아리

[ASCII 맵 또는 이미지]

## 적 스폰 계획

### 0-3분

- 하급 도깨비 x 10 (30초마다)
- 원한 맺힌 영혼 x 5 (1분마다)

[...]
```

---

### 5. `balance/` - 밸런스 데이터 및 조정 기록

**목적**: 게임 밸런스 데이터 및 변경 기록 관리

**권장 파일**:

- `weapons.md`: 무기별 데미지, 쿨타임, 업그레이드 수치
- `enemies.md`: 적별 체력, 공격력, 이동 속도
- `stats.md`: 스텟별 효과 수치 (힘 1당 체력 +10 등)
- `equipment.md`: 장비별 효과 수치
- `difficulty.md`: 난이도별 배율
- `changelog.md`: 밸런스 변경 기록 (패치 노트 형식)

**사용 방법**:

- 수치는 표 형식으로 작성
- 변경 사항은 `changelog.md`에 날짜와 함께 기록
- 플레이 테스트 후 지속적으로 업데이트

**예시** (`weapons.md`):

```markdown
# 무기 밸런스

## 부적 (Talisman)

| 레벨 | 데미지 | 쿨타임 | 발사 개수 | 속도 |
| ---- | ------ | ------ | --------- | ---- |
| 1    | 10     | 1.0s   | 1         | 300  |
| 2    | 12     | 1.0s   | 2         | 300  |
| 3    | 15     | 0.9s   | 2         | 350  |

[...]
```

---

### 6. `art/` - 아트 가이드

**목적**: 아트 스타일 가이드 및 에셋 사양

**권장 파일**:

- `art-style-guide.md`: 전체 아트 스타일, 참고 이미지
- `color-palette.md`: 컬러 팔레트 (RGB 값 포함)
- `character-sprites.md`: 캐릭터 스프라이트 사양 (크기, 프레임 수)
- `enemy-sprites.md`: 적 스프라이트 사양
- `ui-assets.md`: UI 에셋 사양
- `vfx.md`: VFX 이펙트 가이드

**사용 방법**:

- 아티스트가 작업 시 참고
- 에셋 사양은 정확한 픽셀 크기, 프레임 수 명시
- 참고 이미지는 링크 또는 `docs/art/images/` 폴더에 저장

---

### 7. `audio/` - 오디오 가이드

**목적**: 음악 및 효과음 가이드

**권장 파일**:

- `music.md`: 배경 음악 리스트, 분위기, 참고 곡
- `sfx.md`: 효과음 리스트 (무기, 적, UI 등)

**사용 방법**:

- 작곡가/사운드 디자이너가 참고
- 필요한 음악/효과음 목록 작성
- 참고 곡은 YouTube 링크 등으로 공유

---

### 8. `technical/` - 기술 문서

**목적**: 개발 관련 기술 문서

**권장 파일**:

- `architecture.md`: 코드 아키텍처 (ECS, 상태 머신 등)
- `pixijs-setup.md`: PixiJS 초기 설정 가이드
- `build-deploy.md`: 빌드 및 배포 방법
- `optimization.md`: 성능 최적화 가이드

**사용 방법**:

- 개발자 온보딩 시 참고
- 기술적 결정 사항 기록
- 설정 방법 단계별로 작성

---

### 9. `workflow/` - 작업 프로세스

**목적**: 팀 작업 프로세스 및 컨벤션

**권장 파일**:

- `git-workflow.md`: Git 브랜치 전략, 커밋 메시지 컨벤션
- `task-management.md`: 태스크 관리 방식 (GitHub Issues 등)
- `code-review.md`: 코드 리뷰 가이드

**사용 방법**:

- 팀원 간 작업 방식 통일
- 프로젝트 시작 시 먼저 작성

---

## 문서 작성 가이드라인

### 1. 파일명 규칙

- 소문자 사용
- 단어는 하이픈(-)으로 구분 (예: `combat-system.md`)
- 날짜 포함 시 `YYMMDD` 형식 (예: `meeting-20251013.md`)

### 2. 마크다운 형식

- 제목은 `#` 사용 (계층 구조 명확히)
- 코드 블록은 언어 명시 (```typescript)
- 표는 가독성 좋게 정렬
- 링크는 상대 경로 사용

### 3. 업데이트 규칙

- 문서 하단에 **최종 수정일** 명시
- 중요한 변경 사항은 `changelog.md`에 기록
- `CORE_DESIGN.md` 변경 시 팀원에게 공지

### 4. 문서 간 연결

- 관련 문서는 링크로 연결
- `CORE_DESIGN.md`에서 상세 문서로 링크
- 상세 문서에서 `CORE_DESIGN.md`로 역링크

---

## 구현 상태

### 소스 코드 구조 (src/)

```
src/
├── config/ ✅                  # 게임 설정
│   ├── game.config.ts ✅      # 게임 시스템 설정
│   └── balance.config.ts ✅   # 밸런스 수치
│
├── game/ ✅
│   ├── data/ ✅               # 게임 콘텐츠 데이터
│   │   ├── weapons.ts ✅      # 무기 데이터베이스
│   │   └── enemies.ts ✅      # 적 데이터베이스
│   │
│   ├── entities/ ✅           # 게임 엔티티
│   │   ├── Player.ts ✅       # 플레이어
│   │   ├── Enemy.ts ✅        # 적 (티어 지원)
│   │   └── Projectile.ts ✅   # 투사체
│   │
│   ├── weapons/ ⏳            # 무기 구현
│   │   ├── Weapon.ts ✅       # 무기 베이스 클래스
│   │   ├── Talisman.ts ✅     # 부적 (구현 완료)
│   │   ├── DokkaebiFireWeapon.ts ⏳  # 도깨비불 (데이터만)
│   │   ├── MoktakSoundWeapon.ts ⏳   # 목탁 소리 (데이터만)
│   │   └── JakduBladeWeapon.ts ⏳    # 작두날 (데이터만)
│   │
│   ├── scenes/ ✅             # 게임 씬
│   │   └── GameScene.ts ✅    # 메인 게임 씬
│   │
│   └── utils/ ✅              # 유틸리티
│       └── collision.ts ✅    # 충돌 감지
│
├── systems/ ⏳                # 게임 시스템
│   ├── CombatSystem.ts ✅     # 전투 시스템
│   ├── SpawnSystem.ts ✅      # 스폰 시스템
│   ├── LevelSystem.ts ⏳      # 레벨 시스템 (미구현)
│   ├── StatSystem.ts ⏳       # 스탯 시스템 (미구현)
│   ├── EquipmentSystem.ts ⏳  # 장비 시스템 (미구현)
│   └── PickupSystem.ts ⏳     # 픽업 시스템 (미구현)
│
├── components/ ✅             # React 컴포넌트
│   └── GameContainer.tsx ✅   # 게임 컨테이너
│
├── hooks/ ✅                  # React 훅
│   └── useGameState.ts ✅     # 게임 상태 관리
│
└── types/ ⏳                  # 타입 정의
    ├── game.types.ts ✅       # 게임 타입
    ├── stat.types.ts ⏳       # 스탯 타입 (미구현)
    └── equipment.types.ts ⏳  # 장비 타입 (미구현)
```

**범례**:
- ✅ 구현 완료
- ⏳ 구현 예정 (데이터/구조만 준비됨)
- ❌ 미구현

### 현재 구현 수준

**데이터 레이어**: 7.5/10 ✅
- config/ 완성
- game/data/ 완성
- 4개 무기 전부 데이터 정의
- 적 티어 시스템 완성

**게임플레이**: 3.5/10 ⏳
- 기본 전투 완성
- 1개 무기 구현 (부적)
- 레벨/스탯/장비 시스템 미구현

---

## 문서 작성 우선순위

### Phase 1: 프로토타입 단계 ✅

1. ✅ `CORE_DESIGN.md` (완료)
2. ✅ `FOLDER_STRUCTURE.md` (완료)
3. ✅ `technical/architecture.md` (완료)
4. ✅ `implementation/DATA_LAYER.md` (완료)
5. ✅ `implementation/GETTING_STARTED.md` (완료)

### Phase 2: 핵심 게임플레이 단계 ⏳

6. `design/stat-system.md` (스탯 시스템 구현 전)
7. `design/equipment-system.md`
8. `design/skill-system.md`
9. ✅ `balance/weapons.md` (balance.config.ts로 대체됨)
10. ✅ `balance/enemies.md` (balance.config.ts로 대체됨)

### Phase 3: 콘텐츠 확장 단계

11. `level-design/upper-world/hanok-village.md`
12. `level-design/upper-world/bamboo-forest.md`
13. `level-design/lower-world/yellow-spring-road.md`
14. `art/art-style-guide.md`

### Phase 4: 폴리싱 단계

15. `audio/music.md`
16. `audio/sfx.md`
17. `balance/changelog.md`

---

## 문서 관리 팁

### 1. 정기적 리뷰

- 매주 또는 스프린트마다 문서 리뷰
- 오래된 정보 업데이트
- 불필요한 문서 정리

### 2. 버전 관리

- 중요한 문서는 Git으로 버전 관리
- 큰 변경 사항은 커밋 메시지에 명시

### 3. 백업

- GitHub에 정기적으로 푸시
- 로컬에도 백업 유지

### 4. 협업

- 문서 작성 후 팀원에게 공유
- 피드백을 받아 개선

---

## 자주 묻는 질문 (FAQ)

### Q1. 새로운 시스템을 추가할 때 어디에 문서를 작성하나요?

A. `design/` 폴더에 새로운 파일을 생성하고, `CORE_DESIGN.md`에서 링크를 추가하세요.

### Q2. 레벨 디자인 문서는 언제 작성하나요?

A. 해당 레벨을 구현하기 전에 작성합니다. `templates/level-template.md`를 복사하여 시작하세요.

### Q3. 밸런스 수치를 변경했는데, 어디에 기록하나요?

A. `balance/` 폴더의 해당 파일을 수정하고, `balance/changelog.md`에 변경 기록을 추가하세요.

### Q4. 회의록은 어디에 저장하나요?

A. `concept/` 폴더에 날짜를 포함한 파일명으로 저장하세요 (예: `meeting-20251013.md`).

### Q5. 문서가 너무 많아서 찾기 힘들어요.

A. `README.md`를 문서 허브로 활용하세요. 각 문서로의 링크와 간단한 설명을 포함하세요.

---

**문서 버전**: 1.0
**최종 수정일**: 2025-10-13
**작성자**: 개발팀
