/**
 * DialogSystem - 대화 시스템
 */

import type { DialogNode, DialogScenario } from '@type/dialog.types';

export class DialogSystem {
  private currentScenario: DialogScenario | null = null;
  private currentNode: DialogNode | null = null;
  private onDialogChange?: (node: DialogNode | null) => void;
  private onDialogEnd?: () => void;

  /**
   * 대화 시작
   */
  public startDialog(
    scenario: DialogScenario,
    onDialogChange: (node: DialogNode | null) => void,
    onDialogEnd: () => void
  ): void {
    this.currentScenario = scenario;
    this.onDialogChange = onDialogChange;
    this.onDialogEnd = onDialogEnd;

    // 첫 번째 노드 찾기
    const startNode = scenario.nodes.find((n) => n.id === scenario.startNodeId);
    if (startNode) {
      this.currentNode = startNode;
      this.onDialogChange?.(this.currentNode);
    }
  }

  /**
   * 다음 대사로 진행
   */
  public nextDialog(): void {
    if (!this.currentNode || !this.currentScenario) return;

    // 다음 노드가 있으면 진행
    if (this.currentNode.nextId) {
      const nextNode = this.currentScenario.nodes.find((n) => n.id === this.currentNode!.nextId);
      if (nextNode) {
        this.currentNode = nextNode;
        this.onDialogChange?.(this.currentNode);
        return;
      }
    }

    // 다음 노드가 없으면 대화 종료
    this.endDialog();
  }

  /**
   * 대화 종료
   */
  public endDialog(): void {
    this.currentNode = null;
    this.currentScenario = null;
    this.onDialogChange?.(null);
    this.onDialogEnd?.();
  }

  /**
   * 현재 대화 노드 가져오기
   */
  public getCurrentNode(): DialogNode | null {
    return this.currentNode;
  }

  /**
   * 대화 진행 중인지 확인
   */
  public isActive(): boolean {
    return this.currentNode !== null;
  }
}
