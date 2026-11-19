import { describe, expect, it } from 'vitest';

import {
  hasActorProfileFormError,
  toActorProfileForm,
  toActorProfileInput,
  validateActorProfileForm,
  type ActorProfileForm,
} from '@/src/sections/members/utils/actor-profile-form';
import {
  toMemberListQuery,
  toMemberRowDisplay,
} from '@/src/sections/members/utils/member-display';
import type { ActorProfile, Member } from '@/src/types/member';

const member: Member = {
  id: 'm1',
  name: 'fixture-1-w2-배우',
  type: 'ACTOR',
  phone: null,
  isVisible: true,
  joinedAt: '2026-11-19',
  createdAt: '2026-11-18T16:00:00.000Z',
  profileImageUrl: null,
};

const profile: ActorProfile = {
  memberId: 'm1',
  profileImageUrl: 'https://example.test/a.png',
  intro: null,
  snsUrl: 'https://instagram.com/fixture',
  activityStart: null,
  displayOrder: 3,
  filmography: [{ title: 'fixture-작품', role: null, year: 2024 }],
};

const form = (over: Partial<ActorProfileForm> = {}): ActorProfileForm => ({
  isVisible: true,
  intro: '',
  snsUrl: '',
  activityStart: '',
  displayOrder: '0',
  filmography: [],
  ...over,
});

describe('member-display', () => {
  it('전체 필터는 type 없이, 배우 필터는 ACTOR 로 20건 페이지를 묻는다', () => {
    expect(toMemberListQuery('ALL', 2)).toEqual({
      type: undefined,
      page: 2,
      size: 20,
    });
    expect(toMemberListQuery('ACTOR', 1).type).toBe('ACTOR');
  });

  it('행을 라벨·tone·연락처 "-"·가입일(joinedAt)로 가공한다', () => {
    // Act
    const row = toMemberRowDisplay(member);
    // Assert
    expect(row.typeLabel).toBe('배우');
    expect(row.typeTone).toBe('info');
    expect(row.phoneText).toBe('-');
    expect(row.joinedText).toBe('2026.11.19');
  });

  it('joinedAt 이 없으면 createdAt 의 KST 날짜를 가입일로 쓴다', () => {
    const row = toMemberRowDisplay({ ...member, joinedAt: null });
    expect(row.joinedText).toBe('2026.11.19');
  });
});

describe('actor-profile-form', () => {
  it('서버 프로필과 단원 노출 여부로 폼을 채운다', () => {
    // Arrange
    let n = 0;
    // Act
    const result = toActorProfileForm(member, profile, () => `k${(n += 1)}`);
    // Assert
    expect(result.isVisible).toBe(true);
    expect(result.intro).toBe('');
    expect(result.displayOrder).toBe('3');
    expect(result.filmography).toEqual([
      { key: 'k1', title: 'fixture-작품', role: '', year: '2024' },
    ]);
  });

  it('소개가 201자면 기획 문구로 막는다', () => {
    const errors = validateActorProfileForm(form({ intro: 'a'.repeat(201) }));
    expect(errors.intro).toBe('한 줄 소개는 200자 이내로 입력해주세요.');
    expect(hasActorProfileFormError(errors)).toBe(true);
  });

  it('소개 200자는 통과한다', () => {
    expect(
      hasActorProfileFormError(
        validateActorProfileForm(form({ intro: 'a'.repeat(200) }))
      )
    ).toBe(false);
  });

  it('노출 순서가 0~9999 밖이면 도움말 문구를 오류로 쓴다', () => {
    expect(
      validateActorProfileForm(form({ displayOrder: '10000' })).displayOrder
    ).toBe('0~9999');
    expect(
      validateActorProfileForm(form({ displayOrder: '' })).displayOrder
    ).toBeNull();
  });

  it('출연작 작품명이 비거나 연도가 1900~2100 밖이면 그 칸을 오류로 표시한다', () => {
    const errors = validateActorProfileForm(
      form({
        filmography: [
          { key: 'a', title: ' ', role: '', year: '1899' },
          { key: 'b', title: 'ok', role: '', year: '2100' },
        ],
      })
    );
    expect(errors.filmography).toEqual([
      { title: true, year: true },
      { title: false, year: false },
    ]);
  });

  it('폼을 저장 모델로 바꾼다 — 노출 순서 빈 값은 0, 연도는 숫자, 사진은 넘긴 값', () => {
    const result = toActorProfileInput(
      form({
        displayOrder: '',
        filmography: [{ key: 'a', title: 't', role: '', year: ' 2020 ' }],
      }),
      'm1',
      'https://example.test/a.png'
    );
    expect(result.displayOrder).toBe(0);
    expect(result.filmography).toEqual([{ title: 't', role: '', year: 2020 }]);
    expect(result.profileImageUrl).toBe('https://example.test/a.png');
  });
});
