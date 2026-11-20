// ----------------------------------------------------------------------
// 필드 아래 도움말 + 오류(designer 2.2 "도움말은 오류가 있어도 남긴다") — FormField 는 둘 중 하나만 그려서
// 계정 화면은 이것을 입력 바로 아래(children)에 둔다. id 는 입력의 aria-describedby 로 잇는다.
// ----------------------------------------------------------------------
import { Typo } from '@/src/components/typo';

interface FieldNotesProps {
  fieldId: string;
  helper?: string;
  error?: string;
}

export function FieldNotes({ fieldId, helper, error }: FieldNotesProps) {
  return (
    <>
      {helper ? (
        <Typo.Caption.Regular id={`${fieldId}-helper`} color='text.secondary'>
          {helper}
        </Typo.Caption.Regular>
      ) : null}
      {error ? (
        <Typo.Caption.Regular id={`${fieldId}-error`} color='error.main'>
          {error}
        </Typo.Caption.Regular>
      ) : null}
    </>
  );
}
