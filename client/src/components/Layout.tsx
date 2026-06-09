import { Link, Outlet, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useContext } from 'react';
import { MobileSidebarContext, MobileSidebarProvider } from '../contexts/MobileSidebarContext';

function MobileMenuButton() {
    const context = useContext(MobileSidebarContext);
    if (!context?.enabled) return null;

    return (
        <button
            type="button"
            onClick={context.toggle}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            aria-label={context.isOpen ? 'Close menu' : 'Open menu'}
        >
            {context.isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
    );
}

export default function Layout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <MobileSidebarProvider>
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            {/* Header */}
            {!isHomePage ? (
                <header className="bg-surface border-b border-gray-100 sticky top-0 z-[60]">
                    <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <MobileMenuButton />
                            <Logo size="small" />
                        </div>
                        <div className="flex items-center gap-4">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="px-5 py-2.5 rounded-full font-bold text-primary border-2 border-primary/10 hover:border-primary hover:bg-gray-50 transition">
                                        Log In
                                    </button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                    </div>
                </header>
            ) : (
                <div className="absolute top-6 right-6 z-50">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 rounded-full text-sm font-bold bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition border border-white/10 shadow-lg">
                                Log In
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10 border-2 border-white/20" } }} />
                    </SignedIn>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer - Hide on Home since it has its own */}
            {!isHomePage && (
                <footer className="bg-surface border-t border-gray-100 py-3 md:py-8 mt-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-2 opacity-80">
                            <Logo size="small" className="hidden sm:inline-block" />
                            <span className="text-xs md:text-sm text-gray-400 sm:ml-2">© 2024 GiveLive</span>
                        </div>
                        <div className="hidden sm:flex gap-6 text-sm text-gray-500">
                            <Link to="/privacy" className="hover:text-primary transition">Privacy</Link>
                            <Link to="/tos" className="hover:text-primary transition">Terms</Link>
                            <a href="mailto:hello@givelive.app" className="hover:text-primary transition">Support</a>
                        </div>
                    </div>
                </footer>
            )}
        </div>
        </MobileSidebarProvider>
    );
}
