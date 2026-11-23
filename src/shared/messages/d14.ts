// ----------------------------------------------------------------------
// SCR-D14 배역·캐스팅(R3 U26 · U33) 문구 — design §6 SCR-D14 · §12(모두 "제안") · develop §11.7 · §17.
// 오류 문구는 서버 계약 문구를 그대로 보인다(toApiErrorMessage).
// ----------------------------------------------------------------------
export const MSG_D14 = {
  TAB: '배역·캐스팅',
  /** 공개 스위치(design §12) */
  PUBLIC_TITLE: '홈페이지 공개',
  PUBLIC_SWITCH: '캐스트·참여자 홈페이지 공개',
  PUBLIC_HELP:
    '꺼져 있으면 배역·캐스트·참여자·캐스트 사진이 홈페이지 어디에도 보이지 않습니다. 배우·연출진의 개인정보 동의를 받은 뒤 켜주세요.',
  PUBLIC_LINKS_HELP: '배우·연출진 노출은 각 관리 화면에서 바꿉니다.',
  LINK_MEMBERS: '단원 관리',
  LINK_STAFF: '연출진 관리',
  /** 배역 목록 */
  ROLES_TITLE: '배역',
  ROLE_ADD: '배역 추가',
  ENSEMBLE_ADD_PERFORMER: '출연자 추가',
  ENSEMBLE: '출연',
  ENSEMBLE_OPTION: '출연(배역 없음) 묶음',
  ENSEMBLE_EXISTS_HELP: '출연 묶음은 하나만 만들 수 있습니다.',
  ROLES_EMPTY: '등록된 배역이 없습니다',
  ROLE_ADD_TITLE: '배역 추가',
  ROLE_EDIT_TITLE: '배역 수정',
  ROLE_NAME: '배역 이름',
  ROLE_NAME_PH: '예: 햄릿',
  ROLE_NAME_REQUIRED: '배역 이름을 입력해주세요',
  ROLE_DESCRIPTION: '배역 설명',
  RECRUITING: '모집 중',
  ACTOR_ADD: '배우 추가',
  ACTOR_REMOVE_ARIA: (name: string) => `${name} 빼기`,
  ROLE_EDIT_ARIA: (name: string) => `${name} 수정`,
  ROLE_DELETE_ARIA: (name: string) => `${name} 삭제`,
  MOVE_UP_ARIA: (name: string) => `${name} 위로`,
  MOVE_DOWN_ARIA: (name: string) => `${name} 아래로`,
  ROLE_DELETE_CONFIRM: (name: string) => `${name} 배역을 삭제하시겠습니까?`,
  ROLE_DELETE_DESC: '기본 캐스트와 회차별 캐스팅도 함께 지워집니다.',
  HIDDEN_ACTOR: '비노출',
  /** 공개 안 됨 이유(publicNow=false — design §12) */
  REASON_SWITCH_OFF: '공개 안 됨 — 공개 스위치 꺼짐',
  REASON_PERFORMANCE_HIDDEN: '공개 안 됨 — 작품 비노출',
  REASON_HIDDEN_ACTOR: '공개 안 됨 — 비노출 배우 포함',
  REASON_NO_VISIBLE_ACTOR: '공개 안 됨 — 노출 배우 없음',
  REASON_CREDIT_HIDDEN: '공개 안 됨 — 참여자 비노출',
  REASON_STAFF_HIDDEN: '공개 안 됨 — 연출진 비노출',
  REASON_MEMBER_HIDDEN: '공개 안 됨 — 배우 비노출',
  PUBLIC_NOW: '공개 중',
  /** 회차별 캐스팅 */
  GRID_TITLE: '회차별 캐스팅',
  GRID_NO_SHOWS: '회차·예매 탭에서 회차를 먼저 추가해주세요.',
  GRID_DEFAULT: '기본',
  GRID_UNDECIDED: '미정',
  GRID_CLEAR: '해제',
  GRID_EDIT_ARIA: (role: string, show: string) =>
    `${show} ${role} 캐스트 고르기`,
  GRID_CLEAR_ARIA: (role: string, show: string) =>
    `${show} ${role} 회차 지정 해제`,
  GRID_SHOW_PICK: '회차 선택',
  GRID_ROLE_HEADER: '배역',
  /** 배우 고르기 */
  PICKER_TITLE_ROLE: (role: string) => `${role} — 배우 추가`,
  PICKER_TITLE_ENSEMBLE: '출연자 추가',
  PICKER_TITLE_CELL: (role: string, show: string) => `${show} · ${role}`,
  PICKER_SEARCH: '배우 이름으로 검색',
  PICKER_NOTE: '메모',
  PICKER_NOTE_PH: '예: A캐스트',
  PICKER_EMPTY: '고를 수 있는 배우가 없습니다',
  PICKER_NO_PROFILE: '프로필 없음',
  PICKER_DEFAULT_FIRST: '기본 캐스트',
  PICKER_SELECT_REQUIRED: '배우를 골라주세요',
  /** 참여자(크레딧) */
  CREDITS_TITLE: '참여자',
  CREDIT_ADD: '참여자 추가',
  CREDITS_EMPTY: '등록된 참여자가 없습니다',
  CREDIT_ADD_TITLE: '참여자 추가',
  CREDIT_EDIT_TITLE: '참여자 수정',
  CREDIT_TITLE: '직함',
  CREDIT_TITLE_PH: '예: 연출, 조연출, 연출 및 음악감독',
  CREDIT_TITLE_REQUIRED: '직함을 입력해주세요',
  CREDIT_PERSON: '사람',
  CREDIT_KIND_STAFF: '연출진',
  CREDIT_KIND_MEMBER: '단원',
  CREDIT_KIND_NAME: '이름만 입력',
  CREDIT_STAFF_PH: '연출진 선택',
  CREDIT_MEMBER_PH: '단원 선택',
  CREDIT_NAME_PH: '이름',
  CREDIT_PERSON_REQUIRED: '사람을 고르거나 이름을 입력해주세요',
  CREDIT_VISIBLE: '홈페이지 노출',
  CREDIT_EDIT_ARIA: (title: string) => `${title} 수정`,
  CREDIT_DELETE_ARIA: (title: string) => `${title} 삭제`,
  CREDIT_DELETE_CONFIRM: (title: string) =>
    `${title} 참여자를 삭제하시겠습니까?`,
  CREDIT_VISIBLE_ARIA: (title: string) => `${title} 노출`,
  /** 연결 해제 뒤 회차 지정이 남았을 때(develop §17.5 안내 문구) */
  overrideLeft: (n: number) =>
    `회차별 캐스팅 ${n}칸은 배역·캐스팅 탭에서 정리해주세요.`,
  /** (U45) 팀 구성 — 배우 × 팀(제안 문구) */
  TEAMS_TITLE: '팀 구성',
  TEAMS_HELP:
    '배우가 속한 팀을 고르면 그 팀이 연습실을 예약할 때 참석자로 체크할 수 있습니다. 한 배우가 여러 팀에 속할 수 있습니다.',
  TEAMS_TABLE_ARIA: '팀 구성(배우 × 팀)',
  TEAMS_COL_ACTOR: '배우',
  TEAMS_NO_TEAMS: '팀 계정이 없습니다. 팀 계정 탭에서 먼저 만들어주세요.',
  TEAMS_NO_ACTORS: '배역에 배우를 넣으면 여기서 팀을 정할 수 있습니다.',
  TEAMS_CHECK_ARIA: (name: string, team: string) => `${name} — ${team} 팀`,
  TEAMS_ERROR: '팀 구성을 불러오지 못했습니다.',
  /** (U48) 캐스트 사진 카드 — designer §19.4 제안 문구. 오류는 서버 문구(PHO_001~004 · UPL_003 · TEAM_005 · ROL_001) */
  PHOTO_TITLE: '캐스트 사진',
  PHOTO_HELP:
    "홈페이지 작품 상세 '캐스트'에 보이는 사진이에요. 올리기 전에 자동으로 줄여요.",
  PHOTO_METER: '배역 사진',
  PHOTO_METER_ARIA: '배역 사진 올린 수',
  PHOTO_VIEW_HOMEPAGE: '홈페이지에서 보기',
  PHOTO_INFO_PUBLIC:
    '홈페이지 순서: 단체샷 → 팀 탭·팀샷 → 배역 카드. 배역 사진이 없으면 배우 프로필 사진, 그것도 없으면 빈 실루엣으로 보여요. 비노출 배우의 사진은 보이지 않아요.',
  PHOTO_INFO_PRIVATE:
    "지금은 홈페이지에 보이지 않아요. 단체샷·팀샷에도 얼굴이 나오므로 '캐스트·참여자 홈페이지 공개'를 켰을 때 함께 공개돼요. 미리 올려 두어도 괜찮아요.",
  PHOTO_ERROR: '캐스트 사진을 불러오지 못했습니다.',
  PHOTO_GROUP_TITLE: '단체샷',
  PHOTO_GROUP_HELP: (max: number) =>
    `선택 · 최대 ${max}장 · 가로 사진 · 첫 장이 대표`,
  PHOTO_GROUP_MAIN: '대표',
  PHOTO_GROUP_UPLOAD: '단체샷 올리기',
  PHOTO_GROUP_UPLOAD_HELP:
    '눌러서 고르기 · 없으면 홈페이지에서 이 자리가 보이지 않아요',
  PHOTO_GROUP_ADD: '단체샷 추가',
  PHOTO_GROUP_ADD_LEFT: (n: number) => `${n}장 더`,
  PHOTO_GROUP_ALT: (n: number) => `단체샷 ${n}`,
  PHOTO_GROUP_LEFT_ARIA: (n: number) => `단체샷 ${n} 앞으로`,
  PHOTO_GROUP_RIGHT_ARIA: (n: number) => `단체샷 ${n} 뒤로`,
  PHOTO_GROUP_REPLACE_ARIA: (n: number) => `단체샷 ${n} 교체`,
  PHOTO_GROUP_DELETE_ARIA: (n: number) => `단체샷 ${n} 삭제`,
  PHOTO_TEAM_TITLE: '팀샷',
  PHOTO_TEAM_HELP: "선택 · 팀마다 1장 · 팀은 '팀 구성'에서 정해요",
  PHOTO_TEAM_NONE:
    "팀이 없어요. '팀 계정' 탭에서 팀을 만들면 팀샷을 올릴 수 있어요.",
  PHOTO_TEAM_NAME: (label: string) => `${label}팀`,
  PHOTO_TEAM_COUNT: (n: number) => `· ${n}명`,
  PHOTO_TEAM_UPLOAD: (label: string) => `${label}팀 사진 올리기`,
  PHOTO_TEAM_UPLOAD_HELP: (label: string) =>
    `없으면 ${label}팀 탭에 팀샷 자리가 없어요`,
  PHOTO_TEAM_ALT: (label: string) => `${label}팀 팀샷`,
  PHOTO_TEAM_REPLACE_ARIA: (label: string) => `${label}팀 팀샷 교체`,
  PHOTO_TEAM_DELETE_ARIA: (label: string) => `${label}팀 팀샷 삭제`,
  PHOTO_ROLE_TITLE: '배역 사진',
  PHOTO_ROLE_HELP:
    '배역 × 배우마다 1장 · 세로 3:4 권장(다른 비율은 가운데를 잘라 보여요) · 배우 프로필 사진과 따로예요',
  PHOTO_ROLE_NONE: '배역에 배우를 넣으면 배역 사진을 올릴 수 있어요.',
  PHOTO_ROLE_MISSING_NONE: '사진이 없는 배역이 없어요.',
  PHOTO_FILTER_ARIA: '보기',
  PHOTO_FILTER_ALL: (n: number) => `전체 ${n}`,
  PHOTO_FILTER_MISSING: (n: number) => `사진 없음 ${n}`,
  PHOTO_ROLE_COUNT: (n: number) => `${n}명`,
  PHOTO_ROLE_ALT: (role: string, name: string) => `${role} · ${name} 배역 사진`,
  PHOTO_SRC_ROLE: '배역 사진',
  PHOTO_SRC_PROFILE: '홈페이지: 프로필 사진으로 보여요',
  PHOTO_SRC_SILHOUETTE: '홈페이지: 실루엣으로 보여요(프로필 사진도 없음)',
  PHOTO_SRC_HIDDEN: '비노출 배우라 홈페이지에 보이지 않아요',
  PHOTO_SRC_UNKNOWN: '홈페이지: 프로필 사진 또는 실루엣으로 보여요',
  PHOTO_UPLOAD: '사진 올리기',
  PHOTO_UPLOAD_SHORT: '올리기',
  PHOTO_ROLE_UPLOAD_ARIA: (role: string, name: string) =>
    `${role} ${name} 사진 올리기`,
  PHOTO_ROLE_REPLACE_ARIA: (role: string, name: string) =>
    `${role} ${name} 사진 교체`,
  PHOTO_ROLE_DELETE_ARIA: (role: string, name: string) =>
    `${role} ${name} 사진 삭제`,
  PHOTO_OPTIMIZING: '줄이는 중…',
  PHOTO_UPLOADING: '올리는 중…',
  PHOTO_FAILED: '올리지 못했어요. 다시 시도해 주세요.',
  PHOTO_RETRY: '다시 시도',
  PHOTO_DISMISS: '닫기',
  PHOTO_DELETE_ROLE: '배역 사진을 지울까요?',
  PHOTO_DELETE_ROLE_DESC: (role: string, name: string, fallback: string) =>
    `${role} · ${name}. 홈페이지에서는 ${fallback}`,
  PHOTO_FALLBACK_PROFILE: (name: string) =>
    `${name} 배우의 프로필 사진으로 바뀌어요.`,
  PHOTO_FALLBACK_SILHOUETTE: '실루엣으로 바뀌어요.',
  PHOTO_DELETE_TEAM: (label: string) => `${label}팀 팀샷을 지울까요?`,
  PHOTO_DELETE_TEAM_DESC: (label: string) =>
    `홈페이지 ${label}팀 탭에서 팀샷 자리가 없어져요.`,
  PHOTO_DELETE_GROUP: (n: number) => `단체샷 ${n}을 지울까요?`,
  PHOTO_DELETE_GROUP_DESC: '뒤 사진이 한 칸씩 앞으로 당겨져요.',
  /** (U48) 홈페이지 미리보기 — §25.9(30분 토큰) */
  PREVIEW_BUTTON: '홈페이지 미리보기',
  PREVIEW_HELP: '공개 전 모습을 새 탭에서 봅니다. 링크는 30분 뒤 만료돼요.',
  PREVIEW_OPENED: '새 탭에서 미리보기를 열었어요. 링크는 30분 뒤 만료돼요.',
  PREVIEW_NO_CLIENT_URL:
    '홈페이지 주소(CLIENT_PUBLIC_URL)가 설정되지 않아 미리보기를 열 수 없어요.',
  PREVIEW_POPUP_BLOCKED:
    '새 탭이 막혔어요. 브라우저의 팝업 차단을 풀고 다시 눌러 주세요.',
} as const;
