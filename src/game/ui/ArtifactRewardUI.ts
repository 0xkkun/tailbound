/**
 * 유물 보상 UI
 * 3분/6분/9분에 진화 유물을 지급하는 UI
 *
 * Phase 1: 룰렛 (3초간 유물 번갈아가며 표시)
 * Phase 2: 확정 팝업 (유물 아이콘 + 설명 + 확인 버튼)
 */

import { CDN_ASSETS } from '@config/assets.config';
import type { IArtifact } from '@game/artifacts/base/IArtifact';
import { PixelButton } from '@game/ui/PixelButton';
import i18n from '@i18n/config';
import {
  AnimatedSprite,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';

// 색상 팔레트 (LevelUpUI와 동일)
const COLORS = {
  OVERLAY: 0x000000,
  BACKGROUND: 0xdcc7af, // Figma: 갈색 베이지
  BORDER: 0x9d5a29, // Figma: 진한 갈색
  LINE_BORDER: 0xbaa48b, // Figma: Line 테두리
  TITLE: 0x773f16, // Figma: 갈색 (제목)
  TEXT: 0x292826, // Figma: 진한 회갈색 (본문)
  TEXT_DESC: 0x8f867f, // Figma: 회갈색 (설명)
  RARITY_BORDER: 0xd4af37, // 금색 (진화 유물)
} as const;

export class ArtifactRewardUI extends Container {
  private overlay!: Graphics;
  private brightEffectTop!: AnimatedSprite;
  private brightEffectBottom!: AnimatedSprite;
  private backgroundBox!: Graphics;
  private lineContainer!: Graphics;
  private contentBackground!: Graphics; // 컨텐츠 배경 (코너 패턴 안쪽)
  private titleText!: Text;
  private confirmButton!: PixelButton;
  private cornerPatterns: Sprite[] = [];

  // 유물 카드 (중앙 고정)
  private artifactCard!: Container;
  private artifactIconBackground!: Graphics;
  private artifactIcon!: Sprite;
  private weaponCategoryLabels!: Container; // 무기 카테고리 레이블들
  private artifactNameText!: Text;
  private artifactDescText!: Text;

  // 룰렛 상태
  private isRouletting: boolean = false;
  private rouletteTimer: number = 0;
  private rouletteDuration: number = 3.0; // 1초 룰렛
  private rouletteInterval: number = 0.1; // 0.1초마다 유물 변경
  private rouletteElapsed: number = 0;
  private currentRouletteIndex: number = 0;
  private artifactPool: IArtifact[] = [];
  private selectedArtifact?: IArtifact;
  private rouletteResolver?: (artifact: IArtifact) => void;

  // 레이아웃 상수
  private boxWidth: number;
  private boxHeight: number;
  private boxX: number;
  private boxY: number;

  // 콜백
  public onConfirm?: (artifact: IArtifact) => void;

  constructor() {
    super();

    this.visible = false;
    this.zIndex = 20000; // LevelUpUI보다 높게

    // 레이아웃 계산 (좌우 8px 제외, 최대 400px)
    this.boxWidth = Math.min(400, window.innerWidth - 16);
    this.boxHeight = Math.min(540, window.innerHeight - 160);
    this.boxX = (window.innerWidth - this.boxWidth) / 2;
    this.boxY = (window.innerHeight - this.boxHeight) / 2 - 60;

    this.createOverlay();
    this.createBackgroundBox();
    this.createLineContainer();
    this.createContentBackground();
    this.createTitle();
    this.createArtifactCard();
    this.createConfirmButton();

    // 코너 패턴 및 오프닝 이펙트 비동기 로드
    void this.loadCornerPatterns();
    void this.loadBrightOpeningEffect();
  }

  /**
   * 반투명 오버레이 생성 (LevelUpUI와 동일)
   */
  private createOverlay(): void {
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, window.innerWidth, window.innerHeight);
    this.overlay.fill({ color: COLORS.OVERLAY, alpha: 0.8 });

    // 오버레이도 클릭 가능하게 (외부 클릭 방지)
    this.overlay.eventMode = 'static';
    this.addChild(this.overlay);
  }

  /**
   * 배경 박스 생성 (LevelUpUI와 동일)
   */
  private createBackgroundBox(): void {
    this.backgroundBox = new Graphics();

    // 배경 (Figma: radius 없음)
    this.backgroundBox.rect(this.boxX, this.boxY, this.boxWidth, this.boxHeight);
    this.backgroundBox.fill(COLORS.BACKGROUND);

    // 테두리 (Figma: border-2 = 2px)
    this.backgroundBox.rect(this.boxX, this.boxY, this.boxWidth, this.boxHeight);
    this.backgroundBox.stroke({ color: COLORS.BORDER, width: 2 });

    this.backgroundBox.zIndex = 100;
    this.addChild(this.backgroundBox);
  }

  /**
   * Line 컨테이너 생성 (LevelUpUI와 동일)
   */
  private createLineContainer(): void {
    this.lineContainer = new Graphics();

    // Line 컨테이너는 배경 박스 안쪽에 8px 패딩
    const lineX = this.boxX + 8;
    const lineY = this.boxY + 8;
    const lineWidth = this.boxWidth - 16;
    const lineHeight = this.boxHeight - 16;

    // border만
    this.lineContainer.rect(lineX, lineY, lineWidth, lineHeight);
    this.lineContainer.stroke({ color: COLORS.LINE_BORDER, width: 1 });

    this.lineContainer.zIndex = 110;
    this.addChild(this.lineContainer);
  }

  /**
   * 컨텐츠 배경 생성 (코너 패턴 안쪽 영역)
   */
  private createContentBackground(): void {
    this.contentBackground = new Graphics();

    // Line 컨테이너 기준으로 계산
    const lineX = this.boxX + 8;
    const lineY = this.boxY + 8;
    const lineWidth = this.boxWidth - 16;
    const lineHeight = this.boxHeight - 16;

    // 코너 패턴 크기
    const cornerSize = 40;
    const gap = 16;

    // 컨텐츠 영역: 위아래만 코너 패턴 기준으로 16px 간격, 좌우는 lineX 기준
    const contentX = lineX;
    const contentY = lineY + cornerSize + gap;
    const contentWidth = lineWidth;
    const contentHeight = lineHeight - cornerSize * 2 - gap * 2;

    // 배경 (F4EFE9)
    this.contentBackground.rect(contentX, contentY, contentWidth, contentHeight);
    this.contentBackground.fill(0xf4efe9);

    // 위아래 테두리만 (BAA48B)
    // 상단 테두리
    this.contentBackground.moveTo(contentX, contentY);
    this.contentBackground.lineTo(contentX + contentWidth, contentY);
    this.contentBackground.stroke({ color: 0xbaa48b, width: 1 });

    // 하단 테두리
    this.contentBackground.moveTo(contentX, contentY + contentHeight);
    this.contentBackground.lineTo(contentX + contentWidth, contentY + contentHeight);
    this.contentBackground.stroke({ color: 0xbaa48b, width: 1 });

    this.contentBackground.zIndex = 105; // lineContainer(110)보다 아래, backgroundBox(100)보다 위
    this.addChild(this.contentBackground);
  }

  /**
   * 제목 생성 (LevelUpUI와 동일)
   */
  private createTitle(): void {
    this.titleText = new Text({
      text: '유물 보따리',
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 24,
        fill: COLORS.TITLE,
      },
    });
    this.titleText.resolution = 2;
    this.titleText.anchor.set(0.5);

    const lineY = this.boxY + 8;
    this.titleText.x = window.innerWidth / 2;
    this.titleText.y = lineY + 30;
    this.titleText.zIndex = 120;
    this.addChild(this.titleText);
  }

  /**
   * 코너 패턴 로드 (LevelUpUI와 동일)
   */
  private async loadCornerPatterns(): Promise<void> {
    try {
      const texture = await Assets.load(CDN_ASSETS.gui.cornerPattern);
      texture.source.scaleMode = 'nearest';

      const lineX = this.boxX + 8;
      const lineY = this.boxY + 8;
      const lineWidth = this.boxWidth - 16;
      const lineHeight = this.boxHeight - 16;

      const displaySize = 40;
      const halfSize = displaySize / 2;
      const imageScale = 0.5;

      const corners = [
        // 좌상: 원본
        {
          x: lineX + halfSize,
          y: lineY + halfSize,
          rotation: 0,
          scaleX: imageScale,
          scaleY: imageScale,
        },
        // 우상: rotate 180° + scaleY -1
        {
          x: lineX + lineWidth - halfSize,
          y: lineY + halfSize,
          rotation: Math.PI,
          scaleX: imageScale,
          scaleY: -imageScale,
        },
        // 우하: rotate 180°
        {
          x: lineX + lineWidth - halfSize,
          y: lineY + lineHeight - halfSize,
          rotation: Math.PI,
          scaleX: imageScale,
          scaleY: imageScale,
        },
        // 좌하: scaleY -1
        {
          x: lineX + halfSize,
          y: lineY + lineHeight - halfSize,
          rotation: 0,
          scaleX: imageScale,
          scaleY: -imageScale,
        },
      ];

      for (const corner of corners) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5, 0.5);
        sprite.x = corner.x;
        sprite.y = corner.y;
        sprite.rotation = corner.rotation;
        sprite.scale.set(corner.scaleX, corner.scaleY);
        sprite.zIndex = 130;
        this.cornerPatterns.push(sprite);
        this.addChild(sprite);
      }
    } catch (error) {
      console.error('[ArtifactRewardUI] Failed to load corner pattern:', error);
    }
  }

  /**
   * 밝은 오프닝 이펙트 로드 (상단/하단)
   */
  private async loadBrightOpeningEffect(): Promise<void> {
    try {
      const texture = await Assets.load(CDN_ASSETS.gui.brightOpeningEffect);
      texture.source.scaleMode = 'nearest';

      // 7755 × 515, 15프레임 스프라이트시트
      const frameWidth = 7755 / 15;
      const frameHeight = 515;

      // 15개의 프레임 생성
      const frames: Texture[] = [];
      for (let i = 0; i < 15; i++) {
        const frame = new Texture({
          source: texture.source,
          frame: new Rectangle(i * frameWidth, 0, frameWidth, frameHeight),
        });
        frames.push(frame);
      }

      // 상단 이펙트
      this.brightEffectTop = new AnimatedSprite(frames);
      this.brightEffectTop.anchor.set(0.5, 0);
      this.brightEffectTop.x = window.innerWidth / 2;
      this.brightEffectTop.y = 0;
      this.brightEffectTop.animationSpeed = 0.3;
      this.brightEffectTop.loop = true;
      this.brightEffectTop.play();

      // 화면 너비에 맞춰 스케일 조정
      const scaleX = window.innerWidth / frameWidth;
      this.brightEffectTop.scale.set(scaleX, scaleX);
      this.brightEffectTop.zIndex = 50; // 오버레이와 배경 사이

      this.addChild(this.brightEffectTop);

      // 하단 이펙트
      this.brightEffectBottom = new AnimatedSprite(frames);
      this.brightEffectBottom.anchor.set(0.5, 1);
      this.brightEffectBottom.x = window.innerWidth / 2;
      this.brightEffectBottom.y = window.innerHeight;
      this.brightEffectBottom.animationSpeed = 0.3;
      this.brightEffectBottom.loop = true;
      this.brightEffectBottom.play();
      this.brightEffectBottom.scale.set(scaleX, scaleX);
      this.brightEffectBottom.zIndex = 50;

      this.addChild(this.brightEffectBottom);

      console.log('[ArtifactRewardUI] Bright opening effect loaded');
    } catch (error) {
      console.error('[ArtifactRewardUI] Failed to load bright opening effect:', error);
    }
  }

  /**
   * 유물 카드 생성 (중앙 고정)
   */
  private createArtifactCard(): void {
    this.artifactCard = new Container();
    this.artifactCard.x = window.innerWidth / 2;
    this.artifactCard.y = this.boxY + this.boxHeight / 3 + 20; // 중앙보다 조금 아래
    this.artifactCard.zIndex = 120;

    // 레이아웃 계산 (위에서 아래로)
    const bgSize = 128;

    // 1. 배경 사각형: 중앙 위쪽
    const bgY = -80; // 배경 시작 위치

    // 2. 무기 카테고리 레이블: 배경 하단 아래 16px gap
    const weaponCategoryY = bgY + bgSize + 16;

    // 3. 유물 이름: 무기 카테고리 아래 16px gap
    const nameY = weaponCategoryY + 40;

    // 4. 설명: 이름 아래
    const descY = nameY + 32;

    // 텍스트 최대 너비 계산 (박스 너비에서 충분한 패딩 확보)
    // Line 패딩(8*2) + 컨텐츠 패딩(8*2) + 좌우 여유(16*2) = 총 64px 제외
    // 추가로 안전 마진 16px 확보
    const textMaxWidth = this.boxWidth - 80;

    // 128x128 배경 사각형 (흰색)
    this.artifactIconBackground = new Graphics();
    this.artifactIconBackground.rect(-bgSize / 2, bgY, bgSize, bgSize);
    this.artifactIconBackground.fill(COLORS.BACKGROUND);
    this.artifactCard.addChild(this.artifactIconBackground);

    // 유물 아이콘 (배경 중앙)
    this.artifactIcon = new Sprite();
    this.artifactIcon.anchor.set(0.5);
    this.artifactIcon.x = 0;
    this.artifactIcon.y = bgY + bgSize / 2; // 배경 중앙
    this.artifactCard.addChild(this.artifactIcon);

    // 무기 카테고리 레이블 컨테이너 (이미지 바로 아래)
    this.weaponCategoryLabels = new Container();
    this.weaponCategoryLabels.x = 0;
    this.weaponCategoryLabels.y = weaponCategoryY;
    this.artifactCard.addChild(this.weaponCategoryLabels);

    // 유물 이름
    this.artifactNameText = new Text({
      text: '',
      style: {
        fontFamily: 'ChosunCentennial',
        fontSize: 24,
        fill: COLORS.TEXT,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: textMaxWidth,
        breakWords: true, // 단어 중간에서도 줄바꿈 허용
      },
    });
    this.artifactNameText.resolution = 2;
    this.artifactNameText.anchor.set(0.5, 0);
    this.artifactNameText.x = 0;
    this.artifactNameText.y = nameY;
    this.artifactCard.addChild(this.artifactNameText);

    // 설명 텍스트
    this.artifactDescText = new Text({
      text: '',
      style: {
        fontFamily: 'RIDIBatang',
        fontSize: 16,
        fill: COLORS.TEXT_DESC,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: textMaxWidth,
        breakWords: true, // 단어 중간에서도 줄바꿈 허용
        lineHeight: 22,
      },
    });
    this.artifactDescText.resolution = 2;
    this.artifactDescText.anchor.set(0.5, 0);
    this.artifactDescText.x = 0;
    this.artifactDescText.y = descY;
    this.artifactCard.addChild(this.artifactDescText);

    this.addChild(this.artifactCard);
  }

  /**
   * 확인 버튼 생성
   */
  private createConfirmButton(): void {
    this.confirmButton = new PixelButton('획득', 184, 56, COLORS.RARITY_BORDER, false);
    this.confirmButton.x = window.innerWidth / 2;

    // 컨텐츠 배경 영역 하단 기준으로 위치 계산
    const lineY = this.boxY + 8;
    const lineHeight = this.boxHeight - 16;
    const cornerSize = 40;
    const gap = 16;
    const contentBottomY = lineY + lineHeight - cornerSize - gap;

    // 컨텐츠 영역 하단에서 버튼 높이 + 여백만큼 위로
    this.confirmButton.y = contentBottomY - 28 - 20; // 버튼 높이 절반(28) + 여백(20)

    this.confirmButton.visible = false;
    this.confirmButton.zIndex = 120;
    this.confirmButton.on('pointerdown', () => this.handleConfirm());
    this.addChild(this.confirmButton);
  }

  /**
   * 룰렛 시작 (0.1초마다 유물 변경)
   */
  public async startRoulette(artifactPool: IArtifact[]): Promise<IArtifact> {
    // 중복 호출 방지
    if (this.isRouletting || this.visible) {
      console.warn('[ArtifactRewardUI] 이미 룰렛이 진행 중입니다');
      return Promise.reject(new Error('Roulette already in progress'));
    }

    // 유물 풀 검증
    if (!artifactPool || artifactPool.length === 0) {
      console.error('[ArtifactRewardUI] 유물 풀이 비어있습니다');
      return Promise.reject(new Error('Empty artifact pool'));
    }

    this.artifactPool = artifactPool;
    this.isRouletting = true;
    this.rouletteTimer = 0;
    this.rouletteElapsed = 0;
    this.currentRouletteIndex = 0;

    // 랜덤으로 최종 유물 선택
    const randomIndex = Math.floor(Math.random() * artifactPool.length);
    this.selectedArtifact = artifactPool[randomIndex];

    this.visible = true;
    this.confirmButton.visible = false;

    // 첫 유물 표시
    this.updateArtifactDisplay(this.artifactPool[0]);

    console.log(`[ArtifactRewardUI] 룰렛 시작 (${this.rouletteDuration}초)`);

    return new Promise<IArtifact>((resolve) => {
      this.rouletteResolver = resolve;
    });
  }

  /**
   * 업데이트 (룰렛 애니메이션)
   */
  public update(deltaTime: number): void {
    if (!this.isRouletting) return;

    this.rouletteElapsed += deltaTime;
    this.rouletteTimer += deltaTime;

    // 0.1초마다 유물 변경
    if (this.rouletteElapsed >= this.rouletteInterval) {
      this.rouletteElapsed = 0;
      this.currentRouletteIndex = (this.currentRouletteIndex + 1) % this.artifactPool.length;
      this.updateArtifactDisplay(this.artifactPool[this.currentRouletteIndex]);
    }

    // 룰렛 종료
    if (this.rouletteTimer >= this.rouletteDuration) {
      this.finishRoulette();
    }
  }

  /**
   * 룰렛 종료 → 확정 팝업 표시
   */
  private finishRoulette(): void {
    this.isRouletting = false;
    console.log(`[ArtifactRewardUI] 룰렛 종료 → 확정: ${this.selectedArtifact?.data.name}`);

    // 최종 유물 표시
    if (this.selectedArtifact) {
      this.updateArtifactDisplay(this.selectedArtifact);
    }

    // 확인 버튼 표시 (확인 버튼을 눌러야 Promise가 resolve됨)
    this.confirmButton.visible = true;
  }

  /**
   * 유물 정보 업데이트 (아이콘 + 텍스트)
   */
  private updateArtifactDisplay(artifact: IArtifact): void {
    // 아이콘 로드
    Assets.load(artifact.data.iconPath)
      .then((texture) => {
        texture.source.scaleMode = 'nearest';
        this.artifactIcon.texture = texture;

        // 128x128 사각형에 꽉 차도록 스케일 조정
        const iconSize = 128;
        const scaleX = iconSize / texture.width;
        const scaleY = iconSize / texture.height;
        const scale = Math.max(scaleX, scaleY); // 꽉 차게 하려면 max 사용
        this.artifactIcon.scale.set(scale);
      })
      .catch((error) => {
        console.warn('[ArtifactRewardUI] 아이콘 로드 실패:', error);
      });

    // 텍스트 업데이트
    this.artifactNameText.text = artifact.data.name;
    this.artifactDescText.text = artifact.data.description;

    // 무기 카테고리 레이블 업데이트
    this.updateWeaponCategoryLabels(artifact);
  }

  /**
   * 무기 카테고리 레이블 업데이트
   */
  private updateWeaponCategoryLabels(artifact: IArtifact): void {
    // 기존 레이블 제거
    this.weaponCategoryLabels.removeChildren();

    const categories = artifact.data.weaponCategories;

    // undefined이거나 빈 배열이면 "전체" 표시
    if (!categories || categories.length === 0) {
      const allText = i18n.t('weapons.common.all');
      const label = this.createWeaponCategoryLabel(allText, COLORS.TEXT);
      label.x = 0;
      this.weaponCategoryLabels.addChild(label);
      return;
    }

    // WeaponType 목록 (배경색 판단용)
    const weaponTypes = [
      'talisman',
      'dokkaebi_fire',
      'moktak_sound',
      'jakdu_blade',
      'fan_wind',
      'purifying_water',
    ];

    // 각 카테고리에 대한 레이블 생성
    const labelWidth = 70;
    const labelGap = 8;
    const totalWidth = categories.length * labelWidth + (categories.length - 1) * labelGap;
    const startX = -totalWidth / 2;

    categories.forEach((category, index) => {
      // WeaponType인지 확인
      const isWeaponType = weaponTypes.includes(category);

      // i18n으로 이름 가져오기
      const categoryName = isWeaponType
        ? i18n.t(`weapons.types.${category}`)
        : i18n.t(`weapons.categories.${category}`);

      // 배경색 설정: WeaponType이면 빨강(0xd3294a), 아니면 기본 색상
      const bgColor = isWeaponType ? 0xd3294a : COLORS.TEXT;

      const label = this.createWeaponCategoryLabel(categoryName, bgColor);
      label.x = startX + index * (labelWidth + labelGap) + labelWidth / 2;
      this.weaponCategoryLabels.addChild(label);
    });
  }

  /**
   * 무기 카테고리 레이블 생성
   */
  private createWeaponCategoryLabel(text: string, color: number): Container {
    const container = new Container();

    // 배경 박스
    const bg = new Graphics();
    bg.roundRect(-35, -12, 70, 24, 12);
    bg.fill(color);
    container.addChild(bg);

    // 텍스트
    const labelText = new Text({
      text,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 14,
        fill: 0xf0ecf7, // 밝은 보라빛 흰색
        align: 'center',
      },
    });
    labelText.resolution = 2;
    labelText.anchor.set(0.5);
    labelText.x = 0;
    labelText.y = 0;
    container.addChild(labelText);

    return container;
  }

  /**
   * 확인 버튼 클릭
   */
  private handleConfirm(): void {
    if (!this.selectedArtifact) return;

    console.log(`[ArtifactRewardUI] 확인 버튼 클릭: ${this.selectedArtifact.data.name}`);

    // Promise 해결 (확인 버튼을 눌러야 유물 지급)
    if (this.rouletteResolver && this.selectedArtifact) {
      this.rouletteResolver(this.selectedArtifact);
    }

    if (this.onConfirm) {
      this.onConfirm(this.selectedArtifact);
    }

    this.hide();
  }

  /**
   * UI 숨기기
   */
  public hide(): void {
    this.visible = false;
    this.isRouletting = false;
    this.confirmButton.visible = false;

    // Promise resolver 정리 (메모리 누수 방지)
    this.rouletteResolver = undefined;
    this.selectedArtifact = undefined;
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.confirmButton.destroy();
    for (const pattern of this.cornerPatterns) {
      pattern.destroy();
    }
    if (this.brightEffectTop) {
      this.brightEffectTop.destroy();
    }
    if (this.brightEffectBottom) {
      this.brightEffectBottom.destroy();
    }
    super.destroy({ children: true });
  }
}
