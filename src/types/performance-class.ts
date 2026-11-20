// 반(FN-10) — develop §3.4 "반". time = "HH:mm"(KST 벽시계), deadline = "YYYY-MM-DD".
import type { ClassStatus, DayCode } from '@/src/types/codes';

export interface ClassItemResponse {
  id: string;
  performanceId: string;
  name: string;
  daysOfWeek: DayCode[];
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  location: string | null;
  status: ClassStatus;
  createdAt: string;
}

export interface ClassUpsertRequest {
  name: string;
  daysOfWeek: DayCode[];
  startTime?: string | null;
  endTime?: string | null;
  deadline?: string | null;
  location?: string | null;
  status: ClassStatus;
}

export interface PerformanceClass {
  id: string;
  performanceId: string;
  name: string;
  daysOfWeek: DayCode[];
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  location: string | null;
  status: ClassStatus;
  createdAt: string;
}

export interface ClassFormInput {
  name: string;
  daysOfWeek: DayCode[];
  startTime: string;
  endTime: string;
  deadline: string;
  location: string;
  status: ClassStatus;
}
