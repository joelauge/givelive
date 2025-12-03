import { ArrowRight, Workflow, BarChart3, QrCode, Zap, CheckCircle2, Play, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="bg-background min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        New: AI-Powered Journey Builder
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                        Turn Live Events into <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Movements</span>
                    </h1>

                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        The all-in-one platform for interactive, real-time fundraising journeys. Engage your audience, track impact, and drive donations instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <Link to="/admin" className="btn-primary py-4 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2">
                            Start Building <ArrowRight size={20} />
                        </Link>
                        <button className="px-8 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-2">
                            <Play size={20} className="fill-gray-700" /> Watch Demo
                        </button>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden aspect-[16/9] relative group cursor-default">
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white z-0"></div>

                            {/* Mock UI Elements */}
                            <div className="absolute top-0 left-0 w-64 h-full border-r border-gray-100 bg-surface p-4 z-10 hidden md:block">
                                <div className="h-8 w-32 bg-gray-200 rounded-lg mb-8"></div>
                                <div className="space-y-3">
                                    <div className="h-10 w-full bg-primary/10 rounded-xl"></div>
                                    <div className="h-10 w-full bg-gray-50 rounded-xl"></div>
                                    <div className="h-10 w-full bg-gray-50 rounded-xl"></div>
                                </div>
                            </div>

                            <div className="absolute top-8 left-8 md:left-72 right-8 bottom-8 z-10">
                                <div className="flex gap-6 h-full">
                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-4 group-hover:scale-[1.02] transition-transform duration-500">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <QrCode size={32} />
                                        </div>
                                        <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
                                        <div className="h-3 w-24 bg-gray-50 rounded-full"></div>
                                    </div>
                                    <div className="w-12 flex items-center justify-center text-gray-300">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-4 group-hover:scale-[1.02] transition-transform duration-500 delay-75">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Zap size={32} />
                                        </div>
                                        <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
                                        <div className="h-3 w-24 bg-gray-50 rounded-full"></div>
                                    </div>
                                    <div className="w-12 flex items-center justify-center text-gray-300">
                                        <ArrowRight size={24} />
                                    </div>
                                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center gap-4 group-hover:scale-[1.02] transition-transform duration-500 delay-150">
                                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                            <Heart size={32} />
                                        </div>
                                        <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
                                        <div className="h-3 w-24 bg-gray-50 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Powerful tools designed specifically for the unique dynamics of live fundraising events.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Workflow size={24} />,
                                color: "bg-blue-100 text-blue-600",
                                title: "Journey Builder",
                                desc: "Visual drag-and-drop editor to create complex donor journeys in minutes."
                            },
                            {
                                icon: <BarChart3 size={24} />,
                                color: "bg-green-100 text-green-600",
                                title: "Live Analytics",
                                desc: "Real-time dashboard to track donations, engagement, and impact as it happens."
                            },
                            {
                                icon: <QrCode size={24} />,
                                color: "bg-purple-100 text-purple-600",
                                title: "QR Interactions",
                                desc: "Bridge the physical and digital worlds with dynamic, trackable QR codes."
                            },
                            {
                                icon: <Zap size={24} />,
                                color: "bg-orange-100 text-orange-600",
                                title: "Instant Impact",
                                desc: "Frictionless donation flows optimized for mobile conversion."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-surface border border-gray-100 hover:shadow-lg transition duration-300 group">
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="py-20 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Trusted by forward-thinking organizations</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos */}
                        <div className="text-2xl font-black text-gray-800">CharityOne</div>
                        <div className="text-2xl font-black text-gray-800">GlobalHope</div>
                        <div className="text-2xl font-black text-gray-800">EcoAction</div>
                        <div className="text-2xl font-black text-gray-800">LifeWater</div>
                        <div className="text-2xl font-black text-gray-800">FutureKids</div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20"></div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-bold mb-6">Ready to transform your events?</h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of organizations using GiveLive to make a bigger impact.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/admin" className="bg-white text-gray-900 py-4 px-8 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl flex items-center gap-2">
                            Get Started for Free <ArrowRight size={20} />
                        </Link>
                        <button className="px-8 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition">
                            Contact Sales
                        </button>
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> No credit card required</div>
                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 14-day free trial</div>
                        <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Cancel anytime</div>
                    </div>
                </div>
            </section>
        </div>
    );
}
