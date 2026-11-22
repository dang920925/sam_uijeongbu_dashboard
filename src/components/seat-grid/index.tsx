'use client';

// ----------------------------------------------------------------------
// SeatGrid — 좌석 격자 공용(U35): 위 "STAGE" 띠 → 행(행 이름 좌우 + 칸). 첫 행이 무대 쪽.
// 쓰는 곳: 좌석 배치 편집기·미리보기(D11) · 좌석 현황 지도·좌석 변경·수동 등록 좌석 고르기(D12).
// 칸 모양(tone): available 빈 좌석 · selected 고른 좌석(주황) · sold 예매 완료(어두운 채움 + ✕) ·
// mine 이 예매가 가진 좌석(파랑) · locked 편집기에서 예매된 좌석(바꿀 수 없음) · aisle 통로 · void 사용 안 함.
// 색만으로 구분하지 않는다(✕·aria-label·aria-pressed). 색은 theme semantic.seat 토큰만. 넘치면 가로 스크롤.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import type { SxProps, Theme } from '@mui/material/styles';

import { Typo } from '@/src/components/typo';
import { RADIUS } from '@/src/theme/layout-tokens';

export type SeatGridTone =
  'available' | 'selected' | 'sold' | 'mine' | 'locked' | 'aisle' | 'void';

export interface SeatGridCellView {
  key: string;
  tone: SeatGridTone;
  /** 칸 안 글자(좌석 번호·"통로" 표시 등) */
  text: string;
  ariaLabel: string;
  /** 누를 수 있는 칸(버튼) — 아니면 빈 상자 */
  interactive: boolean;
  /** 버튼이지만 지금은 누를 수 없음(aria-disabled) */
  disabled?: boolean;
  pressed?: boolean;
}

export interface SeatGridRowView {
  key: string;
  label: string;
  cells: SeatGridCellView[];
}

interface SeatGridProps {
  rows: readonly SeatGridRowView[];
  stageLabel: string;
  ariaLabel: string;
  /** 칸 크기(px) — 기본 32 */
  cellSize?: number;
  /** 빈 통로·사용 안 함 칸도 테두리로 보이기(편집기) */
  showEmptyCells?: boolean;
  testId?: string;
  onCellClick?: (key: string) => void;
}

const LABEL_WIDTH = 24;

/** sx 배열의 한 칸(객체) — @mui/system 을 직접 의존하지 않으려고 SxProps 에서 꺼낸다 */
type SxItem = Extract<SxProps<Theme>, ReadonlyArray<unknown>>[number];

function toneSx(tone: SeatGridTone, show: boolean): SxItem {
  switch (tone) {
    case 'selected':
      return {
        bgcolor: 'semantic.seat.selectedBg',
        borderColor: 'semantic.seat.selectedBg',
        color: 'semantic.seat.selectedFg',
      };
    case 'mine':
      return {
        bgcolor: 'semantic.seat.mineBg',
        borderColor: 'semantic.seat.mineBg',
        color: 'semantic.seat.mineFg',
      };
    case 'sold':
    case 'locked':
      return {
        bgcolor: 'semantic.seat.soldBg',
        borderColor: 'semantic.seat.soldBg',
        color: 'semantic.seat.soldFg',
      };
    case 'aisle':
      return show
        ? {
            borderStyle: 'dashed',
            borderColor: 'semantic.seat.aisleBorder',
            color: 'text.secondary',
          }
        : { borderColor: 'transparent' };
    case 'void':
      return show
        ? {
            bgcolor: 'semantic.seat.voidBg',
            borderColor: 'semantic.seat.voidBg',
            color: 'text.secondary',
          }
        : { borderColor: 'transparent' };
    default:
      return {
        bgcolor: 'semantic.seat.availableBg',
        borderColor: 'semantic.seat.availableBorder',
        color: 'semantic.seat.availableFg',
      };
  }
}

export function SeatGrid({
  rows,
  stageLabel,
  ariaLabel,
  cellSize = 32,
  showEmptyCells = false,
  testId,
  onCellClick,
}: SeatGridProps) {
  const label = (text: string, align: 'right' | 'left') => (
    <Typo.Caption.Semibold
      aria-hidden
      color='text.secondary'
      sx={{ width: LABEL_WIDTH, flexShrink: 0, textAlign: align }}
    >
      {text}
    </Typo.Caption.Semibold>
  );
  return (
    <Box
      role='region'
      aria-label={ariaLabel}
      data-testid={testId}
      tabIndex={0}
      sx={{
        overflowX: 'auto',
        p: 4,
        borderRadius: `${RADIUS.md}px`,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: 'max-content', minWidth: '100%' }}>
        <Box
          aria-hidden
          sx={{
            mx: 'auto',
            mb: 4,
            width: '70%',
            maxWidth: 320,
            py: 2,
            borderRadius: `${RADIUS.sm}px`,
            bgcolor: 'semantic.seat.stageBg',
            color: 'semantic.seat.stageFg',
            textAlign: 'center',
          }}
        >
          <Typo.Badge.Bold sx={{ letterSpacing: '0.2em' }}>
            {stageLabel}
          </Typo.Badge.Bold>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: 'max-content',
            mx: 'auto',
          }}
        >
          {rows.map((row) => (
            <Box
              key={row.key}
              role='group'
              aria-label={row.label ? `${row.label}열` : undefined}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {label(row.label, 'right')}
              {row.cells.map((cell) => {
                const sx: SxItem[] = [
                  {
                    width: cellSize,
                    height: cellSize,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: `${RADIUS.sm}px`,
                    border: 1,
                    borderColor: 'transparent',
                  },
                  toneSx(cell.tone, showEmptyCells),
                ];
                const content =
                  cell.tone === 'sold' || cell.tone === 'locked' ? (
                    <Typo.Caption.Bold aria-hidden>✕</Typo.Caption.Bold>
                  ) : (
                    <Typo.Caption.Semibold aria-hidden>
                      {cell.text}
                    </Typo.Caption.Semibold>
                  );
                if (!cell.interactive) {
                  return (
                    <Box
                      key={cell.key}
                      role={cell.ariaLabel ? 'img' : undefined}
                      aria-label={cell.ariaLabel || undefined}
                      aria-hidden={cell.ariaLabel ? undefined : true}
                      data-tone={cell.tone}
                      sx={sx}
                    >
                      {content}
                    </Box>
                  );
                }
                return (
                  <ButtonBase
                    key={cell.key}
                    type='button'
                    data-tone={cell.tone}
                    data-testid='seat-cell'
                    aria-label={cell.ariaLabel}
                    aria-pressed={cell.pressed}
                    aria-disabled={cell.disabled || undefined}
                    onClick={
                      cell.disabled ? undefined : () => onCellClick?.(cell.key)
                    }
                    sx={[
                      ...sx,
                      cell.disabled ? { cursor: 'not-allowed' } : {},
                      {
                        '&:focus-visible': {
                          outline: 2,
                          outlineStyle: 'solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2,
                        },
                      },
                    ]}
                  >
                    {content}
                  </ButtonBase>
                );
              })}
              {label(row.label, 'left')}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** 범례 한 줄(SeatGrid 와 같은 칸 모양) */
export function SeatGridLegend({
  items,
  ariaLabel,
}: {
  items: { tone: SeatGridTone; label: string }[];
  ariaLabel: string;
}) {
  return (
    <Box
      role='list'
      aria-label={ariaLabel}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
    >
      {items.map((item) => (
        <Box
          key={item.tone}
          role='listitem'
          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
        >
          <Box
            aria-hidden
            sx={[
              {
                width: 20,
                height: 20,
                borderRadius: `${RADIUS.xs}px`,
                border: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              toneSx(item.tone, true),
            ]}
          >
            {item.tone === 'sold' || item.tone === 'locked' ? (
              <Typo.Caption.Bold>✕</Typo.Caption.Bold>
            ) : null}
          </Box>
          <Typo.Caption.Regular>{item.label}</Typo.Caption.Regular>
        </Box>
      ))}
    </Box>
  );
}
