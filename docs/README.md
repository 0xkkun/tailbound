# 설화 (Talebound) - 문서 허브

> 프로젝트의 모든 문서에 대한 인덱스 및 빠른 참조 가이드

---

## 🎮 프로젝트 개요

**설화 (Talebound / 魂录)**는 한국 전통 설화와 단군 신화를 재해석한 로그라이트 액션 게임입니다.

- **게임 엔진**: PixiJS
- **장르**: 로그라이트, 탑다운 액션, 생존형 웨이브 디펜스
- **플레이 타임**: 약 20분 (2 스테이지 x 10분)
- **핵심 특징**: 스텟 기반 빌드, 디아블로식 장비 시스템, 한국 신화 기반 스토리

---

## 📚 핵심 문서 (필독)

### ⭐ [CORE_DESIGN.md](CORE_DESIGN.md)
**프로젝트의 핵심 게임 디자인 문서**
- 게임의 모든 핵심 시스템과 디자인 결정 사항
- 개발 중 항상 참고해야 하는 기준 문서
- 세계관, 게임플레이, 시스템 설계, 개발 로드맵 포함

### 📁 [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)
**문서 폴더 구조 가이드**
- 각 폴더의 목적과 사용법
- 새로운 문서 작성 시 참고
- 문서 작성 가이드라인

---

## 📖 문서 카테고리

### 1. 💡 초기 컨셉 (concept/)
프로젝트 초기 단계의 아이디어와 회의 내용

- [game-concept.md](concept/game-concept.md) - 최초 게임 컨셉
- [initial-design.md](concept/initial-design.md) - 초기 디자인 회의록
- [affix-design.md](concept/affix-design.md) - 접두사/접미사 시스템 디자인

> **참고**: 이 폴더의 문서는 참고용이며, 최종 결정 사항은 `CORE_DESIGN.md`를 확인하세요.

---

### 2. 🎯 시스템 설계 (design/)
각 게임 시스템의 상세한 설계 문서

| 문서 | 설명 | 상태 |
|------|------|------|
| [weapon-implementation-guide.md](design/weapon-implementation-guide.md) | 무기 구현 가이드 (단계별 체크리스트, 예제 코드) | ✅ 완료 |
| combat-system.md | 전투 시스템 (데미지 계산, 피격 판정) | 📝 예정 |
| stat-system.md | 스텟 시스템 (힘/민첩/지능) | 📝 예정 |
| equipment-system.md | 장비 시스템 (접두사/접미사) | 📝 예정 |
| skill-system.md | 스킬 및 무기 시스템 | 📝 예정 |
| enemy-ai.md | 적 AI 및 행동 패턴 | 📝 예정 |
| spawn-system.md | 적 스폰 시스템 | 📝 예정 |
| progression-system.md | 진행 및 메타 시스템 | 📝 예정 |
| ui-ux.md | UI/UX 설계 | 📝 예정 |

---

### 3. 🗺️ 레벨 디자인 (level-design/)
스테이지별 레벨 디자인 문서

#### 상계 - 현세 (upper-world/)
조선시대 배경의 스테이지 1

| 레벨 | 테마 | 분위기 | 상태 |
|------|------|--------|------|
| hanok-village.md | 한옥 마을 | 친숙하지만 으스스함 | 📝 예정 |
| bamboo-forest.md | 대나무 숲 | 신비롭고 고요함 | 📝 예정 |
| palace.md | 궁궐 (경복궁) | 위엄있지만 텅 빈 | 📝 예정 |

#### 하계 - 저승 (lower-world/)
저승 배경의 스테이지 2

| 레벨 | 테마 | 분위기 | 상태 |
|------|------|--------|------|
| yellow-spring-road.md | 황천길 | 슬프고 황량함 | 📝 예정 |
| infernal-garden.md | 지옥의 정원 | 위압적이고 초자연적 | 📝 예정 |
| palace-of-the-dead.md | 망자의 궁전 | 악몽 같은 공간 | 📝 예정 |

#### 템플릿 (templates/)
- [level-template.md](level-design/templates/level-template.md) - 레벨 디자인 템플릿

---

### 4. ⚖️ 밸런스 (balance/)
게임 밸런스 데이터 및 조정 기록

| 문서 | 설명 | 상태 |
|------|------|------|
| weapons.md | 무기 밸런스 (데미지, 쿨타임 등) | 📝 예정 |
| enemies.md | 적 밸런스 (체력, 공격력 등) | 📝 예정 |
| stats.md | 스텟 효과 수치 | 📝 예정 |
| equipment.md | 장비 효과 수치 | 📝 예정 |
| difficulty.md | 난이도별 배율 | 📝 예정 |
| changelog.md | 밸런스 변경 기록 | 📝 예정 |

---

### 5. 🎨 아트 (art/)
아트 스타일 가이드 및 에셋 사양

| 문서 | 설명 | 상태 |
|------|------|------|
| art-style-guide.md | 전체 아트 스타일 가이드 | 📝 예정 |
| color-palette.md | 컬러 팔레트 | 📝 예정 |
| character-sprites.md | 캐릭터 스프라이트 사양 | 📝 예정 |
| enemy-sprites.md | 적 스프라이트 사양 | 📝 예정 |
| ui-assets.md | UI 에셋 사양 | 📝 예정 |
| vfx.md | VFX 이펙트 가이드 | 📝 예정 |

---

### 6. 🔊 오디오 (audio/)
음악 및 효과음 가이드

| 문서 | 설명 | 상태 |
|------|------|------|
| music.md | 배경 음악 리스트 | 📝 예정 |
| sfx.md | 효과음 리스트 | 📝 예정 |

---

### 7. 🛠️ 개발 가이드 (dev/)
개발 환경 및 도구 사용 가이드

| 문서 | 설명 | 상태 |
|------|------|------|
| [setup.md](dev/setup.md) | 개발 환경 설정 (Path Aliases 포함) | ✅ 완료 |
| [test.md](dev/test.md) | 테스트 가이드 (Vitest + PixiJS) | ✅ 완료 |
| [i18n.md](dev/i18n.md) | 국제화 가이드 (react-i18next) | ✅ 완료 |

### 8. 🏗️ 기술 문서 (technical/)
아키텍처 및 기술 스택 문서

| 문서 | 설명 | 상태 |
|------|------|------|
| [architecture.md](technical/architecture.md) | 코드 아키텍처 | ✅ 완료 |
| pixijs-setup.md | PixiJS 초기 설정 | 📝 예정 |
| build-deploy.md | 빌드 및 배포 가이드 | 📝 예정 |
| optimization.md | 성능 최적화 가이드 | 📝 예정 |

---

### 9. 🔄 작업 프로세스 (workflow/)
팀 작업 프로세스 및 컨벤션

| 문서 | 설명 | 상태 |
|------|------|------|
| git-workflow.md | Git 브랜치 전략, 커밋 컨벤션 | 📝 예정 |
| task-management.md | 태스크 관리 방식 | 📝 예정 |
| code-review.md | 코드 리뷰 가이드 | 📝 예정 |

---

## 🚀 빠른 시작

### 개발자 온보딩
1. [CORE_DESIGN.md](CORE_DESIGN.md) 읽기 (필수)
2. [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) 읽기
3. [dev/setup.md](dev/setup.md) 읽기 - 개발 환경 설정 ✅
4. [technical/architecture.md](technical/architecture.md) 읽기 - 코드 아키텍처 ✅
5. [dev/test.md](dev/test.md) 읽기 - 테스트 환경 이해 ✅
6. [dev/i18n.md](dev/i18n.md) 읽기 - 국제화 사용법 ✅
7. `workflow/git-workflow.md` 읽기 (작성 예정)

### 새로운 문서 작성하기
1. [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)에서 적절한 폴더 확인
2. 파일명 규칙 따르기 (소문자, 하이픈 사용)
3. 마크다운 형식으로 작성
4. 관련 문서와 링크 연결

### 레벨 디자인 작성하기
1. `level-design/templates/level-template.md` 복사
2. 적절한 폴더 (`stage-1/` 또는 `stage-2/`)에 붙여넣기
3. 내용 작성
4. 본 README에 링크 추가

---

## 📊 개발 진행 상황

### Phase 1: 프로토타입 (2-3주)
- [x] 초기 컨셉 문서 작성
- [x] 핵심 디자인 문서 작성
- [x] 문서 폴더 구조 생성
- [x] 프로젝트 초기 설정 (React + PixiJS + Vite)
- [x] 테스트 환경 구축 (Vitest + Canvas Mock)
- [x] 국제화 설정 (react-i18next, 한국어 지원)
- [x] Path Alias 설정 (@/, @components, @i18n, @test)
- [ ] 기본 플레이어 이동
- [ ] 자동 공격 무기 1-2개
- [ ] 기본 적 AI
- [ ] 레벨업 시스템

### Phase 2: 핵심 게임플레이 (4-6주)
- [ ] 전체 무기/스킬 시스템
- [ ] 스텟 시스템
- [ ] 장비 시스템
- [ ] 다양한 적 타입
- [ ] 보스 전투
- [ ] UI/UX

### Phase 3: 콘텐츠 확장 (3-4주)
- [ ] 2 스테이지 구조
- [ ] 난이도 시스템
- [ ] 랜덤 이벤트
- [ ] 영구 업그레이드

### Phase 4: 폴리싱 (2-3주)
- [ ] 아트 에셋
- [ ] 사운드/음악
- [ ] 밸런스 조정
- [ ] 버그 수정

---

## 🔗 외부 링크

### 참고 게임
- [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/)
- [Brotato](https://store.steampowered.com/app/1942280/Brotato/)
- [Hades](https://store.steampowered.com/app/1145360/Hades/)

### 기술 참고
- [PixiJS 공식 문서](https://pixijs.com/docs)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [Vite 공식 문서](https://vitejs.dev/guide/)

### 아트 참고
- [한국 민화 이미지 검색](https://www.google.com/search?q=korean+folklore+art)
- [조선시대 미술](https://www.google.com/search?q=joseon+dynasty+art)

---

## 💬 문의 및 피드백

### 문서 관련 문의
- 문서 구조나 내용에 대한 질문은 팀 채팅에 남겨주세요.
- 개선 사항은 GitHub Issues에 등록해주세요.

### 개발 관련 문의
- 기술적 질문은 `technical/` 문서를 먼저 확인하세요.
- 디자인 관련 질문은 `CORE_DESIGN.md`를 먼저 확인하세요.

---

## 📝 문서 업데이트 로그

| 날짜 | 내용 | 작성자 |
|------|------|--------|
| 2025-10-17 | design/weapon-implementation-guide.md 작성 완료 | 개발팀 |
| 2025-10-17 | 커스텀 엔티티 템플릿 추가 (Orbital, AoE, Melee) | 개발팀 |
| 2025-10-15 | dev/test.md, dev/i18n.md 작성 완료 | 개발팀 |
| 2025-10-15 | 테스트 환경 구축 (Vitest + Canvas Mock) | 개발팀 |
| 2025-10-15 | 국제화 설정 (react-i18next, 한국어) | 개발팀 |
| 2025-10-15 | Path Alias 설정 완료 | 개발팀 |
| 2025-10-14 | technical/architecture.md 작성 완료 | 개발팀 |
| 2025-10-14 | README 업데이트 (architecture.md 링크 추가) | 개발팀 |
| 2025-10-13 | 초기 문서 구조 생성 | 개발팀 |
| 2025-10-13 | CORE_DESIGN.md 작성 | 개발팀 |
| 2025-10-13 | FOLDER_STRUCTURE.md 작성 | 개발팀 |

---

**문서 버전**: 1.3
**최종 수정일**: 2025-10-17
**작성자**: 개발팀
