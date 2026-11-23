// ----------------------------------------------------------------------
// 앱 딥링크로 이동(U43) — 관리자 앱 WebView 가 shouldOverrideUrlLoading 에서 가로챈다(samadmin://pair).
// 브라우저 API 를 한 곳에 모아 뷰모델이 window 를 직접 만지지 않게 한다.
// ----------------------------------------------------------------------
export function openAppLink(url: string): void {
  window.location.href = url;
}
