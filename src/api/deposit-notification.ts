// ----------------------------------------------------------------------
// R2 입금 알림 요청 함수. 브라우저 → BFF `/api/backend/v1/admin/deposit-notifications*` → 서버.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import { apiFetch, apiPost, withQuery } from '@/src/lib/api-client';
import type {
  DepositMatchRequest,
  DepositNotificationItem,
  DepositNotificationListQuery,
  DepositNotificationPage,
  DepositPreview,
  DepositPreviewRequest,
  DepositReceivedAmounts,
} from '@/src/types/deposit-notification';

export function fetchDepositNotifications(
  query: DepositNotificationListQuery
): Promise<DepositNotificationPage> {
  return apiFetch<DepositNotificationPage>(
    withQuery(endpoints.depositNotifications.list, query)
  );
}

export function fetchDepositReceivedAmounts(
  performanceId: string
): Promise<DepositReceivedAmounts> {
  return apiFetch<DepositReceivedAmounts>(
    withQuery(endpoints.depositNotifications.receivedAmounts, {
      performanceId,
    })
  );
}

export function previewDeposit(
  body: DepositPreviewRequest
): Promise<DepositPreview> {
  return apiPost<DepositPreview>(endpoints.depositNotifications.preview, body);
}

export function matchDepositNotification(
  id: string,
  body: DepositMatchRequest
): Promise<DepositNotificationItem> {
  return apiPost<DepositNotificationItem>(
    endpoints.depositNotifications.match(id),
    body
  );
}

export function ignoreDepositNotification(
  id: string
): Promise<DepositNotificationItem> {
  return apiPost<DepositNotificationItem>(
    endpoints.depositNotifications.ignore(id)
  );
}
