import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import BillingCheckoutModal from './BillingCheckoutModal';
import type { PricingPlan } from '../data/pricingPlans';

type Props = {
    plan: PricingPlan;
    highlighted?: boolean;
};

export default function PlanCheckoutButton({ plan, highlighted }: Props) {
    const { isSignedIn, user } = useUser();
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    const buttonClass = `block w-full py-3.5 rounded-full font-bold text-center transition disabled:opacity-60 ${
        highlighted
            ? 'bg-primary text-white hover:bg-primary-light shadow-lg'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
    }`;

    if (plan.ctaHref.startsWith('mailto:')) {
        return (
            <a href={plan.ctaHref} className={buttonClass}>
                {plan.cta}
            </a>
        );
    }

    if (plan.id === 'free') {
        return (
            <Link to="/admin" className={buttonClass}>
                {plan.cta}
            </Link>
        );
    }

    const paidPlans = ['starter', 'growth', 'pro'] as const;
    const isPaid = paidPlans.includes(plan.id as (typeof paidPlans)[number]);

    if (!isPaid) {
        return (
            <Link to={plan.ctaHref} className={buttonClass}>
                {plan.cta}
            </Link>
        );
    }

    if (!isSignedIn) {
        return (
            <SignInButton mode="modal" forceRedirectUrl="/pricing">
                <button type="button" className={buttonClass}>
                    Sign in to subscribe
                </button>
            </SignInButton>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                disabled={!user?.id}
                className={buttonClass}
            >
                {plan.cta}
            </button>
            <BillingCheckoutModal
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                planId={plan.id as 'starter' | 'growth' | 'pro'}
                planName={plan.name}
            />
        </>
    );
}
