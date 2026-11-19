// ----------------------------------------------------------------------
// 일반 단원 패널 — "연락처" "가입일" 두 줄(현행 Members.tsx:290-299, 아래 구분선).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { MSG_D05 } from '@/src/shared/messages/d05';

interface MembersGeneralInfoProps {
  phoneText: string;
  joinedText: string;
}

export function MembersGeneralInfo({
  phoneText,
  joinedText,
}: MembersGeneralInfoProps) {
  const items = [
    { label: MSG_D05.PHONE, value: phoneText },
    { label: MSG_D05.JOINED, value: joinedText },
  ];
  return (
    <dl className='m-0 flex flex-col'>
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typo.Badge.Regular component='dt' color='text.secondary'>
            {item.label}
          </Typo.Badge.Regular>
          <Typo.Badge.Regular component='dd' sx={{ m: 0 }}>
            {item.value}
          </Typo.Badge.Regular>
        </Box>
      ))}
    </dl>
  );
}
