import { Outlet } from 'react-router-dom';
import Logo from './Logo';

export default function Layout() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            {/* Header */}
            <header className="bg-surface border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        {/* Placeholder for nav items or user profile */}
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200"></div>
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
