// ----------------------------------------------------------------------
// base64url(패딩 없어도 됨) → 바이트. 푸시 구독의 applicationServerKey(VAPID 공개키)에 쓴다(U37).
// ----------------------------------------------------------------------
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    '='
  );
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
