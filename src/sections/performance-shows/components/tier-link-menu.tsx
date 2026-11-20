'use client';

// ----------------------------------------------------------------------
// 링크 복사 ▾ 메뉴(design §6.1b · designer tier-link-menu) — "등급 링크 복사" / "등급 링크 + 단원 초대 링크"(+ 설명).
// 링크 전용 등급에만 쓴다. 주소가 없으면(CLIENT_PUBLIC_URL) 버튼 비활성 + 이유 툴팁.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D11 } from '@/src/shared/messages/d11';

interface TierLinkMenuProps {
  tierName: string;
  isUnavailable: boolean;
  onCopyLink: () => void;
  onCopyWithMember: () => void;
}

export function TierLinkMenu({
  tierName,
  isUnavailable,
  onCopyLink,
  onCopyWithMember,
}: TierLinkMenuProps) {
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  const button = (
    <Button
      variant='outlined'
      color='inherit'
      size='small'
      disabled={isUnavailable}
      aria-label={`${MSG_D11.LINK_COPY} — ${tierName}`}
      aria-haspopup='menu'
      aria-expanded={anchor ? 'true' : undefined}
      aria-controls={anchor ? menuId : undefined}
      onClick={(event) => setAnchor(event.currentTarget)}
      startIcon={<Iconify icon='solar:copy-linear' />}
      endIcon={<Iconify icon='solar:alt-arrow-down-linear' />}
    >
      {MSG_D11.LINK_COPY}
    </Button>
  );

  return (
    <>
      {isUnavailable ? (
        <Tooltip title={MSG_D11.LINK_UNAVAILABLE}>
          <span>{button}</span>
        </Tooltip>
      ) : (
        button
      )}
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={anchor !== null}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            close();
            onCopyLink();
          }}
        >
          <ListItemIcon>
            <Iconify icon='solar:copy-linear' />
          </ListItemIcon>
          <Typo.Badge.Regular>{MSG_D11.LINK_COPY_TIER}</Typo.Badge.Regular>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onCopyWithMember();
          }}
        >
          <ListItemIcon>
            <Iconify icon='solar:users-group-rounded-linear' />
          </ListItemIcon>
          <div className='flex flex-col'>
            <Typo.Badge.Regular>
              {MSG_D11.LINK_COPY_WITH_MEMBER}
            </Typo.Badge.Regular>
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D11.LINK_COPY_WITH_MEMBER_HELP}
            </Typo.Caption.Regular>
          </div>
        </MenuItem>
      </Menu>
    </>
  );
}
