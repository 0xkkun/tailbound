// import I18nExample from '@components/I18nExample';
import { Application, extend } from '@pixi/react';
import { Container } from 'pixi.js';

import { GameContainer } from './components/GameContainer';

// extend tells @pixi/react what Pixi.js components are available
extend({
  Container,
  Text,
});

export default function App() {
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
      >
        <GameContainer />
      </Application>
    </>
  );
}
