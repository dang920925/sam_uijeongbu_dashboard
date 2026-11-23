// ----------------------------------------------------------------------
// (U48) 점선 올리기 자리(designer `.drop`) — 아이콘 + 골드 글자 + 보조 글. 세로(틀 채움) / 가로(drop--row) 두 모양.
// 최소 높이 44(터치), 포커스는 ButtonBase 공용 outline.
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface PhotoDropButtonProps {
  label?: string;
  help?: string;
  ariaLabel?: string;
  icon?: string;
  isRow?: boolean;
  onClick: () => void;
}

export function PhotoDropButton({
  label,
  help,
  ariaLabel,
  icon = 'solar:gallery-add-linear',
  isRow = false,
  onClick,
}: PhotoDropButtonProps) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        width: '100%',
        height: isRow ? 'auto' : '100%',
        minHeight: isRow ? LAYOUT.thumb + 16 : LAYOUT.touch,
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
        justifyContent: isRow ? 'flex-start' : 'center',
        alignItems: 'center',
        gap: isRow ? 3 : 1,
        p: isRow ? 4 : 1,
        textAlign: isRow ? 'left' : 'center',
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'semantic.input.borderStrong',
        borderRadius: `${RADIUS.sm}px`,
        color: 'text.secondary',
        '&:hover': { borderColor: 'primary.main', color: 'text.primary' },
      }}
    >
      <Iconify icon={icon} size='md' sx={{ color: 'primary.main' }} />
      {label || help ? (
        <span className='flex flex-col'>
          {label ? (
            <Typo.Badge.Semibold color='primary.main'>
              {label}
            </Typo.Badge.Semibold>
          ) : null}
          {help ? (
            <Typo.Caption.Regular color='inherit'>{help}</Typo.Caption.Regular>
          ) : null}
        </span>
      ) : null}
    </ButtonBase>
  );
}
