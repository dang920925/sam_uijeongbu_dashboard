// ----------------------------------------------------------------------
// 기간 겹침 경고 배지 — danger-triangle + MSG-POPUP-OVERLAP 문구(warning 색). 막지 않고 알리기만 한다(FN-17).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D10 } from '@/src/shared/messages/d10';
import { RADIUS } from '@/src/theme/layout-tokens';

export function PopupOverlapBadge() {
  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1,
        borderRadius: `${RADIUS.pill}px`,
        bgcolor: 'semantic.label.warning.bg',
        color: 'semantic.label.warning.fg',
        maxWidth: '100%',
      }}
    >
      <Iconify icon='solar:danger-triangle-linear' />
      <Typo.Caption.Semibold color='inherit'>
        {MSG_D10.OVERLAP}
      </Typo.Caption.Semibold>
    </Box>
  );
}
