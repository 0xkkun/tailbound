import { useCallback, useEffect, useRef } from 'react';
import { BoundaryGameScene } from '@game/scenes/game/BoundaryGameScene';
import { OverworldGameScene } from '@game/scenes/game/OverworldGameScene';
import { TestGameScene } from '@game/scenes/game/TestGameScene';
import { LobbyScene } from '@game/scenes/LobbyScene';
import { LoadingSpriteUI } from '@game/ui/LoadingSpriteUI';
import { StageSelectModal } from '@game/ui/StageSelectModal';
import { useApplication } from '@pixi/react';
import { assetLoader } from '@services/assetLoader';
import { audioManager } from '@services/audioManager';

import { useGameState } from '../hooks/useGameState';

interface GameContainerProps {
  onAssetsLoaded?: () => void;
}

export const GameContainer = ({ onAssetsLoaded }: GameContainerProps) => {
  const { app } = useApplication();
  const {
    gamePhase,
    playerSnapshot,
    selectedStage,
    gameKey,
    startGame,
    startTestMode,
    enterBoundary,
    continueToStage2,
    returnToLobby,
    restartGame,
    showStageSelect,
    startGameWithStage,
  } = useGameState();
  const lobbySceneRef = useRef<LobbyScene | null>(null);
  const overworldSceneRef = useRef<OverworldGameScene | null>(null);
  const boundarySceneRef = useRef<BoundaryGameScene | null>(null);
  const testSceneRef = useRef<TestGameScene | null>(null);
  const loadingUIRef = useRef<LoadingSpriteUI | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

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
  }, [app, gamePhase, startGame, startTestMode]);

  // 에셋 프리로딩
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        // 필수 에셋 로드 (critical)
        await assetLoader.loadCritical();

        // 높은 우선순위 에셋 로드 (high)
        await assetLoader.loadHigh();

        // 로딩 완료 콜백 (Press to Start 표시)
        onAssetsLoaded?.();

        // 백그라운드에서 나머지 에셋과 오디오 로드 (병렬 처리)
        Promise.all([
          // Medium/Low 에셋 로드
          assetLoader.loadPhase('medium').then(() => assetLoader.loadPhase('low')),
          // 오디오 파일 preload (Howler.js)
          audioManager.preloadAllAudio(),
        ]).catch((error) => {
          console.error('백그라운드 에셋 로딩 실패:', error);
        });
      } catch (error) {
        console.error('에셋 로딩 실패:', error);
        // 에러가 발생해도 게임은 시작
        onAssetsLoaded?.();
      }
    };

    preloadAssets();
  }, [onAssetsLoaded]);

  // 로딩 체크 후 stage-select로 전환하는 함수
  const handleShowStageSelect = useCallback(async () => {
    if (!app) return;

    // Medium/Low 에셋과 오디오가 이미 로드되었는지 확인
    const mediumLoaded = assetLoader.isPhaseLoaded('medium');
    const lowLoaded = assetLoader.isPhaseLoaded('low');
    const audioLoaded = audioManager.isAudioPreloadComplete();

    // 이미 모두 로드되었다면 바로 stage-select로 전환
    if (mediumLoaded && lowLoaded && audioLoaded) {
      showStageSelect();
      return;
    }

    // 로딩 UI 생성
    const ui = new LoadingSpriteUI(app.screen.width, app.screen.height);

    // stage의 sortableChildren 활성화 (z-index가 작동하도록)
    app.stage.sortableChildren = true;

    app.stage.addChild(ui);
    loadingUIRef.current = ui;

    // z-index 정렬 (로딩 UI가 최상위에 표시되도록)
    app.stage.sortChildren();

    // 로딩 UI 초기화 (패턴 + 스프라이트 로드)
    await ui.initialize();

    // 로딩 UI를 숨기는 함수
    const hideLoadingUI = async () => {
      // 페이드아웃
      await ui.fadeOut(300);
      // UI 제거
      app.stage.removeChild(ui);
      ui.destroy();
      loadingUIRef.current = null;
    };

    // Medium/Low 에셋 및 오디오 로딩 상태 확인
    const checkLoadingComplete = () => {
      const mediumLoaded = assetLoader.isPhaseLoaded('medium');
      const lowLoaded = assetLoader.isPhaseLoaded('low');
      const audioLoaded = audioManager.isAudioPreloadComplete();

      if (mediumLoaded && lowLoaded && audioLoaded && ui) {
        ui.notifyAssetsLoaded();

        // 최소 표시 시간이 지났는지 확인
        if (ui.canHide()) {
          clearInterval(checkIntervalRef.current!);
          hideLoadingUI();
        }
      }
    };

    // 100ms마다 체크
    checkIntervalRef.current = setInterval(checkLoadingComplete, 100);

    // 초기 체크
    checkLoadingComplete();
  }, [app, showStageSelect]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (loadingUIRef.current && app) {
        app.stage.removeChild(loadingUIRef.current);
        loadingUIRef.current.destroy();
        loadingUIRef.current = null;
      }
    };
  }, [app]);

  useEffect(() => {
    if (!app) return;

    // Clear existing stage children (but preserve loading UI if it exists)
    const loadingUI = loadingUIRef.current;
    if (loadingUI && app.stage.children.includes(loadingUI)) {
      // 로딩 UI를 제외한 나머지 제거
      app.stage.children.forEach((child) => {
        if (child !== loadingUI) {
          app.stage.removeChild(child);
        }
      });
    } else {
      app.stage.removeChildren();
    }

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

      // Connect stage select callback
      lobbyScene.onShowStageSelect = () => {
        handleShowStageSelect();
        // 로딩 완료 후 스테이지 선택 화면으로 전환
        showStageSelect();
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
    } else if (gamePhase === 'stage-select') {
      // Stage select modal
      console.log('스테이지 선택 모달 표시');

      const stageSelectModal = new StageSelectModal(app.screen.width, app.screen.height);

      stageSelectModal.onStageSelect = (stageId: string) => {
        console.log('스테이지 선택:', stageId);
        startGameWithStage(stageId);
      };

      stageSelectModal.onCancel = () => {
        console.log('스테이지 선택 취소');
        returnToLobby();
      };

      app.stage.addChild(stageSelectModal);

      return () => {
        stageSelectModal.destroy();
        app.stage.removeChild(stageSelectModal);
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
          const scene = overworldSceneRef.current;
          overworldSceneRef.current = null;
          // 비동기 정리 - cleanup 함수에서는 await 불가하므로 then 사용
          scene.destroy().then(() => {
            app.stage.removeChild(scene);
          });
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
    selectedStage,
    gameKey,
    startGame,
    startTestMode,
    enterBoundary,
    continueToStage2,
    returnToLobby,
    restartGame,
    showStageSelect,
    startGameWithStage,
    handleShowStageSelect,
    app,
  ]);

  return null;
};
