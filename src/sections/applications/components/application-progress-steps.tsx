'use client';

// ----------------------------------------------------------------------
// 상세 진행 단계(designer §18.3 drawer) — 점·선 스텝퍼(radiogroup)로 순서를 보이고, 불참/보류는 점선 아래 따로.
// 지난 단계 = 채운 점 + 체크, 지금 = 굵은 고리, 앞으로 = 빈 고리(색만이 아니게 모양으로도 구분). 거절된 신청은 모두 비활성.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type {
  ApplicationProgressView,
  ProgressStep,
} from '@/src/sections/applications/utils/application-row';
import type { ApplicationProgress } from '@/src/types/codes';

interface ApplicationProgressStepsProps {
  progress: ApplicationProgressView;
  labelledBy: string;
  onChange: (progress: ApplicationProgress) => void;
}

function Dot({ step }: { step: ProgressStep }) {
  return (
    <Box
      component='span'
      aria-hidden
      sx={{
        width: 24,
        height: 24,
        borderRadius: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: step.state === 'current' ? 4 : 2,
        borderColor: step.state === 'todo' ? 'divider' : 'primary.main',
        bgcolor: step.state === 'done' ? 'primary.main' : 'background.paper',
        color: 'primary.contrastText',
      }}
    >
      {step.state === 'done' ? (
        <Iconify icon='solar:check-read-linear' />
      ) : null}
    </Box>
  );
}

export function ApplicationProgressSteps({
  progress,
  labelledBy,
  onChange,
}: ApplicationProgressStepsProps) {
  const select = (step: ProgressStep) => {
    if (step.state !== 'current') onChange(step.value);
  };
  return (
    <div
      role='radiogroup'
      aria-labelledby={labelledBy}
      className='flex flex-col gap-3'
    >
      <ol className='m-0 flex list-none p-0'>
        {progress.steps.map((step, i) => (
          <li key={step.value} className='relative flex flex-1 justify-center'>
            {i > 0 ? (
              <Box
                component='span'
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: '50%',
                  width: '100%',
                  height: 2,
                  bgcolor: step.state === 'todo' ? 'divider' : 'primary.main',
                }}
              />
            ) : null}
            <ButtonBase
              role='radio'
              aria-checked={step.state === 'current'}
              disabled={progress.isLocked}
              onClick={() => select(step)}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                minHeight: 44,
                px: 1,
                borderRadius: 1,
                '&.Mui-disabled': { opacity: 0.6 },
              }}
            >
              <Dot step={step} />
              {step.state === 'current' ? (
                <Typo.Caption.Bold>{step.label}</Typo.Caption.Bold>
              ) : (
                <Typo.Caption.Regular color='text.secondary'>
                  {step.label}
                </Typo.Caption.Regular>
              )}
            </ButtonBase>
          </li>
        ))}
      </ol>
      <Box
        sx={{
          borderTop: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          pt: 3,
        }}
      >
        <ButtonBase
          role='radio'
          aria-checked={progress.exit.state === 'current'}
          disabled={progress.isLocked}
          onClick={() => select(progress.exit)}
          sx={{
            minHeight: 44,
            px: 4,
            borderRadius: 9999,
            border: 1,
            borderStyle: progress.exit.state === 'current' ? 'solid' : 'dashed',
            borderColor:
              progress.exit.state === 'current' ? 'text.primary' : 'divider',
            '&.Mui-disabled': { opacity: 0.6 },
          }}
        >
          {progress.exit.state === 'current' ? (
            <Typo.Caption.Bold>{progress.exit.label}</Typo.Caption.Bold>
          ) : (
            <Typo.Caption.Regular color='text.secondary'>
              {progress.exit.label}
            </Typo.Caption.Regular>
          )}
        </ButtonBase>
      </Box>
    </div>
  );
}
