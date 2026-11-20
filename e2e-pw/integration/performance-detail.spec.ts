// ----------------------------------------------------------------------
// 연동 SCR-D04 공연 상세·반 관리(FN-09·10) — 실서버 /admin/performances/{id}(·/classes), /admin/classes*.
// - 정보 카드: 서버 createdAt(UTC) → KST 등록일, 노출·상세 이미지 수·설명. 404: 없는 UUID(PERF_001)·소프트 삭제 공연,
//   UUID 아닌 id(서버 400 COMMON_001 → 요청 함수가 404 로 번역).
// - 반: 요일 DayCode[] → "월, 수", 시간 "HH:mm ~ HH:mm", 마감 date → 'YYYY.MM.DD'.
//   충돌 사전 경고(다른 공연 반 포함, GET /admin/classes?status=ACTIVE), 화면이 모르는 새 반과 겹치면 서버 409 CLS_002 문구,
//   마감 지난 반·비활성 반과는 충돌 없음, 종료 ≤ 시작은 서버도 400 CLS_003.
// - 반 수정(PATCH — 요일 전체 교체)·삭제(DELETE, 확인창), 공연 수정 + 노출 토글(D5).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('perf-detail');
const API = '/api/backend/v1';
const UNKNOWN_ID = '0190f000-0000-7000-8000-00000000ffff';

interface Created {
  id: string;
  createdAt: string;
}

interface ClassItem {
  id: string;
  name: string;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  deadline: string | null;
  location: string | null;
  status: string;
}

function kstDate(offsetDays = 0, from = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(from + offsetDays * 24 * 60 * 60 * 1000)
  );
}

function createPerformance(title: string): Promise<Created> {
  return adminApi<Created>('POST', '/admin/performances', {
    title,
    type: 'MUSICAL',
    status: 'ONGOING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
}

function createClass(
  performanceId: string,
  body: Record<string, unknown>
): Promise<ClassItem> {
  return adminApi<ClassItem>(
    'POST',
    `/admin/performances/${performanceId}/classes`,
    {
      name: `${PREFIX}기존반`,
      daysOfWeek: ['MON'],
      startTime: '19:00',
      endTime: '21:00',
      deadline: null,
      location: null,
      status: 'ACTIVE',
      ...body,
    }
  );
}

const visible = (page: Page, text: string) =>
  page.getByText(text, { exact: true }).filter({ visible: true }).first();

async function openAddDialog(page: Page) {
  await page.getByRole('button', { name: '반 추가' }).click();
  const dialog = page.getByRole('dialog', { name: '반 추가' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillSlot(
  page: Page,
  name: string,
  day: string,
  start: string,
  end: string
) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('반 이름').fill(name);
  await dialog.getByRole('button', { name: day, exact: true }).click();
  await dialog.getByLabel('시작 시간').fill(start);
  await dialog.getByLabel('종료 시간').fill(end);
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('연동 SCR-D04 공연 상세 — 현재 상태(404)', () => {
  test('없는 공연 id 면 "공연을 찾을 수 없습니다"(404 PERF_001)', async ({
    page,
  }) => {
    // Act
    const detail = page.waitForResponse(`**/admin/performances/${UNKNOWN_ID}`);
    await page.goto(`/performances/${UNKNOWN_ID}`);
    // Assert
    const response = await detail;
    expect(response.status()).toBe(404);
    expect(((await response.json()) as { code: string }).code).toBe('PERF_001');
    await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toHaveCount(
      0
    );
  });

  test('UUID 가 아닌 id(서버 400 COMMON_001)도 "공연을 찾을 수 없습니다" 를 보인다', async ({
    page,
  }) => {
    // Act
    const detail = page.waitForResponse('**/admin/performances/not-a-uuid');
    await page.goto('/performances/not-a-uuid');
    // Assert
    expect((await detail).status()).toBe(400);
    await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
    await expect(page.getByText('id 형식이 올바르지 않습니다.')).toHaveCount(0);
  });
});

test.describe('연동 SCR-D04 공연 상세 — 채운 상태', () => {
  test.afterEach(() => cleanupFixtures(FIXTURE_BASE));

  test('정보 카드에 라벨·KST 등록일·비노출·상세 이미지 수·설명을 보이고 빈 반 문구를 보인다', async ({
    page,
  }) => {
    // Arrange
    const title = `${PREFIX}상세 공연`;
    const created = await createPerformance(title);
    // Act
    await page.goto(`/performances/${created.id}`);
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: title })
    ).toBeVisible();
    await expect(visible(page, '뮤지컬')).toBeVisible();
    await expect(visible(page, '진행중')).toBeVisible();
    await expect(
      visible(
        page,
        kstDate(0, Date.parse(created.createdAt)).replaceAll('-', '.')
      )
    ).toBeVisible();
    await expect(visible(page, '비노출')).toBeVisible();
    await expect(visible(page, '0장')).toBeVisible();
    await expect(visible(page, `${PREFIX}설명`)).toBeVisible();
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
  });

  test('소프트 삭제한 공연은 404 화면이다', async ({ page }) => {
    // Arrange
    const created = await createPerformance(`${PREFIX}삭제 공연`);
    await adminApi('DELETE', `/admin/performances/${created.id}`);
    // Act
    await page.goto(`/performances/${created.id}`);
    // Assert
    await expect(page.getByText('공연을 찾을 수 없습니다')).toBeVisible();
  });

  test('반 목록에 요일·"HH:mm ~ HH:mm"·마감일·상태를 보이고 ← 로 공연 관리로 돌아간다', async ({
    page,
  }) => {
    // Arrange — 요일은 보낸 순서와 무관하게 월→일(서버도 월→일로 준다)
    const { id } = await createPerformance(`${PREFIX}목록`);
    const created = await createClass(id, {
      name: `${PREFIX}A반`,
      daysOfWeek: ['WED', 'MON'],
      deadline: '2030-01-31',
    });
    expect(created.daysOfWeek).toEqual(['MON', 'WED']);
    // 비활성 반
    await createClass(id, {
      name: `${PREFIX}쉬는반`,
      daysOfWeek: [],
      startTime: null,
      endTime: null,
      status: 'INACTIVE',
    });
    // Act
    await page.goto(`/performances/${id}`);
    // Assert
    const row = page.getByRole('row').filter({ hasText: `${PREFIX}A반` });
    await expect(row).toContainText('월, 수');
    await expect(row).toContainText('19:00 ~ 21:00');
    await expect(row).toContainText('2030.01.31');
    await expect(row).toContainText('활성');
    const inactive = page
      .getByRole('row')
      .filter({ hasText: `${PREFIX}쉬는반` });
    await expect(inactive).toContainText('비활성');
    await expect(inactive.getByText('-', { exact: true })).toHaveCount(3);
    await page.getByRole('link', { name: '공연 관리로 돌아가기' }).click();
    await expect(page).toHaveURL(/\/performances$/);
  });

  test('다른 공연의 월 19:00~21:00 반과 겹치는 월 20:00~22:00 은 경고하고 추가를 막는다', async ({
    page,
  }) => {
    // Arrange
    const other = await createPerformance(`${PREFIX}다른 공연`);
    await createClass(other.id, {});
    const { id } = await createPerformance(`${PREFIX}새 공연`);
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    // Act
    await fillSlot(page, `${PREFIX}B반`, '월', '20:00', '22:00');
    // Assert
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: '추가' })).toBeDisabled();
    await expect(
      dialog.getByRole('button', { name: '월', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('화면이 모르는 사이 생긴 반과 겹치면 서버 409 CLS_002 문구를 다이얼로그 안에 보인다', async ({
    page,
  }) => {
    // Arrange — 화면(사전 경고 캐시)을 연 뒤에 충돌 반을 만든다
    const { id } = await createPerformance(`${PREFIX}409`);
    await page.goto(`/performances/${id}`);
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
    await createClass(id, {});
    const dialog = await openAddDialog(page);
    await fillSlot(page, `${PREFIX}C반`, '월', '20:00', '22:00');
    // Act
    const post = page.waitForResponse(
      (r) =>
        r.url().endsWith(`/admin/performances/${id}/classes`) &&
        r.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    const response = await post;
    expect(response.status()).toBe(409);
    expect(((await response.json()) as { code: string }).code).toBe('CLS_002');
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 다른 반이 있습니다')
    ).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('마감일이 어제인 반·비활성 반과는 같은 시간이라도 충돌 없이 추가된다(서버 201)', async ({
    page,
  }) => {
    // Arrange
    const { id } = await createPerformance(`${PREFIX}마감`);
    await createClass(id, { name: `${PREFIX}지난반`, deadline: kstDate(-1) });
    await createClass(id, {
      name: `${PREFIX}쉬는반`,
      daysOfWeek: ['TUE'],
      status: 'INACTIVE',
    });
    await page.goto(`/performances/${id}`);
    // Act — 마감 지난 반과 같은 슬롯
    let dialog = await openAddDialog(page);
    await fillSlot(page, `${PREFIX}D반`, '월', '19:00', '21:00');
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toHaveCount(0);
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog).toBeHidden();
    // Act — 비활성 반과 같은 슬롯
    dialog = await openAddDialog(page);
    await fillSlot(page, `${PREFIX}E반`, '화', '20:00', '22:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog).toBeHidden();
    // Assert
    await expect(visible(page, `${PREFIX}D반`)).toBeVisible();
    await expect(visible(page, `${PREFIX}E반`)).toBeVisible();
    const saved = await adminApi<{ items: ClassItem[] }>(
      'GET',
      `/admin/performances/${id}/classes`
    );
    expect(saved.items.map((c) => c.name)).toEqual([
      `${PREFIX}지난반`,
      `${PREFIX}쉬는반`,
      `${PREFIX}D반`,
      `${PREFIX}E반`,
    ]);
  });

  test('반 이름 빈 값·종료 ≤ 시작은 화면이 막고, 서버도 같은 경우 400 CLS_003 을 준다', async ({
    page,
  }) => {
    // Arrange
    const { id } = await createPerformance(`${PREFIX}검증`);
    await page.goto(`/performances/${id}`);
    const dialog = await openAddDialog(page);
    // Act
    await dialog.getByLabel('시작 시간').fill('21:00');
    await dialog.getByLabel('종료 시간').fill('20:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('반 이름을 입력해주세요.')).toBeVisible();
    await expect(
      dialog.getByText('종료 일시는 시작 일시 이후여야 합니다.')
    ).toBeVisible();
    // 서버 계약(BFF 경유) — 문구가 화면 사전 검증과 같다
    const response = await page.request.post(
      `${API}/admin/performances/${id}/classes`,
      {
        data: {
          name: `${PREFIX}역순반`,
          daysOfWeek: ['FRI'],
          startTime: '21:00',
          endTime: '20:00',
          status: 'ACTIVE',
        },
      }
    );
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'CLS_003',
      message: '종료 일시는 시작 일시 이후여야 합니다.',
    });
  });

  test('반 수정은 기존 값으로 열리고 요일·시간·마감·장소·상태를 PATCH 로 저장한다', async ({
    page,
  }) => {
    // Arrange
    const { id } = await createPerformance(`${PREFIX}수정`);
    const original = await createClass(id, {
      name: `${PREFIX}원래반`,
      location: `${PREFIX}연습실`,
    });
    await page.goto(`/performances/${id}`);
    // Act
    await page
      .getByRole('button', { name: `반 수정 ${PREFIX}원래반` })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole('dialog', { name: '반 수정' });
    await expect(dialog.getByLabel('반 이름')).toHaveValue(`${PREFIX}원래반`);
    await expect(dialog.getByLabel('시작 시간')).toHaveValue('19:00');
    await expect(dialog.getByLabel('장소')).toHaveValue(`${PREFIX}연습실`);
    await expect(
      dialog.getByText('선택한 요일/시간에 이미 운영 중인 반이 있습니다')
    ).toHaveCount(0);
    await dialog.getByLabel('반 이름').fill(`${PREFIX}바뀐반`);
    await dialog.getByRole('button', { name: '월', exact: true }).click();
    await dialog.getByRole('button', { name: '토', exact: true }).click();
    await dialog.getByLabel('시작 시간').fill('10:00');
    await dialog.getByLabel('종료 시간').fill('12:30');
    await dialog.getByLabel('마감일').fill('2030-03-01');
    await dialog.getByLabel('장소').fill('');
    // 상태 선택(MUI select — 다이얼로그 안 유일한 combobox)
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: '비활성' }).click();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: `${PREFIX}바뀐반` });
    await expect(row).toContainText('토');
    await expect(row).toContainText('10:00 ~ 12:30');
    await expect(row).toContainText('2030.03.01');
    await expect(row).toContainText('비활성');
    const saved = await adminApi<{ items: ClassItem[] }>(
      'GET',
      `/admin/performances/${id}/classes`
    );
    expect(saved.items).toEqual([
      expect.objectContaining({
        id: original.id,
        name: `${PREFIX}바뀐반`,
        daysOfWeek: ['SAT'],
        startTime: '10:00',
        endTime: '12:30',
        deadline: '2030-03-01',
        location: null,
        status: 'INACTIVE',
      }),
    ]);
  });

  test('반 삭제는 확인창 "반을 삭제하시겠습니까?" 를 거쳐 서버에서 지운다', async ({
    page,
  }) => {
    // Arrange
    const { id } = await createPerformance(`${PREFIX}삭제`);
    await createClass(id, { name: `${PREFIX}지울반` });
    await page.goto(`/performances/${id}`);
    // Act
    await page
      .getByRole('button', { name: `반 삭제 ${PREFIX}지울반` })
      .filter({ visible: true })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText('반을 삭제하시겠습니까?')).toBeVisible();
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(page.getByText('등록된 반이 없습니다')).toBeVisible();
    const saved = await adminApi<{ items: ClassItem[] }>(
      'GET',
      `/admin/performances/${id}/classes`
    );
    expect(saved.items).toEqual([]);
  });

  test('공연 수정에서 제목·홈페이지 노출(D5)을 바꾸면 상세·목록·서버 값이 바뀐다', async ({
    page,
  }) => {
    // Arrange — 비노출로 만든 공연
    const { id } = await createPerformance(`${PREFIX}수정 전`);
    await page.goto(`/performances/${id}`);
    // Act
    await page.getByRole('button', { name: '수정', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '공연 수정' });
    await expect(dialog.getByLabel('공연 제목')).toHaveValue(
      `${PREFIX}수정 전`
    );
    await expect(dialog.getByLabel('홈페이지 노출')).not.toBeChecked();
    await dialog.getByLabel('공연 제목').fill(`${PREFIX}수정 후`);
    await dialog.getByLabel('홈페이지 노출').check();
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole('heading', { level: 1, name: `${PREFIX}수정 후` })
    ).toBeVisible();
    await expect(visible(page, '노출')).toBeVisible();
    const saved = await adminApi<{ title: string; isVisible: boolean }>(
      'GET',
      `/admin/performances/${id}`
    );
    expect(saved).toMatchObject({ title: `${PREFIX}수정 후`, isVisible: true });
    await page.getByRole('link', { name: '공연 관리로 돌아가기' }).click();
    const row = page.getByRole('row', {
      name: `${PREFIX}수정 후 상세 보기`,
      exact: true,
    });
    await expect(row).toContainText('노출');
    await expect(row).not.toContainText('비노출');
  });
});
