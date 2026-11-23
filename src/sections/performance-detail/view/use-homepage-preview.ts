'use client';

// ----------------------------------------------------------------------
// (U48) 홈페이지 미리보기 ViewModel(back-end §25.9) — JSX 없음.
// 누르면 새 탭을 먼저 열고(팝업 차단 회피 — 사용자 동작 안에서 연다) → POST preview-token(30분) →
// 그 탭을 `{홈페이지}/works/{id}?preview=<token>` 으로 보낸다. 토큰은 캐시·상태에 두지 않는다.
// 홈페이지 주소(서버 env CLIENT_PUBLIC_URL)가 없으면 버튼을 잠그고 이유를 보인다.
// ----------------------------------------------------------------------
import { toPreviewUrl } from '@/src/api/cast-photo-mapper';
import { useIssuePreviewToken } from '@/src/api/cast-photo-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export function useHomepagePreview(
  performanceId: string,
  clientUrl: string | null
) {
  const snackbar = useAppSnackbar();
  const issue = useIssuePreviewToken(performanceId);

  return {
    isDisabled: clientUrl === null,
    isPending: issue.isPending,
    help:
      clientUrl === null ? MSG_D14.PREVIEW_NO_CLIENT_URL : MSG_D14.PREVIEW_HELP,
    onOpen: () => {
      if (clientUrl === null || issue.isPending) return;
      const tab = window.open('about:blank', '_blank');
      if (!tab) {
        snackbar.error(MSG_D14.PREVIEW_POPUP_BLOCKED);
        return;
      }
      tab.opener = null;
      issue.mutate(undefined, {
        onSuccess: ({ token }) => {
          tab.location.href = toPreviewUrl(clientUrl, performanceId, token);
          snackbar.success(MSG_D14.PREVIEW_OPENED);
        },
        onError: (error) => {
          tab.close();
          snackbar.error(toApiErrorMessage(error));
        },
      });
    },
  };
}

export type HomepagePreview = ReturnType<typeof useHomepagePreview>;
