import { beforeEach, describe, expect, it } from 'vitest';

import {
  ADMISSION_STORE_KEY,
  safeLocalStorage,
  useAdmissionStore,
} from '@/src/stores/admission-store';

/** jsdom·Node 의 localStorage 차이를 피해 메모리 저장소를 끼운다 */
function installStorage(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
) {
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
  });
}

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

describe('admission-store', () => {
  beforeEach(() => {
    installStorage(memoryStorage());
    useAdmissionStore.setState({
      selectedShowId: null,
      isNumericKeypad: false,
    });
  });

  it('고른 회차를 저장소에 기억한다', () => {
    // Act
    useAdmissionStore.getState().selectShow('show-1');
    // Assert
    expect(useAdmissionStore.getState().selectedShowId).toBe('show-1');
    expect(window.localStorage.getItem(ADMISSION_STORE_KEY)).toContain(
      'show-1'
    );
  });

  it('저장된 회차를 다시 불러온다', async () => {
    // Arrange
    window.localStorage.setItem(
      ADMISSION_STORE_KEY,
      JSON.stringify({
        state: { selectedShowId: 'show-9', isNumericKeypad: true },
        version: 0,
      })
    );
    // Act
    await useAdmissionStore.persist.rehydrate();
    // Assert
    expect(useAdmissionStore.getState().selectedShowId).toBe('show-9');
    expect(useAdmissionStore.getState().isNumericKeypad).toBe(true);
  });

  it('숫자 키패드 모드를 켜고 끈다', () => {
    // Act
    useAdmissionStore.getState().toggleKeypad();
    const on = useAdmissionStore.getState().isNumericKeypad;
    useAdmissionStore.getState().toggleKeypad();
    // Assert
    expect(on).toBe(true);
    expect(useAdmissionStore.getState().isNumericKeypad).toBe(false);
  });

  it('저장소 접근이 막혀도 메모리로 동작한다', async () => {
    // Arrange
    const blocked = () => {
      throw new DOMException('막힘', 'SecurityError');
    };
    installStorage({ getItem: blocked, setItem: blocked, removeItem: blocked });
    // Act
    useAdmissionStore.getState().selectShow('show-2');
    await useAdmissionStore.persist.rehydrate();
    // Assert
    expect(useAdmissionStore.getState().selectedShowId).toBe('show-2');
    expect(safeLocalStorage.getItem('x')).toBeNull();
  });
});
