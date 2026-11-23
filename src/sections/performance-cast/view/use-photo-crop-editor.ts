'use client';

// ----------------------------------------------------------------------
// (U51) '보이는 위치 조정' 창 ViewModel — JSX 없음(designer §21.2).
// - 값은 창 안에서만 바꾸고 [저장] 때 `…/display` PATCH 한 번(onSave). [취소]·닫기·Esc 는 저장 없이 닫는다(올린 직후면 가운데·원본).
// - 원본 크기를 모르면(옛 사진) 사진을 연 뒤 naturalWidth·Height 로 잰다.
// - 끌기·두 손가락 확대는 use-crop-gestures 가 % 로 바꿔 준다. 키보드: 화살표 1%·Shift 10%·+/− 확대.
// ----------------------------------------------------------------------
import { useRef, useState } from 'react';

import type { CastPhotoDisplaySave } from '@/src/api/cast-photo-queries';
import {
  clamp,
  coverStyle,
  cropKeyAction,
  CROP_LIMIT,
  pinchZoom,
  ratioOf,
  type PhotoAspect,
  type PhotoSize,
} from '@/src/sections/performance-cast/utils/photo-crop';
import {
  clearThumb,
  initialEditorState,
  moveActive,
  resetActive,
  setAspect,
  toDisplaySave,
  toEditorModel,
  zoomActive,
  type CropEditorRequest,
  type CropEditTarget,
} from '@/src/sections/performance-cast/utils/photo-crop-editor';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { toApiErrorMessage } from '@/src/utils/api-error-message';

export interface PhotoCropEditorOptions {
  onSave: (save: CastPhotoDisplaySave) => Promise<void>;
  onClose: () => void;
}

export function usePhotoCropEditor(
  request: CropEditorRequest,
  { onSave, onClose }: PhotoCropEditorOptions
) {
  const [state, setState] = useState(() => initialEditorState(request));
  const [natural, setNatural] = useState<PhotoSize | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pinchStart = useRef(1);

  const size = request.size ?? natural;
  const model = size ? toEditorModel(request, state, size) : null;
  const zoomTo = (zoom: number) =>
    size && setState((s) => zoomActive(request, s, size, zoom));
  const active = model?.active ?? state.crop;
  const isRole = request.kind === 'role';
  const ratioLabel = isRole
    ? request.cardRatio
    : MSG_D14.RATIO_LABEL(state.aspect);

  const cardRatio = isRole
    ? ratioOf(request.cardRatio)
    : (model?.ratio ?? null);
  const preview = {
    imageUrl: request.imageUrl,
    size,
    /** 카드(배역)·잘라 보기(단체·팀) — 원본이면 null */
    card:
      cardRatio === null
        ? null
        : { ratio: cardRatio, style: coverStyle(size, cardRatio, state.crop) },
    thumb: isRole
      ? { ratio: 1, style: coverStyle(size, 1, state.thumbCrop ?? state.crop) }
      : null,
    roleLabel: request.roleLabel,
    actorName: request.actorName,
  };

  return {
    kind: request.kind,
    who: request.who,
    isNew: request.isNew,
    imageUrl: request.imageUrl,
    size,
    isLoading: size === null && !loadFailed,
    loadFailed,
    model,
    target: state.target,
    aspect: state.aspect,
    ratioLabel,
    zoomPercent: Math.round(active.zoom * 100),
    readout: MSG_D14.CROP_READOUT(
      Math.round(active.x),
      Math.round(active.y),
      Math.round(active.zoom * 100)
    ),
    isDragging,
    isSaving,
    errorMessage,
    preview,
    onImageLoad: (width: number, height: number) => {
      if (width > 0 && height > 0) setNatural({ width, height });
    },
    onImageError: () => setLoadFailed(true),
    onTarget: (target: CropEditTarget) => setState((s) => ({ ...s, target })),
    onAspect: (aspect: PhotoAspect) => setState((s) => setAspect(s, aspect)),
    onMove: (dx: number, dy: number) =>
      size && setState((s) => moveActive(request, s, size, dx, dy)),
    onZoom: zoomTo,
    onZoomStep: (delta: number) =>
      zoomTo(
        clamp(active.zoom + delta, CROP_LIMIT.zoomMin, CROP_LIMIT.zoomMax)
      ),
    onPinchStart: () => {
      pinchStart.current = active.zoom;
    },
    onPinch: (scale: number) => zoomTo(pinchZoom(pinchStart.current, 1, scale)),
    onDragChange: setDragging,
    /** 처리했으면 true(기본 동작 막기) */
    onKey: (key: string, shiftKey: boolean): boolean => {
      const action = cropKeyAction(key, shiftKey);
      if (!action || !size) return false;
      if (action.kind === 'move') {
        setState((s) => moveActive(request, s, size, action.dx, action.dy));
      } else {
        zoomTo(
          clamp(
            active.zoom + action.delta,
            CROP_LIMIT.zoomMin,
            CROP_LIMIT.zoomMax
          )
        );
      }
      return true;
    },
    onReset: () => setState((s) => resetActive(request, s)),
    onThumbAuto: () => setState(clearThumb),
    onCancel: () => {
      if (!isSaving) onClose();
    },
    onSave: () => {
      if (isSaving) return;
      setSaving(true);
      setErrorMessage(null);
      onSave(toDisplaySave(request, state, size))
        .then(onClose)
        .catch((error: unknown) => {
          setErrorMessage(toApiErrorMessage(error));
          setSaving(false);
        });
    },
  };
}

export type PhotoCropEditor = ReturnType<typeof usePhotoCropEditor>;
