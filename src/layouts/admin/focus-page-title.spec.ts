import { afterEach, describe, expect, it } from 'vitest';

import { focusPageTitleWhenReady } from '@/src/layouts/admin/focus-page-title';

function addTitle() {
  const h1 = document.createElement('h1');
  h1.id = 'page-title';
  h1.tabIndex = -1;
  document.body.appendChild(h1);
  return h1;
}

describe('focusPageTitleWhenReady', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('h1 이 이미 있으면 바로 포커스한다', () => {
    const h1 = addTitle();
    focusPageTitleWhenReady(document);
    expect(document.activeElement).toBe(h1);
  });

  it('h1 이 데이터 로드 뒤에 그려지면 그때 포커스한다(QA2-006)', async () => {
    focusPageTitleWhenReady(document);
    const h1 = addTitle();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(h1);
  });

  it('기다리는 사이 사용자가 다른 곳에 포커스하면 빼앗지 않는다', async () => {
    focusPageTitleWhenReady(document);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    addTitle();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(input);
  });

  it('이동을 일으킨 메뉴에 포커스가 남아 있어도 h1 으로 옮긴다', async () => {
    const link = document.createElement('a');
    link.href = '#';
    document.body.appendChild(link);
    link.focus();
    focusPageTitleWhenReady(document);
    const h1 = addTitle();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(h1);
  });
});
