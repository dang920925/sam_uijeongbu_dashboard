'use client';

// ----------------------------------------------------------------------
// SCR-D15 계정 설정 컨테이너 — 현재 아이디(GET /auth/me) 로딩·오류 분기, 그 밖은 View.
// (U37) 계정 카드 아래에 '예매 알림' 카드(자체 로딩·오류 분기)를 둔다.
// ----------------------------------------------------------------------
import { ErrorRetry } from '@/src/components/error-retry';
import { AccountLayout } from '@/src/sections/account/components/account-layout';
import { AccountSkeleton } from '@/src/sections/account/components/account-skeleton';
import { AccountView } from '@/src/sections/account/view/account-view';
import { PushSettingsContainer } from '@/src/sections/account/view/push-settings-container';
import { useAccountViewModel } from '@/src/sections/account/view/use-account-view-model';

export function AccountContainer() {
  const vm = useAccountViewModel();

  if (vm.status === 'loading') {
    return (
      <AccountLayout>
        <AccountSkeleton />
      </AccountLayout>
    );
  }
  if (vm.status === 'error') {
    return (
      <AccountLayout>
        <ErrorRetry message={vm.loadErrorMessage} onRetry={vm.onRetry} />
      </AccountLayout>
    );
  }
  return (
    <AccountLayout>
      <AccountView {...vm} />
      <PushSettingsContainer />
    </AccountLayout>
  );
}
