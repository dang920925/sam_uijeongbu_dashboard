// ----------------------------------------------------------------------
// 연출진 사진 48 원형(designer `avatar--md`). 사진이 없으면 사람 아이콘 자리.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Image } from '@/src/components/image';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface StaffAvatarProps {
  src: string | null;
  alt: string;
}

export function StaffAvatar({ src, alt }: StaffAvatarProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: LAYOUT.avatarMd,
        height: LAYOUT.avatarMd,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: '50%',
        bgcolor: 'semantic.surface.placeholder',
        color: 'text.secondary',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <Image src={src} alt={alt} sizes={`${LAYOUT.avatarMd}px`} />
      ) : (
        <Iconify icon='solar:user-linear' size='md' />
      )}
    </Box>
  );
}
