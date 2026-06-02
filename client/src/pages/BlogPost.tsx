import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { templates } from '../data/templateLibrary';
import { Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../api';

// Import local image (this path is a placeholder relative to where images are served)
// For now we will use a computed path or import if it's in assets
// Since we are generating images into an artifact folder, we need to move them to public or src/assets to use them in build.
// For development, we'll assume they are available or use online placeholder if missing.

export default function BlogPost() {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Template not found</h1>
                <Link to="/blog" className="text-primary hover:underline">Back to Blog</Link>
            </div>
        );
    }

    const { isSignedIn, user } = useUser();
    const [creating, setCreating] = useState(false);

    const handleUseTemplate = async () => {
        if (!isSignedIn) {
            // Redirect to public preview
            navigate(`/template-preview/${template?.id}`);
            return;
        }

        // Authenticated: Create project and redirect
        try {
            setCreating(true);
            const res = await api.createEvent({
                org_id: user.id, // Using user ID as org for now
                name: `My ${template?.name} Flow`,
                date: new Date().toISOString(),
                qr_url: 'https://example.com/placeholder'
            });

            if (res && res.id) {
                // Redirect to builder with template param
                navigate(`/admin/event/${res.id}?template=${template?.id}&new=true`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to start project (Backend might be offline locally). Try signing up!');
        } finally {
            setCreating(false);
        }
    };

    const [imageAttempt, setImageAttempt] = useState(0); // 0: specific.png, 1: specific.jpg, 2: category.png, 3: category.jpg

    const getImageUrl = () => {
        const baseName = template.id.replace(/-/g, '_');
        const catName = template.category.toLowerCase().replace(/\s+/g, '_');

        switch (imageAttempt) {
            case 0: return `/assets/blog_illustration_${baseName}.png`;
            case 1: return `/assets/blog_illustration_${baseName}.jpg`;
            case 2: return `/assets/blog_illustration_${catName}.png`;
            case 3: return `/assets/blog_illustration_${catName}.jpg`;
            default: return `https://placehold.co/1200x600/e2e8f0/475569?text=${encodeURIComponent(template.category + ' Illustration')}`;
        }
    };

    const handleImageError = () => {
        if (imageAttempt < 4) { // Allow one more step for the placeholder if needed
            setImageAttempt(prev => prev + 1);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <article>
                {/* Hero Section */}
                <div className="relative bg-slate-50 pt-16 pb-24 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="max-w-3xl mx-auto text-center mb-12">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 bg-white border border-gray-200 text-gray-500`}>
                                {template.category}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
                                Free {template.name} <span className="text-primary">Template</span>
                            </h1>
                            <p className="text-xl text-slate-500 leading-relaxed mb-8">
                                {template.description}. Get started in minutes with this professionally designed, mobile-optimized template.
                            </p>

                            <div className="flex items-center justify-center gap-4">
                                <button onClick={handleUseTemplate} disabled={creating} className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
                                    {creating ? 'Setting up...' : 'Use this free template'}
                                </button>
                            </div>
                        </div>

                        {/* Illustration */}
                        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-slate-200 aspect-[5/3] relative group">
                            <img
                                key={imageAttempt}
                                src={getImageUrl()}
                                alt={`${template.name} Illustration`}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                            <div className="absolute bottom-8 left-8 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                                    </div>
                                    <span className="text-sm font-medium opacity-90">Trusted by 10,000+ users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-4xl mx-auto px-6 py-24">
                    <div className="prose prose-lg prose-slate mx-auto">
                        <h2>Why use this {template.name} template?</h2>
                        <p>
                            Starting from scratch can be tough. Our <strong>{template.name}</strong> template is pre-configured with the optimal flow to maximize conversions.
                            Whether you're looking to {template.description.toLowerCase()} or simply engage scanners at your location, this template provides the perfect foundation.
                        </p>

                        <div className="my-12 grid md:grid-cols-2 gap-8 not-prose">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className={`w-12 h-12 ${template.iconBg} ${template.iconColor} rounded-xl flex items-center justify-center mb-4`}>
                                    <template.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Mobile Optimized</h3>
                                <p className="text-gray-500 text-sm">Looks perfect on every device, ensuring you never miss an opportunity from mobile visitors.</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                                    <Check size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Zero Code Required</h3>
                                <p className="text-gray-500 text-sm">Customize everything with our visual builder. Change colors, text, and layout in seconds.</p>
                            </div>
                        </div>

                        <h3>What's included?</h3>
                        <ul>
                            <li>Pre-built conversion pages</li>
                            <li>Integrated payment processing (if applicable)</li>
                            <li>Automated SMS/Email follow-ups</li>
                            <li>Real-time analytics dashboard</li>
                        </ul>

                        <div className="bg-primary/5 p-8 rounded-3xl mt-12 text-center not-prose border border-primary/10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
                            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                                You can be up and running with this template in less than 5 minutes. No credit card required to start building.
                            </p>
                            <button onClick={handleUseTemplate} disabled={creating} className="bg-primary text-white px-8 py-3 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-70 disabled:cursor-wait">
                                {creating ? 'Setting up...' : 'Start with this template'}
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
