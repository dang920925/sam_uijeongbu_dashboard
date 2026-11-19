'use client';

// ----------------------------------------------------------------------
// 배우 패널 View — props 만으로 렌더(designer W4 §1 순서).
// 사진 + "이미지 변경" → 구분선 → 홈페이지 노출 → 소개(+[n]/200) → SNS URL → 활동 시작일 → 노출 순서(0~9999)
// → 출연작 → "저장되었습니다 ✓"(저장 성공 후에만) → "프로필 저장".
// 소개는 maxLength 로 자르지 않는다 — 201자를 넣으면 기획 문구로 알린다(FN-12 수용 기준).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { SwitchField } from '@/src/components/switch-field';
import { Typo } from '@/src/components/typo';
import { MembersFilmographyFields } from '@/src/sections/members/components/members-filmography-fields';
import { MembersPanelPhoto } from '@/src/sections/members/components/members-panel-photo';
import type { ActorProfileViewModel } from '@/src/sections/members/view/use-actor-profile-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MembersActorProfileFormProps {
  vm: ActorProfileViewModel;
}

export function MembersActorProfileForm({ vm }: MembersActorProfileFormProps) {
  const introId = useId();
  const snsId = useId();
  const activityId = useId();
  const orderId = useId();
  const { form, errors } = vm;

  return (
    <form
      noValidate
      className='flex flex-col gap-4'
      onSubmit={(event) => {
        event.preventDefault();
        vm.onSave();
      }}
    >
      <MembersPanelPhoto
        imageUrl={vm.photo.imageUrl}
        alt={vm.photo.alt}
        isBusy={vm.photo.isBusy}
        errorMessage={vm.photo.errorMessage}
        onSelectFile={vm.photo.onSelectFile}
        onRetry={vm.photo.onRetry}
      />
      <Divider />
      <SwitchField
        label={MSG_COMMON.VISIBLE_LABEL}
        checked={form.isVisible}
        onChange={vm.onVisibleChange}
      />
      <FormField
        label={MSG_D05.INTRO}
        htmlFor={introId}
        error={errors.intro}
        helper={vm.introCounter}
      >
        <TextField
          id={introId}
          multiline
          minRows={3}
          value={form.intro}
          placeholder={MSG_D05.INTRO_PH}
          error={Boolean(errors.intro)}
          onChange={(e) => vm.onFieldChange('intro', e.target.value)}
        />
      </FormField>
      <FormField label={MSG_D05.SNS_URL} htmlFor={snsId}>
        <TextField
          id={snsId}
          type='url'
          value={form.snsUrl}
          placeholder={MSG_D05.SNS_URL_PH}
          onChange={(e) => vm.onFieldChange('snsUrl', e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500, inputMode: 'url' } }}
        />
      </FormField>
      <FormField label={MSG_D05.ACTIVITY_START} htmlFor={activityId}>
        <TextField
          id={activityId}
          type='date'
          value={form.activityStart}
          onChange={(e) => vm.onFieldChange('activityStart', e.target.value)}
        />
      </FormField>
      <FormField
        label={MSG_D05.DISPLAY_ORDER}
        htmlFor={orderId}
        error={errors.displayOrder}
        helper={MSG_D05.DISPLAY_ORDER_HELP}
      >
        <TextField
          id={orderId}
          type='number'
          value={form.displayOrder}
          error={Boolean(errors.displayOrder)}
          onChange={(e) => vm.onFieldChange('displayOrder', e.target.value)}
          slotProps={{
            htmlInput: { min: 0, max: 9999, inputMode: 'numeric' },
          }}
        />
      </FormField>
      <MembersFilmographyFields
        rows={form.filmography}
        errors={errors.filmography}
        onAdd={vm.onFilmAdd}
        onRemove={vm.onFilmRemove}
        onChange={vm.onFilmChange}
      />
      {vm.isSaved ? (
        <Typo.Caption.Regular color='success.main' role='status'>
          {MSG_D05.SAVED_INLINE}
        </Typo.Caption.Regular>
      ) : null}
      <Button
        type='submit'
        variant='contained'
        fullWidth
        disabled={vm.isSaving || vm.photo.isBusy}
        startIcon={
          vm.isSaving ? <CircularProgress size={16} color='inherit' /> : null
        }
      >
        {MSG_D05.SAVE_PROFILE}
      </Button>
    </form>
  );
}
