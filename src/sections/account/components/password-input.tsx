'use client';

// ----------------------------------------------------------------------
// 비밀번호 입력 + 보기 토글(designer `.acc-pw`). 토글 이름은 "비밀번호 보기" 고정, 상태는 aria-pressed(칸마다 따로).
// 토글은 칸 높이와 같은 정사각(md↑ 40 / xs 44 — MuiIconButton xs 44 오버라이드).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import { Iconify } from '@/src/components/iconify';
import { MSG_D15 } from '@/src/shared/messages/d15';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface PasswordInputProps {
  id: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  value: string;
  visible: boolean;
  invalid: boolean;
  describedBy: string | undefined;
  readOnly: boolean;
  required?: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}

export function PasswordInput({
  id,
  name,
  autoComplete,
  value,
  visible,
  invalid,
  describedBy,
  readOnly,
  required = false,
  onChange,
  onToggle,
}: PasswordInputProps) {
  return (
    <TextField
      id={id}
      name={name}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      error={invalid}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        htmlInput: {
          maxLength: 200,
          readOnly,
          required,
          'aria-invalid': invalid,
          'aria-describedby': describedBy,
          autoCapitalize: 'none',
          spellCheck: false,
        },
        input: {
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                edge='end'
                aria-label={MSG_D15.TOGGLE_PASSWORD}
                aria-pressed={visible}
                aria-controls={id}
                onClick={onToggle}
                sx={{ width: LAYOUT.control, height: LAYOUT.control }}
              >
                <Iconify
                  icon={
                    visible ? 'solar:eye-closed-linear' : 'solar:eye-linear'
                  }
                  size='md'
                />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
