// ----------------------------------------------------------------------
// 페이지 이동 뒤 포커스를 h1(#page-title)로(designer §4 "이동 후 포커스 h1").
// 데이터가 늦게 오면 h1 이 나중에 그려지므로(D03 → D04, 캐시 없음) 나타날 때까지 DOM 을 지켜보다가 옮긴다
// (qa2 QA2-006 — 예전엔 rAF 한 번이라 포커스가 body 에 남았다). 그 사이 사용자가 다른 곳에 포커스를 두면 건드리지 않는다.
// 반환값은 정리 함수. 최대 대기 timeoutMs.
// ----------------------------------------------------------------------
export function focusPageTitleWhenReady(
  doc: Document,
  timeoutMs = 10_000
): () => void {
  // 이동을 일으킨 요소(사이드바 메뉴 등)는 남아 있어도 h1 로 옮긴다 — 그 뒤에 사용자가 새로 고른 곳만 존중
  const initial = doc.activeElement;
  const isUserFocusElsewhere = () => {
    const active = doc.activeElement;
    return (
      active !== null &&
      active !== doc.body &&
      active !== initial &&
      active.id !== 'page-title'
    );
  };

  const tryFocus = (): boolean => {
    if (isUserFocusElsewhere()) return true; // 사용자가 이미 옮겼으면 끝
    const title = doc.getElementById('page-title');
    if (!title) return false;
    title.focus();
    return true;
  };

  if (tryFocus()) return () => undefined;
  const observer = new MutationObserver(() => {
    if (tryFocus()) stop();
  });
  const timer = setTimeout(() => stop(), timeoutMs);
  function stop() {
    observer.disconnect();
    clearTimeout(timer);
  }
  observer.observe(doc.body, { childList: true, subtree: true });
  return stop;
}
