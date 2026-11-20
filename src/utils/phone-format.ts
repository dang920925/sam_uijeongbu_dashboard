// ----------------------------------------------------------------------
// 연락처 표시 — 서버는 숫자만 저장·응답한다(back-end.md §14.4, 지휘자 전달 2026-11-20). 화면이 하이픈을 넣는다.
// 010-1234-5678(11자리) · 010-123-4567(10자리) · 그 밖은 받은 그대로.
// ----------------------------------------------------------------------
export function formatPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11)
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}
