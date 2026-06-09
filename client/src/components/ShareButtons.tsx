import { useState } from 'react';
import { Check, Facebook, Link as LinkIcon, Linkedin, Twitter } from 'lucide-react';

type Props = {
    title: string;
    /** Path or full URL. Defaults to the current page. */
    url?: string;
    className?: string;
};

export default function ShareButtons({ title, url, className = '' }: Props) {
    const [copied, setCopied] = useState(false);

    const shareUrl = url?.startsWith('http')
        ? url
        : `${window.location.origin}${url ?? window.location.pathname}`;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (e.g. insecure context); fall back to prompt
            window.prompt('Copy this link:', shareUrl);
        }
    };

    const buttonClass =
        'w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-sm font-medium text-gray-400 mr-1">Share</span>
            <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
                aria-label="Share on X"
            >
                <Twitter size={16} />
            </a>
            <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
                aria-label="Share on LinkedIn"
            >
                <Linkedin size={16} />
            </a>
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
                aria-label="Share on Facebook"
            >
                <Facebook size={16} />
            </a>
            <button
                type="button"
                onClick={handleCopy}
                className={buttonClass}
                aria-label="Copy link"
            >
                {copied ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} />}
            </button>
        </div>
    );
}
