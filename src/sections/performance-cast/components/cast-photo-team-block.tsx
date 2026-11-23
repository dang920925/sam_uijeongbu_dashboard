'use client';

// ----------------------------------------------------------------------
// (U48) '캐스트 사진' ② 팀샷 — 팀마다 1장(16:9). 머리 "A팀 · 8명" + 교체·삭제(44), 없으면 점선 "A팀 사진 올리기".
// 팀이 없으면 안내 한 줄('팀 계정' 탭에서 만든다).
// ----------------------------------------------------------------------
import IconButton from '@mui/material/IconButton';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { CastPhotoFrame } from '@/src/sections/performance-cast/components/cast-photo-frame';
import { PhotoDropButton } from '@/src/sections/performance-cast/components/photo-drop-button';
import { PhotoFilePicker } from '@/src/sections/performance-cast/components/photo-file-picker';
import { PhotoUploadError } from '@/src/sections/performance-cast/components/photo-upload-error';
import type { TeamPhotoTile } from '@/src/sections/performance-cast/utils/cast-photo-rows';
import type { CastPhotoSection } from '@/src/sections/performance-cast/view/use-cast-photo-section';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface CastPhotoTeamBlockProps {
  teams: TeamPhotoTile[];
  section: CastPhotoSection;
}

const ICON_SX = { width: LAYOUT.touch, height: LAYOUT.touch };

export function CastPhotoTeamBlock({
  teams,
  section,
}: CastPhotoTeamBlockProps) {
  if (teams.length === 0) {
    return (
      <Typo.Badge.Regular color='text.secondary'>
        {MSG_D14.PHOTO_TEAM_NONE}
      </Typo.Badge.Regular>
    );
  }
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {teams.map((team) => {
        const isBusy = team.upload !== null && team.upload.phase !== 'error';
        return (
          <PhotoFilePicker
            key={team.teamAccountId}
            onFile={(file) => section.onUploadTeam(team, file)}
            inputLabel={MSG_D14.PHOTO_TEAM_UPLOAD(team.label)}
          >
            {(open) => (
              <div className='flex min-w-0 flex-col gap-2'>
                <div className='flex min-h-11 items-center justify-between gap-2'>
                  <span className='flex items-baseline gap-1'>
                    <Typo.Badge.Semibold>
                      {MSG_D14.PHOTO_TEAM_NAME(team.label)}
                    </Typo.Badge.Semibold>
                    {team.memberCount !== null ? (
                      <Typo.Badge.Regular color='text.secondary'>
                        {MSG_D14.PHOTO_TEAM_COUNT(team.memberCount)}
                      </Typo.Badge.Regular>
                    ) : null}
                  </span>
                  {team.photoUrl ? (
                    <span className='flex items-center gap-1'>
                      <IconButton
                        aria-label={MSG_D14.PHOTO_TEAM_REPLACE_ARIA(team.label)}
                        disabled={isBusy}
                        onClick={open}
                        sx={{ ...ICON_SX, color: 'text.secondary' }}
                      >
                        <Iconify icon='solar:refresh-linear' />
                      </IconButton>
                      <IconButton
                        aria-label={MSG_D14.PHOTO_TEAM_DELETE_ARIA(team.label)}
                        onClick={() => section.onDeleteTeam(team)}
                        sx={{ ...ICON_SX, color: 'error.main' }}
                      >
                        <Iconify icon='solar:trash-bin-trash-linear' />
                      </IconButton>
                    </span>
                  ) : null}
                </div>
                <CastPhotoFrame
                  ratio='16 / 9'
                  imageUrl={team.photoUrl}
                  alt={MSG_D14.PHOTO_TEAM_ALT(team.label)}
                  upload={team.upload}
                >
                  <PhotoDropButton
                    label={MSG_D14.PHOTO_TEAM_UPLOAD(team.label)}
                    help={MSG_D14.PHOTO_TEAM_UPLOAD_HELP(team.label)}
                    onClick={open}
                  />
                </CastPhotoFrame>
                {team.upload?.phase === 'error' ? (
                  <PhotoUploadError
                    message={team.upload.errorMessage ?? MSG_D14.PHOTO_FAILED}
                    canRetry={team.upload.canRetry}
                    onRetry={() => section.onRetryUpload(team.slotKey)}
                    onDismiss={() => section.onDismissUpload(team.slotKey)}
                  />
                ) : null}
              </div>
            )}
          </PhotoFilePicker>
        );
      })}
    </div>
  );
}
