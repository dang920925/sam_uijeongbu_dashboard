'use client';

// ----------------------------------------------------------------------
// 배우 프로필 패널 ViewModel(FN-12). JSX 없음. 단원이 바뀌면 컨테이너가 key 로 다시 마운트해 폼을 새로 채운다.
// - "프로필 저장" 한 버튼으로 프로필(PATCH actor-profile)과 홈페이지 노출(PATCH members isVisible, 바뀐 경우만)을
//   함께 저장한다(designer W4 확인 필요 — 기본안 한 버튼, 자체 결정). 검증 실패 가능성이 큰 프로필을 먼저 보낸다.
// - 성공하면 패널 안 "저장되었습니다 ✓"(현행 Members.tsx:278). 칸을 다시 고치면 지운다(상태 정직성 §11.9).
// - 실패는 스낵바(서버 message — designer W4 "서버 오류는 스낵바").
// - 사진: "이미지 변경" → 서명 URL 업로드(ACTOR_PROFILE) → 즉시 프로필에 저장(현행 handleImageUpload 와 같은 동작).
//   이때 다른 칸은 서버 값 그대로 보내 아직 저장하지 않은 입력을 건드리지 않는다.
// ----------------------------------------------------------------------
import { useState } from 'react';

import { useSaveActorProfile, useSaveMember } from '@/src/api/member-queries';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { useImageUpload } from '@/src/hooks/use-image-upload';
import {
  emptyFilmographyRow,
  hasActorProfileFormError,
  INTRO_MAX,
  toActorProfileForm,
  toActorProfileInput,
  validateActorProfileForm,
  type ActorProfileForm,
  type ActorProfileFormErrors,
  type FilmographyFormRow,
} from '@/src/sections/members/utils/actor-profile-form';
import { toApiErrorMessage } from '@/src/utils/api-error-message';
import { formatIntroCounter } from '@/src/shared/messages/d05';
import type { ActorProfile, Member } from '@/src/types/member';

type TextField = 'intro' | 'snsUrl' | 'activityStart' | 'displayOrder';
type FilmField = 'title' | 'role' | 'year';

const NO_ERRORS: ActorProfileFormErrors = {
  intro: null,
  displayOrder: null,
  filmography: [],
};

/** 출연작 행 렌더 키 — 서버로 보내지 않는 화면 전용 일련번호 */
let filmKeySeq = 0;
const makeKey = () => {
  filmKeySeq += 1;
  return `film-${filmKeySeq}`;
};

export function useActorProfileViewModel(
  member: Member,
  profile: ActorProfile
) {
  const snackbar = useAppSnackbar();
  const saveProfile = useSaveActorProfile();
  const savePhoto = useSaveActorProfile();
  const saveMember = useSaveMember();
  const uploader = useImageUpload('ACTOR_PROFILE');
  const [form, setForm] = useState<ActorProfileForm>(() =>
    toActorProfileForm(member, profile, makeKey)
  );
  // 저장을 한 번 시도한 뒤에는 입력할 때마다 다시 검증해 보여준다(행 추가·삭제에도 오류 위치가 맞게).
  const [showErrors, setShowErrors] = useState(false);
  const errors: ActorProfileFormErrors = showErrors
    ? validateActorProfileForm(form)
    : NO_ERRORS;
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const update = (next: (prev: ActorProfileForm) => ActorProfileForm) => {
    setForm(next);
    setIsSaved(false);
  };

  const updateRow = (
    key: string,
    change: (row: FilmographyFormRow) => FilmographyFormRow
  ) =>
    update((prev) => ({
      ...prev,
      filmography: prev.filmography.map((row) =>
        row.key === key ? change(row) : row
      ),
    }));

  const handleSave = async () => {
    setShowErrors(true);
    if (hasActorProfileFormError(validateActorProfileForm(form)) || isSaving)
      return;
    setIsSaved(false);
    setIsSaving(true);
    try {
      await saveProfile.mutateAsync(
        toActorProfileInput(form, member.id, profile.profileImageUrl)
      );
      if (form.isVisible !== member.isVisible) {
        await saveMember.mutateAsync({
          id: member.id,
          input: { isVisible: form.isVisible },
        });
      }
      setIsSaved(true);
    } catch (error: unknown) {
      snackbar.error(toApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoFile = async (file: File) => {
    const url = await uploader.upload(file);
    if (!url) return;
    savePhoto.mutate(
      { ...profile, profileImageUrl: url },
      { onError: (error) => snackbar.error(toApiErrorMessage(error)) }
    );
  };

  return {
    photo: {
      imageUrl: profile.profileImageUrl,
      alt: member.name,
      isBusy: uploader.isUploading || savePhoto.isPending,
      errorMessage: uploader.errorMessage,
      onSelectFile: (file: File) => void handlePhotoFile(file),
      onRetry: () =>
        void uploader.retry().then((url) => {
          if (url)
            savePhoto.mutate(
              { ...profile, profileImageUrl: url },
              { onError: (error) => snackbar.error(toApiErrorMessage(error)) }
            );
        }),
    },
    form,
    errors,
    introCounter: formatIntroCounter(form.intro.length, INTRO_MAX),
    isSaved,
    isSaving,
    onVisibleChange: (isVisible: boolean) =>
      update((prev) => ({ ...prev, isVisible })),
    onFieldChange: (field: TextField, value: string) =>
      update((prev) => ({ ...prev, [field]: value })),
    onFilmAdd: () =>
      update((prev) => ({
        ...prev,
        filmography: [...prev.filmography, emptyFilmographyRow(makeKey())],
      })),
    onFilmRemove: (key: string) =>
      update((prev) => ({
        ...prev,
        filmography: prev.filmography.filter((row) => row.key !== key),
      })),
    onFilmChange: (key: string, field: FilmField, value: string) =>
      updateRow(key, (row) => ({ ...row, [field]: value })),
    onSave: () => void handleSave(),
  };
}

export type ActorProfileViewModel = ReturnType<typeof useActorProfileViewModel>;
