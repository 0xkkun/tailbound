import { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';

import { BoundaryGameScene } from '../game/scenes/game/BoundaryGameScene';
import { OverworldGameScene } from '../game/scenes/game/OverworldGameScene';
import { TestGameScene } from '../game/scenes/game/TestGameScene';
import { LobbyScene } from '../game/scenes/LobbyScene';
import { useGameState } from '../hooks/useGameState';

export const GameContainer = () => {
  const { app } = useApplication();
  const {
    gamePhase,
    playerSnapshot,
    gameKey,
    startGame,
    startTestMode,
    enterBoundary,
    continueToStage2,
    returnToLobby,
    restartGame,
  } = useGameState();
  const lobbySceneRef = useRef<LobbyScene | null>(null);
  const overworldSceneRef = useRef<OverworldGameScene | null>(null);
  const boundarySceneRef = useRef<BoundaryGameScene | null>(null);
  const testSceneRef = useRef<TestGameScene | null>(null);

  // URL 파라미터로 테스트 모드 자동 진입
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true' && gamePhase === 'lobby') {
      console.log('URL 파라미터로 테스트 모드 진입');
      startTestMode();
    }
  }, [gamePhase, startTestMode]);

  // iOS 웹뷰: Canvas 터치 이벤트 완전 차단
  useEffect(() => {
    if (!app?.canvas) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventDefaultContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const canvas = app.canvas as HTMLCanvasElement;

    // 모든 터치 이벤트를 차단하여 iOS 기본 동작 방지
    canvas.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchend', preventDefaultTouch, { passive: false });
    canvas.addEventListener('touchcancel', preventDefaultTouch, { passive: false });

    // 추가: 컨텍스트 메뉴 차단
    canvas.addEventListener('contextmenu', preventDefaultContextMenu);

    return () => {
      canvas.removeEventListener('touchstart', preventDefaultTouch);
      canvas.removeEventListener('touchmove', preventDefaultTouch);
      canvas.removeEventListener('touchend', preventDefaultTouch);
      canvas.removeEventListener('touchcancel', preventDefaultTouch);
      canvas.removeEventListener('contextmenu', preventDefaultContextMenu);
    };
  }, [app]);

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
        newLobbyScene.onStartTestMode = () => {
          startTestMode();
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

      // Connect test mode callback
      lobbyScene.onStartTestMode = () => {
        startTestMode();
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

      // Create OverworldGameScene (playerSnapshot 전달)
      const overworldScene = new OverworldGameScene(
        app.screen.width,
        app.screen.height,
        playerSnapshot
      );

      // Connect game over callback
      overworldScene.onGameOver = (result) => {
        console.log('게임 오버!', result);
      };

      // Connect return to lobby callback
      overworldScene.onReturnToLobby = () => {
        console.log('로비로 돌아가기');
        returnToLobby();
      };

      // Connect restart game callback
      overworldScene.onRestartGame = () => {
        console.log('게임 다시하기');
        restartGame();
      };

      // Connect boundary enter callback
      overworldScene.onEnterBoundary = () => {
        console.log('경계로 진입!');
        const player = overworldScene.getPlayer();
        enterBoundary(player);
      };

      app.stage.addChild(overworldScene);
      overworldSceneRef.current = overworldScene;

      return () => {
        if (overworldSceneRef.current) {
          overworldSceneRef.current.destroy();
          app.stage.removeChild(overworldSceneRef.current);
          overworldSceneRef.current = null;
        }
      };
    } else if (gamePhase === 'boundary') {
      // Boundary scene
      console.log('경계 맵 진입!');

      // Create BoundaryGameScene (playerSnapshot 전달)
      const boundaryScene = new BoundaryGameScene(
        app.screen.width,
        app.screen.height,
        playerSnapshot
      );

      // 다음 스테이지로 진행 콜백 연결
      boundaryScene.onContinueToStage2 = () => {
        console.log('스테이지 2로 진행');
        continueToStage2();
      };

      app.stage.addChild(boundaryScene);
      boundarySceneRef.current = boundaryScene;

      return () => {
        if (boundarySceneRef.current) {
          boundarySceneRef.current.destroy();
          app.stage.removeChild(boundarySceneRef.current);
          boundarySceneRef.current = null;
        }
      };
    } else if (gamePhase === 'test') {
      // Test scene
      console.log('테스트 모드 시작!');

      // Create TestGameScene
      const testScene = new TestGameScene(app.screen.width, app.screen.height, playerSnapshot);

      // Connect return to lobby callback
      testScene.onReturnToLobby = () => {
        console.log('로비로 돌아가기');
        returnToLobby();
      };

      // Connect restart game callback
      testScene.onRestartGame = () => {
        console.log('게임 다시하기');
        restartGame();
      };

      app.stage.addChild(testScene);
      testSceneRef.current = testScene;

      return () => {
        if (testSceneRef.current) {
          testSceneRef.current.destroy();
          app.stage.removeChild(testSceneRef.current);
          testSceneRef.current = null;
        }
      };
    }
  }, [
    gamePhase,
    playerSnapshot,
    gameKey,
    startGame,
    startTestMode,
    enterBoundary,
    continueToStage2,
    returnToLobby,
    restartGame,
    app,
  ]);

  return null;
};
