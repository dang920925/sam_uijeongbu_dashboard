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
    expect(model.rolePhotos[rolePhotoKey('r1', 'p1')].imageUrl).toBe(
      'https://x/r.jpg'
    );
    expect(model.groupPhotoMax).toBe(4);
    // U51 필드가 없으면 3:4 · 원본 · 가운데 · 크기 모름
    expect(model.castCardRatio).toBe('3:4');
    expect(model.groupPhotos[0].ratio).toBeNull();
    expect(model.groupPhotos[0].display).toEqual({ size: null, crop: null });
  });

  it('(U51 §27.5) 비율·위치·크기를 화면 모델로 옮기고 허용 밖 비율은 버린다', () => {
    // Arrange
    const res = {
      castPublic: true,
      castCardRatio: '2:3' as const,
      groupPhotos: [
        {
          id: 'g1',
          imageUrl: 'https://x/g1.jpg',
          sortOrder: 0,
          width: 2400,
          height: 1350,
          displayRatio: '4:3' as const,
          crop: { x: 40, y: 50, zoom: 1.2 },
        },
      ],
      groupPhotoMax: 4,
      teams: [
        {
          teamAccountId: 't1',
          label: 'A',
          photoUrl: 'https://x/a.jpg',
          photoWidth: 1600,
          photoHeight: 0,
          photoRatio: '21:9' as unknown as '16:9',
          photoCrop: null,
        },
      ],
      rolePhotos: [
        {
          roleId: 'r1',
          actorProfileId: 'p1',
          memberId: 'm1',
          imageUrl: 'https://x/r.jpg',
          width: 1600,
          height: 1200,
          crop: { x: 26, y: 40, zoom: 1.3 },
          thumbCrop: null,
        },
      ],
    };

    // Act
    const model = fromCastPhotosResponse(res);

    // Assert
    expect(model.castCardRatio).toBe('2:3');
    expect(model.groupPhotos[0].ratio).toBe('4:3');
    expect(model.groupPhotos[0].display).toEqual({
      size: { width: 2400, height: 1350 },
      crop: { x: 40, y: 50, zoom: 1.2 },
    });
    expect(model.teams[0].ratio).toBeNull();
    expect(model.teams[0].display.size).toBeNull();
    const role = model.rolePhotos[rolePhotoKey('r1', 'p1')];
    expect(role.display.crop).toEqual({ x: 26, y: 40, zoom: 1.3 });
    expect(role.thumbCrop).toBeNull();
  });
});

describe('toPreviewUrl (U48 §25.9)', () => {
  it('홈페이지 주소 끝 / 를 떼고 작품 상세에 preview 토큰을 붙인다', () => {
    expect(toPreviewUrl('https://home.example/', 'p-1', 'a.b+c')).toBe(
      'https://home.example/works/p-1?preview=a.b%2Bc'
    );
  });
});
