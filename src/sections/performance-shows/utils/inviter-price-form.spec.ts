import {
  toInviterPriceForm,
  toInviterPricesRequest,
  validateInviterPriceForm,
} from '@/src/sections/performance-shows/utils/inviter-price-form';

describe('inviter-price-form (U41)', () => {
  it('서버 값을 폼으로 옮기고 없는 가격은 빈 칸이다', () => {
    expect(toInviterPriceForm({ base: 20000, samRelated: null })).toEqual({
      base: '20000',
      samRelated: '',
    });
    expect(toInviterPriceForm(null)).toEqual({ base: '', samRelated: '' });
  });

  it('둘 다 필수이고 1~1,000,000원 정수만 통과한다', () => {
    expect(validateInviterPriceForm({ base: '', samRelated: '0' })).toEqual({
      base: '가격을 입력해주세요',
      samRelated: '1원부터 1,000,000원까지 입력해주세요',
    });
    expect(
      validateInviterPriceForm({ base: '20,000', samRelated: '10000' })
    ).toEqual({ base: null, samRelated: null });
  });

  it('쉼표를 지우고 정수로 보낸다', () => {
    expect(
      toInviterPricesRequest({ base: '20,000', samRelated: ' 10000 ' })
    ).toEqual({ base: 20000, samRelated: 10000 });
  });
});
