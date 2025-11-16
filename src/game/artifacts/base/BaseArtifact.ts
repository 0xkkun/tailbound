/**
 * 유물 베이스 클래스
 */

import type { BaseEnemy } from '@game/entities/enemies/BaseEnemy';
import type { Player } from '@game/entities/Player';
import type { ArtifactData } from '@type/artifact.types';
import type { IGameScene } from '@type/scene.types';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import type { IArtifact } from './IArtifact';

export abstract class BaseArtifact implements IArtifact {
  public active: boolean = false;
  protected player?: Player;
  protected scene?: IGameScene;

  // 중앙 UI 요소 (선택적)
  protected centerUI?: Container; // 중앙 컨테이너 UI
  protected centerIcon?: Sprite; // 아이콘
  protected centerText?: Text; // 텍스트 (아이콘 아래)
  protected centerProgress?: Graphics; // 원형 프로그레스바 (쿨다운용)

  constructor(public readonly data: ArtifactData) {}

  /**
   * 유물 활성화
   */
  public activate(player: Player, scene: IGameScene): void {
    if (this.active) {
      console.warn(`[Artifact] ${this.data.id} is already active`);
      return;
    }

    this.player = player;
    this.scene = scene;
    this.active = true;

    console.log(`✅ [Artifact] Activated: ${this.data.name}`);
  }

  /**
   * 유물 비활성화
   */
  public deactivate(player: Player, scene: IGameScene): void {
    if (!this.active) return;

    this.cleanup();
    this.active = false;

    console.log(
      `❌ [Artifact] Deactivated: ${this.data.name}, player: ${player.name}, scene: ${scene.name}`
    );
  }

  /**
   * 매 프레임 업데이트 (기본: 아무것도 안함)
   */
  public update(_delta: number): void {
    // 필요한 유물만 오버라이드
    void _delta;
  }

  /**
   * 상태 정리
   */
  public cleanup(): void {
    // 중앙 UI 정리
    this.destroyCenterUI();

    this.player = undefined;
    this.scene = undefined;
  }

  // ====== 중앙 컨테이너 UI 헬퍼 메서드 ======

  /**
   * 중앙 컨테이너에 아이콘 + 텍스트 UI 생성
   * @param iconSize 아이콘 크기 (기본: 20)
   * @param fontSize 텍스트 폰트 크기 (기본: 12)
   * @param textColor 텍스트 색상 (기본: 0xe39f54)
   * @param _textOffsetY 텍스트 Y 오프셋 (기본: 26) - 현재 미사용
   */
  protected async createCenterUI(
    iconSize: number = 20,
    fontSize: number = 12,
    textColor: number = 0xe39f54,
    _textOffsetY: number = 26
  ): Promise<void> {
    void _textOffsetY; // 현재 미사용 (텍스트가 아이콘 중앙에 오버레이되므로)

    if (!this.scene?.artifactIconsContainer) return;

    try {
      // 아이콘 로드
      const iconTexture = await Assets.load(this.data.iconPath);

      // UI 컨테이너 생성
      this.centerUI = new Container();

      // 아이콘 생성
      this.centerIcon = new Sprite(iconTexture);
      this.centerIcon.anchor.set(0.5, 0);
      this.centerIcon.width = iconSize;
      this.centerIcon.height = iconSize;
      this.centerIcon.x = 0;
      this.centerIcon.y = 0;

      // 텍스트 생성 (아이콘 중앙에 오버레이)
      this.centerText = new Text('', {
        fontFamily: 'NeoDunggeunmo',
        fontSize,
        fill: textColor,
      });
      this.centerText.resolution = 2;
      this.centerText.anchor.set(0.5, 0.5); // 중앙 정렬
      this.centerText.x = 0;
      this.centerText.y = iconSize / 2; // 아이콘 중앙
      this.centerText.zIndex = 100; // 항상 위에 표시

      this.centerUI.addChild(this.centerIcon);
      this.centerUI.addChild(this.centerText);
      this.centerUI.sortableChildren = true; // zIndex 활성화

      // artifactIconsContainer에 추가
      this.scene.artifactIconsContainer.addChild(this.centerUI);

      // 레이아웃 재계산
      this.relayoutArtifactIcons();

      console.log(`[${this.data.name}] Center UI created`);
    } catch (error) {
      console.error(`[${this.data.name}] Failed to create center UI:`, error);
    }
  }

  /**
   * 중앙 UI 텍스트 업데이트
   */
  protected updateCenterText(text: string): void {
    if (this.centerText) {
      this.centerText.text = text;
    }
  }

  /**
   * 원형 프로그레스바 생성 (아이콘 위에 오버레이)
   */
  protected createCenterProgress(): void {
    if (!this.centerUI || !this.centerIcon) return;

    this.centerProgress = new Graphics();
    this.centerProgress.x = 0;
    this.centerProgress.y = this.centerIcon.height / 2;
    this.centerUI.addChild(this.centerProgress);
  }

  /**
   * 원형 프로그레스바 업데이트 (쿨다운 표시 - 오버레이 형태)
   * @param progress 0~1 (0: 비어있음, 1: 가득참)
   * @param color 진행 색상 (사용 안 함, 그레이로 고정)
   */
  protected updateCenterProgress(progress: number, color: number = 0x00ff00): void {
    void color; // 사용 안 함

    if (!this.centerProgress || !this.centerIcon) return;

    this.centerProgress.clear();

    if (progress <= 0) return; // 진행도가 0이면 아무것도 그리지 않음

    const radius = this.centerIcon.width / 2;
    const startAngle = -Math.PI / 2; // 12시 방향 시작
    const endAngle = startAngle + progress * Math.PI * 2;

    // 파이 형태로 채우기 (그레이 색상)
    this.centerProgress.moveTo(0, 0);
    this.centerProgress.arc(0, 0, radius, startAngle, endAngle);
    this.centerProgress.lineTo(0, 0);
    this.centerProgress.fill({ color: 0x808080, alpha: 0.7 }); // 그레이, 불투명하게
  }

  /**
   * 아이콘 grayscale 필터 적용/해제
   * @param grayscale true: 회색, false: 원래 색상
   */
  protected setCenterIconGrayscale(grayscale: boolean): void {
    if (!this.centerIcon) return;

    if (grayscale) {
      this.centerIcon.tint = 0x888888; // 회색조
      this.centerIcon.alpha = 0.5;
    } else {
      this.centerIcon.tint = 0xffffff; // 원래 색상
      this.centerIcon.alpha = 1;
    }
  }

  /**
   * 진화 유물용 UI 업데이트
   * @param weaponLevel 현재 무기 레벨
   * @param requiredLevel 진화 필요 레벨 (기본: 7)
   * @param isEvolved 진화 완료 여부
   */
  protected updateEvolutionUI(
    weaponLevel: number,
    requiredLevel: number = 7,
    isEvolved: boolean = false
  ): void {
    if (isEvolved) {
      // 진화 완료: 컬러 + 텍스트 숨김
      this.setCenterIconGrayscale(false);
      this.updateCenterText('');
    } else {
      // 진화 전: grayscale + 레벨 표시
      this.setCenterIconGrayscale(true);
      this.updateCenterText(`${weaponLevel}/${requiredLevel}`);
    }
  }

  /**
   * 중앙 UI 제거
   */
  protected destroyCenterUI(): void {
    if (this.centerUI) {
      if (!this.centerUI.destroyed) {
        this.centerUI.destroy({ children: true });
      }
      this.centerUI = undefined;
    }

    this.centerIcon = undefined;
    this.centerText = undefined;
    this.centerProgress = undefined;

    // 레이아웃 재계산
    this.relayoutArtifactIcons();
  }

  /**
   * 유물 아이콘 레이아웃 재계산 (한 줄 중앙 정렬 + 전체 배경)
   */
  private relayoutArtifactIcons(): void {
    if (!this.scene?.artifactIconsContainer) return;

    const container = this.scene.artifactIconsContainer;
    const children = container.children;

    // 배경 제거 (기존에 있다면)
    const existingBg = children.find((child) => child.label === 'artifact-bg');
    if (existingBg) {
      container.removeChild(existingBg);
    }

    // 유물 아이콘만 필터링 (배경 제외)
    const icons = children.filter((child) => child.label !== 'artifact-bg');
    const count = icons.length;

    if (count === 0) return;

    const ITEM_GAP = 8; // 아이템 간격
    const ICON_SIZE = 20; // 아이콘 크기

    // 전체 너비 계산
    const totalWidth = count * ICON_SIZE + (count - 1) * ITEM_GAP;
    const startX = -totalWidth / 2;

    // 아이콘 배치
    for (let i = 0; i < count; i++) {
      const child = icons[i] as Container;
      child.x = startX + i * (ICON_SIZE + ITEM_GAP) + ICON_SIZE / 2;
      child.y = 4; // 상단 padding
    }

    // 전체 배경 생성 (검정색, padding 8/4, border rounded 4)
    const bg = new Graphics();
    const bgWidth = totalWidth + 16; // 좌우 padding 8*2
    const bgHeight = ICON_SIZE + 8; // 아이콘 + 상하 padding 4*2
    bg.roundRect(-bgWidth / 2, 0, bgWidth, bgHeight, 4); // rounded 4
    bg.fill({ color: 0x000000, alpha: 0.8 });
    bg.stroke({ color: 0x000000, width: 4 });
    bg.label = 'artifact-bg';

    // 배경을 맨 뒤에 추가
    container.addChildAt(bg, 0);
  }

  // 이벤트 훅 (필요한 유물만 구현)
  public onKill?(enemy: BaseEnemy): void;
  public onHit?(enemy: BaseEnemy, damage: number): void;
  public onTakeDamage?(damage: number, source: Container): number;
  public onLevelUp?(level: number): void;
}
