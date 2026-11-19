import { describe, expect, it } from 'vitest';

import { moveItem } from '@/src/components/image-upload-field/move-item';

describe('moveItem', () => {
  it('항목을 한 칸 위·아래로 옮긴다', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('끝에서 바깥으로는 옮기지 않고 같은 배열을 돌려준다', () => {
    const list = ['a', 'b'];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
  });
});
