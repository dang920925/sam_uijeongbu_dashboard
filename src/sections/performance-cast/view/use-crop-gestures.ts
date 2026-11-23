'use client';

// ----------------------------------------------------------------------
// (U51) 조정 창 무대의 끌기·두 손가락 확대 — Pointer Events(마우스·터치·펜 한 갈래). JSX 없음.
// 무대는 원본 전체를 그대로 줄여 보여 주므로 '무대 폭의 n%' = '원본 가로의 n%'. 무대는 touch-action: none.
// 손가락 하나 = 옮기기(onMove % 단위), 둘 = 처음 거리 대비 비율(onPinch). 끄는 동안 onDragChange(true).
// ----------------------------------------------------------------------
import { useRef, type PointerEvent } from 'react';

interface CropGestureHandlers {
  onMove: (dxPercent: number, dyPercent: number) => void;
  onPinchStart: () => void;
  onPinch: (scale: number) => void;
  onDragChange: (isDragging: boolean) => void;
}

interface Point {
  x: number;
  y: number;
}

function distance(points: Point[]): number {
  const [a, b] = points;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function useCropGestures(
  handlers: CropGestureHandlers,
  enabled: boolean
) {
  const pointers = useRef(new Map<number, Point>());
  const pinchFrom = useRef(0);

  const end = (event: PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(event.pointerId)) return;
    if (pointers.current.size < 2) pinchFrom.current = 0;
    if (pointers.current.size === 0) handlers.onDragChange(false);
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!enabled || (event.pointerType === 'mouse' && event.button !== 0))
        return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (pointers.current.size === 2) {
        pinchFrom.current = distance([...pointers.current.values()]);
        handlers.onPinchStart();
      }
      handlers.onDragChange(true);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      const next = { x: event.clientX, y: event.clientY };
      pointers.current.set(event.pointerId, next);
      if (pointers.current.size >= 2) {
        if (pinchFrom.current > 0)
          handlers.onPinch(
            distance([...pointers.current.values()]) / pinchFrom.current
          );
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      handlers.onMove(
        ((next.x - previous.x) / rect.width) * 100,
        ((next.y - previous.y) / rect.height) * 100
      );
    },
    onPointerUp: end,
    onPointerCancel: end,
  };
}
