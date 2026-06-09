import { useState } from 'react';
import { Search } from 'lucide-react';
import { templates, categories } from '../data/templateLibrary';
import { usePageSeo } from '../lib/seo';
import TemplateCard from '../components/TemplateCard';

export default function BlogIndex() {
    usePageSeo({
        title: 'Free QR Flow Templates',
        description:
            'Browse professionally designed GiveLive templates for fundraising, real locations, lead capture, tickets, raffles, and more. Start from a proven flow in minutes.',
        path: '/blog',
    });

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
                            Browse our library of professionally designed templates for fundraising, real locations, and more.
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
