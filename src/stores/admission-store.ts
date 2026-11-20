// ----------------------------------------------------------------------
// 입장 체크 기기 설정(zustand persist) — 고른 회차(새로고침 유지, design SCR-D13 ①)와 숫자 키패드 모드(designer §13.7.4 1.5 "기기에 기억").
// 저장소(localStorage) 접근이 막혀도(사생활 보호 모드·저장 공간 초과·SSR) 메모리로 동작한다.
// 서버 렌더와 첫 화면이 어긋나지 않게 skipHydration — 화면이 붙은 뒤 rehydrate 한다.
// ----------------------------------------------------------------------
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

export const ADMISSION_STORE_KEY = 'sam-admin-admission';

interface AdmissionState {
  selectedShowId: string | null;
  isNumericKeypad: boolean;
}

interface AdmissionActions {
  selectShow: (showId: string) => void;
  toggleKeypad: () => void;
}

/** 저장소 실패를 삼키는 래퍼 — 읽기 실패는 null, 쓰기·지우기 실패는 무시 */
export const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // 저장하지 못해도 이번 화면에서는 메모리 값으로 동작한다
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // 위와 같음
    }
  },
};

export const useAdmissionStore = create<AdmissionState & AdmissionActions>()(
  persist(
    (set) => ({
      selectedShowId: null,
      isNumericKeypad: false,
      selectShow: (showId) => set({ selectedShowId: showId }),
      toggleKeypad: () =>
        set((state) => ({ isNumericKeypad: !state.isNumericKeypad })),
    }),
    {
      name: ADMISSION_STORE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      skipHydration: true,
    }
  )
);
