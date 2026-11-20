'use client';

// ----------------------------------------------------------------------
// SCR-D15 계정 설정 View — props 만으로 그린다(designer §13.7.4 W4 2.1·2.2).
// 순서: [폼 위 알림] → 현재 아이디(읽기) → 현재 비밀번호* → 구분선 → 새 아이디* → 새 비밀번호(비우면 유지)
// → 확인 → 안내(info) → 저장(전폭). 필드 오류는 칸 아래(aria-invalid·aria-describedby), 도움말은 오류와 함께 남긴다.
// 저장 중에는 버튼 loading(aria-busy)·입력 읽기 전용.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import type { FormEvent } from 'react';

import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { AccountAlert } from '@/src/sections/account/components/account-alert';
import { FieldNotes } from '@/src/sections/account/components/field-notes';
import { PasswordInput } from '@/src/sections/account/components/password-input';
import {
  ACCOUNT_FIELD_IDS,
  describedByOf,
} from '@/src/sections/account/utils/account-form';
import type { AccountViewModel } from '@/src/sections/account/view/use-account-view-model';
import { MSG_D15 } from '@/src/shared/messages/d15';
import { RADIUS } from '@/src/theme/layout-tokens';

type AccountViewProps = Omit<
  AccountViewModel,
  'status' | 'loadErrorMessage' | 'onRetry'
>;

const IDS = ACCOUNT_FIELD_IDS;
const CURRENT_USERNAME_ID = 'account-current-username';

export function AccountView({
  currentUsername,
  values,
  errors,
  visible,
  isSaving,
  onChange,
  onToggleVisible,
  onSubmit,
}: AccountViewProps) {
  const fieldError = errors.fields;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Card sx={{ p: { xs: 4, md: 6 } }}>
      <form className='flex flex-col gap-4' noValidate onSubmit={handleSubmit}>
        {errors.alert ? (
          <AccountAlert
            tone='error'
            message={errors.alert.message}
            locked={errors.alert.locked}
          />
        ) : null}

        <FormField
          label={MSG_D15.CURRENT_USERNAME}
          htmlFor={CURRENT_USERNAME_ID}
        >
          <Box
            component='output'
            id={CURRENT_USERNAME_ID}
            sx={{
              display: 'flex',
              alignItems: 'center',
              minHeight: { xs: 44, md: 40 },
              px: 3,
              borderRadius: `${RADIUS.sm}px`,
              bgcolor: 'semantic.surface.muted',
              color: 'semantic.text.onMuted',
            }}
          >
            <Typo.Body.Regular color='inherit'>
              {currentUsername}
            </Typo.Body.Regular>
          </Box>
        </FormField>

        <FormField
          label={MSG_D15.CURRENT_PASSWORD}
          htmlFor={IDS.currentPassword}
          required
        >
          <PasswordInput
            id={IDS.currentPassword}
            name='currentPassword'
            autoComplete='current-password'
            value={values.currentPassword}
            visible={visible.currentPassword}
            invalid={Boolean(fieldError.currentPassword)}
            describedBy={describedByOf(
              IDS.currentPassword,
              false,
              fieldError.currentPassword
            )}
            readOnly={isSaving}
            required
            onChange={(value) => onChange('currentPassword', value)}
            onToggle={() => onToggleVisible('currentPassword')}
          />
          <FieldNotes
            fieldId={IDS.currentPassword}
            error={fieldError.currentPassword}
          />
        </FormField>

        <Divider sx={{ my: 2 }} />

        <FormField
          label={MSG_D15.NEW_USERNAME}
          htmlFor={IDS.newUsername}
          required
        >
          <TextField
            id={IDS.newUsername}
            name='newUsername'
            autoComplete='username'
            value={values.newUsername}
            error={Boolean(fieldError.newUsername)}
            onChange={(e) => onChange('newUsername', e.target.value)}
            slotProps={{
              htmlInput: {
                maxLength: 50,
                readOnly: isSaving,
                required: true,
                autoCapitalize: 'none',
                spellCheck: false,
                'aria-invalid': Boolean(fieldError.newUsername),
                'aria-describedby': describedByOf(
                  IDS.newUsername,
                  true,
                  fieldError.newUsername
                ),
              },
            }}
          />
          <FieldNotes
            fieldId={IDS.newUsername}
            helper={MSG_D15.HELP_USERNAME}
            error={fieldError.newUsername}
          />
        </FormField>

        <FormField
          label={
            <>
              {MSG_D15.NEW_PASSWORD}{' '}
              <Typo.Badge.Regular component='span' color='text.secondary'>
                {MSG_D15.NEW_PASSWORD_OPTIONAL}
              </Typo.Badge.Regular>
            </>
          }
          htmlFor={IDS.newPassword}
        >
          <PasswordInput
            id={IDS.newPassword}
            name='newPassword'
            autoComplete='new-password'
            value={values.newPassword}
            visible={visible.newPassword}
            invalid={Boolean(fieldError.newPassword)}
            describedBy={describedByOf(
              IDS.newPassword,
              true,
              fieldError.newPassword
            )}
            readOnly={isSaving}
            onChange={(value) => onChange('newPassword', value)}
            onToggle={() => onToggleVisible('newPassword')}
          />
          <FieldNotes
            fieldId={IDS.newPassword}
            helper={MSG_D15.HELP_PASSWORD}
            error={fieldError.newPassword}
          />
        </FormField>

        <FormField
          label={MSG_D15.CONFIRM_PASSWORD}
          htmlFor={IDS.confirmPassword}
        >
          <PasswordInput
            id={IDS.confirmPassword}
            name='confirmPassword'
            autoComplete='new-password'
            value={values.confirmPassword}
            visible={visible.confirmPassword}
            invalid={Boolean(fieldError.confirmPassword)}
            describedBy={describedByOf(
              IDS.confirmPassword,
              false,
              fieldError.confirmPassword
            )}
            readOnly={isSaving}
            onChange={(value) => onChange('confirmPassword', value)}
            onToggle={() => onToggleVisible('confirmPassword')}
          />
          <FieldNotes
            fieldId={IDS.confirmPassword}
            error={fieldError.confirmPassword}
          />
        </FormField>

        <AccountAlert tone='info' message={MSG_D15.NOTICE} />

        <Button
          type='submit'
          variant='contained'
          fullWidth
          loading={isSaving}
          loadingPosition='start'
          aria-busy={isSaving}
          sx={{ minHeight: 48 }}
        >
          {MSG_D15.SAVE}
        </Button>
      </form>
    </Card>
  );
}
