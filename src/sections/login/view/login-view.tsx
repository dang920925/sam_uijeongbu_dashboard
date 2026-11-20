'use client';

// ----------------------------------------------------------------------
// 로그인(SCR-D01) View — props 만으로 그린다. 중앙 카드(최대 400, xs 좌우 16 → 카드 폭 = 전체-32).
// Typo: SubHead(로고 — 로그인은 페이지 성격 화면, designer W3) · Badge(부제·라벨·실패 박스) · Caption(빈 값).
// 진행 중에는 버튼을 막고 스피너를 앞에 두되 라벨 "로그인" 은 유지(designer loading 프레임).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import type { FormEvent } from 'react';

import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { LoginErrorBox } from '@/src/sections/login/components/login-error-box';
import type {
  LoginFormErrors,
  LoginFormValues,
} from '@/src/sections/login/utils/validate-login-form';
import { MSG_D01 } from '@/src/shared/messages/d01';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface LoginViewProps {
  values: LoginFormValues;
  errors: LoginFormErrors;
  authError: string | null;
  isSubmitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function LoginView({
  values,
  errors,
  authError,
  isSubmitting,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginViewProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className='flex min-h-dvh items-center justify-center p-4'>
      <Card
        sx={{
          width: '100%',
          maxWidth: LAYOUT.login,
          p: { xs: 6, md: 8 },
          borderRadius: `${RADIUS.lg}px`,
        }}
      >
        <div className='flex flex-col gap-8'>
          <div className='flex flex-col items-center gap-1 text-center'>
            <Typo.SubHead.Bold component='h1'>{MSG_D01.LOGO}</Typo.SubHead.Bold>
            <Typo.Badge.Regular color='text.secondary'>
              {MSG_D01.SUBTITLE}
            </Typo.Badge.Regular>
          </div>
          <form
            className='flex flex-col gap-4'
            noValidate
            onSubmit={handleSubmit}
          >
            <FormField
              label={MSG_D01.USERNAME}
              htmlFor='login-username'
              error={errors.username}
            >
              <TextField
                id='login-username'
                name='username'
                autoComplete='username'
                autoFocus
                value={values.username}
                placeholder={MSG_D01.USERNAME_PH}
                error={Boolean(errors.username)}
                onChange={(e) => onUsernameChange(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
            </FormField>
            <FormField
              label={MSG_D01.PASSWORD}
              htmlFor='login-password'
              error={errors.password}
            >
              <TextField
                id='login-password'
                name='password'
                type='password'
                autoComplete='current-password'
                value={values.password}
                placeholder={MSG_D01.PASSWORD_PH}
                error={Boolean(errors.password)}
                onChange={(e) => onPasswordChange(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
            </FormField>
            {authError ? <LoginErrorBox message={authError} /> : null}
            <Button
              type='submit'
              variant='contained'
              fullWidth
              loading={isSubmitting}
              loadingPosition='start'
            >
              {MSG_D01.SUBMIT}
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}
