// ----------------------------------------------------------------------
// 브라우저가 이미지를 열지 못함(HEIC 등) — 업로드 전 압축 단계에서 던진다.
// 화면 문구는 MSG_UPLOAD.DECODE_FAILED(toUploadErrorMessage).
// ----------------------------------------------------------------------
export class ImageDecodeError extends Error {
  constructor() {
    super('IMAGE_DECODE_FAILED');
    this.name = 'ImageDecodeError';
  }
}
