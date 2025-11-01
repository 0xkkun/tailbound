// import I18nExample from '@components/I18nExample';
import { useState } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Text, TextureSource } from 'pixi.js';

import { GameContainer } from './components/GameContainer';
import { PressToStart } from './components/PressToStart';

// 픽셀 아트 렌더링 설정 (앱 시작 시 한 번만 설정)
// PixiJS v8에서는 TextureSource의 기본 스케일 모드를 설정
TextureSource.defaultOptions.scaleMode = 'nearest';

// extend tells @pixi/react what Pixi.js components are available
extend({
  Container,
  Text,
});

export default function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  return (
    <>
      {/* <I18nExample /> */}
      {/* We'll wrap our components with an <Application> component to provide
          the Pixi.js Application context */}
      <Application
        background={'#1a1a2e'}
        resizeTo={window}
        antialias={false} // 픽셀 아트용: 안티앨리어싱 비활성화
        roundPixels={false} // 카메라 시스템에서 직접 반올림 처리
        autoDensity={true} // 고해상도 디스플레이 대응
        resolution={window.devicePixelRatio || 1} // 디바이스 픽셀 비율 사용
      >
        <GameContainer onAssetsLoaded={() => setAssetsLoaded(true)} />
      </Application>
      <PressToStart assetsLoaded={assetsLoaded} />
    </>
  );
}
