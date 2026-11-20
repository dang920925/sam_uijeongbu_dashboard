// ----------------------------------------------------------------------
// 요약(SCR-D02) View — 현황판(§11.6 ②): KPI 4(xs1→md2→lg4, gap 16) → 목록 카드 2(xs1→lg2, gap 24).
// props 만으로 그린다(가공은 ViewModel·utils).
// ----------------------------------------------------------------------
import { DashboardKpiCard } from '@/src/sections/dashboard/components/dashboard-kpi-card';
import { DashboardListCard } from '@/src/sections/dashboard/components/dashboard-list-card';
import type {
  DashboardKpi,
  DashboardListRow,
} from '@/src/sections/dashboard/utils/build-dashboard-view';
import { MSG_D02 } from '@/src/shared/messages/d02';

interface DashboardViewProps {
  kpis: DashboardKpi[];
  recentRows: DashboardListRow[];
  pendingRows: DashboardListRow[];
}

export function DashboardView({
  kpis,
  recentRows,
  pendingRows,
}: DashboardViewProps) {
  return (
    <>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {kpis.map((kpi) => (
          <DashboardKpiCard
            key={kpi.key}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            icon={kpi.icon}
            tone={kpi.tone}
          />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <DashboardListCard
          title={MSG_D02.RECENT_PERFORMANCES}
          rows={recentRows}
          emptyMessage={MSG_D02.RECENT_EMPTY}
        />
        <DashboardListCard
          title={MSG_D02.PENDING_APPLICATIONS}
          rows={pendingRows}
          emptyMessage={MSG_D02.PENDING_EMPTY}
        />
      </div>
    </>
  );
}
