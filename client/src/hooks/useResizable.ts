import { useCallback, useEffect, useRef, useState } from 'react';

type UseResizableOptions = {
    /** Axis the size applies to: 'x' = width, 'y' = height */
    axis: 'x' | 'y';
    initial: number;
    min: number;
    /** Computed at drag time so it can track the current window size */
    getMax: () => number;
    /** Invert the pointer delta (e.g. a right-anchored panel grows when dragging left) */
    invert?: boolean;
    /** Persist the size across sessions */
    storageKey?: string;
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Drag-to-resize state for a panel. Attach `startResize` to a handle's
 * onPointerDown and apply `size` as the panel's width/height in px.
 */
export function useResizable({ axis, initial, min, getMax, invert = false, storageKey }: UseResizableOptions) {
    const [size, setSize] = useState<number>(() => {
        if (storageKey) {
            const stored = Number(localStorage.getItem(storageKey));
            if (Number.isFinite(stored) && stored > 0) {
                return clamp(stored, min, getMax());
            }
        }
        return initial;
    });
    const [isResizing, setIsResizing] = useState(false);
    const sizeRef = useRef(size);
    useEffect(() => {
        sizeRef.current = size;
    }, [size]);

    const startResize = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            const startPos = axis === 'x' ? e.clientX : e.clientY;
            const startSize = sizeRef.current;
            setIsResizing(true);

            const prevUserSelect = document.body.style.userSelect;
            const prevCursor = document.body.style.cursor;
            document.body.style.userSelect = 'none';
            document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';

            const onMove = (ev: PointerEvent) => {
                const pos = axis === 'x' ? ev.clientX : ev.clientY;
                const delta = (pos - startPos) * (invert ? -1 : 1);
                setSize(clamp(startSize + delta, min, getMax()));
            };

            const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                document.body.style.userSelect = prevUserSelect;
                document.body.style.cursor = prevCursor;
                setIsResizing(false);
                if (storageKey) {
                    localStorage.setItem(storageKey, String(sizeRef.current));
                }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
        },
        [axis, invert, min, getMax, storageKey]
    );

    return { size, isResizing, startResize };
}
