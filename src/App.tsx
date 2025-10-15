import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';

import { GameContainer } from './components/GameContainer';

// extend tells @pixi/react what Pixi.js components are available
extend({
  Container,
  Graphics,
  Text,
});

export default function App() {
  return (
    // We'll wrap our components with an <Application> component to provide
    // the Pixi.js Application context
    <Application background={'#1a1a2e'} resizeTo={window}>
      <GameContainer />
    </Application>
  );
}
