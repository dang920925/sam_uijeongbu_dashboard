// ----------------------------------------------------------------------
// KPI 4(design SCR-D12 · D02 KpiCard 재사용) — lg 4열 / xs·md 2×2. 집계를 받기 전엔 스켈레톤.
// ----------------------------------------------------------------------
import Skeleton from '@mui/material/Skeleton';

import { DashboardKpiCard } from '@/src/sections/dashboard/components/dashboard-kpi-card';
import type { ReservationKpi } from '@/src/sections/reservations/utils/summary-view';

interface ReservationKpiRowProps {
  kpis: ReservationKpi[] | null;
}

const SKELETON_KEYS = ['a', 'b', 'c', 'd'];

export function ReservationKpiRow({ kpis }: ReservationKpiRowProps) {
  return (
    <div className='grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4'>
      {kpis
        ? kpis.map((kpi) => (
            <DashboardKpiCard
              key={kpi.key}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
              tone={kpi.tone}
            />
          ))
        : SKELETON_KEYS.map((key) => (
            <Skeleton key={key} variant='rounded' height={112} />
          ))}
    </div>
  );
}
