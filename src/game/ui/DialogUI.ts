/**
 * DialogUI - 리니지2M/루시 벨콜 스타일 대화 UI
 * 초상화 박스(좌측 하단) + 대화창(하단 전체)
 */
import { CDN_BASE_URL } from '@config/assets.config';
import type { NPCData } from '@game/entities/NPC';
import type { DialogNode } from '@type/dialog.types';
import { platform } from '@utils/platform';
import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';

export class DialogUI extends Container {
  private screenWidth: number;
  private screenHeight: number;

  // 오버레이
  private overlay: Graphics;

  // 초상화 박스
  private portraitContainer: Container; // 초상화 컨테이너 (마스킹용)
  private portraitSprite?: Sprite;
  private currentNPC?: NPCData;

  // 대화창
  private dialogBox: Graphics;
  private speakerNameText: Text;
  private dividerLine: Graphics;
  private dialogContentText: Text;
  private continueHintText: Text;

  public onClick?: () => void;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // 오버레이 생성 (맨 먼저)
    this.overlay = this.createOverlay();

    // 초상화 컨테이너 및 박스 생성
    this.portraitContainer = new Container();

    // 대화창 생성
    this.dialogBox = this.createDialogBox();
    this.speakerNameText = this.createSpeakerName();
    this.dividerLine = this.createDivider();
    this.dialogContentText = this.createDialogContent();
    this.continueHintText = this.createContinueHint();

    // 레이어 추가 (순서 중요: 오버레이 → 초상화 → 대화창)
    this.addChild(this.overlay);
    this.addChild(this.portraitContainer); // 초상화를 먼저
    this.addChild(this.dialogBox);
    this.addChild(this.speakerNameText);
    this.addChild(this.dividerLine);
    this.addChild(this.dialogContentText);
    this.addChild(this.continueHintText);

    this.setupInteraction();
    this.visible = false;
  }

  /**
   * 오버레이 (화면 전체 어둡게)
   */
  private createOverlay(): Graphics {
    const g = new Graphics();
    g.rect(0, 0, this.screenWidth, this.screenHeight);
    g.fill({ color: 0x000000, alpha: 0.5 }); // 반투명 검정
    return g;
  }

  /**
   * 초상화 스프라이트 생성 (monk 캐릭터)
   */
  private createPortraitSprite(): void {
    const padding = 20;
    const boxWidth = 200;
    const boxHeight = 280;
    const dialogBoxHeight = 160; // 대화창 높이와 일치
    const x = padding;
    const y = this.screenHeight - dialogBoxHeight - boxHeight - padding - 10;

    // 초상화 스프라이트 (NPC별 portraitPath 사용, 없으면 기본값)
    const spritePath = this.currentNPC?.portraitPath || `${CDN_BASE_URL}/assets/npc/monk.png`;
    this.portraitSprite = Sprite.from(spritePath);

    // 크기 확대 (2.5배)
    this.portraitSprite.scale.set(2.5);

    // 하단 중앙 정렬 (하반신이 잘리도록)
    this.portraitSprite.anchor.set(0.5, 1);
    this.portraitSprite.x = x + boxWidth / 2;
    this.portraitSprite.y = y + boxHeight + 20; // 박스 하단보다 20px 아래 (상단 여백 줄임)

    // 마스크 생성 (박스 영역만 표시)
    const mask = new Graphics();
    mask.rect(x + 15, y + 15, boxWidth - 30, boxHeight - 30);
    mask.fill(0xffffff);

    this.portraitContainer.addChild(this.portraitSprite);
    this.portraitContainer.addChild(mask);
    this.portraitSprite.mask = mask;
  }

  /**
   * 대화창 (하단 전체 너비)
   */
  private createDialogBox(): Graphics {
    const g = new Graphics();

    const padding = 20;
    const boxHeight = 200;
    const x = padding;
    const y = this.screenHeight - boxHeight - padding;
    const boxWidth = this.screenWidth - padding * 2;

    // 메인 배경
    g.beginFill(0x1a1a2e, 0.95);
    g.lineStyle(3, 0xd4af37, 0.9);
    g.roundRect(x, y, boxWidth, boxHeight, 8);
    g.endFill();

    // 내부 장식선
    g.lineStyle(1, 0xd4af37, 0.3);
    g.roundRect(x + 8, y + 8, boxWidth - 16, boxHeight - 16, 6);

    return g;
  }

  /**
   * 화자 이름
   */
  private createSpeakerName(): Text {
    const text = new Text('', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xd4af37,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 3,
        color: 0x000000,
        distance: 2,
      },
    });

    text.resolution = 2; // 고해상도 렌더링
    text.x = 40;
    text.y = this.screenHeight - 210;

    return text;
  }

  /**
   * 이름과 대사 사이 구분선
   */
  private createDivider(): Graphics {
    const g = new Graphics();
    const padding = 20;
    const x1 = padding + 15;
    const x2 = this.screenWidth - padding - 15;
    const y = this.screenHeight - 180;

    g.lineStyle(1, 0xd4af37, 0.5);
    g.moveTo(x1, y);
    g.lineTo(x2, y);
    g.stroke();

    return g;
  }

  /**
   * 대사 내용
   */
  private createDialogContent(): Text {
    const padding = 20;
    const maxWidth = this.screenWidth - padding * 2 - 40;

    const text = new Text('', {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xffffff,
      lineHeight: 24,
      wordWrap: true,
      wordWrapWidth: maxWidth,
    });

    text.resolution = 2; // 고해상도 렌더링
    text.x = 40;
    text.y = this.screenHeight - 160;

    return text;
  }

  /**
   * 계속 진행 힌트
   */
  private createContinueHint(): Text {
    // 모바일 환경 감지
    const hintText = platform.isMobile() ? '▼ 터치하여 계속 ▼' : '▼ 클릭하여 계속 ▼';

    const text = new Text(hintText, {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xaaaaaa,
      fontStyle: 'italic',
    });

    text.resolution = 2; // 고해상도 렌더링
    text.anchor.set(1, 1);
    text.x = this.screenWidth - 40;
    text.y = this.screenHeight - 30;

    return text;
  }

  /**
   * 클릭 인터랙션 설정
   */
  private setupInteraction(): void {
    this.eventMode = 'static';
    this.hitArea = new Rectangle(0, 0, this.screenWidth, this.screenHeight);

    this.on('pointerdown', () => {
      this.onClick?.();
    });
  }

  /**
   * NPC 설정 (초상화 표시용)
   */
  public setNPC(npcData: NPCData): void {
    this.currentNPC = npcData;

    // 초상화 스프라이트 재생성
    if (this.portraitSprite) {
      this.portraitContainer.removeChild(this.portraitSprite);
      this.portraitSprite.destroy();
    }

    this.createPortraitSprite();
  }

  /**
   * 대화 노드 표시
   */
  public showDialog(node: DialogNode): void {
    this.speakerNameText.text = node.speaker;
    this.dialogContentText.text = node.text;
    this.visible = true;
  }

  /**
   * 대화 창 숨기기
   */
  public hide(): void {
    this.visible = false;
  }

  /**
   * 화면 크기 업데이트
   */
  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    // 초상화 스프라이트 재생성
    this.portraitContainer.removeChildren();
    if (this.currentNPC) {
      this.createPortraitSprite();
    }

    // 대화 창 재생성
    this.removeChild(this.dialogBox);
    this.dialogBox.destroy();
    this.dialogBox = this.createDialogBox();
    this.addChildAt(this.dialogBox, 0);

    // 구분선 재생성
    this.removeChild(this.dividerLine);
    this.dividerLine.destroy();
    this.dividerLine = this.createDivider();
    this.addChildAt(this.dividerLine, 2);

    // 텍스트 위치 업데이트
    this.speakerNameText.x = 40;
    this.speakerNameText.y = height - 210;

    this.dialogContentText.x = 40;
    this.dialogContentText.y = height - 160;
    this.dialogContentText.style.wordWrapWidth = width - 80;

    this.continueHintText.x = width - 40;
    this.continueHintText.y = height - 30;

    // hitArea 업데이트
    this.hitArea = new Rectangle(0, 0, width, height);
  }

  /**
   * 제거
   */
  public destroy(): void {
    this.removeAllListeners();
    super.destroy({ children: true });
  }
}
