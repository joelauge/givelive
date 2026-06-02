import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { templates, categories } from '../data/templateLibrary';

export default function BlogIndex() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTemplates = templates.filter(template => {
        const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-grow pt-12 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                            Discover <span className="text-primary">Free Templates</span>
                        </h1>
                        <p className="text-lg text-gray-500 mb-8">
                            Browse our library of professionally designed templates for fundraising, events, and more.
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition ${selectedCategory === category
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                                <Search className="text-gray-300" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No templates found</h3>
                            <p className="text-gray-500">Try adjusting your search or category filter</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">© {new Date().getFullYear()} GiveLive. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function TemplateCard({ template }: { template: any }) {
    const [imageError, setImageError] = useState(false);
    const [imageAttempt, setImageAttempt] = useState(0); // 0: specific.png, 1: specific.jpg, 2: category.png, 3: category.jpg

    const getImageUrl = () => {
        const baseName = template.id.replace(/-/g, '_');
        const catName = template.category.toLowerCase().replace(/\s+/g, '_');

        switch (imageAttempt) {
            case 0: return `/assets/blog_illustration_${baseName}.png`;
            case 1: return `/assets/blog_illustration_${baseName}.jpg`;
            case 2: return `/assets/blog_illustration_${catName}.png`;
            case 3: return `/assets/blog_illustration_${catName}.jpg`;
            default: return '';
        }
    };

    const handleImageError = () => {
        if (imageAttempt < 3) {
            setImageAttempt(prev => prev + 1);
        } else {
            setImageError(true);
        }
    };

    return (
        <Link
            to={`/blog/${template.id}`}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className={`h-48 ${template.iconBg} flex items-center justify-center relative overflow-hidden`}>
                {!imageError ? (
                    <img
                        key={imageAttempt} // Force re-render on error to try next URL
                        src={getImageUrl()}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={handleImageError}
                    />
                ) : (
                    <template.icon size={64} className={`${template.iconColor} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        View Template <ArrowRight size={14} />
                    </div>
                </div>
            </div>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border border-gray-100 px-2 py-1 rounded-full">
                        {template.category}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                    {template.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {template.description}
                </p>
            </div>
        </Link>
    );
}
