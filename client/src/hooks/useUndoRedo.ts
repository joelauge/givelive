import { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

export function useUndoRedo() {
    const [past, setPast] = useState<HistoryState[]>([]);
    const [future, setFuture] = useState<HistoryState[]>([]);

    const takeSnapshot = useCallback((nodes: Node[], edges: Edge[]) => {
        setPast((prev) => [...prev, { nodes, edges }]);
        setFuture([]);
    }, []);

    const undo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (past.length === 0) return null;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);

        setPast(newPast);
        setFuture((prev) => [{ nodes: currentNodes, edges: currentEdges }, ...prev]);

        return previous;
    }, [past]);

    const redo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
        if (future.length === 0) return null;

        const next = future[0];
        const newFuture = future.slice(1);

        setPast((prev) => [...prev, { nodes: currentNodes, edges: currentEdges }]);
        setFuture(newFuture);

        return next;
    }, [future]);

    return {
        takeSnapshot,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0
    };
}
