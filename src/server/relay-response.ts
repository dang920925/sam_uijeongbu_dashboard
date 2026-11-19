// 서버 응답을 브라우저로 되돌린다 — 응답 헤더도 화이트리스트(content-type·retry-after)만.
import { NextResponse } from 'next/server';

const PASS_HEADERS = ['content-type', 'retry-after', 'content-length'];

export async function relayResponse(upstream: Response): Promise<NextResponse> {
  const headers = new Headers({ 'cache-control': 'no-store' });
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const body = upstream.status === 204 ? null : await upstream.arrayBuffer();
  return new NextResponse(body, { status: upstream.status, headers });
}
