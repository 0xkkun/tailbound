import { CDN_BASE_URL } from '@config/assets.config';
import { audioManager } from '@services/audioManager';
import { safeGetSafeAreaInsets } from '@utils/tossAppBridge';
import gsap from 'gsap';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';

import { PixelButton } from './PixelButton';

interface StageData {
  id: string;
  name: string;
  locked: boolean;
  bossImage: string;
}

interface StageCard extends Container {
  stageData: StageData;
  darkOverlay?: Graphics;
}

export class StageSelectModal extends Container {
  // UI 상수
  private readonly MAX_CARD_WIDTH = 360;
  private readonly CARD_HEIGHT = 120;
  private readonly CARD_OFFSET_Y = 32;
  private readonly CARD_SCALE_UNSELECTED = 0.9; // 선택되지 않은 카드 크기: 90%
  private readonly CARD_ALPHA_UNSELECTED = 0.6;
  private readonly SWIPE_THRESHOLD = 60; // 슬라이드 민감도, 높을수록 둔감
  private readonly DRAG_START_THRESHOLD = 10;
  private readonly ANIMATION_DURATION = 0.3;

  private backgroundSprite!: Sprite;
  private overlay!: Graphics;
  private modalContainer!: Container;
  private cardsContainer!: Container;
  private swipeArea!: Graphics;
  private buttonLayer!: Container;
  private cards: StageCard[] = [];
  private currentIndex: number = 0;
  private cardData: StageData[] = [
    {
      id: 'stage1',
      name: '흑혈백호',
      locked: false,
      bossImage: `${CDN_BASE_URL}/assets/boss/boss-tiger.png`,
    },
    {
      id: 'stage2',
      name: '????',
      locked: true,
      bossImage: `${CDN_BASE_URL}/assets/boss/boss-dragon.png`,
    },
    {
      id: 'stage3',
      name: '????',
      locked: true,
      bossImage: `${CDN_BASE_URL}/assets/boss/boss-fire.png`,
    },
  ];
  private confirmButton!: PixelButton;
  private backButton!: Container;
  private screenWidth: number;
  private screenHeight: number;

  // 드래그 제스처용 변수
  private dragStartY: number = 0;
  private isDragging: boolean = false;

  public onStageSelect?: (stageId: string) => void;
  public onCancel?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.loadAndCreateBackground();
    this.createModal();
    this.createCards();
    this.createButtons();
    this.setupDragGesture(); // 버튼보다 나중에 호출하여 버튼이 위에 오도록 함
  }

  private async loadAndCreateBackground(): Promise<void> {
    try {
      // bg-stage 이미지 로드
      const texture = await Assets.load(`${CDN_BASE_URL}/assets/gui/bg-stage.png`);

      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      // 배경 스프라이트 생성
      this.backgroundSprite = new Sprite(texture);

      // 이미지 원본 크기
      const imgWidth = texture.width;
      const imgHeight = texture.height;

      // 화면 전체를 덮도록 스케일 계산
      const scaleX = this.screenWidth / imgWidth;
      const scaleY = this.screenHeight / imgHeight;
      const scale = Math.max(scaleX, scaleY);
      this.backgroundSprite.scale.set(scale);

      // 스케일 적용 후 실제 크기
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // 배경 스프라이트를 중앙 정렬
      this.backgroundSprite.x = (this.screenWidth - scaledWidth) / 2;
      this.backgroundSprite.y = (this.screenHeight - scaledHeight) / 2;

      this.addChildAt(this.backgroundSprite, 0);

      console.log('스테이지 선택 배경 로드 완료');
    } catch (error) {
      console.error('스테이지 선택 배경 로드 실패:', error);
      // 폴백: 검은색 배경
      this.overlay = new Graphics();
      this.overlay.rect(0, 0, this.screenWidth, this.screenHeight);
      this.overlay.fill({ color: 0x000000, alpha: 0.8 });
      this.addChild(this.overlay);
    }
  }

  private createModal(): void {
    this.modalContainer = new Container();
    this.modalContainer.x = this.screenWidth / 2;
    this.modalContainer.y = this.screenHeight / 2;
    // 이벤트를 통과시키기 위해 passive 모드로 설정
    this.modalContainer.eventMode = 'passive';
    this.addChild(this.modalContainer);

    // 카드 컨테이너 위치 계산
    // 선택 버튼이 screenHeight - 80에 위치하므로
    // 카드는 버튼보다 16px 위 + 카드 높이의 절반만큼 위로
    const buttonY = this.screenHeight - 80;
    const cardCenterY = buttonY - 16 - this.CARD_HEIGHT - 16;

    this.cardsContainer = new Container();
    // modalContainer의 중심이 (screenWidth/2, screenHeight/2)이므로
    // 상대 좌표로 카드 위치 설정
    this.cardsContainer.y = cardCenterY - this.screenHeight / 2;
    // 이벤트를 통과시키기 위해 passive 모드로 설정
    this.cardsContainer.eventMode = 'passive';
    this.modalContainer.addChild(this.cardsContainer);
  }

  private createCards(): void {
    // 가로로 긴 직사각형 카드
    const cardWidth = Math.min(this.MAX_CARD_WIDTH, this.screenWidth - 32);

    // 3개의 카드를 생성 (세로로 겹쳐서 배치)
    this.cardData.forEach((data) => {
      const card = this.createCard(data, cardWidth, this.CARD_HEIGHT);

      // 초기 위치 설정 (중앙에 세로로 겹쳐서 배치)
      card.x = 0;
      card.y = 0;

      this.cards.push(card);
      this.cardsContainer.addChild(card);
    });

    // 초기 상태 업데이트
    this.updateCardStates();
  }

  private createCard(data: StageData, width: number, height: number): StageCard {
    const card = new Container() as StageCard;

    // 4-layer border frame
    const outerBorder = 4; // #9D5A29
    const secondBorder = 8; // #E39F54
    const thirdBorder = 4; // #BAA48B
    const totalBorder = outerBorder + secondBorder + thirdBorder; // 16px total

    // Layer 1: Outer border #9D5A29 (4px)
    const layer1 = new Graphics();
    layer1.rect(-width / 2, -height / 2, width, height);
    layer1.fill({ color: 0x9d5a29 });
    card.addChild(layer1);

    // Layer 2: Second border #E39F54 (8px inset)
    const layer2 = new Graphics();
    layer2.rect(
      -width / 2 + outerBorder,
      -height / 2 + outerBorder,
      width - outerBorder * 2,
      height - outerBorder * 2
    );
    layer2.fill({ color: 0xe39f54 });
    card.addChild(layer2);

    // Layer 3: Third border #BAA48B (4px inset)
    const layer3 = new Graphics();
    layer3.rect(
      -width / 2 + outerBorder + secondBorder,
      -height / 2 + outerBorder + secondBorder,
      width - (outerBorder + secondBorder) * 2,
      height - (outerBorder + secondBorder) * 2
    );
    layer3.fill({ color: 0xbaa48b });
    card.addChild(layer3);

    // Layer 4: Inner content area #E9D2B8
    const contentWidth = width - totalBorder * 2;
    const contentHeight = height - totalBorder * 2;
    const contentX = -width / 2 + totalBorder;
    const contentY = -height / 2 + totalBorder;

    const contentArea = new Graphics();
    contentArea.rect(contentX, contentY, contentWidth, contentHeight);
    contentArea.fill({ color: 0xe9d2b8 });
    card.addChild(contentArea);

    // Content container with mask for cropping
    const contentContainer = new Container();
    contentContainer.x = contentX;
    contentContainer.y = contentY;

    // Mask for content area
    const mask = new Graphics();
    mask.rect(0, 0, contentWidth, contentHeight);
    mask.fill({ color: 0xffffff });
    contentContainer.addChild(mask);
    contentContainer.mask = mask;

    // Text content (left side)
    const textLeftMargin = 14; // 좌측 여백
    const textGap = 12; // 텍스트 간격

    // "제 n 장" text (#BAA48B, 16px)
    const stageNumber = parseInt(data.id.replace('stage', ''));
    const stageLabel = new Text({
      text: `제 ${stageNumber} 장`,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 16,
        fill: 0xbaa48b,
      },
    });
    stageLabel.resolution = 2;
    stageLabel.anchor.set(0, 0.5); // 좌측 기준, 세로 중앙
    contentContainer.addChild(stageLabel);

    // Boss name text (#773F16, 32px)
    const bossName = new Text({
      text: data.name,
      style: {
        fontFamily: 'NeoDunggeunmo',
        fontSize: 32,
        fill: 0x773f16,
      },
    });
    bossName.resolution = 2;
    bossName.anchor.set(0, 0.5); // 좌측 기준, 세로 중앙
    contentContainer.addChild(bossName);

    // 두 텍스트의 총 높이 계산 (간격 포함)
    const totalTextHeight = stageLabel.height + textGap + bossName.height;

    // 컨텐츠 박스 세로 중앙에 텍스트 그룹 배치
    const textGroupStartY = (contentHeight - totalTextHeight) / 2;

    // 각 텍스트 위치 설정
    stageLabel.x = textLeftMargin;
    stageLabel.y = textGroupStartY + stageLabel.height / 2;

    bossName.x = textLeftMargin;
    bossName.y = stageLabel.y + stageLabel.height / 2 + textGap + bossName.height / 2;

    // Boss image (right side) - all stages show boss image
    this.loadBossImage(data.bossImage, contentWidth, contentHeight, data.locked).then(
      (bossImage) => {
        if (bossImage) {
          contentContainer.addChild(bossImage);

          // 잠긴 스테이지: 보스 이미지 위에 80% dimmed + "Coming Soon!!!" 텍스트
          if (data.locked) {
            // 보스 이미지 영역(112px)만 dimmed 처리
            const bossImageWidth = 112;
            const bossAreaOverlay = new Graphics();
            // 보스 이미지 위치 기준으로 오버레이 생성
            bossAreaOverlay.rect(
              bossImage.x - bossImageWidth / 2,
              bossImage.y - bossImage.height / 2,
              bossImageWidth,
              bossImage.height
            );
            bossAreaOverlay.fill({ color: 0x000000, alpha: 0.8 });
            contentContainer.addChild(bossAreaOverlay);

            // "Coming Soon!!!" 텍스트 (#F7A74F, 12px) - 보스 이미지 시각적 중앙
            const comingSoonText = new Text({
              text: 'Coming Soon!!!',
              style: {
                fontFamily: 'NeoDunggeunmo',
                fontSize: 12,
                fill: 0xf7a74f,
              },
            });
            comingSoonText.resolution = 2;
            comingSoonText.anchor.set(0.5); // 중앙 정렬
            // 보스 이미지가 우측으로 12px overflow, 하단으로 height/8 offset되어 있으므로
            // 텍스트를 왼쪽(-6px)과 위쪽(-height/8)으로 조정하여 시각적 중앙에 배치
            comingSoonText.x = bossImage.x - 6;
            comingSoonText.y = bossImage.y - bossImage.height / 8;
            contentContainer.addChild(comingSoonText);
          }
        }
      }
    );

    card.addChild(contentContainer);

    // 선택되지 않은 카드용 어두운 오버레이 (updateCardStates에서 표시/숨김 처리)
    const darkOverlay = new Graphics();
    darkOverlay.rect(-width / 2, -height / 2, width, height);
    darkOverlay.fill({ color: 0x000000, alpha: 0.7 });
    darkOverlay.visible = false; // 기본값은 숨김, 선택되지 않은 카드에만 표시
    card.addChild(darkOverlay);

    // 오버레이 참조 저장
    card.darkOverlay = darkOverlay;

    // 카드 클릭 비활성화 (스와이프 영역에서만 처리)
    card.eventMode = 'passive';

    // 카드 데이터 저장
    card.stageData = data;

    return card;
  }

  private async loadBossImage(
    imagePath: string,
    contentWidth: number,
    contentHeight: number,
    isLocked: boolean = false
  ): Promise<Sprite | null> {
    try {
      const texture = await Assets.load(imagePath);

      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      const bossImage = new Sprite(texture);
      bossImage.anchor.set(0.5);

      // Set fixed width and calculate height to maintain aspect ratio
      const targetWidth = 112;
      const scale = targetWidth / texture.width;
      bossImage.width = targetWidth;
      bossImage.height = texture.height * scale;

      // Flip horizontally (mirror)
      bossImage.scale.x = -Math.abs(bossImage.scale.x);

      // Position at right edge with overflow (12px overflow on right)
      // Y position offset down by height/8 to crop bottom portion
      bossImage.x = contentWidth - targetWidth / 2 + 12;
      bossImage.y = contentHeight / 2 + bossImage.height / 8;

      // Apply grayscale effect for locked stages
      if (isLocked) {
        bossImage.alpha = 0.5;
        bossImage.tint = 0x000000; // Gray tint for grayscale effect
      }

      return bossImage;
    } catch (error) {
      console.error(`보스 이미지 로드 실패: ${imagePath}`, error);
      return null;
    }
  }

  private selectCard(targetIndex: number): void {
    if (targetIndex === this.currentIndex) return;

    // 효과음 재생
    audioManager.playButtonClickSound();

    this.currentIndex = targetIndex;

    // 카드 상태 업데이트
    this.updateCardStates();
  }

  private updateCardStates(): void {
    this.cards.forEach((card, index) => {
      const isSelected = index === this.currentIndex;
      const offset = index - this.currentIndex;

      // 선택된 카드: 중앙에 크게 배치
      // 위쪽 카드(이전 카드): 아래로 작게 배치
      // 아래쪽 카드(다음 카드): 위로 작게 배치
      let targetY = 0;
      if (isSelected) {
        targetY = 0; // 선택된 카드는 중앙
      } else if (offset < 0) {
        targetY = -this.CARD_OFFSET_Y; // 이전 카드는 위로
      } else {
        targetY = this.CARD_OFFSET_Y; // 다음 카드는 아래로
      }

      const targetScale = isSelected ? 1.0 : this.CARD_SCALE_UNSELECTED;
      const targetAlpha = isSelected ? 1.0 : this.CARD_ALPHA_UNSELECTED;

      // z-index 조정 (선택된 카드를 맨 앞으로)
      if (isSelected) {
        this.cardsContainer.setChildIndex(card, this.cards.length - 1);
      }

      gsap.to(card, {
        y: targetY,
        duration: this.ANIMATION_DURATION,
        ease: 'power2.out',
      });

      gsap.to(card.scale, {
        x: targetScale,
        y: targetScale,
        duration: this.ANIMATION_DURATION,
        ease: 'power2.out',
      });

      gsap.to(card, {
        alpha: targetAlpha,
        duration: this.ANIMATION_DURATION,
        ease: 'power2.out',
      });

      // 선택 상태에 따라 어두운 오버레이 표시/숨김 (선택되지 않은 카드는 70% 검은색 오버레이)
      if (card.darkOverlay) {
        card.darkOverlay.visible = !isSelected;
      }
    });

    // 확인 버튼 활성화 상태 업데이트 (버튼이 생성된 경우에만)
    if (this.confirmButton) {
      const currentCard = this.cards[this.currentIndex];
      this.confirmButton.setDisabled(currentCard.stageData.locked);
    }
  }

  private createButtons(): void {
    // 버튼 레이어 생성 (z-index를 위로 올리기 위해)
    this.buttonLayer = new Container();
    this.addChild(this.buttonLayer);

    // 확인 버튼 (화면 하단 중앙) - 고정 크기 184x56
    const buttonY = this.screenHeight - 80;
    this.confirmButton = PixelButton.create(
      '선택',
      this.screenWidth / 2,
      buttonY,
      () => {
        const selectedStage = this.cardData[this.currentIndex];
        if (!selectedStage.locked) {
          // TODO: 로비 BGM 페이드아웃
          // audioManager.stopBGM(true);
          audioManager.stopBGM(false);
          this.onStageSelect?.(selectedStage.id);
        }
      },
      false,
      184,
      56
    );
    this.buttonLayer.addChild(this.confirmButton);

    // 백 버튼 (좌측 상단) - 아이콘만 (OverworldGameScene 설정 버튼과 동일한 위치)
    // 인앱토스 SafeArea 적용
    const insets = safeGetSafeAreaInsets();
    const UI_PADDING = 16;
    const ICON_SIZE = 32;
    const backButtonContainer = new Container();
    backButtonContainer.x = UI_PADDING + ICON_SIZE / 2; // 16 + 16 = 32
    backButtonContainer.y = UI_PADDING + ICON_SIZE / 2 + insets.top; // SafeArea 적용
    backButtonContainer.eventMode = 'static';
    backButtonContainer.cursor = 'pointer';

    // 백 버튼 아이콘 비동기 로드 (32px 크기)
    Assets.load(`${CDN_BASE_URL}/assets/gui/back.png`).then((texture) => {
      // 픽셀 아트 렌더링 설정
      if (texture.source) {
        texture.source.scaleMode = 'nearest';
      }

      const backIcon = new Sprite(texture);
      backIcon.width = 32;
      backIcon.height = 32;
      backIcon.anchor.set(0.5);
      backButtonContainer.addChild(backIcon);
    });

    // 호버 효과
    backButtonContainer.on('pointerover', () => {
      backButtonContainer.scale.set(1.1);
    });

    backButtonContainer.on('pointerout', () => {
      backButtonContainer.scale.set(1.0);
    });

    // 클릭 이벤트
    backButtonContainer.on('pointerdown', () => {
      backButtonContainer.scale.set(0.95);
    });

    backButtonContainer.on('pointerup', () => {
      backButtonContainer.scale.set(1.1);
      audioManager.playButtonClickSound();
      this.onCancel?.();
    });

    this.buttonLayer.addChild(backButtonContainer);
    this.backButton = backButtonContainer;
  }

  private setupDragGesture(): void {
    // 화면 전체 크기의 투명한 스와이프 영역 생성
    this.swipeArea = new Graphics();
    this.swipeArea.rect(0, 0, this.screenWidth, this.screenHeight);
    this.swipeArea.fill({ color: 0x000000, alpha: 0 }); // 완전 투명
    this.swipeArea.eventMode = 'static';

    // 스와이프 영역을 버튼 레이어 바로 아래에 추가
    // buttonLayer는 마지막 자식이므로, 그 직전에 삽입
    const buttonLayerIndex = this.getChildIndex(this.buttonLayer);
    this.addChildAt(this.swipeArea, buttonLayerIndex);

    this.swipeArea.on('pointerdown', (event) => {
      this.dragStartY = event.global.y;
      this.isDragging = false;
    });

    this.swipeArea.on('pointermove', (event) => {
      const deltaY = event.global.y - this.dragStartY;

      // 세로 드래그 거리가 DRAG_START_THRESHOLD 이상이면 드래그로 간주
      if (Math.abs(deltaY) > this.DRAG_START_THRESHOLD) {
        this.isDragging = true;

        // 위로 드래그: 다음 카드 선택 (index 증가)
        // 아래로 드래그: 이전 카드 선택 (index 감소)
        if (deltaY < -this.SWIPE_THRESHOLD) {
          // 위로 드래그 (SWIPE_THRESHOLD 이상) -> 다음 카드
          if (this.currentIndex < this.cards.length - 1) {
            const newIndex = this.currentIndex + 1;
            // 잠긴 카드도 선택 가능하도록 수정 (확인 버튼만 비활성화됨)
            this.selectCard(newIndex);
            this.dragStartY = event.global.y; // 드래그 시작점 리셋
          }
        } else if (deltaY > this.SWIPE_THRESHOLD) {
          // 아래로 드래그 (SWIPE_THRESHOLD 이상) -> 이전 카드
          if (this.currentIndex > 0) {
            const newIndex = this.currentIndex - 1;
            // 잠긴 카드도 선택 가능하도록 수정 (확인 버튼만 비활성화됨)
            this.selectCard(newIndex);
            this.dragStartY = event.global.y; // 드래그 시작점 리셋
          }
        }
      }
    });

    this.swipeArea.on('pointerup', () => {
      this.isDragging = false;
    });

    this.swipeArea.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  public destroy(): void {
    // gsap 애니메이션 정리
    this.cards.forEach((card) => {
      gsap.killTweensOf(card);
      gsap.killTweensOf(card.scale);
    });

    this.confirmButton.destroy();
    this.backButton.destroy();
    super.destroy({ children: true });
  }
}
