// ----------------------------------------------------------------------
// 회차 라벨 "12/12 (토) 14:00" — 날짜 "YYYY-MM-DD"(KST 달력 날짜)와 시각 "HH:mm" 문자열만으로 만든다(시간대 무관).
// ----------------------------------------------------------------------
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function formatShowLabel(showDate: string, startTime: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(showDate);
  if (!match) return `${showDate} ${startTime}`;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}/${d} (${WEEKDAYS[day]}) ${startTime}`;
}
