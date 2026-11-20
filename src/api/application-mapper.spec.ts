import { describe, expect, it } from 'vitest';

import {
  fromApplicationItemResponse,
  toApplicationContactRequest,
  toRegisterMemberFromApplicationRequest,
} from '@/src/api/application-mapper';
import type { ApplicationItemResponse } from '@/src/types/application';

const BASE: ApplicationItemResponse = {
  id: 'a1',
  appType: 'WORK_OBSERVATION',
  applicantName: 'fixture-1-w3-신청자',
  phone: '010-1234-5678',
  performance: { id: 'p1', title: 'fixture-1-w3-공연' },
  preferredDate: '2026-12-01',
  preferredTime: null,
  motivation: null,
  consultationMethod: null,
  question: null,
  age: 20,
  gender: null,
  status: 'APPROVED',
  processedAt: '2026-11-19T01:00:00.000Z',
  createdAt: '2026-11-18T01:00:00.000Z',
  member: { id: 'm1', name: 'fixture-1-w3-단원' },
  interestedPerformances: [],
  interestUndecided: null,
  contactedAt: null,
  contactNote: null,
  progress: 'RECEIVED',
  progressUpdatedAt: null,
  scheduleCancellation: null,
};

describe('application-mapper', () => {
  it('등록된 단원·연결 공연을 화면 모델에 그대로 옮긴다', () => {
    // Act
    const app = fromApplicationItemResponse(BASE);
    // Assert
    expect(app.member).toEqual({ id: 'm1', name: 'fixture-1-w3-단원' });
    expect(app.performance).toEqual({ id: 'p1', title: 'fixture-1-w3-공연' });
    expect(app.status).toBe('APPROVED');
  });

  it('생략된 선택 필드는 null 로 맞춘다', () => {
    // Arrange
    const res = {
      ...BASE,
      performance: null,
      member: null,
      preferredDate: undefined,
      age: undefined,
      processedAt: undefined,
    } as unknown as ApplicationItemResponse;
    // Act
    const app = fromApplicationItemResponse(res);
    // Assert
    expect(app).toMatchObject({
      performance: null,
      member: null,
      preferredDate: null,
      age: null,
      processedAt: null,
    });
  });

  it('단원으로 등록 요청은 이름 공백을 지우고 빈 연락처를 null 로 보낸다', () => {
    // Act
    const body = toRegisterMemberFromApplicationRequest({
      name: '  fixture-1-w3-신청자 ',
      phone: '   ',
      type: 'ACTOR',
    });
    // Assert
    expect(body).toEqual({
      name: 'fixture-1-w3-신청자',
      phone: null,
      type: 'ACTOR',
    });
  });

  it('U31 관심 작품·연락·진행과 U29 일정 취소를 화면 모델로 옮긴다', () => {
    // Act
    const app = fromApplicationItemResponse({
      ...BASE,
      interestedPerformances: [{ id: 'p2', title: 'fixture-1-w3-관심' }],
      interestUndecided: false,
      contactedAt: '2026-11-20T05:30:00.000Z',
      contactNote: '참관 안내 문자',
      progress: 'SCHEDULED',
      scheduleCancellation: { scheduleId: 's1', reason: '공연 단체관람' },
    });
    // Assert
    expect(app.interestedPerformances).toEqual([
      { id: 'p2', title: 'fixture-1-w3-관심' },
    ]);
    expect(app.contactedAt).toBe('2026-11-20T05:30:00.000Z');
    expect(app.progress).toBe('SCHEDULED');
    expect(app.scheduleCancellation).toEqual({
      scheduleId: 's1',
      reason: '공연 단체관람',
    });
  });

  it('U31 필드가 없는 옛 응답은 빈 목록·연락 전·접수로 맞춘다', () => {
    // Arrange
    const old = { ...BASE } as Partial<ApplicationItemResponse>;
    delete old.interestedPerformances;
    delete old.progress;
    delete old.contactedAt;
    delete old.scheduleCancellation;
    // Act
    const app = fromApplicationItemResponse(old as ApplicationItemResponse);
    // Assert
    expect(app.interestedPerformances).toEqual([]);
    expect(app.progress).toBe('RECEIVED');
    expect(app.contactedAt).toBeNull();
    expect(app.scheduleCancellation).toBeNull();
  });

  it('연락 요청은 메모를 넘기지 않으면 note 키가 없고, 빈 메모는 null 이다', () => {
    // Act & Assert
    expect(toApplicationContactRequest(true)).toEqual({ contacted: true });
    expect(toApplicationContactRequest(false, '  ')).toEqual({
      contacted: false,
      note: null,
    });
    expect(toApplicationContactRequest(true, ' 12/6 문자 ')).toEqual({
      contacted: true,
      note: '12/6 문자',
    });
  });
});
