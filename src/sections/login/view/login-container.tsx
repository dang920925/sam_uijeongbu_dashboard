'use client';

// ----------------------------------------------------------------------
// 로그인(SCR-D01) 컨테이너 — 사이드바 없는 단독 화면(app/login 은 (dashboard) 그룹 밖).
// 조회 데이터가 없어 로딩·빈 분기는 없고, 상태(검증·실패·진행)는 ViewModel 값으로 View 가 그린다.
// ----------------------------------------------------------------------
import { LoginView } from '@/src/sections/login/view/login-view';
import { useLoginViewModel } from '@/src/sections/login/view/use-login-view-model';

export function LoginContainer() {
  const vm = useLoginViewModel();
  return <LoginView {...vm} />;
}
