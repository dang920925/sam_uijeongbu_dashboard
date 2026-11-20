// ----------------------------------------------------------------------
// SCR-D14 회차별 캐스팅 격자 표시 모델(design §6 SCR-D14) — 행 = 배역, 열 = 회차.
// 칸 = 그 회차 캐스트 이름들. 회차 지정이 아니면 흐린 "기본", 지정이면 강조 + 해제. 배우가 없으면 "미정".
// ----------------------------------------------------------------------
import { MSG_D14 } from '@/src/shared/messages/d14';
import {
  castReason,
  type CastPublicContext,
} from '@/src/sections/performance-cast/utils/cast-reasons';
import { formatShowLabel } from '@/src/sections/performance-cast/utils/format-show-label';
import type { RoleCast, ShowCastGrid } from '@/src/types/cast';

export interface CastGridCell {
  key: string;
  showId: string;
  roleId: string;
  showLabel: string;
  roleLabel: string;
  names: string;
  isOverride: boolean;
  isEmpty: boolean;
  reason: string | null;
  actors: RoleCast[];
}

export interface CastGridRow {
  roleId: string;
  roleLabel: string;
  cells: CastGridCell[];
}

export interface CastGridModel {
  shows: { id: string; label: string }[];
  rows: CastGridRow[];
}

export function toCastGrid(
  grid: ShowCastGrid,
  ctx: CastPublicContext
): CastGridModel {
  const shows = grid.shows.map((show) => ({
    id: show.id,
    label: formatShowLabel(show.showDate, show.startTime),
  }));
  const rows = grid.roles.map((role) => {
    const roleLabel = role.name ?? MSG_D14.ENSEMBLE;
    return {
      roleId: role.id,
      roleLabel,
      cells: shows.flatMap((show) => {
        const cell = grid.cells.find(
          (c) => c.showId === show.id && c.roleId === role.id
        );
        if (!cell) return [];
        return [
          {
            key: `${show.id}-${role.id}`,
            showId: show.id,
            roleId: role.id,
            showLabel: show.label,
            roleLabel,
            names:
              cell.actors.length === 0
                ? MSG_D14.GRID_UNDECIDED
                : cell.actors.map((a) => a.name).join(', '),
            isOverride: cell.isOverride,
            isEmpty: cell.actors.length === 0,
            reason: castReason(cell.publicNow, role.name, cell.actors, ctx),
            actors: cell.actors,
          },
        ];
      }),
    };
  });
  return { shows, rows };
}
