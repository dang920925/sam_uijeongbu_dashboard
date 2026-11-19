// ----------------------------------------------------------------------
// KST(Asia/Seoul) 날짜 표시·입력 변환 — 실행 환경 TZ 와 무관하게 KST 로 계산한다(R10·B12).
// 표시 형식: 현행 toLocaleDateString('ko-KR') 2자리 대신 design 공통 `YYYY.MM.DD` · `YYYY.MM.DD HH:mm`.
// 서버 출력 datetime 은 UTC `Z`, 입력은 오프셋 필수 → 폼 값은 `+09:00` 을 붙여 보낸다(develop §3.1).
// ----------------------------------------------------------------------
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

interface KstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function toKstParts(iso: string): KstParts | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const d = new Date(time + KST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** datetime(ISO) → 'YYYY.MM.DD'. 값 없거나 잘못되면 '-' */
export function formatKstDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const p = toKstParts(iso);
  return p ? `${p.year}.${pad(p.month)}.${pad(p.day)}` : '-';
}

/** datetime(ISO) → 'YYYY.MM.DD HH:mm' */
export function formatKstDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const p = toKstParts(iso);
  return p
    ? `${p.year}.${pad(p.month)}.${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`
    : '-';
}

/** date('YYYY-MM-DD', KST 달력 날짜) → 'YYYY.MM.DD' — 시간대 변환 없이 표기만 바꾼다 */
export function formatCalendarDate(date: string | null | undefined): string {
  if (!date) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '-';
}

/** datetime(ISO) → <input type="datetime-local"> 값 'YYYY-MM-DDTHH:mm'(KST) */
export function toKstDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const p = toKstParts(iso);
  return p
    ? `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
    : '';
}

/** <input type="datetime-local"> 값(KST 벽시계) → ISO 8601 + '+09:00'. 빈 값은 null */
export function fromKstDateTimeInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  return `${value}:00+09:00`;
}

/** 오늘 KST 달력 날짜 'YYYY-MM-DD' (now 주입 가능 — 테스트용) */
export function todayKst(now: Date = new Date()): string {
  const p = toKstParts(now.toISOString()) as KstParts;
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}
