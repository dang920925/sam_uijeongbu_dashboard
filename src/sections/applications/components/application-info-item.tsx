// ----------------------------------------------------------------------
// 상세 정보 한 칸 — 아이콘(없으면 같은 폭 빈 자리로 줄 맞춤) + 라벨(caption) / 값(badge medium).
// 현행 InfoRow(Applications.tsx:42-50): 값이 없으면 칸을 그리지 않는다 — 호출 쪽이 값 있을 때만 쓴다.
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface ApplicationInfoItemProps {
  label: string;
  value: string;
  icon?: string;
  /** 2열 그리드에서 두 칸 차지 */
  isWide?: boolean;
}

export function ApplicationInfoItem({
  label,
  value,
  icon,
  isWide = false,
}: ApplicationInfoItemProps) {
  return (
    <div className={isWide ? 'col-span-2 flex gap-2' : 'flex gap-2'}>
      {icon ? (
        <Iconify icon={icon} sx={{ color: 'text.secondary', mt: 1 }} />
      ) : (
        <span aria-hidden className='w-4 shrink-0' />
      )}
      <div className='flex min-w-0 flex-col gap-1'>
        <Typo.Caption.Regular color='text.secondary'>
          {label}
        </Typo.Caption.Regular>
        <Typo.Badge.Medium>{value}</Typo.Badge.Medium>
      </div>
    </div>
  );
}
