import { describe, expect, it } from 'vitest';

import {
  emptyRoomBlockForm,
  END_TIMES,
  oneYearLater,
  START_TIMES,
  toRoomBlockRequest,
  toRoomBlockRow,
  validateRoomBlockForm,
} from '@/src/sections/room-blocks/utils/room-block-form';

describe('room-block-form', () => {
  it('기본값은 매주 오늘 요일 10:00~18:00, 종료일은 1년 뒤', () => {
    expect(emptyRoomBlockForm('2026-11-23')).toEqual({
      title: '',
      memo: '',
      repeat: 'WEEKLY',
      weekdays: [1],
      startTime: '10:00',
      endTime: '18:00',
      startDate: '2026-11-23',
      endDate: '2027-11-23',
    });
    expect(oneYearLater('2028-02-29')).toBe('2029-03-01');
  });

  it('시각 칸은 30분 단위이고 끝은 24:00 까지', () => {
    expect(START_TIMES[0]).toBe('00:00');
    expect(START_TIMES.at(-1)).toBe('23:30');
    expect(END_TIMES[0]).toBe('00:30');
    expect(END_TIMES.at(-1)).toBe('24:00');
  });

  it('검증 — 제목·요일·시간·기간', () => {
    const form = emptyRoomBlockForm('2026-11-23');
    expect(validateRoomBlockForm({ ...form, title: '고정 사용' })).toEqual({});
    expect(
      validateRoomBlockForm({
        ...form,
        weekdays: [],
        endTime: '10:00',
        endDate: '2026-11-22',
      })
    ).toEqual({
      title: '제목을 입력해주세요.',
      weekdays: '반복할 요일을 하나 이상 골라주세요.',
      time: '끝 시각은 시작보다 30분 이상 뒤여야 합니다.',
      dates: '종료일은 시작일과 같거나 뒤여야 합니다.',
    });
    expect(
      validateRoomBlockForm({ ...form, title: 'x', endDate: '2028-11-24' })
        .dates
    ).toBe('기간은 2년 이내로 정해주세요.');
  });

  it('하루만이면 요일을 비우고 종료일 = 시작일로 보낸다', () => {
    expect(
      toRoomBlockRequest({
        ...emptyRoomBlockForm('2026-11-23'),
        title: ' 대관 ',
        memo: ' ',
        repeat: 'NONE',
      })
    ).toEqual({
      title: '대관',
      memo: null,
      repeat: 'NONE',
      weekdays: [],
      startTime: '10:00',
      endTime: '18:00',
      startDate: '2026-11-23',
      endDate: '2026-11-23',
    });
  });

  it('목록 줄은 반복·시간·기간·해제한 날 글자를 만든다', () => {
    expect(
      toRoomBlockRow({
        id: 'b',
        title: '고정 사용',
        memo: null,
        repeat: 'WEEKLY',
        weekdays: [3, 1],
        startTime: '19:00',
        endTime: '24:00',
        startDate: '2026-11-23',
        endDate: '2027-11-23',
        skipDates: ['2026-12-02'],
      })
    ).toEqual({
      id: 'b',
      title: '고정 사용',
      repeatText: '매주 월·수',
      timeText: '19:00–24:00',
      periodText: '2026.11.23 – 2027.11.23',
      skipText: '12.02',
    });
  });
});
