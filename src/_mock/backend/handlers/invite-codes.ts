// ----------------------------------------------------------------------
// 목 단원 초대 코드(FN-35) — develop §11.4. 코드 6자 [A-HJ-NP-Z2-9](0·1·I·O 제외), 재발급은 이전 코드 무효.
// ----------------------------------------------------------------------
import { findMember } from '@/src/_mock/backend/handlers/members';
import { apiError, json, type MockRoute } from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newInviteCode(): string {
  const used = new Set(getStore().inviteCodes.values());
  for (;;) {
    const code = Array.from(
      { length: 6 },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    ).join('');
    if (!used.has(code)) return code;
  }
}

export const inviteCodeRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/members\/invite-codes$/,
    auth: true,
    handle: () => {
      const store = getStore();
      const items = store.members
        .filter((m) => m.deletedAt === null)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        .map((m) => ({
          memberId: m.id,
          name: m.name,
          type: m.type,
          inviteCode: store.inviteCodes.get(m.id) ?? null,
        }));
      return json({ items });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/members\/(?<id>[^/]+)\/invite-code$/,
    auth: true,
    handle: (ctx) => {
      if (!findMember(ctx.params.id))
        return apiError(ctx, 404, 'MEM_001', '단원 정보를 찾을 수 없습니다.');
      const inviteCode = newInviteCode();
      getStore().inviteCodes.set(ctx.params.id, inviteCode);
      return json({ memberId: ctx.params.id, inviteCode });
    },
  },
];
