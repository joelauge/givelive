import { Link } from 'react-router-dom';
import logo from '../assets/givelive_logo_blue.svg';

export default function Logo({ className = "", size = "normal" }: { className?: string, size?: "normal" | "small" }) {
    const height = size === "small" ? "h-8" : "h-16";

    return (
        <Link to="/" className={`inline-block transition-opacity hover:opacity-80 ${className}`}>
            <img
                src={logo}
                alt="GiveLive Logo"
                className={`${height} w-auto object-contain`}
            />
        </Link>
    );
}
