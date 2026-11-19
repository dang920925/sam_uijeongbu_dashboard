// ----------------------------------------------------------------------
// FormField — 라벨 위 · 입력 · 도움말/오류(designer components.css `.field`). 라벨-입력 간격 4(§11.4).
// 필수 표시 " *" 는 현행 라벨 문구("공연 제목 *")를 그대로 쓰는 대신 required 로 붙인다.
// 입력 컴포넌트에는 id 를 주고 htmlFor 로 연결한다.
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { Typo } from '@/src/components/typo';

interface FormFieldProps {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  helper?: ReactNode;
  error?: string | null;
  children: ReactNode;
  /** 라벨을 legend 로 쓰는 묶음(요일 토글 등) */
  asGroup?: boolean;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  helper,
  error,
  children,
  asGroup = false,
}: FormFieldProps) {
  const labelNode = (
    <Typo.Badge.Medium component='span'>
      {label}
      {required ? (
        <Typo.Badge.Medium component='span' color='error.main' sx={{ ml: 1 }}>
          *
        </Typo.Badge.Medium>
      ) : null}
    </Typo.Badge.Medium>
  );
  const Wrapper = asGroup ? 'fieldset' : 'div';
  return (
    <Wrapper className='m-0 flex min-w-0 flex-col gap-1 border-0 p-0'>
      {asGroup ? (
        <legend className='mb-1 p-0'>{labelNode}</legend>
      ) : (
        <label htmlFor={htmlFor}>{labelNode}</label>
      )}
      {children}
      {error ? (
        <Typo.Caption.Regular color='error.main' role='alert'>
          {error}
        </Typo.Caption.Regular>
      ) : helper ? (
        <Typo.Caption.Regular color='text.secondary'>
          {helper}
        </Typo.Caption.Regular>
      ) : null}
    </Wrapper>
  );
}
