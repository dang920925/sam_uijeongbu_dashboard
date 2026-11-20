// ----------------------------------------------------------------------
// SCR-D15 '예매 알림' 기기 목록(U37, design §16) — 기기 이름 · 등록일 · (이 기기) · 삭제. 비면 안내 한 줄.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import type { PushDevice } from '@/src/api/push-mapper';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { MSG_D15_PUSH } from '@/src/shared/messages/d15-push';
import { RADIUS } from '@/src/theme/layout-tokens';

interface PushDeviceListProps {
  devices: PushDevice[];
  disabled: boolean;
  onDelete: (device: PushDevice) => void;
}

export function PushDeviceList({
  devices,
  disabled,
  onDelete,
}: PushDeviceListProps) {
  return (
    <section
      aria-labelledby='push-devices-title'
      className='flex flex-col gap-2'
    >
      <Typo.Badge.Medium id='push-devices-title' component='h3'>
        {MSG_D15_PUSH.DEVICES}
      </Typo.Badge.Medium>
      {devices.length === 0 ? (
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D15_PUSH.DEVICES_EMPTY}
        </Typo.Badge.Regular>
      ) : (
        <Box
          component='ul'
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
                <span className='flex flex-wrap items-center gap-2'>
                  <Typo.Badge.Medium>{device.name}</Typo.Badge.Medium>
                  {device.isCurrent ? (
                    <Label tone='info'>{MSG_D15_PUSH.THIS_DEVICE}</Label>
                  ) : null}
                </span>
                <Typo.Caption.Regular color='semantic.text.onMuted'>
                  {`${MSG_D15_PUSH.REGISTERED_AT} ${device.registeredAt}`}
                </Typo.Caption.Regular>
              </div>
              <IconButton
                aria-label={`${device.name} ${MSG_D15_PUSH.DELETE_DEVICE}`}
                title={MSG_D15_PUSH.DELETE_DEVICE}
                disabled={disabled}
                onClick={() => onDelete(device)}
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
