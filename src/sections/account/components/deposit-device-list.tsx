// ----------------------------------------------------------------------
// SCR-D15 '입금 알림 기기' 목록(U43) — 기기 이름 · 마지막 수신 · 등록 해제. 비면 안내 한 줄. 모양은 '예매 알림' 기기 목록과 같다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import type { DepositDeviceRow } from '@/src/api/deposit-device-mapper';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { MSG_D15_DEPOSIT } from '@/src/shared/messages/d15-deposit-devices';
import { RADIUS } from '@/src/theme/layout-tokens';

interface DepositDeviceListProps {
  devices: DepositDeviceRow[];
  disabled: boolean;
  onRevoke: (device: DepositDeviceRow) => void;
}

export function DepositDeviceList({
  devices,
  disabled,
  onRevoke,
}: DepositDeviceListProps) {
  return (
    <section
      aria-labelledby='deposit-devices-title'
      className='flex flex-col gap-2'
    >
      <Typo.Badge.Medium id='deposit-devices-title' component='h3'>
        {MSG_D15_DEPOSIT.DEVICES}
      </Typo.Badge.Medium>
      {devices.length === 0 ? (
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D15_DEPOSIT.DEVICES_EMPTY}
        </Typo.Badge.Regular>
      ) : (
        <Box
          component='ul'
          aria-label={MSG_D15_DEPOSIT.DEVICES}
          sx={{
            m: 0,
            p: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {devices.map((device) => (
            <Box
              component='li'
              key={device.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                pl: 3,
                pr: 1,
                py: 1,
                borderRadius: `${RADIUS.sm}px`,
                bgcolor: 'semantic.surface.muted',
              }}
            >
              <Iconify
                icon='solar:smartphone-linear'
                size='sm'
                sx={{ color: 'text.secondary', flexShrink: 0 }}
              />
              <div className='flex min-w-0 flex-1 flex-col'>
                <Typo.Badge.Medium>{device.name}</Typo.Badge.Medium>
                <Typo.Caption.Regular color='semantic.text.onMuted'>
                  {device.lastSeenText}
                </Typo.Caption.Regular>
              </div>
              <IconButton
                aria-label={`${device.name} ${MSG_D15_DEPOSIT.REVOKE}`}
                title={MSG_D15_DEPOSIT.REVOKE}
                disabled={disabled}
                onClick={() => onRevoke(device)}
                sx={{ width: 44, height: 44 }}
              >
                <Iconify icon='solar:trash-bin-trash-linear' />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </section>
  );
}
