import { ArrowRight, Workflow, BarChart3, QrCode, Zap, Play, Heart, Globe2, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/givelive_logo_blue.svg';
import logoWhite from '../assets/givelive_logo_white.svg';

export default function Home() {
    return (
        <div className="bg-white min-h-screen font-sans selection:bg-secondary selection:text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-primary text-white">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-accent-purple/10 rounded-full blur-[80px]"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-blue text-sm font-medium mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
                            </span>
                            New: Intelligent Journey Builder is live
                        </div>

                        <img src={logoWhite} alt="GiveLive" className="h-32 w-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-75 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-display tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Power the Next Generation of <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-secondary">Giving</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            GiveLive is the operating system for high-impact live fundraising. Create immersive in-person and online digital events, engage donors instantly, and watch your movement grow.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                            <Link to="/admin" className="h-14 px-8 rounded-full bg-white text-primary font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-2 group">
                                Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="h-14 px-8 rounded-full bg-white/5 text-white border border-white/10 font-bold text-lg hover:bg-white/10 hover:scale-105 transition-all duration-300 backdrop-blur-sm flex items-center gap-3 group">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                                    <Play className="w-4 h-4 fill-white ml-0.5" />
                                </span>
                                Watch Demo
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Preview - Glassmorphism */}
                    <div className="mt-24 relative max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                        <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-xl border border-white/10 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue/20 via-transparent to-secondary/10 rounded-2xl opacity-50"></div>
                            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/9] lg:aspect-[2/1] shadow-inner group">
                                {/* UI Header */}
                                <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 gap-3">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <div className="inline-block w-48 h-6 bg-slate-800 rounded-md"></div>
                                    </div>
                                </div>
                                {/* UI Body */}
                                <div className="flex h-full">
                                    {/* Sidebar */}
                                    <div className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 hidden md:flex flex-col gap-4">
                                        <div className="w-full h-8 bg-accent-blue/20 rounded-lg"></div>
                                        <div className="space-y-2">
                                            <div className="w-full h-8 bg-slate-800/50 rounded-lg"></div>
                                            <div className="w-full h-8 bg-slate-800/50 rounded-lg"></div>
                                            <div className="w-full h-8 bg-slate-800/50 rounded-lg"></div>
                                        </div>
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                                        <div className="col-span-2 space-y-6">
                                            <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 flex items-center justify-between">
                                                <div className="space-y-2">
                                                    <div className="w-24 h-4 bg-slate-700 rounded full"></div>
                                                    <div className="w-48 h-10 bg-slate-600 rounded-lg"></div>
                                                </div>
                                                <div className="w-16 h-16 rounded-full bg-accent-green/20 text-accent-green flex items-center justify-center">
                                                    <BarChart3 size={32} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="h-24 rounded-xl bg-slate-800/50 border border-slate-800"></div>
                                                <div className="h-24 rounded-xl bg-slate-800/50 border border-slate-800"></div>
                                            </div>
                                        </div>
                                        <div className="col-span-1 rounded-2xl bg-slate-800/30 border border-slate-800 p-4 flex flex-col items-center justify-center gap-4">
                                            <div className="w-full aspect-square bg-white p-4 rounded-xl flex items-center justify-center">
                                                <QrCode size={100} className="text-slate-900" />
                                            </div>
                                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="w-2/3 h-full bg-accent-purple"></div>
                                            </div>
                                            <div className="flex justify-between w-full text-xs text-slate-400">
                                                <span>Scan Rate</span>
                                                <span className="text-white">68%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Overlay Elements */}
                                <div className="absolute top-1/4 right-1/4 bg-white rounded-xl p-4 shadow-xl border border-gray-100 transform rotate-[-6deg] translate-y-8 animate-float hidden lg:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 font-bold uppercase">New Donation</div>
                                            <div className="text-lg font-bold text-gray-900">$250.00</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By */}
            <section className="py-12 border-y border-gray-100 bg-surface">
                <div className="container mx-auto px-4">
                    <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by global non-profits</p>
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        {['CharityOne', 'GlobalHope', 'EcoAction', 'LifeWater', 'FutureKids', 'MedicAir'].map((name) => (
                            <span key={name} className="text-xl md:text-2xl font-black text-slate-800">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Props / Features */}
            <section className="py-24 md:py-32 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold font-display text-gray-900 mb-6">Everything you need to scale impact</h2>
                        <p className="text-xl text-gray-500 leading-relaxed">
                            Stop wrestling with clunky tools. GiveLive provides a unified suite of powerful features designed specifically for the dynamics of modern fundraising.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 rounded-3xl bg-surface border border-gray-100 hover:shadow-xl hover:shadow-accent-blue/5 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-accent-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Workflow size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Visual Journey Builder</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Design complex donor journeys with a drag-and-drop interface. Trigger emails, texts, and on-screen alerts based on real-time behavior.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-surface border border-gray-100 hover:shadow-xl hover:shadow-accent-purple/5 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-accent-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <QrCode size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Bridge Physical & Digital</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Deploy dynamic QR codes that change behavior based on time, location, or user segment. Perfect for live event activation.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-surface border border-gray-100 hover:shadow-xl hover:shadow-secondary/5 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Heart size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Frictionless Giving</h3>
                            <p className="text-gray-500 leading-relaxed">
                                Optimized donation flows that work instantly on mobile. Apple Pay, Google Pay, and one-tap checkout increase conversion by 40%.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-blue/20 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                                    <BarChart3 size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Real-Time Analytics</h3>
                                <p className="text-gray-400 mb-6">Track every dollar, click, and scan as it happens. Make data-driven decisions on the fly.</p>
                                <div className="h-32 bg-white/5 rounded-lg border border-white/10 p-4 flex items-end gap-2">
                                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                        <div key={i} className="flex-1 bg-accent-blue/80 hover:bg-accent-blue transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise-Grade Security</h3>
                                <p className="text-gray-500 mb-6">SOC2 compliant, PCI-DSS Level 1 certified. Your donor data is locked down and secure.</p>
                                <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> 99.99% Uptime</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> 24/7 Monitoring</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Big CTA */}
            <section className="py-24 bg-primary relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-blue/20 rounded-full blur-[120px]"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold font-display text-white mb-8">Ready to start your movement?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of forward-thinking organizations using GiveLive to make a bigger difference.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/admin" className="h-16 px-10 rounded-full bg-white text-primary font-bold text-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-xl shadow-white/10 flex items-center gap-2">
                            Get Started for Free <ArrowRight size={24} />
                        </Link>
                    </div>

                    <p className="mt-8 text-gray-500 text-sm">
                        No credit card required · 14-day free trial · Cancel anytime
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary-light border-t border-white/5 py-12 text-gray-400 text-sm">
                <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/" className="mb-4 block">
                            <img src={logo} alt="GiveLive" className="h-8 w-auto" />
                        </Link>
                        <p className="max-w-xs mb-6">Empowering non-profits with the technology they need to change the world.</p>
                        <div className="flex gap-4">
                            {/* Social icons placeholders */}
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"><Globe2 size={18} /></div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition cursor-pointer"><Users size={18} /></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-white transition">Features</a></li>
                            <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                            <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
                            <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-white transition">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition">Careers</a></li>
                            <li><a href="#" className="hover:text-white transition">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© 2024 GiveLive Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
