import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { TemplateMetadata } from '../data/templateLibrary';

type Props = {
    template: TemplateMetadata;
};

export default function TemplateCard({ template }: Props) {
    const [imageError, setImageError] = useState(false);
    const [imageAttempt, setImageAttempt] = useState(0);

    const getImageUrl = () => {
        const baseName = template.id.replace(/-/g, '_');
        const catName = template.category.toLowerCase().replace(/\s+/g, '_');

        switch (imageAttempt) {
            case 0:
                return `/assets/blog_illustration_${baseName}.png`;
            case 1:
                return `/assets/blog_illustration_${baseName}.jpg`;
            case 2:
                return `/assets/blog_illustration_${catName}.png`;
            case 3:
                return `/assets/blog_illustration_${catName}.jpg`;
            default:
                return '';
        }
    };

    const handleImageError = () => {
        if (imageAttempt < 3) {
            setImageAttempt((prev) => prev + 1);
        } else {
            setImageError(true);
        }
    };

    const Icon = template.icon;

    return (
        <Link
            to={`/blog/${template.id}`}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
        >
            <div className={`h-48 ${template.iconBg} flex items-center justify-center relative overflow-hidden shrink-0`}>
                {!imageError ? (
                    <img
                        key={imageAttempt}
                        src={getImageUrl()}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={handleImageError}
                    />
                ) : (
                    <Icon
                        size={64}
                        className={`${template.iconColor} opacity-50 group-hover:scale-110 transition-transform duration-500`}
                    />
                )}
            </div>
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border border-gray-100 px-2 py-1 rounded-full">
                        {template.category}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                    {template.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">
                    {template.description}
                </p>
                <span className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                    Read article
                    <ArrowRight size={14} />
                </span>
            </div>
        </Link>
    );
}
