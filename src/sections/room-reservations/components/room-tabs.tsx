'use client';

// ----------------------------------------------------------------------
// (U46) 연습실 예약 메뉴 탭 — 예약 목록 · 시간 막기. 탭마다 주소가 따로 있다(새로고침·공유).
// ----------------------------------------------------------------------
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Link from 'next/link';

import { paths } from '@/app/paths';
import { MSG_ROOMS } from '@/src/shared/messages/room-reservations';

interface RoomTabsProps {
  current: 'list' | 'blocks';
}

const TABS = [
  { key: 'list', label: MSG_ROOMS.TAB_LIST, href: paths.roomReservations },
  { key: 'blocks', label: MSG_ROOMS.TAB_BLOCKS, href: paths.roomBlocks },
] as const;

export function RoomTabs({ current }: RoomTabsProps) {
  return (
    <Tabs value={current} aria-label={MSG_ROOMS.TABS_ARIA}>
      {TABS.map((tab) => (
        <Tab
          key={tab.key}
          value={tab.key}
          label={tab.label}
          component={Link}
          href={tab.href}
          aria-current={tab.key === current ? 'page' : undefined}
        />
      ))}
    </Tabs>
  );
}
