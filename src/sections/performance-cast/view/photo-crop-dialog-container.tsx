'use client';

// ----------------------------------------------------------------------
// (U51) '보이는 위치 조정' 창 Container — 창 ViewModel·끌기 처리를 묶어 View 에 넘긴다.
// 부르는 쪽이 key={request.key} 로 그려 대상이 바뀌면 값이 새로 시작된다.
// ----------------------------------------------------------------------
import { PhotoCropDialog } from '@/src/sections/performance-cast/components/photo-crop-dialog';
import type { CropEditorRequest } from '@/src/sections/performance-cast/utils/photo-crop-editor';
import { useCropGestures } from '@/src/sections/performance-cast/view/use-crop-gestures';
import {
  usePhotoCropEditor,
  type PhotoCropEditorOptions,
} from '@/src/sections/performance-cast/view/use-photo-crop-editor';

interface PhotoCropDialogContainerProps extends PhotoCropEditorOptions {
  request: CropEditorRequest;
}

export function PhotoCropDialogContainer({
  request,
  onSave,
  onClose,
}: PhotoCropDialogContainerProps) {
  const editor = usePhotoCropEditor(request, { onSave, onClose });
  const gestures = useCropGestures(
    {
      onMove: editor.onMove,
      onPinchStart: editor.onPinchStart,
      onPinch: editor.onPinch,
      onDragChange: editor.onDragChange,
    },
    Boolean(editor.model?.canAdjust)
  );
  return <PhotoCropDialog editor={editor} gestures={gestures} />;
}
