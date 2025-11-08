#!/bin/bash

# 자동 오디오 노멀라이징 스크립트
# Git hook이나 파일 감시 시스템에서 사용
#
# 사용법:
#   ./auto-normalize-audio.sh <directory>
#   ./auto-normalize-audio.sh public/audio

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 노멀라이징 설정
TARGET_LUFS="-16"
TRUE_PEAK="-1.5"
LOUDNESS_RANGE="11"
SAMPLE_RATE="44100"
BITRATE="192k"

# 처리할 디렉토리 (기본값: public/audio)
WATCH_DIR="${1:-public/audio}"

# 제외할 파일 패턴 (이미 노멀라이즈된 파일)
EXCLUDE_PATTERN="-normalized"

# 로그 파일
LOG_FILE="audio-normalize.log"

# ffmpeg 확인
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}❌ ffmpeg가 설치되어 있지 않습니다.${NC}"
        exit 1
    fi
}

# 오디오 파일이 이미 노멀라이즈되었는지 확인
is_normalized() {
    local file="$1"
    local filename=$(basename "$file")

    # 파일명에 normalized가 포함되어 있으면 스킵
    if [[ "$filename" == *"$EXCLUDE_PATTERN"* ]]; then
        return 0 # true
    fi

    # 메타데이터 확인 (ffmpeg comment에 normalized 마크가 있는지)
    if ffprobe -v error -show_entries format_tags=comment \
        -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null | grep -q "normalized"; then
        return 0 # true
    fi

    return 1 # false
}

# 오디오 노멀라이징 (인플레이스)
normalize_in_place() {
    local input_file="$1"
    local temp_file="${input_file}.tmp"

    echo -e "${YELLOW}🔊 노멀라이징: $input_file${NC}"

    # 임시 파일로 노멀라이징
    if ffmpeg -i "$input_file" \
        -af "loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=${LOUDNESS_RANGE}" \
        -ar ${SAMPLE_RATE} \
        -b:a ${BITRATE} \
        -metadata comment="normalized" \
        -y \
        "$temp_file" 2>&1 | grep -v "frame=" | grep -v "size=" | grep -v "time=" > /dev/null; then

        # 성공하면 원본을 백업하고 임시 파일로 교체
        local backup_file="${input_file}.bak"
        mv "$input_file" "$backup_file"
        mv "$temp_file" "$input_file"

        # 파일 크기 비교
        local original_size=$(du -h "$backup_file" | cut -f1)
        local normalized_size=$(du -h "$input_file" | cut -f1)

        echo -e "  ${GREEN}✅ 완료${NC} ($original_size → $normalized_size)"

        # 로그 기록
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Normalized: $input_file ($original_size → $normalized_size)" >> "$LOG_FILE"

        return 0
    else
        echo -e "  ${RED}❌ 실패${NC}"
        # 임시 파일 정리
        [ -f "$temp_file" ] && rm "$temp_file"
        return 1
    fi
}

# 디렉토리 내 모든 오디오 파일 처리
process_directory() {
    local dir="$1"

    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ 디렉토리를 찾을 수 없습니다: $dir${NC}"
        exit 1
    fi

    echo -e "${BLUE}📁 디렉토리 스캔 중: $dir${NC}"
    echo ""

    local processed=0
    local skipped=0
    local failed=0

    # 오디오 파일 찾기
    while IFS= read -r file; do
        # 이미 노멀라이즈된 파일은 스킵
        if is_normalized "$file"; then
            echo -e "${BLUE}⏭️  스킵 (이미 처리됨): $(basename "$file")${NC}"
            ((skipped++))
            continue
        fi

        # 노멀라이징 수행
        if normalize_in_place "$file"; then
            ((processed++))
        else
            ((failed++))
        fi

        echo ""
    done < <(find "$dir" -type f \( -name "*.mp3" -o -name "*.wav" -o -name "*.m4a" -o -name "*.ogg" \))

    # 결과 요약
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  처리 완료${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "  처리됨: $processed"
    echo "  스킵됨: $skipped"
    echo "  실패: $failed"
    echo ""

    if [ $processed -gt 0 ]; then
        echo -e "${BLUE}💡 백업 파일 정리:${NC}"
        echo "  find $dir -name '*.bak' -delete"
        echo ""
    fi
}

# Git Hook 모드: 커밋된 오디오 파일만 처리
process_git_staged() {
    echo -e "${BLUE}🔍 Git staged 오디오 파일 확인 중...${NC}"
    echo ""

    local processed=0

    # Staged된 오디오 파일 찾기
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # 파일이 존재하고 오디오 파일인 경우
            if [[ "$file" =~ \.(mp3|wav|m4a|ogg)$ ]]; then
                if ! is_normalized "$file"; then
                    echo -e "${YELLOW}처리: $file${NC}"
                    if normalize_in_place "$file"; then
                        # 노멀라이즈된 파일을 다시 stage에 추가
                        git add "$file"
                        ((processed++))
                    fi
                fi
            fi
        fi
    done < <(git diff --cached --name-only --diff-filter=ACM)

    if [ $processed -gt 0 ]; then
        echo ""
        echo -e "${GREEN}✅ $processed 개 파일 노멀라이징 완료 및 재 stage됨${NC}"
    else
        echo -e "${BLUE}ℹ️  노멀라이징이 필요한 파일이 없습니다${NC}"
    fi
}

# 메인
main() {
    check_ffmpeg

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  자동 오디오 노멀라이징${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Git hook 모드인지 확인
    if [ "${GIT_HOOK:-}" = "true" ]; then
        process_git_staged
    else
        process_directory "$WATCH_DIR"
    fi
}

main "$@"
