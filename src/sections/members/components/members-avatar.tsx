// ----------------------------------------------------------------------
// 단원 원형 사진 — 32(표 행) / 96(패널). 사진이 없으면 사람 아이콘(현행 User 아이콘 자리).
// 목록 응답의 profileImageUrl 을 쓴다(행마다 프로필 조회하던 현행 → 목록에 포함, design SCR-D05).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Iconify } from '@/src/components/iconify';
import { Image } from '@/src/components/image';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface MembersAvatarProps {
  src: string | null;
  /** 장식(표 행 — 옆에 이름이 있음)이면 빈 문자열 */
  alt: string;
  size?: 'sm' | 'xl';
}

export function MembersAvatar({ src, alt, size = 'sm' }: MembersAvatarProps) {
  const px = size === 'xl' ? LAYOUT.avatarXl : LAYOUT.avatarSm;
  return (
    <Box
      sx={{
        position: 'relative',
        width: px,
        height: px,
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
        <Image src={src} alt={alt} sizes={`${px}px`} />
      ) : (
        <Iconify icon='solar:user-linear' size={size === 'xl' ? 'lg' : 'sm'} />
      )}
    </Box>
  );
}
