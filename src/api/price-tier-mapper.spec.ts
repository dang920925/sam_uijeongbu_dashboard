import { describe, expect, it } from 'vitest';

import {
  buildTierLink,
  EMPTY_PRICE_TIER_FORM,
  fromAdminPriceTierResponse,
  fromInviteCodeItemResponse,
  toPriceTierCreateRequest,
  toPriceTierFormInput,
} from '@/src/api/price-tier-mapper';

const RESPONSE = {
  id: 't1',
  name: 'fixture-스태프',
  price: 10000,
  visibility: 'LINK_ONLY' as const,
  linkToken: 'fixtureToken_0000000000',
  sortOrder: 1,
  isActive: true,
  usedQty: 2,
};

describe('price-tier-mapper', () => {
  it('이름 공백을 지우고 가격은 정수로 추가 요청을 만든다(순서는 서버가 정함)', () => {
    // Act
    const request = toPriceTierCreateRequest({
      ...EMPTY_PRICE_TIER_FORM,
      name: ' 일반 ',
      price: '15000',
    });
    // Assert
    expect(request).toEqual({
      name: '일반',
      price: 15000,
      visibility: 'PUBLIC',
      isActive: true,
    });
  });

  it('응답을 화면 모델로 옮기고 수정 폼 값으로 바꾼다', () => {
    const tier = fromAdminPriceTierResponse(RESPONSE);
    expect(tier).toEqual(RESPONSE);
    expect(toPriceTierFormInput(tier)).toEqual({
      name: 'fixture-스태프',
      price: '10000',
      visibility: 'LINK_ONLY',
      isActive: true,
    });
  });

  it('등급 링크를 만들고 단원 코드가 있으면 &ref= 를 붙인다, 주소·토큰이 없으면 null', () => {
    const base = 'https://fixture.example';
    expect(buildTierLink(base, 'p1', 'tok')).toBe(
      'https://fixture.example/works/p1/book?tier=tok'
    );
    expect(buildTierLink(base, 'p1', 'tok', 'ABC234')).toBe(
      'https://fixture.example/works/p1/book?tier=tok&ref=ABC234'
    );
    expect(buildTierLink(null, 'p1', 'tok')).toBeNull();
    expect(buildTierLink(base, 'p1', null)).toBeNull();
  });

  it('초대 코드 목록 항목을 단원 모델로 옮긴다', () => {
    expect(
      fromInviteCodeItemResponse({
        memberId: 'm1',
        name: 'fixture-단원',
        type: 'ACTOR',
        inviteCode: null,
      })
    ).toEqual({ memberId: 'm1', name: 'fixture-단원', inviteCode: null });
  });
});
