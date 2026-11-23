import {
  castPhotoSlotKey,
  toCastPhotoBoard,
  type CastPhotoBoardInput,
} from '@/src/sections/performance-cast/utils/cast-photo-rows';
import type { AdminRole } from '@/src/types/cast';

const actor = (id: string, isVisible = true) => ({
  actorProfileId: `ap-${id}`,
  memberId: id,
  name: `fixture-${id}`,
  isVisible,
  note: null,
});

const role = (id: string, name: string | null, ids: string[]): AdminRole => ({
  id,
  name,
  description: null,
  sortOrder: 0,
  isRecruiting: false,
  publicNow: true,
  defaultCast: ids.map((m) => actor(m, m !== 'hidden')),
});

const NO_DISPLAY = { size: null, crop: null };
const group = (id: string, sortOrder: number) => ({
  id,
  imageUrl: `https://x/${id}.jpg`,
  sortOrder,
  display: NO_DISPLAY,
  ratio: null,
});
const team = (
  teamAccountId: string,
  label: string,
  photoUrl: string | null
) => ({
  teamAccountId,
  label,
  photoUrl,
  display: NO_DISPLAY,
  ratio: null,
});

function input(over: Partial<CastPhotoBoardInput> = {}): CastPhotoBoardInput {
  return {
    roles: [
      role('r1', '에반', ['m1', 'm2']),
      role('r2', null, ['m3', 'hidden']),
      role('r3', '빈 배역', []),
    ],
    photos: {
      castPublic: true,
      castCardRatio: '3:4',
      groupPhotos: [group('g1', 0), group('g2', 1)],
      groupPhotoMax: 4,
      teams: [team('tA', 'A', 'https://x/a.jpg'), team('tB', 'B', null)],
      rolePhotos: {
        'r1:ap-m1': {
          imageUrl: 'https://x/r1m1.jpg',
          display: NO_DISPLAY,
          thumbCrop: null,
        },
      },
    },
    profileUrls: { m1: null, m2: 'https://x/p2.jpg', m3: null },
    teamMembers: { tA: ['m1', 'm3'], tB: ['m2', 'm3'] },
    uploads: {},
    filter: 'all',
    ...over,
  };
}

describe('toCastPhotoBoard (U48 designer §19.4)', () => {
  it('단체샷 첫 장을 대표로, 끝 장은 뒤로 못 가게, 남은 자리를 센다', () => {
    // Act
    const board = toCastPhotoBoard(input());
    // Assert
    expect(board.groups.map((g) => g.orderLabel)).toEqual(['대표', '2']);
    expect(board.groups[0].canMoveLeft).toBe(false);
    expect(board.groups[1].canMoveRight).toBe(false);
    expect(board.groupAdd).toMatchObject({ remaining: 2, canAdd: true });
  });

  it('홈페이지 대체 표시를 배역 사진 → 프로필 → 실루엣, 비노출은 숨김으로 정한다', () => {
    const rows = toCastPhotoBoard(input()).blocks.flatMap((b) => b.rows);
    expect(rows.map((r) => [r.memberId, r.source])).toEqual([
      ['m1', 'role'],
      ['m2', 'profile'],
      ['m3', 'silhouette'],
      ['hidden', 'hidden'],
    ]);
  });

  it('배우 없는 배역은 빼고, 이름 없는 배역은 "출연"으로, 팀 칩은 팀 구성대로 붙인다', () => {
    const board = toCastPhotoBoard(input());
    expect(board.blocks.map((b) => b.label)).toEqual(['에반', '출연']);
    expect(board.blocks[1].rows[0].teamLabels).toEqual(['A', 'B']);
    expect(board.teams.map((t) => t.memberCount)).toEqual([2, 2]);
  });

  it('진행 막대는 배역 사진 수 / 전체 줄, 사진 없음 보기는 사진 없는 줄만 남긴다', () => {
    const board = toCastPhotoBoard(input({ filter: 'missing' }));
    expect(board.meter).toEqual({ have: 1, total: 4 });
    expect(board.counts).toEqual({ all: 4, missing: 3 });
    expect(board.blocks.flatMap((b) => b.rows).map((r) => r.memberId)).toEqual([
      'm2',
      'm3',
      'hidden',
    ]);
  });

  it('단원·팀 구성을 못 받았으면 대체 표시는 모름, 팀 인원은 null 이다', () => {
    const board = toCastPhotoBoard(
      input({ profileUrls: null, teamMembers: null })
    );
    expect(board.blocks[0].rows[1].source).toBe('unknown');
    expect(board.teams[0].memberCount).toBeNull();
    expect(board.blocks[0].rows[0].teamLabels).toEqual([]);
  });

  it('슬롯 열쇠로 올리는 중·실패 상태를 붙이고, 단체샷 4장이면 추가 자리를 닫는다', () => {
    const uploading = {
      phase: 'uploading' as const,
      progress: 40,
      errorMessage: null,
      canRetry: false,
    };
    const board = toCastPhotoBoard(
      input({
        uploads: {
          [castPhotoSlotKey.role('r1', 'ap-m2')]: uploading,
          [castPhotoSlotKey.team('tB')]: { ...uploading, phase: 'error' },
        },
        photos: {
          ...input().photos,
          groupPhotos: [0, 1, 2, 3].map((n) => group(`g${n}`, n)),
        },
      })
    );
    expect(board.blocks[0].rows[1].upload?.progress).toBe(40);
    expect(board.teams[1].upload?.phase).toBe('error');
    expect(board.groupAdd.canAdd).toBe(false);
  });

  it('(U51) 배역 카드 비율을 싣고, 위치를 옮겼거나 썸네일을 따로 맞춘 배역 사진만 위치 조정됨으로 본다', () => {
    // Arrange
    const photo = (crop: { x: number; y: number; zoom: number } | null) => ({
      imageUrl: 'https://x/r.jpg',
      display: { size: { width: 1600, height: 1200 }, crop },
      thumbCrop: null,
    });
    // Act
    const board = toCastPhotoBoard(
      input({
        photos: {
          ...input().photos,
          castCardRatio: '2:3',
          rolePhotos: {
            'r1:ap-m1': photo({ x: 26, y: 40, zoom: 1.3 }),
            'r1:ap-m2': photo({ x: 50, y: 50, zoom: 1 }),
          },
        },
      })
    );
    // Assert
    expect(board.cardRatio).toBe('2:3');
    expect(board.blocks[0].rows.map((r) => r.isAdjusted)).toEqual([
      true,
      false,
    ]);
    expect(board.blocks[0].rows[0].rolePhoto?.display.size?.width).toBe(1600);
  });
});
