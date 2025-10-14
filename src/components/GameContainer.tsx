import { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';

import { LobbyScene } from '../game/scenes/LobbyScene';
import { useGameState } from '../hooks/useGameState';

export const GameContainer = () => {
  const { app } = useApplication();
  const { gamePhase, startGame } = useGameState();
  const lobbySceneRef = useRef<LobbyScene | null>(null);

  // 화면 리사이즈 처리
  useEffect(() => {
    if (!app) return;

    const handleResize = () => {
      // 로비 씬 재생성
      if (gamePhase === 'lobby' && lobbySceneRef.current) {
        app.stage.removeChild(lobbySceneRef.current);
        lobbySceneRef.current.destroy();

        const newLobbyScene = new LobbyScene(app.screen.width, app.screen.height);
        newLobbyScene.onStartGame = () => {
          startGame();
        };

        app.stage.addChild(newLobbyScene);
        lobbySceneRef.current = newLobbyScene;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [app, gamePhase, startGame]);

  useEffect(() => {
    if (!app) return;

    // Clear existing stage children
    app.stage.removeChildren();

    if (gamePhase === 'lobby') {
      // Create and add lobby scene
      const lobbyScene = new LobbyScene(app.screen.width, app.screen.height);

      // Connect game start callback
      lobbyScene.onStartGame = () => {
        startGame();
      };

      app.stage.addChild(lobbyScene);
      lobbySceneRef.current = lobbyScene;

      return () => {
        if (lobbySceneRef.current) {
          lobbySceneRef.current.destroy();
          app.stage.removeChild(lobbySceneRef.current);
          lobbySceneRef.current = null;
        }
      };
    } else if (gamePhase === 'playing') {
      // Game scene (placeholder for now)
      console.log('게임 시작됨!');

      // Create a simple placeholder for the game scene
      const gameContainer = new Container();

      // Add background
      const bg = new Graphics();
      bg.beginFill(0x0a0a15);
      bg.drawRect(0, 0, app.screen.width, app.screen.height);
      bg.endFill();
      gameContainer.addChild(bg);

      // Add placeholder text
      const placeholderText = new Text('게임 화면 (구현 예정)', {
        fontFamily: 'Nanum Gothic',
        fontSize: 48,
        fill: 0xffffff,
      });
      placeholderText.anchor.set(0.5);
      placeholderText.x = app.screen.width / 2;
      placeholderText.y = app.screen.height / 2;
      gameContainer.addChild(placeholderText);

      app.stage.addChild(gameContainer);

      return () => {
        gameContainer.destroy({ children: true });
        app.stage.removeChild(gameContainer);
      };
    }
  }, [gamePhase, startGame, app]);

  return null;
};
