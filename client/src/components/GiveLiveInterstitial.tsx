import logoBlue from '../assets/givelive_logo_blue.png';
import { watermarkUrl } from '../lib/watermark';

type Props = {
    eventId?: string;
    onContinue: () => void;
};

export default function GiveLiveInterstitial({ eventId, onContinue }: Props) {
    const signupUrl = watermarkUrl('page', eventId);

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="max-w-sm w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                <img
                    src={logoBlue}
                    alt="GiveLive"
                    className="h-16 w-auto"
                />

                <p className="text-gray-600 text-base leading-relaxed">
                    Provided by{' '}
                    <a
                        href={signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                    >
                        GiveLive.app
                    </a>
                    {' — '}
                    Get your free account at{' '}
                    <a
                        href={signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline"
                    >
                        GiveLive.app
                    </a>
                </p>

                <button
                    type="button"
                    onClick={onContinue}
                    className="w-full max-w-xs py-3.5 px-6 rounded-full bg-primary text-white font-bold text-base hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
