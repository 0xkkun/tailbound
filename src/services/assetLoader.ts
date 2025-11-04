/**
 * 에셋 로더 서비스
 * - 단계별 에셋 로딩
 * - 로딩 진행률 추적
 * - CDN 에셋 캐싱
 */

import { ASSET_LOADING_GROUPS, CDN_ASSETS } from '@config/assets.config';
import { Assets } from 'pixi.js';

export type LoadingPhase = 'critical' | 'high' | 'medium' | 'low';

export interface LoadingProgress {
  phase: LoadingPhase;
  loaded: number;
  total: number;
  percentage: number;
}

export class AssetLoader {
  private static instance: AssetLoader;
  private loadedPhases: Set<LoadingPhase> = new Set();
  private onProgressCallbacks: ((progress: LoadingProgress) => void)[] = [];

  private constructor() {}

  static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * 진행률 콜백 등록
   */
  onProgress(callback: (progress: LoadingProgress) => void): void {
    this.onProgressCallbacks.push(callback);
  }

  /**
   * 진행률 콜백 제거
   */
  offProgress(callback: (progress: LoadingProgress) => void): void {
    const index = this.onProgressCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onProgressCallbacks.splice(index, 1);
    }
  }

  /**
   * 진행률 알림
   */
  private notifyProgress(progress: LoadingProgress): void {
    this.onProgressCallbacks.forEach((callback) => callback(progress));
  }

  /**
   * 특정 단계의 에셋 로드
   */
  async loadPhase(phase: LoadingPhase): Promise<void> {
    if (this.loadedPhases.has(phase)) {
      console.log(`[AssetLoader] Phase "${phase}" already loaded, skipping`);
      return;
    }

    const assets = ASSET_LOADING_GROUPS[phase];
    const total = assets.length;

    console.log(`[AssetLoader] Loading phase "${phase}" (${total} assets)`);

    try {
      let loaded = 0;

      // 에셋을 하나씩 로드하면서 진행률 업데이트
      for (const asset of assets) {
        try {
          await Assets.load(asset);
          loaded++;

          this.notifyProgress({
            phase,
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        } catch (error) {
          console.error(`[AssetLoader] Failed to load asset: ${asset}`, error);
          // 개별 에셋 로드 실패는 무시하고 계속 진행
        }
      }

      this.loadedPhases.add(phase);
      console.log(`[AssetLoader] Phase "${phase}" loaded successfully`);
    } catch (error) {
      console.error(`[AssetLoader] Failed to load phase "${phase}":`, error);
      throw error;
    }
  }

  /**
   * 필수 에셋 로드 (게임 시작 전)
   */
  async loadCritical(): Promise<void> {
    await this.loadPhase('critical');
  }

  /**
   * 높은 우선순위 에셋 로드 (게임 초반)
   */
  async loadHigh(): Promise<void> {
    await this.loadPhase('high');
  }

  /**
   * 중간 우선순위 에셋 로드 (게임 중반)
   */
  async loadMedium(): Promise<void> {
    await this.loadPhase('medium');
  }

  /**
   * 낮은 우선순위 에셋 로드 (게임 후반/보스)
   */
  async loadLow(): Promise<void> {
    await this.loadPhase('low');
  }

  /**
   * 모든 에셋 로드
   */
  async loadAll(): Promise<void> {
    await this.loadCritical();
    await this.loadHigh();
    await this.loadMedium();
    await this.loadLow();
  }

  /**
   * 백그라운드에서 비동기로 에셋 로드
   */
  loadInBackground(phases: LoadingPhase[]): void {
    Promise.all(phases.map((phase) => this.loadPhase(phase))).catch((error) => {
      console.error('[AssetLoader] Background loading failed:', error);
    });
  }

  /**
   * 특정 에셋 URL 로드 (동적 로딩용)
   */
  async loadAsset(url: string): Promise<void> {
    try {
      await Assets.load(url);
      console.log(`[AssetLoader] Loaded asset: ${url}`);
    } catch (error) {
      console.error(`[AssetLoader] Failed to load asset: ${url}`, error);
      throw error;
    }
  }

  /**
   * 여러 에셋 URL 로드
   */
  async loadAssets(urls: string[]): Promise<void> {
    try {
      await Assets.load(urls);
      console.log(`[AssetLoader] Loaded ${urls.length} assets`);
    } catch (error) {
      console.error('[AssetLoader] Failed to load assets:', error);
      throw error;
    }
  }

  /**
   * 로딩 상태 초기화
   */
  reset(): void {
    this.loadedPhases.clear();
    this.onProgressCallbacks = [];
  }

  /**
   * 특정 단계가 로드되었는지 확인
   */
  isPhaseLoaded(phase: LoadingPhase): boolean {
    return this.loadedPhases.has(phase);
  }

  /**
   * CDN 에셋 경로 가져오기 (타입 안전)
   */
  static getCDNAsset(category: keyof typeof CDN_ASSETS, key: string): string {
    const categoryAssets = CDN_ASSETS[category] as Record<string, string>;
    return categoryAssets[key] || '';
  }
}

// 싱글톤 인스턴스 export
export const assetLoader = AssetLoader.getInstance();
