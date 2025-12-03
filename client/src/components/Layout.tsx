import { Outlet, useLocation, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Logo from './Logo';

export default function Layout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            {/* Header */}
            <header className="bg-surface border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-5 py-2.5 rounded-full font-bold text-primary border-2 border-primary/10 hover:border-primary hover:bg-gray-50 transition">
                                    Log In
                                </button>
                            </SignInButton>
                            {isHomePage && (
                                <Link to="/demo" className="btn-secondary py-2.5 px-5 text-sm shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 hover:-translate-y-0.5 transition-all duration-300">
                                    Request A Demo
                                </Link>
                            )}
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-surface border-t border-gray-100 py-8 mt-auto">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 opacity-80">
                        <Logo size="small" />
                        <span className="text-sm text-gray-400 ml-2">© 2024 GiveLive</span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-primary transition">Privacy</a>
                        <a href="#" className="hover:text-primary transition">Terms</a>
                        <a href="#" className="hover:text-primary transition">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
