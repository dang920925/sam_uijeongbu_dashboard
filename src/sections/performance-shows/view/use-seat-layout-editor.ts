'use client';

// ----------------------------------------------------------------------
// 좌석 배치 편집기 ViewModel(U35 — design §14 SCR-D11). JSX 없음.
// - 열면 그 회차 배치를 받는다(없으면 기본 8×9·가운데 통로로 새로 시작).
// - 열 수·칸 수 입력이 올바르면 바로 격자 크기를 바꾼다(있던 칸 유지). 예매된 좌석 칸은 잠근다.
// - 저장: PUT(VOID 제외) → 409 SEAT_004 등은 Dialog 위 오류. 복사: POST copy-from → 받은 배치로 격자를 바꾼다.
// ----------------------------------------------------------------------
import { useState } from 'react';

import {
  useAdminSeatMap,
  useCopySeatMap,
  useSaveSeatMap,
} from '@/src/api/seat-map-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import type { SeatLayoutDialogProps } from '@/src/sections/performance-shows/components/seat-layout-dialog';
import {
  countSeats,
  lockedPositions,
  parseGridSize,
  resizeKindGrid,
  toEditorRows,
  toggleCell,
  toKindGrid,
  toPreviewRows,
  toSaveSeatMapRequest,
  type KindGrid,
} from '@/src/sections/performance-shows/utils/seat-layout';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

interface EditorState {
  showId: string;
  grid: KindGrid;
  rowsInput: string;
  colsInput: string;
}

export function useSeatLayoutEditor(
  shows: readonly { id: string; titleText: string }[]
): SeatLayoutDialogProps & { onOpen: (showId: string) => void } {
  const snackbar = useAppSnackbar();
  const [showId, setShowId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditorState | null>(null);
  const [copySourceId, setCopySourceId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const query = useAdminSeatMap(showId);
  const save = useSaveSeatMap();
  const copy = useCopySeatMap();

  const map = query.data ?? null;
  const loaded = showId !== null && query.isSuccess;
  const baseGrid = toKindGrid(map);
  const current: EditorState | null =
    edit && edit.showId === showId
      ? edit
      : loaded && showId
        ? {
            showId,
            grid: baseGrid,
            rowsInput: String(baseGrid.length),
            colsInput: String(baseGrid[0]?.length ?? 0),
          }
        : null;
  const grid = current?.grid ?? [];
  const locked = lockedPositions(map);
  const size = current
    ? parseGridSize(current.rowsInput, current.colsInput)
    : null;

  const update = (next: Partial<EditorState>) => {
    if (!current) return;
    setEdit({ ...current, ...next });
    setErrorMessage(null);
  };

  const onSizeChange = (rowsInput: string, colsInput: string) => {
    if (!current) return;
    const parsed = parseGridSize(rowsInput, colsInput);
    update({
      rowsInput,
      colsInput,
      grid: parsed
        ? resizeKindGrid(current.grid, parsed.rows, parsed.cols)
        : current.grid,
    });
  };

  const close = () => {
    setShowId(null);
    setEdit(null);
    setCopySourceId('');
    setErrorMessage(null);
  };

  const title = shows.find((show) => show.id === showId)?.titleText ?? '';

  return {
    open: showId !== null,
    title: MSG_SEAT.EDITOR_TITLE(title),
    status: query.isError ? 'error' : current ? 'ready' : 'loading',
    loadErrorMessage: query.isError ? toApiErrorMessage(query.error) : null,
    isNew: loaded && map === null,
    rowsInput: current?.rowsInput ?? '',
    colsInput: current?.colsInput ?? '',
    sizeError: current && !size ? MSG_SEAT.EDITOR_INVALID_SIZE : null,
    editorRows: toEditorRows(grid, locked),
    previewRows: toPreviewRows(grid),
    summaryText: MSG_SEAT.EDITOR_SUMMARY(countSeats(grid)),
    copyOptions: shows
      .filter((show) => show.id !== showId)
      .map((show) => ({ value: show.id, label: show.titleText })),
    copySourceId,
    isCopying: copy.isPending,
    isSaving: save.isPending,
    errorMessage,
    onOpen: (id: string) => {
      setShowId(id);
      setEdit(null);
      setCopySourceId('');
      setErrorMessage(null);
    },
    onRowsChange: (value) => onSizeChange(value, current?.colsInput ?? ''),
    onColsChange: (value) => onSizeChange(current?.rowsInput ?? '', value),
    onCellClick: (key) => {
      const m = /^r(\d+)c(\d+)$/.exec(key);
      if (!m || !current) return;
      update({
        grid: toggleCell(current.grid, Number(m[1]), Number(m[2]), locked),
      });
    },
    onCopySourceChange: setCopySourceId,
    onCopy: () => {
      if (!showId || !copySourceId || copy.isPending) return;
      copy.mutate(
        { showId, sourceShowId: copySourceId },
        {
          onSuccess: (copied) => {
            const next = toKindGrid(copied);
            setEdit({
              showId,
              grid: next,
              rowsInput: String(next.length),
              colsInput: String(next[0]?.length ?? 0),
            });
            setErrorMessage(null);
            snackbar.success(MSG_SEAT.EDITOR_COPY_DONE);
          },
          onError: (error) => setErrorMessage(toApiErrorMessage(error)),
        }
      );
    },
    onSave: () => {
      if (!showId || !current || save.isPending) return;
      if (!size) {
        setErrorMessage(MSG_SEAT.EDITOR_INVALID_SIZE);
        return;
      }
      if (countSeats(current.grid) === 0) {
        setErrorMessage(MSG_SEAT.EDITOR_EMPTY);
        return;
      }
      save.mutate(
        { showId, body: toSaveSeatMapRequest(current.grid) },
        {
          onSuccess: () => {
            snackbar.success(MSG_SEAT.EDITOR_SAVED);
            close();
          },
          onError: (error) => setErrorMessage(toApiErrorMessage(error)),
        }
      );
    },
    onClose: close,
    onRetry: () => void query.refetch(),
  };
}
