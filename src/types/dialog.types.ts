/**
 * 대화 시스템 타입 정의
 */

/**
 * 대화 노드 (한 줄의 대사)
 */
export interface DialogNode {
  id: string;
  speaker: string; // NPC 이름
  text: string; // 대사 내용
  nextId?: string; // 다음 대화 노드 ID (없으면 종료)
}

/**
 * 대화 시나리오
 */
export interface DialogScenario {
  id: string;
  nodes: DialogNode[];
  startNodeId: string; // 시작 노드 ID
}
