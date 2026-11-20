// ----------------------------------------------------------------------
// 레이아웃 UI 상태(zustand) — xs 내비 드로어 열림. 헤더 햄버거와 드로어가 공유한다.
// ----------------------------------------------------------------------
import { create } from 'zustand';

interface LayoutState {
  isNavDrawerOpen: boolean;
}

interface LayoutActions {
  openNavDrawer: () => void;
  closeNavDrawer: () => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  isNavDrawerOpen: false,
  openNavDrawer: () => set({ isNavDrawerOpen: true }),
  closeNavDrawer: () => set({ isNavDrawerOpen: false }),
}));
