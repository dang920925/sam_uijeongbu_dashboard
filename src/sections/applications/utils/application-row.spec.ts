import { describe, expect, it } from 'vitest';

import {
  getApplicationAction,
  joinAgeGender,
  toApplicationRow,
  toRegisterFormInitial,
} from '@/src/sections/applications/utils/application-row';
import type { Application } from '@/src/types/application';

const APP: Application = {
  id: 'a1',
  appType: 'CONSULTATION',
  applicantName: 'fixture-1-w3-신청자',
  phone: '010-1234-5678',
  performance: null,
  preferredDate: null,
  preferredTime: 'WEEKDAY_EVENING',
  motivation: '  ',
  consultationMethod: 'PHONE',
  question: '문의',
  age: 20,
  gender: null,
  status: 'PENDING',
  processedAt: null,
  createdAt: '2026-11-18T15:30:00.000Z',
  member: null,
};

describe('application-row', () => {
  it('대기 신청은 승인·거절, 승인+미등록은 등록, 그 외는 상세만 고른다', () => {
    // Act & Assert
    expect(getApplicationAction(APP)).toBe('review');
    expect(getApplicationAction({ ...APP, status: 'APPROVED' })).toBe(
      'register'
    );
    expect(
      getApplicationAction({
        ...APP,
        status: 'APPROVED',
        member: { id: 'm1', name: 'n' },
      })
    ).toBe('none');
    expect(getApplicationAction({ ...APP, status: 'REJECTED' })).toBe('none');
  });

  it('나이 / 성별은 있는 값만 잇고 둘 다 없으면 null 이다', () => {
    expect(joinAgeGender('20세', null)).toBe('20세');
    expect(joinAgeGender('20세', '여성')).toBe('20세 / 여성');
    expect(joinAgeGender(null, null)).toBeNull();
  });

  it('코드값을 대시보드 라벨로, 신청일을 KST 날짜로 바꾼다', () => {
    // Act
    const row = toApplicationRow(APP);
    // Assert
    expect(row).toMatchObject({
      ageGender: '20세',
      methodLabel: '전화',
      preferredTimeLabel: '평일 저녁 (18~21시)',
      createdAt: '2026.11.19',
      statusLabel: '대기',
      statusTone: 'warning',
      detailTitle: '💬 방문 상담 신청 상세',
      motivation: null,
      question: '문의',
    });
  });

  it('등록된 단원은 단원 관리 패널 링크로 만든다', () => {
    // Act
    const row = toApplicationRow({
      ...APP,
      appType: 'WORK_OBSERVATION',
      status: 'APPROVED',
      preferredDate: '2026-12-01',
      member: { id: 'm 1', name: 'fixture-1-w3-단원' },
    });
    // Assert
    expect(row.member).toEqual({
      name: 'fixture-1-w3-단원',
      href: '/members?member=m%201',
    });
    expect(row.preferredDate).toBe('2026.12.01');
    expect(row.detailTitle).toBe('🎭 작품 참관 신청 상세');
  });

  it('등록 폼 초기값은 신청자 이름·연락처와 구분 일반이다', () => {
    expect(toRegisterFormInitial(APP)).toEqual({
      name: 'fixture-1-w3-신청자',
      phone: '010-1234-5678',
      type: 'GENERAL',
    });
  });
});
