import { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';

import { GameScene } from '../game/scenes/GameScene';
import { LobbyScene } from '../game/scenes/LobbyScene';
import { useGameState } from '../hooks/useGameState';

export const GameContainer = () => {
  const { app } = useApplication();
  const { gamePhase, startGame } = useGameState();
  const lobbySceneRef = useRef<LobbyScene | null>(null);
  const gameSceneRef = useRef<GameScene | null>(null);

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
      // Game scene
      console.log('게임 시작됨!');

      // Create GameScene
      const gameScene = new GameScene(app.screen.width, app.screen.height);

      // Connect game over callback
      gameScene.onGameOver = (result) => {
        console.log('게임 오버!', result);
        // TODO: 게임 오버 처리 (로비로 돌아가기 등)
        // setGamePhase('lobby'); 등
      };

      app.stage.addChild(gameScene);
      gameSceneRef.current = gameScene;

      return () => {
        if (gameSceneRef.current) {
          gameSceneRef.current.destroy();
          app.stage.removeChild(gameSceneRef.current);
          gameSceneRef.current = null;
        }
      };
    }
  }, [gamePhase, startGame, app]);

  return null;
};
