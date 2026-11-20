// ----------------------------------------------------------------------
// 방문자 IP 읽기(qa1 U11 — develop §3.1 "방문자 IP 전달" ①).
// Vercel 이 채운 요청 헤더에서 읽는다: x-vercel-forwarded-for → x-real-ip → x-forwarded-for 의 첫 값.
// Vercel 은 X-Forwarded-For 를 클라이언트 공인 IP 로 덮어쓰고 외부에서 온 값을 넘기지 않는다(develop S-vc-55).
// 로컬(헤더 없음)이면 null — 서버로 보내지 않는다. 형식 검사는 서버(net.isIP)가 하고, 틀리면 무시한다.
// ----------------------------------------------------------------------
const VISITOR_IP_SOURCES = [
  'x-vercel-forwarded-for',
  'x-real-ip',
  'x-forwarded-for',
] as const;

/** 헤더 값이 너무 길면 버린다(IPv6 최장 표기 45자보다 넉넉히) */
const MAX_IP_LENGTH = 64;

export function visitorIpOf(headers: Headers): string | null {
  for (const name of VISITOR_IP_SOURCES) {
    const first = headers.get(name)?.split(',')[0]?.trim();
    if (first && first.length <= MAX_IP_LENGTH) return first;
  }
  return null;
}
