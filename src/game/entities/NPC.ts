/**
 * NPC - 경계 맵의 NPC 엔티티
 */
import { CDN_BASE_URL } from '@config/assets.config';
import { GAME_CONFIG } from '@config/game.config';
import { Container, Sprite, Text } from 'pixi.js';

export interface NPCData {
  id: string;
  name: string;
  dialogId: string; // 대화 시나리오 ID
  portraitPath?: string; // 일러스트 경로 (옵셔널)
}

export class NPC extends Container {
  private sprite: Sprite;
  private nameText: Text;
  private isPlayerNearby: boolean = false;

  public data: NPCData;
  public onInteract?: (npc: NPC) => void;

  constructor(x: number, y: number, data: NPCData) {
    super();

    this.x = x;
    this.y = y;
    this.data = data;

    this.sprite = this.createNPCSprite();
    this.nameText = this.createNameText();

    this.addChild(this.sprite);
    this.addChild(this.nameText);
  }

  /**
   * NPC 스프라이트 생성
   */
  private createNPCSprite(): Sprite {
    // NPC별 portraitPath 사용, 없으면 기본값
    const spritePath = this.data.portraitPath || `${CDN_BASE_URL}/assets/npc/monk.png`;
    const sprite = Sprite.from(spritePath);

    // 원본 크기 사용 (스케일 없음)
    sprite.anchor.set(0.5, 1); // 하단 중앙 기준
    sprite.y = 0;

    return sprite;
  }

  /**
   * NPC 이름 텍스트
   */
  private createNameText(): Text {
    const text = new Text(this.data.name, {
      fontFamily: 'NeoDunggeunmo',
      fontSize: 16,
      fill: 0xd4af37,
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 2,
        color: 0x000000,
        distance: 2,
      },
    });
    text.resolution = 2; // 고해상도 렌더링
    text.anchor.set(0.5, 0);
    text.y = 5; // 캐릭터 바로 위에 표시
    return text;
  }

  /**
   * 플레이어 근접 체크
   */
  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const wasNearby = this.isPlayerNearby;
    this.isPlayerNearby = distance <= GAME_CONFIG.interaction.npcProximityRadius;

    // 플레이어가 처음 근처로 왔을 때만 트리거
    if (this.isPlayerNearby && !wasNearby) {
      this.onInteract?.(this);
      return true;
    }

    return false;
  }

  /**
   * NPC 제거
   */
  public destroy(): void {
    this.sprite.destroy();
    this.nameText.destroy();
    super.destroy({ children: true });
  }
}
