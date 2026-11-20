// ----------------------------------------------------------------------
// SectionStack — 섹션 간격 소유(comfortable 24 / dense 16, 가이드 §11.4).
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

interface SectionStackProps {
  children: ReactNode;
  dense?: boolean;
}

export function SectionStack({ children, dense = false }: SectionStackProps) {
  return (
    <div className={dense ? 'flex flex-col gap-4' : 'flex flex-col gap-6'}>
      {children}
    </div>
  );
}
