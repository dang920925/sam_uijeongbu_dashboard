import { describe, expect, it } from 'vitest';

import {
  fromActorProfileResponse,
  fromMemberListItemResponse,
  toActorProfileUpsertRequest,
  toMemberCreateRequest,
} from '@/src/api/member-mapper';

describe('member-mapper', () => {
  it('빈 연락처는 null, 이름은 공백을 지워 단원 생성 요청으로 만든다', () => {
    expect(
      toMemberCreateRequest({ name: ' 홍 ', phone: '  ', type: 'GENERAL' })
    ).toEqual({
      name: '홍',
      phone: null,
      type: 'GENERAL',
    });
  });

  it('목록 응답의 가입일·사진 null 을 그대로 화면 모델에 둔다', () => {
    // Act
    const member = fromMemberListItemResponse({
      id: 'm1',
      name: 'fixture-단원',
      type: 'ACTOR',
      phone: null,
      isVisible: false,
      joinedAt: null,
      createdAt: '2026-11-19T00:00:00.000Z',
      profileImageUrl: null,
    });
    // Assert
    expect(member).toMatchObject({
      joinedAt: null,
      profileImageUrl: null,
      type: 'ACTOR',
    });
  });

  it('프로필 없는 응답은 출연작 빈 배열·노출 순서 0 으로 매핑한다', () => {
    // Act
    const profile = fromActorProfileResponse({
      memberId: 'm1',
      profileImageUrl: null,
      intro: null,
      snsUrl: null,
      activityStart: null,
      displayOrder: undefined as unknown as number,
      filmography: undefined as unknown as [],
    });
    // Assert
    expect(profile.filmography).toEqual([]);
    expect(profile.displayOrder).toBe(0);
  });

  it('프로필 저장 바디에서 빈 소개·SNS·배역을 null 로 보낸다', () => {
    // Act
    const body = toActorProfileUpsertRequest({
      memberId: 'm1',
      profileImageUrl: null,
      intro: ' ',
      snsUrl: '',
      activityStart: '2020-03-01',
      displayOrder: 3,
      filmography: [{ title: ' 작품 ', role: '', year: 2024 }],
    });
    // Assert
    expect(body).toEqual({
      profileImageUrl: null,
      intro: null,
      snsUrl: null,
      activityStart: '2020-03-01',
      displayOrder: 3,
      filmography: [{ title: '작품', role: null, year: 2024 }],
    });
  });
});
