'use client';

// (U46) 연습실 '시간 막기' 탭 Container — ViewModel 을 View 에 넘긴다(상태 분기는 View 의 본문 자리).
import { RoomBlocksView } from '@/src/sections/room-blocks/view/room-blocks-view';
import { useRoomBlocksViewModel } from '@/src/sections/room-blocks/view/use-room-blocks-view-model';

export function RoomBlocksContainer() {
  const vm = useRoomBlocksViewModel();
  return <RoomBlocksView vm={vm} />;
}
