#!/usr/bin/env python3
"""
오디오 파일 다운로드 및 노멀라이징 스크립트

필요한 패키지:
  pip install pydub requests tqdm

ffmpeg도 필요합니다:
  macOS: brew install ffmpeg
  Ubuntu/Debian: sudo apt-get install ffmpeg
"""

import os
import shutil
import sys
from pathlib import Path
from typing import List

try:
    import requests
    from pydub import AudioSegment
    from pydub.effects import normalize
    from tqdm import tqdm
except ImportError as e:
    print(f"❌ 필요한 패키지가 설치되어 있지 않습니다: {e}")
    print("\n설치 방법:")
    print("  pip install pydub requests tqdm")
    print("\nffmpeg도 필요합니다:")
    print("  macOS: brew install ffmpeg")
    sys.exit(1)


# 설정
CDN_BASE_URL = "https://cdn.tailbound.xyz"
WORK_DIR = Path("./audio-normalize-temp")
DOWNLOAD_DIR = WORK_DIR / "original"
NORMALIZED_DIR = WORK_DIR / "normalized"

# 오디오 파일 목록
AUDIO_FILES = [
    # BGM
    "assets/audio/background/bgm-lobby-01.mp3",
    "assets/audio/background/bgm-game-01.mp3",
    # GUI 효과음
    "assets/audio/gui/button-click.mp3",
    "assets/audio/gui/slide-up.mp3",
    "assets/audio/gui/slide-down.mp3",
    "assets/audio/gui/ingame-start.wav",
    # 무기 효과음
    "assets/audio/weapon/dokkaebi-fire.mp3",
    "assets/audio/weapon/fan-wind.mp3",
    "assets/audio/weapon/jakdu-blade.mp3",
    "assets/audio/weapon/talisman.mp3",
    "assets/audio/weapon/moktak-sound.mp3",
    # 적 효과음
    "assets/audio/enemy/common-01.mp3",
    "assets/audio/enemy/common-02.mp3",
    "assets/audio/enemy/common-03.mp3",
    "assets/audio/enemy/ghost-01.mp3",
    # 보스 효과음
    "assets/audio/boss/white-tiger/attack.mp3",
    "assets/audio/boss/white-tiger/fire.mp3",
    "assets/audio/boss/white-tiger/injury.mp3",
]


def setup_directories():
    """작업 디렉토리 생성"""
    print("📁 작업 디렉토리 생성 중...")

    # 기존 디렉토리 삭제
    if WORK_DIR.exists():
        shutil.rmtree(WORK_DIR)

    # 새 디렉토리 생성
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)

    print("✅ 디렉토리 생성 완료\n")


def download_audio_files():
    """오디오 파일 다운로드"""
    print("⬇️  오디오 파일 다운로드 중...\n")

    for file_path in tqdm(AUDIO_FILES, desc="다운로드 진행", unit="file"):
        # URL 구성
        url = f"{CDN_BASE_URL}/{file_path}"

        # 로컬 경로 구성
        local_path = DOWNLOAD_DIR / file_path
        local_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # 파일 다운로드
            response = requests.get(url, timeout=30)
            response.raise_for_status()

            # 파일 저장
            with open(local_path, "wb") as f:
                f.write(response.content)

            tqdm.write(f"  ✅ {file_path}")

        except requests.exceptions.RequestException as e:
            tqdm.write(f"  ❌ {file_path} - 실패: {e}")

    print("\n✅ 다운로드 완료\n")


def get_file_size_mb(path: Path) -> float:
    """파일 크기를 MB 단위로 반환"""
    return path.stat().st_size / (1024 * 1024)


def normalize_audio_file(input_path: Path, output_path: Path) -> bool:
    """
    오디오 파일 노멀라이징

    Args:
        input_path: 입력 파일 경로
        output_path: 출력 파일 경로

    Returns:
        성공 여부
    """
    try:
        # 파일 확장자 확인
        ext = input_path.suffix.lower()

        # 오디오 파일 로드
        if ext == ".mp3":
            audio = AudioSegment.from_mp3(input_path)
        elif ext == ".wav":
            audio = AudioSegment.from_wav(input_path)
        else:
            print(f"  ⚠️  지원하지 않는 형식: {ext}")
            return False

        # 노멀라이징 적용
        # normalize(): Peak normalization (최대값을 0dB로 맞춤)
        normalized_audio = normalize(audio)

        # 추가 처리: -16 LUFS 타겟 (게임 오디오 권장)
        # pydub의 normalize는 peak normalization이므로
        # 평균 볼륨을 조정하여 -16 LUFS에 가깝게 만듭니다
        target_dBFS = -16.0
        change_in_dBFS = target_dBFS - normalized_audio.dBFS
        normalized_audio = normalized_audio.apply_gain(change_in_dBFS)

        # 출력 디렉토리 생성
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # 파일 저장
        if ext == ".mp3":
            normalized_audio.export(
                output_path,
                format="mp3",
                bitrate="192k",  # 고품질 MP3
                parameters=["-ar", "44100"],  # 44.1kHz 샘플레이트
            )
        elif ext == ".wav":
            normalized_audio.export(
                output_path,
                format="wav",
                parameters=["-ar", "44100"],
            )

        return True

    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return False


def normalize_audio_files():
    """모든 오디오 파일 노멀라이징"""
    print("🔊 오디오 노멀라이징 중...\n")

    # 다운로드된 모든 오디오 파일 찾기
    audio_files = list(DOWNLOAD_DIR.rglob("*.mp3")) + list(DOWNLOAD_DIR.rglob("*.wav"))

    for input_file in tqdm(audio_files, desc="노멀라이징 진행", unit="file"):
        # 상대 경로 계산
        rel_path = input_file.relative_to(DOWNLOAD_DIR)

        # 출력 파일 경로
        output_file = NORMALIZED_DIR / rel_path

        # 노멀라이징 수행
        tqdm.write(f"  처리 중: {rel_path}")

        original_size = get_file_size_mb(input_file)

        if normalize_audio_file(input_file, output_file):
            normalized_size = get_file_size_mb(output_file)
            tqdm.write(
                f"    ✅ 완료 (원본: {original_size:.2f}MB → 노멀라이즈: {normalized_size:.2f}MB)"
            )
        else:
            tqdm.write(f"    ❌ 실패")

    print("\n✅ 노멀라이징 완료\n")


def print_summary():
    """결과 요약 출력"""
    print("\n" + "=" * 60)
    print("  ✅ 오디오 노멀라이징 완료!")
    print("=" * 60)
    print(f"\n결과 파일 위치: {NORMALIZED_DIR.absolute()}\n")
    print("다음 단계:")
    print("  1. 노멀라이즈된 파일들을 확인하세요")
    print("  2. 음질을 테스트해보세요")
    print("  3. CDN에 업로드하세요\n")
    print("업로드 예시 (AWS S3):")
    print(
        f"  aws s3 sync {NORMALIZED_DIR}/audio s3://your-bucket/audio --acl public-read"
    )
    print(
        f"  aws s3 sync {NORMALIZED_DIR}/assets/audio s3://your-bucket/assets/audio --acl public-read"
    )
    print()


def main():
    """메인 함수"""
    print("=" * 60)
    print("  🎵 오디오 노멀라이징 스크립트")
    print("=" * 60)
    print()

    try:
        setup_directories()
        download_audio_files()
        normalize_audio_files()
        print_summary()

    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 오류 발생: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
