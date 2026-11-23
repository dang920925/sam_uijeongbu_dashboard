import {
  fromCastPhotosResponse,
  rolePhotoKey,
  toPreviewUrl,
} from '@/src/api/cast-photo-mapper';

describe('fromCastPhotosResponse (U48 §25.2)', () => {
  it('단체샷을 순서대로 정렬하고 배역 사진을 (배역, 배우) 열쇠로 묶는다', () => {
    // Arrange
    const res = {
      castPublic: true,
      groupPhotos: [
        { id: 'g2', imageUrl: 'https://x/g2.jpg', sortOrder: 1 },
        { id: 'g1', imageUrl: 'https://x/g1.jpg', sortOrder: 0 },
      ],
      groupPhotoMax: 4,
      teams: [
        { teamAccountId: 't1', label: 'A', photoUrl: 'https://x/a.jpg' },
        { teamAccountId: 't2', label: 'B', photoUrl: '' },
      ],
      rolePhotos: [
        {
          roleId: 'r1',
          actorProfileId: 'p1',
          memberId: 'm1',
          imageUrl: 'https://x/r.jpg',
        },
      ],
    };

    // Act
    const model = fromCastPhotosResponse(res);

    // Assert
    expect(model.groupPhotos.map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(model.teams[1].photoUrl).toBeNull();
    expect(model.rolePhotoUrls[rolePhotoKey('r1', 'p1')]).toBe(
      'https://x/r.jpg'
    );
    expect(model.groupPhotoMax).toBe(4);
  });
});

describe('toPreviewUrl (U48 §25.9)', () => {
  it('홈페이지 주소 끝 / 를 떼고 작품 상세에 preview 토큰을 붙인다', () => {
    expect(toPreviewUrl('https://home.example/', 'p-1', 'a.b+c')).toBe(
      'https://home.example/works/p-1?preview=a.b%2Bc'
    );
  });
});
