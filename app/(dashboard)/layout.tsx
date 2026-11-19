// 관리 화면 공통 틀(SCR-D00) — 사이드바·헤더는 라우트 이동에도 다시 그리지 않는다.
import type { ReactNode } from 'react';

import { AdminLayout } from '@/src/layouts/admin/admin-layout';

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
