// ----------------------------------------------------------------------
// PageContainer — 페이지 폭 캡과 좌우 여백을 소유한다(가이드 §11.4). 화면은 페이지 패딩을 직접 쓰지 않는다.
// 대시보드 본문 여백은 AdminLayout 의 main(xs 16 / md↑ 24)이 이미 갖고 있어 여기서는 폭 캡만 둔다.
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className='mx-auto w-full max-w-7xl'>{children}</div>;
}
