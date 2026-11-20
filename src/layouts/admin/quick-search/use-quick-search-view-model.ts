'use client';

// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기' ViewModel(design §6.1a · develop §11.4 U24 보강 S43). JSX 없음.
// - Enter(폼 제출)로 조회. 4자리 숫자가 아니면 요청하지 않고 안내.
// - `GET /admin/reservations?q=<번호>`(공연 없이, searchReservations) — 1건이면 바로 상세 드로어,
//   여러 건이면 입력 아래 목록에서 고른다, 0건이면 문구.
// - 결과는 ROOT_KEYS.reservation 아래 키라 예매를 바꾸면(입금 확인 등) 같이 새로 불린다 → 드로어도 최신.
// - xs: 아이콘 버튼 → 헤더 전체 폭 입력으로 펼침, ← 로 닫으면 아이콘 버튼으로 포커스를 돌린다.
// ----------------------------------------------------------------------
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { searchReservations } from '@/src/api/reservation';
import { toReservationCode } from '@/src/api/reservation-mapper';
import { useTransitionReservation } from '@/src/api/reservation-queries';
import { ROOT_KEYS } from '@/src/api/root-keys';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import {
  outcomeOf,
  QUICK_SEARCH_IDS,
  sanitizeCodeInput,
} from '@/src/layouts/admin/quick-search/quick-search-utils';
import { ApiError } from '@/src/lib/api-client';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export type QuickSearchPhase =
  'idle' | 'loading' | 'invalid' | 'results' | 'error';

const quickSearchKey = (code: string) =>
  [...ROOT_KEYS.reservation, 'quick-search', code] as const;

const CONFLICT_CODES = new Set(['RSV_007', 'RSV_008']);

export function useQuickSearchViewModel() {
  const queryClient = useQueryClient();
  const snackbar = useAppSnackbar();
  const transition = useTransitionReservation();
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<QuickSearchPhase>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isXsOpen, setIsXsOpen] = useState(false);

  const query = useQuery({
    queryKey: quickSearchKey(code ?? ''),
    queryFn: () => searchReservations(code ?? ''),
    enabled: code !== null,
  });
  const results = code !== null ? (query.data ?? []) : [];
  const selected = results.find((r) => r.id === selectedId) ?? null;

  const handleSubmit = async () => {
    const nextCode = toReservationCode(input);
    if (!nextCode) {
      setPhase('invalid');
      return;
    }
    setPhase('loading');
    setSelectedId(null);
    try {
      const items = await queryClient.fetchQuery({
        queryKey: quickSearchKey(nextCode),
        queryFn: () => searchReservations(nextCode),
        staleTime: 0,
      });
      setCode(nextCode);
      const only = items[0];
      if (outcomeOf(items.length) === 'one' && only) {
        setSelectedId(only.id);
        setPhase('idle');
      } else {
        setPhase('results');
      }
    } catch (error) {
      setErrorMessage(toApiErrorMessage(error));
      setPhase('error');
    }
  };

  const closePopup = () => {
    if (phase !== 'loading') setPhase('idle');
  };

  const closeXs = () => {
    setIsXsOpen(false);
    setPhase('idle');
    requestAnimationFrame(() =>
      document.getElementById(QUICK_SEARCH_IDS.openButton)?.focus()
    );
  };

  const handleConfirm = () => {
    if (!selected) return;
    transition.mutate(
      { id: selected.id, kind: 'confirm', version: selected.version },
      {
        onSuccess: () => snackbar.success(MSG_D12.CONFIRMED(selected.code)),
        onError: (error) =>
          snackbar.error(
            error instanceof ApiError && CONFLICT_CODES.has(error.code ?? '')
              ? MSG_D12.CONFLICT
              : toApiErrorMessage(error)
          ),
      }
    );
  };

  return {
    input,
    phase,
    code: code ?? '',
    results,
    errorMessage,
    selected,
    isXsOpen,
    isConfirming: transition.isPending,
    onInputChange: (value: string) => setInput(sanitizeCodeInput(value)),
    onSubmit: () => void handleSubmit(),
    onSelect: (id: string) => {
      setSelectedId(id);
      setPhase('idle');
    },
    onClosePopup: closePopup,
    onCloseDrawer: () => setSelectedId(null),
    /** "예매 관리에서 보기" 로 이동할 때 — 드로어·목록·xs 펼침을 모두 닫는다 */
    onNavigate: () => {
      setSelectedId(null);
      setPhase('idle');
      setIsXsOpen(false);
    },
    onConfirm: handleConfirm,
    /** xs 펼침 — 입력은 이미 마운트돼 있어(display 만 바뀜) autoFocus 대신 펼친 뒤 포커스 */
    onOpenXs: () => {
      setIsXsOpen(true);
      requestAnimationFrame(() =>
        document.getElementById(QUICK_SEARCH_IDS.input)?.focus()
      );
    },
    onCloseXs: closeXs,
  };
}

export type QuickSearchViewModel = ReturnType<typeof useQuickSearchViewModel>;
