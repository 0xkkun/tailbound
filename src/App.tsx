import I18nExample from '@components/I18nExample';
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
      <I18nExample />
      {/* We'll wrap our components with an <Application> component to provide
          the Pixi.js Application context */}
      <Application background={'#1a1a2e'} resizeTo={window}>
        <GameContainer />
      </Application>
    </>
  );
}
