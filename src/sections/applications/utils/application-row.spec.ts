import { describe, expect, it } from 'vitest';

import {
  getApplicationAction,
  joinAgeGender,
  toApplicationRow,
  toContactView,
  toProgressView,
  toRegisterFormInitial,
  toScheduleText,
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
  interestedPerformances: [],
  interestUndecided: null,
  contactedAt: null,
  contactNote: null,
  progress: 'RECEIVED',
  progressUpdatedAt: null,
  scheduleCancellation: null,
};

describe('application-row', () => {
  it('(U39) 미등록이면 대기·승인 모두 등록, 등록됨·옛 거절은 상세만 고른다', () => {
    // Act & Assert
    expect(getApplicationAction(APP)).toBe('register');
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
      detailTitle: '💬 방문 상담 신청 상세',
      motivation: null,
      question: '문의',
    });
    // (U39) 처리 상태 배지·처리일은 표시 모델에 없다
    expect(row).not.toHaveProperty('statusLabel');
    expect(row).not.toHaveProperty('processedAt');
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

  it('연락 시각을 목록 MM.DD HH:mm · 상세 YYYY.MM.DD HH:mm(KST)으로, 연락 전은 null 로 만든다', () => {
    // Act
    const done = toContactView({
      contactedAt: '2026-11-20T05:30:00.000Z',
      contactNote: '문자 보냄',
    });
    const before = toContactView({ contactedAt: null, contactNote: null });
    // Assert
    expect(done).toEqual({
      isContacted: true,
      shortTime: '11.20 14:30',
      fullTime: '2026.11.20 14:30',
      note: '문자 보냄',
    });
    expect(before).toEqual({
      isContacted: false,
      shortTime: null,
      fullTime: null,
      note: '',
    });
  });

  it('진행 메뉴 항목은 유형별 단계·이름이고 참관에는 입단이 없다', () => {
    // Act
    const visit = toProgressView({
      appType: 'WORK_OBSERVATION',
      progress: 'SCHEDULED',
      status: 'APPROVED',
    });
    const consult = toProgressView({
      appType: 'CONSULTATION',
      progress: 'JOINED',
      status: 'APPROVED',
    });
    // Assert
    expect(visit.options.map((o) => o.label)).toEqual([
      '접수',
      '일정 확정',
      '참관 완료',
      '불참',
    ]);
    expect(visit).toMatchObject({ label: '일정 확정', tone: 'info' });
    expect(consult.options.map((o) => o.label)).toEqual([
      '접수',
      '상담 예정',
      '상담 완료',
      '입단',
      '보류',
    ]);
    expect(consult).toMatchObject({ isJoined: true, tone: 'success' });
  });

  it('스텝퍼는 지금 단계 앞을 done, 뒤를 todo 로 두고 불참/보류는 따로 둔다', () => {
    // Act
    const view = toProgressView({
      appType: 'CONSULTATION',
      progress: 'COMPLETED',
      status: 'APPROVED',
    });
    const dropped = toProgressView({
      appType: 'WORK_OBSERVATION',
      progress: 'DROPPED',
      status: 'APPROVED',
    });
    // Assert
    expect(view.steps.map((s) => [s.label, s.state])).toEqual([
      ['접수', 'done'],
      ['상담 예정', 'done'],
      ['상담 완료', 'current'],
      ['입단', 'todo'],
    ]);
    expect(view.exit).toEqual({
      value: 'DROPPED',
      label: '보류',
      state: 'todo',
    });
    expect(dropped.steps.every((s) => s.state === 'todo')).toBe(true);
    expect(dropped.exit.state).toBe('current');
  });

  it('거절된 신청은 진행이 잠기고 불참/보류는 외곽선이다', () => {
    // Act
    const view = toProgressView({
      appType: 'CONSULTATION',
      progress: 'DROPPED',
      status: 'REJECTED',
    });
    // Assert
    expect(view).toMatchObject({
      label: '보류',
      isLocked: true,
      isOutline: true,
      isJoined: false,
    });
  });

  it('희망 일정은 참관 날짜, 상담 "방법 · 시간"이고 없으면 - 이다', () => {
    expect(
      toScheduleText({
        appType: 'WORK_OBSERVATION',
        preferredDate: '2026-12-13',
        consultationMethod: null,
        preferredTime: null,
      })
    ).toBe('2026.12.13');
    expect(toScheduleText(APP)).toBe('전화 · 평일 저녁 (18~21시)');
    expect(
      toScheduleText({ ...APP, consultationMethod: null, preferredTime: null })
    ).toBe('-');
  });

  it('참관 행은 참관 작품과 관심 작품을 따로 들고 일정 취소 사유를 붙인다', () => {
    // Act
    const row = toApplicationRow({
      ...APP,
      appType: 'WORK_OBSERVATION',
      performance: { id: 'p1', title: 'HADESTOWN' },
      preferredDate: '2026-12-13',
      interestedPerformances: [
        { id: 'p2', title: 'Dear' },
        { id: 'p3', title: '안내놔? 못내놔!' },
      ],
      scheduleCancellation: { scheduleId: 's1', reason: '공연 단체관람' },
    });
    // Assert
    expect(row.typeLabel).toBe('참관');
    expect(row.observationWork).toBe('HADESTOWN');
    expect(row.interestTitle).toBe('관심 작품');
    expect(row.interestChips.map((c) => c.text)).toEqual([
      'Dear',
      '안내놔? 못내놔!',
    ]);
    expect(row.workChips.lg.visible.map((c) => c.text)).toEqual([
      '참관 HADESTOWN',
      'Dear',
    ]);
    expect(row.workChips.lg.overflow).toBe(1);
    expect(row.scheduleCancelReason).toBe('사유: 공연 단체관람');
    expect(row.telHref).toBe('tel:01012345678');
  });

  it('작품 정보가 없는 옛 상담 건은 작품 칸이 비고 희망 작품 제목을 쓴다', () => {
    // Act
    const row = toApplicationRow(APP);
    // Assert
    expect(row.isWorkEmpty).toBe(true);
    expect(row.interestTitle).toBe('희망 작품');
    expect(row.observationWork).toBeNull();
    expect(row.scheduleCancelReason).toBeNull();
  });
});
