#!/bin/bash

# 단일 오디오 파일 노멀라이징 스크립트
# 사용법: ./normalize-single-audio.sh <input_file> [output_file]

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 노멀라이징 설정
TARGET_LUFS="-16"      # 게임 오디오 권장값
TRUE_PEAK="-1.5"       # 클리핑 방지
LOUDNESS_RANGE="11"    # 다이나믹 레인지
SAMPLE_RATE="44100"    # CD 품질
BITRATE="192k"         # 고품질 MP3

# 사용법 표시
show_usage() {
    echo "사용법: $0 <input_file> [output_file]"
    echo ""
    echo "예시:"
    echo "  $0 my-sound.mp3                    # 자동으로 my-sound-normalized.mp3 생성"
    echo "  $0 my-sound.mp3 output.mp3         # 지정한 파일명으로 생성"
    echo "  $0 my-bgm.wav my-bgm-norm.wav      # WAV 파일도 지원"
    echo ""
    echo "설정:"
    echo "  Target Loudness: ${TARGET_LUFS} LUFS"
    echo "  True Peak: ${TRUE_PEAK} dBTP"
    echo "  Loudness Range: ${LOUDNESS_RANGE} LU"
    echo "  Sample Rate: ${SAMPLE_RATE} Hz"
    echo "  Bitrate (MP3): ${BITRATE}"
}

# ffmpeg 확인
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}❌ ffmpeg가 설치되어 있지 않습니다.${NC}"
        echo "설치 방법: brew install ffmpeg"
        exit 1
    fi
}

# 파일 존재 확인
check_input_file() {
    local input_file="$1"

    if [ ! -f "$input_file" ]; then
        echo -e "${RED}❌ 입력 파일을 찾을 수 없습니다: $input_file${NC}"
        exit 1
    fi

    # 파일 확장자 확인
    local ext="${input_file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]') # 소문자로 변환

    if [[ ! "$ext" =~ ^(mp3|wav|m4a|ogg|flac)$ ]]; then
        echo -e "${YELLOW}⚠️  경고: 지원하지 않는 형식일 수 있습니다: .$ext${NC}"
        echo "지원 형식: mp3, wav, m4a, ogg, flac"
    fi
}

# 출력 파일명 자동 생성
generate_output_filename() {
    local input_file="$1"
    local dir=$(dirname "$input_file")
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local ext="${filename##*.}"

    echo "${dir}/${name}-normalized.${ext}"
}

# 오디오 정보 분석
analyze_audio() {
    local input_file="$1"

    echo -e "${BLUE}📊 오디오 정보 분석 중...${NC}"

    # 파일 크기
    local size=$(du -h "$input_file" | cut -f1)
    echo "  파일 크기: $size"

    # ffprobe로 오디오 정보 추출
    if command -v ffprobe &> /dev/null; then
        local duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$input_file" 2>/dev/null)
        if [ -n "$duration" ]; then
            # 초를 mm:ss 형식으로 변환
            local minutes=$(echo "$duration / 60" | bc)
            local seconds=$(echo "$duration % 60" | bc)
            printf "  재생 시간: %d분 %.0f초\n" "$minutes" "$seconds"
        fi
    fi

    echo ""
}

# 오디오 노멀라이징
normalize_audio() {
    local input_file="$1"
    local output_file="$2"

    echo -e "${YELLOW}🔊 오디오 노멀라이징 중...${NC}"
    echo "  입력: $input_file"
    echo "  출력: $output_file"
    echo ""

    # 출력 디렉토리 생성
    local output_dir=$(dirname "$output_file")
    mkdir -p "$output_dir"

    # ffmpeg로 노멀라이징
    # 2-pass 처리로 더 정확한 노멀라이제이션
    echo -e "${BLUE}Pass 1/2: 오디오 분석 중...${NC}"

    # 1차: 라우드니스 측정
    local filter_params=$(ffmpeg -i "$input_file" \
        -af "loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=${LOUDNESS_RANGE}:print_format=json" \
        -f null - 2>&1 | tail -n 12)

    echo -e "${BLUE}Pass 2/2: 노멀라이징 적용 중...${NC}"

    # 2차: 측정값을 바탕으로 정확한 노멀라이징 적용
    if ffmpeg -i "$input_file" \
        -af "loudnorm=I=${TARGET_LUFS}:TP=${TRUE_PEAK}:LRA=${LOUDNESS_RANGE}" \
        -ar ${SAMPLE_RATE} \
        -b:a ${BITRATE} \
        -y \
        "$output_file" 2>&1 | grep -q "error"; then
        echo -e "${RED}❌ 노멀라이징 실패${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ 노멀라이징 완료!${NC}"
    echo ""
}

# 결과 비교
show_result() {
    local input_file="$1"
    local output_file="$2"

    echo -e "${GREEN}📊 결과 비교${NC}"

    local input_size=$(du -h "$input_file" | cut -f1)
    local output_size=$(du -h "$output_file" | cut -f1)

    echo "  원본 파일: $input_file ($input_size)"
    echo "  결과 파일: $output_file ($output_size)"
    echo ""

    # 파일 재생 안내 (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${BLUE}💡 결과 확인:${NC}"
        echo "  afplay \"$output_file\""
        echo ""
    fi
}

# 메인 실행
main() {
    # 인자 확인
    if [ $# -lt 1 ]; then
        show_usage
        exit 1
    fi

    local input_file="$1"
    local output_file="${2:-$(generate_output_filename "$input_file")}"

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  오디오 노멀라이징${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # 검증
    check_ffmpeg
    check_input_file "$input_file"

    # 분석
    analyze_audio "$input_file"

    # 노멀라이징
    if normalize_audio "$input_file" "$output_file"; then
        show_result "$input_file" "$output_file"
        echo -e "${GREEN}✅ 작업 완료!${NC}"
        exit 0
    else
        echo -e "${RED}❌ 작업 실패${NC}"
        exit 1
    fi
}

main "$@"
