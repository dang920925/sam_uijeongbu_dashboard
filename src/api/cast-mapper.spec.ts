import {
  fromAdminCreditResponse,
  fromAdminRoleResponse,
  toCreditFormInput,
  toCreditRequest,
  toRoleRequest,
} from '@/src/api/cast-mapper';

describe('cast-mapper', () => {
  it('배역 응답의 "출연" 묶음 name null 과 캐스트 메모 null 을 유지한다', () => {
    const role = fromAdminRoleResponse({
      id: 'r1',
      name: null,
      description: null,
      sortOrder: 0,
      isRecruiting: false,
      publicNow: true,
      defaultCast: [
        {
          actorProfileId: 'p1',
          memberId: 'm1',
          name: 'fixture-배우',
          isVisible: true,
          note: null,
        },
      ],
    });

    expect(role.name).toBeNull();
    expect(role.defaultCast[0].note).toBeNull();
  });

  it('배역 폼 — 출연 묶음이면 이름 null, 빈 설명은 null 이다', () => {
    expect(
      toRoleRequest({ isEnsemble: true, name: '무시', description: ' ' })
    ).toEqual({ name: null, description: null });
    expect(
      toRoleRequest({ isEnsemble: false, name: ' 햄릿 ', description: '왕자' })
    ).toEqual({ name: '햄릿', description: '왕자' });
  });

  it('참여자 폼 — 고른 갈래 하나만 보내고 이름만이면 displayName 이다', () => {
    const base = {
      title: ' 연출 ',
      staffId: 's1',
      memberId: 'm1',
      displayName: ' fixture-이름 ',
      isVisible: false,
    };

    expect(toCreditRequest({ ...base, kind: 'staff' })).toEqual({
      title: '연출',
      staffId: 's1',
      memberId: null,
      displayName: null,
      isVisible: false,
    });
    expect(toCreditRequest({ ...base, kind: 'member' }).memberId).toBe('m1');
    expect(toCreditRequest({ ...base, kind: 'name' })).toMatchObject({
      staffId: null,
      memberId: null,
      displayName: 'fixture-이름',
    });
  });

  it('참여자 → 폼 초기값은 연결 대상으로 갈래를 정한다', () => {
    const credit = fromAdminCreditResponse({
      id: 'c1',
      title: '조연출',
      staff: null,
      member: { id: 'm1', name: 'fixture-단원', isVisible: true },
      displayName: 'fixture-단원',
      sortOrder: 0,
      isVisible: true,
      publicNow: true,
    });

    expect(toCreditFormInput(credit)).toEqual({
      title: '조연출',
      kind: 'member',
      staffId: null,
      memberId: 'm1',
      displayName: '',
      isVisible: true,
    });
  });
});
