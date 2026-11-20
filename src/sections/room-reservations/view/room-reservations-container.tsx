'use client';

// U34 관리자 연습실 예약 목록 Container — ViewModel 을 View 에 넘긴다(상태 분기는 View 의 본문 자리).
import { RoomReservationsView } from '@/src/sections/room-reservations/view/room-reservations-view';
import { useRoomReservationsViewModel } from '@/src/sections/room-reservations/view/use-room-reservations-view-model';

export function RoomReservationsContainer() {
  const vm = useRoomReservationsViewModel();
  return <RoomReservationsView vm={vm} />;
}
