import { describe, expect, it } from 'vitest';

import {
  fromApplicationItemResponse,
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
});
