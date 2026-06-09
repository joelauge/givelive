import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type MobileSidebarContextValue = {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
};

export const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null);

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
    const [enabled, setEnabled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const toggle = useCallback(() => setIsOpen((open) => !open), []);
    const close = useCallback(() => setIsOpen(false), []);

    const value = useMemo(
        () => ({ enabled, setEnabled, isOpen, toggle, close }),
        [enabled, isOpen, toggle, close]
    );

    return (
        <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>
    );
}

export function useMobileSidebar() {
    const context = useContext(MobileSidebarContext);
    if (!context) {
        throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
    }
    return context;
}

/** Enable the layout hamburger and expose open/close controls to a page sidebar. */
export function useRegisterMobileSidebar() {
    const context = useContext(MobileSidebarContext);

    useEffect(() => {
        if (!context) return;
        context.setEnabled(true);
        return () => {
            context.setEnabled(false);
            context.close();
        };
        // Register once per page mount — do not depend on `context` (it changes when isOpen toggles).
    }, []);

    return context;
}
