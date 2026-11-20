// ----------------------------------------------------------------------
// 노출 여부 — 눈 아이콘 + "노출" / 감은 눈 + "비노출"(secondary). 상태 배지와 색이 겹치지 않게 Label 대신
// 아이콘 + 글자(designer W3 D03 [D5]).
// ----------------------------------------------------------------------
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface PerformanceListVisibilityProps {
  isVisible: boolean;
  label: string;
}

export function PerformanceListVisibility({
  isVisible,
  label,
}: PerformanceListVisibilityProps) {
  const color = isVisible ? 'text.primary' : 'text.secondary';
  return (
    <span className='inline-flex items-center gap-1'>
      <Iconify
        icon={isVisible ? 'solar:eye-linear' : 'solar:eye-closed-linear'}
        sx={{ color }}
      />
      <Typo.Badge.Regular color={color}>{label}</Typo.Badge.Regular>
    </span>
  );
}
