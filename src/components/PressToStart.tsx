import { useEffect, useState } from 'react';

import { audioManager } from '../services/audioManager';

interface PressToStartProps {
  assetsLoaded: boolean;
}

export const PressToStart = ({ assetsLoaded }: PressToStartProps) => {
  const [showPressStart, setShowPressStart] = useState(false);
  const [pressStartClicked, setPressStartClicked] = useState(false);

  // 에셋 로딩 완료 후 PRESS TO START 표시
  useEffect(() => {
    if (!assetsLoaded) return;

    const timer = setTimeout(() => {
      setShowPressStart(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [assetsLoaded]);

  // PRESS TO START 클릭 핸들러
  const handlePressStart = () => {
    // 로비 BGM 즉시 시작 (사용자 인터랙션 발생!)
    audioManager.playBGMByTrack('main');
    console.log('[Loading] BGM started on press start interaction');

    // 클릭 애니메이션 시작
    setPressStartClicked(true);

    // 로딩 화면 페이드아웃 (텍스트보다 약간 늦게)
    setTimeout(() => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');

        // 페이드아웃 완료 후 제거
        setTimeout(() => {
          loadingScreen.classList.add('removed');
          setShowPressStart(false);
        }, 300);
      }
    }, 200);
  };

  if (!showPressStart) return null;
  return (
    <div
      className={`press-start-overlay ${pressStartClicked ? 'clicked' : ''}`}
      onClick={handlePressStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handlePressStart();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="press-start-text">PRESS TO START</div>
    </div>
  );
};
