/**
 * 대화 시나리오 데이터
 */

import type { DialogScenario } from '@/types/dialog.types';

/**
 * 경계 맵 - 저승의 상인 대화
 */
export const BOUNDARY_MERCHANT_DIALOG: DialogScenario = {
  id: 'boundary_merchant',
  startNodeId: 'node_1',
  nodes: [
    {
      id: 'node_1',
      speaker: '저승의 상인',
      text: '잘 왔다, 나그네여. 여기는 상계와 하계의 경계이니라.',
      nextId: 'node_2',
    },
    {
      id: 'node_2',
      speaker: '저승의 상인',
      text: '하계로 가는 길은 험난하니, 준비를 단단히 하거라.',
      nextId: 'node_3',
    },
    {
      id: 'node_3',
      speaker: '저승의 상인',
      text: '필요한 물건이 있으면 거래하고, 준비가 되면 저 문을 통과하거라.',
      // nextId 없음 = 대화 종료
    },
  ],
};
