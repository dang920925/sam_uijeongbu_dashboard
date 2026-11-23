import {
  clearThumb,
  initialEditorState,
  moveActive,
  resetActive,
  setAspect,
  toCropEditorRequest,
  toDisplaySave,
  toEditorModel,
  zoomActive,
  type CropEditorRequest,
} from '@/src/sections/performance-cast/utils/photo-crop-editor';

const SIZE = { width: 1600, height: 1200 };

function request(over: Partial<CropEditorRequest> = {}): CropEditorRequest {
  return {
    key: 'k',
    target: { kind: 'role', roleId: 'r1', actorProfileId: 'ap-m1' },
    kind: 'role',
    who: 'fixture',
    imageUrl: 'https://x/r.jpg',
    size: SIZE,
    isNew: false,
    cardRatio: '3:4',
    aspect: 'ORIGINAL',
    crop: null,
    thumbCrop: null,
    roleLabel: '에반',
    actorName: 'fixture-m1',
    ...over,
  };
}

describe('photo-crop-editor (U51 §21.2 · §27.4)', () => {
  it('배역 사진은 카드 비율로 틀을 그리고, 썸네일은 따로 안 맞추면 자동이다', () => {
    // Arrange
    const req = request({ cardRatio: '1:1' });
    // Act
    const model = toEditorModel(req, initialEditorState(req), SIZE);
    // Assert
    expect(model.ratio).toBe(1);
    expect(model.card).toEqual({ x: 200, y: 0, w: 1200, h: 1200 });
    expect(model.isThumbAuto).toBe(true);
    expect(model.canAdjust).toBe(true);
  });

  it('썸네일 탭에서 옮기면 thumbCrop 만 생기고 카드 값은 그대로다', () => {
    // Arrange
    const req = request();
    const start = { ...initialEditorState(req), target: 'thumb' as const };
    // Act
    const zoomed = zoomActive(req, start, SIZE, 2);
    const moved = moveActive(req, zoomed, SIZE, -10, 0);
    // Assert
    expect(moved.crop).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(moved.thumbCrop).toEqual({ x: 40, y: 50, zoom: 2 });
    // 자동으로 되돌리면 지운다
    expect(clearThumb(moved).thumbCrop).toBeNull();
  });

  it('[가운데로 되돌리기]는 지금 대상만 50·50·1 로 바꾼다', () => {
    const req = request();
    const state = {
      ...initialEditorState(req),
      crop: { x: 30, y: 50, zoom: 1.5 },
    };
    expect(resetActive(req, state).crop).toEqual({ x: 50, y: 50, zoom: 1 });
  });

  it('단체·팀샷이 원본이면 틀·확대가 없고 옮겨도 그대로다', () => {
    // Arrange
    const req = request({
      kind: 'team',
      target: { kind: 'team', teamAccountId: 't1' },
    });
    const state = initialEditorState(req);
    // Act
    const model = toEditorModel(req, state, SIZE);
    // Assert
    expect(model.canAdjust).toBe(false);
    expect(model.card).toBeNull();
    expect(moveActive(req, state, SIZE, 10, 10)).toBe(state);
  });

  it('저장 본문 — 배역은 가운데면 null, 팀샷은 비율·위치, 원본이면 둘 다 null', () => {
    // Arrange
    const role = request();
    const team = request({
      kind: 'team',
      target: { kind: 'team', teamAccountId: 't1' },
    });
    const group = request({
      kind: 'group',
      target: { kind: 'group', photoId: 'g1' },
      aspect: '16:9',
      crop: { x: 50, y: 40, zoom: 1.2 },
    });
    // Act
    const roleSave = toDisplaySave(role, initialEditorState(role), SIZE);
    const teamState = setAspect(initialEditorState(team), '4:3');
    const teamSave = toDisplaySave(
      team,
      zoomActive(team, teamState, SIZE, 1.5),
      SIZE
    );
    const groupOriginal = toDisplaySave(
      group,
      setAspect(initialEditorState(group), 'ORIGINAL'),
      SIZE
    );
    // Assert
    expect(roleSave).toEqual({
      kind: 'role',
      roleId: 'r1',
      actorProfileId: 'ap-m1',
      body: { crop: null, thumbCrop: null },
    });
    expect(teamSave).toEqual({
      kind: 'team',
      teamAccountId: 't1',
      body: { photoRatio: '4:3', photoCrop: { x: 50, y: 50, zoom: 1.5 } },
    });
    expect(groupOriginal.body).toEqual({ displayRatio: null, crop: null });
  });

  it('잘린 가로가 600px 미만이면 흐림 경고', () => {
    const req = request({ crop: { x: 50, y: 50, zoom: 2 } });
    // 3:4 zoom 2 → 가로 450
    expect(toEditorModel(req, initialEditorState(req), SIZE).isBlurry).toBe(
      true
    );
  });

  it('대상 사진으로 창 요청을 만들고, 사진이 없으면 null', () => {
    // Arrange
    const photos = {
      castPublic: true,
      castCardRatio: '4:5' as const,
      groupPhotos: [
        {
          id: 'g1',
          imageUrl: 'https://x/g1.jpg',
          sortOrder: 0,
          display: { size: null, crop: null },
          ratio: '16:9' as const,
        },
      ],
      groupPhotoMax: 4,
      teams: [
        {
          teamAccountId: 't1',
          label: 'A',
          photoUrl: null,
          display: { size: null, crop: null },
          ratio: null,
        },
      ],
      rolePhotos: {
        'r1:ap-m1': {
          imageUrl: 'https://x/r.jpg',
          display: { size: SIZE, crop: { x: 26, y: 40, zoom: 1.3 } },
          thumbCrop: null,
        },
      },
    };
    const roles = [
      {
        id: 'r1',
        name: '에반',
        description: null,
        sortOrder: 0,
        isRecruiting: false,
        publicNow: true,
        defaultCast: [
          {
            actorProfileId: 'ap-m1',
            memberId: 'm1',
            name: 'fixture-m1',
            isVisible: true,
            note: null,
          },
        ],
      },
    ];
    // Act
    const role = toCropEditorRequest(
      photos,
      roles,
      { kind: 'role', roleId: 'r1', actorProfileId: 'ap-m1' },
      true
    );
    const group = toCropEditorRequest(
      photos,
      roles,
      { kind: 'group', photoId: 'g1' },
      false
    );
    // Assert
    expect(role).toMatchObject({
      kind: 'role',
      who: '에반 · fixture-m1 · 배역 사진',
      cardRatio: '4:5',
      crop: { x: 26, y: 40, zoom: 1.3 },
      isNew: true,
    });
    expect(group).toMatchObject({
      kind: 'group',
      aspect: '16:9',
      who: '단체샷 1',
    });
    expect(
      toCropEditorRequest(
        photos,
        roles,
        { kind: 'team', teamAccountId: 't1' },
        true
      )
    ).toBeNull();
  });
});
