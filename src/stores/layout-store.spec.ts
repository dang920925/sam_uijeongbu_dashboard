import { beforeEach, describe, expect, it } from 'vitest';

import { useLayoutStore } from '@/src/stores/layout-store';

describe('layout-store', () => {
  beforeEach(() => useLayoutStore.setState({ isNavDrawerOpen: false }));

  it('드로어를 열고 닫는다', () => {
    // Act
    useLayoutStore.getState().openNavDrawer();
    const opened = useLayoutStore.getState().isNavDrawerOpen;
    useLayoutStore.getState().closeNavDrawer();
    // Assert
    expect(opened).toBe(true);
    expect(useLayoutStore.getState().isNavDrawerOpen).toBe(false);
  });
});
