# 오디오 노멀라이징 가이드

게임의 모든 오디오 파일을 일관된 음량으로 유지하기 위한 도구 모음입니다.

## 📋 목차

1. [일괄 노멀라이징](#일괄-노멀라이징) - CDN의 모든 오디오 파일 한 번에 처리
2. [단일 파일 노멀라이징](#단일-파일-노멀라이징) - 새로 추가하는 파일 개별 처리
3. [자동 노멀라이징](#자동-노멀라이징) - 디렉토리 또는 Git hook으로 자동화
4. [설정 커스터마이징](#설정-커스터마이징)

---

## 일괄 노멀라이징

CDN에 있는 모든 오디오 파일을 다운로드하고 노멀라이징하여 음량을 일관되게 만드는 스크립트입니다.

## 사전 준비

### 1. ffmpeg 설치

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt-get install ffmpeg
```

**Windows:**

- https://ffmpeg.org/download.html 에서 다운로드

### 2. Python 패키지 설치 (Python 스크립트 사용 시)

```bash
pip install pydub requests tqdm
```

## 사용 방법

### 방법 1: Bash 스크립트 (추천)

```bash
./scripts/normalize-audio.sh
```

### 방법 2: Python 스크립트

```bash
python3 scripts/normalize_audio.py
```

## 스크립트가 하는 일

1. **다운로드**: CDN에서 모든 오디오 파일 다운로드
   - BGM (3개)
   - GUI 효과음 (4개)
   - 무기 효과음 (5개)
   - 적 효과음 (4개)
   - 보스 효과음 (3개)

2. **노멀라이징**:
   - Target Loudness: -16 LUFS (게임 오디오 업계 표준)
   - True Peak: -1.5 dBTP
   - Loudness Range: 11 LU
   - Sample Rate: 44.1kHz
   - Bitrate (MP3): 192kbps

3. **결과 저장**: `./audio-normalize-temp/normalized/` 디렉토리에 저장

## 노멀라이징 설정 설명

### -16 LUFS 타겟을 선택한 이유

- **게임 오디오 권장값**: -16 LUFS는 게임 오디오 업계에서 가장 일반적으로 사용되는 값입니다
- **플랫폼별 권장값 참고**:
  - Spotify: -14 LUFS (음악 스트리밍)
  - YouTube: -14 LUFS (동영상)
  - Apple Music: -16 LUFS (음악)
  - **게임**: -16 to -18 LUFS (interactive media)

### 다른 설정

- **True Peak (-1.5 dBTP)**: 클리핑 방지
- **Loudness Range (11 LU)**: 다이나믹 레인지 유지
- **44.1kHz**: CD 품질 샘플레이트
- **192kbps MP3**: 고품질 압축

## 결과 확인

노멀라이징 후 파일들을 재생하여 음질을 확인하세요:

```bash
# 특정 파일 재생 (macOS)
afplay audio-normalize-temp/normalized/audio/bgm-lobby-01.mp3

# 모든 파일 확인
ls -lh audio-normalize-temp/normalized/
```

## CDN 업로드

### AWS S3 사용 시

```bash
# BGM 업로드
aws s3 sync audio-normalize-temp/normalized/audio \
  s3://cdn.tailbound.xyz/audio \
  --acl public-read \
  --cache-control "max-age=31536000"

# 효과음 업로드
aws s3 sync audio-normalize-temp/normalized/assets/audio \
  s3://cdn.tailbound.xyz/assets/audio \
  --acl public-read \
  --cache-control "max-age=31536000"
```

### rsync 사용 시 (자체 서버)

```bash
rsync -avz --progress \
  audio-normalize-temp/normalized/ \
  user@server:/path/to/cdn/
```

## 트러블슈팅

### ffmpeg 오류

```
Error: ffmpeg not found
```

→ ffmpeg를 먼저 설치하세요 (위의 "사전 준비" 참고)

### 다운로드 실패

```
404 Not Found
```

→ CDN URL 또는 파일 경로를 확인하세요

### Python 패키지 오류

```
ModuleNotFoundError: No module named 'pydub'
```

→ pip install pydub requests tqdm 실행

## 노멀라이징 파라미터 커스터마이징

### Bash 스크립트 수정

`scripts/normalize-audio.sh` 파일의 75번째 줄 근처:

```bash
# 현재 설정
-af "loudnorm=I=-16:TP=-1.5:LRA=11"

# 더 큰 음량 (주의: 왜곡 가능)
-af "loudnorm=I=-12:TP=-1.5:LRA=11"

# 더 작은 음량 (배경음악용)
-af "loudnorm=I=-18:TP=-1.5:LRA=11"
```

### Python 스크립트 수정

`scripts/normalize_audio.py` 파일의 132번째 줄 근처:

```python
# 현재 설정
target_dBFS = -16.0

# 더 큰 음량
target_dBFS = -12.0

# 더 작은 음량
target_dBFS = -18.0
```

## 정리

작업이 끝나면 임시 디렉토리를 삭제할 수 있습니다:

```bash
rm -rf audio-normalize-temp
```

---

## 단일 파일 노멀라이징

새로 추가하는 효과음이나 배경음을 개별적으로 노멀라이징할 때 사용합니다.

### 사용법

```bash
# 기본 사용 (자동으로 -normalized 접미사 추가)
./scripts/normalize-single-audio.sh my-new-sound.mp3

# 출력 파일명 지정
./scripts/normalize-single-audio.sh my-new-sound.mp3 output.mp3

# WAV 파일도 지원
./scripts/normalize-single-audio.sh bgm-boss.wav bgm-boss-normalized.wav
```

### 예시

```bash
# 새로운 무기 효과음 추가
./scripts/normalize-single-audio.sh sword-slash.mp3
# → sword-slash-normalized.mp3 생성됨

# 결과 확인 (macOS)
afplay sword-slash-normalized.mp3

# 원본과 비교
afplay sword-slash.mp3
```

### 기능

- ✅ 자동 파일명 생성 (`-normalized` 접미사)
- ✅ 오디오 정보 분석 (크기, 재생 시간)
- ✅ 2-pass 노멀라이징 (더 정확한 결과)
- ✅ 결과 비교 (파일 크기)
- ✅ 지원 형식: MP3, WAV, M4A, OGG, FLAC

---

## 자동 노멀라이징

### 방법 1: 디렉토리 감시 (수동 실행)

특정 디렉토리의 모든 오디오 파일을 자동으로 노멀라이징합니다.

```bash
# public/audio 디렉토리의 모든 파일 처리
./scripts/auto-normalize-audio.sh public/audio

# 다른 디렉토리 지정
./scripts/auto-normalize-audio.sh src/assets/sounds
```

**특징:**

- 이미 노멀라이즈된 파일은 자동으로 스킵
- 원본 파일을 `.bak`으로 백업
- 처리 로그를 `audio-normalize.log`에 기록

**백업 파일 정리:**

```bash
# 작업 확인 후 백업 삭제
find public/audio -name '*.bak' -delete
```

### 방법 2: Git Pre-commit Hook (자동 실행)

커밋 시 자동으로 오디오 파일을 노멀라이징합니다.

#### 설치

```bash
# 1. 실행 권한 부여
chmod +x scripts/normalize-single-audio.sh
chmod +x scripts/auto-normalize-audio.sh
chmod +x scripts/git-hooks/pre-commit-audio

# 2. Git hook 설치 (심볼릭 링크 - 권장)
ln -s ../../scripts/git-hooks/pre-commit-audio .git/hooks/pre-commit

# 또는 복사
cp scripts/git-hooks/pre-commit-audio .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

#### 사용법

```bash
# 일반 커밋 (자동 노멀라이징 활성화)
git add new-sound.mp3
git commit -m "feat: 새로운 효과음 추가"
# → 자동으로 노멀라이징되고 다시 stage됨

# 노멀라이징 스킵 (긴급한 경우)
SKIP_AUDIO_NORMALIZE=1 git commit -m "feat: 임시 커밋"
```

#### 동작 방식

1. Git staged 파일 중 오디오 파일 감지 (.mp3, .wav, .m4a, .ogg)
2. 노멀라이즈되지 않은 파일만 처리
3. 노멀라이즈된 파일을 자동으로 다시 stage
4. 커밋 진행

---

## 설정 커스터마이징

모든 스크립트에서 동일한 설정을 사용합니다. 필요시 각 스크립트 상단의 설정값을 수정하세요.

### 현재 설정

```bash
TARGET_LUFS="-16"        # Target integrated loudness
TRUE_PEAK="-1.5"         # True peak (dBTP)
LOUDNESS_RANGE="11"      # Loudness range (LU)
SAMPLE_RATE="44100"      # Sample rate (Hz)
BITRATE="192k"           # Bitrate for MP3
```

### 설정값 변경 예시

#### 배경음악 전용 (더 작은 음량)

```bash
TARGET_LUFS="-18"  # 배경음은 좀 더 조용하게
```

#### 효과음 전용 (더 큰 음량)

```bash
TARGET_LUFS="-14"  # 효과음은 좀 더 크게
```

#### 고품질 설정

```bash
SAMPLE_RATE="48000"  # 48kHz (영화/게임 표준)
BITRATE="320k"       # 최고 품질 MP3
```

---

## 워크플로우 권장사항

### 신규 오디오 파일 추가 시

1. **개별 노멀라이징**

   ```bash
   ./scripts/normalize-single-audio.sh new-sound.mp3
   ```

2. **결과 확인**

   ```bash
   afplay new-sound-normalized.mp3
   ```

3. **CDN 업로드**

   ```bash
   # AWS S3 예시
   aws s3 cp new-sound-normalized.mp3 \
     s3://cdn.tailbound.xyz/assets/audio/weapon/ \
     --acl public-read
   ```

4. **코드에 추가**
   ```typescript
   // assets.config.ts
   weapon: {
     newSound: `${CDN_BASE_URL}/assets/audio/weapon/new-sound.mp3`,
   }
   ```

### Git Hook 사용 시

```bash
# 1. 새 파일 추가
git add assets/audio/new-sound.mp3

# 2. 커밋 (자동 노멀라이징됨)
git commit -m "feat: 새로운 효과음 추가"

# 3. Push
git push
```

---

## 트러블슈팅
