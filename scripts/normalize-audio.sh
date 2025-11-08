#!/bin/bash

# 오디오 파일 다운로드 및 노멀라이징 스크립트
# 필요한 도구: curl, ffmpeg

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# CDN Base URL
CDN_BASE_URL="https://cdn.tailbound.xyz"

# 작업 디렉토리
WORK_DIR="./audio-normalize-temp"
DOWNLOAD_DIR="$WORK_DIR/original"
NORMALIZED_DIR="$WORK_DIR/normalized"

# 오디오 파일 목록
declare -a AUDIO_FILES=(
    # BGM
    "assets/audio/background/bgm-lobby-01.mp3"
    "assets/audio/background/bgm-game-01.mp3"
    # GUI 효과음
    "assets/audio/gui/button-click.mp3"
    "assets/audio/gui/slide-up.mp3"
    "assets/audio/gui/slide-down.mp3"
    "assets/audio/gui/ingame-start.wav"
    # 무기 효과음
    "assets/audio/weapon/dokkaebi-fire.mp3"
    "assets/audio/weapon/fan-wind.mp3"
    "assets/audio/weapon/jakdu-blade.mp3"
    "assets/audio/weapon/talisman.mp3"
    "assets/audio/weapon/moktak-sound.mp3"
    # 적 효과음
    "assets/audio/enemy/common-01.mp3"
    "assets/audio/enemy/common-02.mp3"
    "assets/audio/enemy/common-03.mp3"
    "assets/audio/enemy/ghost-01.mp3"
    # 보스 효과음
    "assets/audio/boss/white-tiger/attack.mp3"
    "assets/audio/boss/white-tiger/fire.mp3"
    "assets/audio/boss/white-tiger/injury.mp3"
)

# ffmpeg 설치 확인
check_dependencies() {
    echo -e "${YELLOW}의존성 확인 중...${NC}"

    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}❌ ffmpeg가 설치되어 있지 않습니다.${NC}"
        echo "설치 방법:"
        echo "  macOS: brew install ffmpeg"
        echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
        exit 1
    fi

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl이 설치되어 있지 않습니다.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ 의존성 확인 완료${NC}"
}

# 디렉토리 생성
setup_directories() {
    echo -e "${YELLOW}작업 디렉토리 생성 중...${NC}"

    rm -rf "$WORK_DIR"
    mkdir -p "$DOWNLOAD_DIR"
    mkdir -p "$NORMALIZED_DIR"

    echo -e "${GREEN}✓ 디렉토리 생성 완료${NC}"
}

# 오디오 파일 다운로드
download_audio_files() {
    echo -e "${YELLOW}오디오 파일 다운로드 중...${NC}"

    local total=${#AUDIO_FILES[@]}
    local count=0

    for file_path in "${AUDIO_FILES[@]}"; do
        count=$((count + 1))

        # URL 구성
        url="${CDN_BASE_URL}/${file_path}"

        # 로컬 경로 구성 (디렉토리 구조 유지)
        # dirname 대신 bash 내장 문자열 처리 사용
        file_dir="${file_path%/*}"
        if [ "$file_dir" = "$file_path" ]; then
            local_dir="$DOWNLOAD_DIR"
        else
            local_dir="$DOWNLOAD_DIR/$file_dir"
        fi
        mkdir -p "$local_dir"
        local_path="$DOWNLOAD_DIR/$file_path"

        echo -e "  [${count}/${total}] 다운로드: ${file_path}"

        if curl -L -f -s -o "$local_path" "$url"; then
            echo -e "    ${GREEN}✓ 성공${NC}"
        else
            echo -e "    ${RED}✗ 실패 (404 또는 네트워크 오류)${NC}"
        fi
    done

    echo -e "${GREEN}✓ 다운로드 완료${NC}"
}

# 오디오 노멀라이징
# Loudness normalization: -16 LUFS (게임 오디오 권장값)
normalize_audio_files() {
    echo -e "${YELLOW}오디오 노멀라이징 중...${NC}"

    local total=$(find "$DOWNLOAD_DIR" -type f \( -name "*.mp3" -o -name "*.wav" \) | wc -l | xargs)
    local count=0

    # 모든 오디오 파일 찾기
    while IFS= read -r input_file; do
        count=$((count + 1))

        # 상대 경로 계산
        rel_path="${input_file#$DOWNLOAD_DIR/}"

        # 출력 파일 경로
        # dirname 대신 bash 내장 문자열 처리 사용
        rel_dir="${rel_path%/*}"
        if [ "$rel_dir" = "$rel_path" ]; then
            output_dir="$NORMALIZED_DIR"
        else
            output_dir="$NORMALIZED_DIR/$rel_dir"
        fi
        mkdir -p "$output_dir"
        output_file="$NORMALIZED_DIR/$rel_path"

        echo -e "  [${count}/${total}] 처리 중: ${rel_path}"

        # ffmpeg로 노멀라이징
        # - loudnorm filter: EBU R128 표준 기반 라우드니스 노멀라이제이션
        # - I=-16: Target integrated loudness (LUFS) - 게임 오디오 권장값
        # - TP=-1.5: True peak (dBTP)
        # - LRA=11: Loudness range
        if ffmpeg -i "$input_file" \
            -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
            -ar 44100 \
            -y \
            "$output_file" 2>&1 | grep -q "error"; then
            echo -e "    ${RED}✗ 노멀라이징 실패${NC}"
        else
            echo -e "    ${GREEN}✓ 완료${NC}"

            # 파일 크기 비교
            original_size=$(du -h "$input_file" | cut -f1)
            normalized_size=$(du -h "$output_file" | cut -f1)
            echo -e "    원본: ${original_size} → 노멀라이즈: ${normalized_size}"
        fi
    done < <(find "$DOWNLOAD_DIR" -type f \( -name "*.mp3" -o -name "*.wav" \))

    echo -e "${GREEN}✓ 노멀라이징 완료${NC}"
}

# 결과 요약
print_summary() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  오디오 노멀라이징 완료!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "결과 파일 위치: $NORMALIZED_DIR"
    echo ""
    echo "다음 단계:"
    echo "  1. 노멀라이즈된 파일들을 확인하세요"
    echo "  2. CDN에 업로드하세요 (예: aws s3 sync, rsync 등)"
    echo ""
    echo "업로드 예시 (AWS S3):"
    echo "  aws s3 sync $NORMALIZED_DIR/audio s3://your-bucket/audio --acl public-read"
    echo "  aws s3 sync $NORMALIZED_DIR/assets/audio s3://your-bucket/assets/audio --acl public-read"
    echo ""
}

# 메인 실행
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  오디오 노멀라이징 스크립트${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    check_dependencies
    setup_directories
    download_audio_files
    normalize_audio_files
    print_summary
}

main "$@"
