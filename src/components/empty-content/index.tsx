// ----------------------------------------------------------------------
// EmptyContent — 빈 상태(정상 결과). 오류(ErrorRetry)와 다른 화면이다(§11.9).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface EmptyContentProps {
  message: string;
  icon?: string;
}

export function EmptyContent({ message, icon }: EmptyContentProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-2 px-4 py-12 text-center'>
      {icon ? (
        <Iconify icon={icon} size='lg' sx={{ color: 'text.secondary' }} />
      ) : null}
      <Typo.Badge.Regular color='text.secondary'>{message}</Typo.Badge.Regular>
    </div>
  );
}
