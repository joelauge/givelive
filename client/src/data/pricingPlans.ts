export type PlanId = 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';

export type PlanFeature = {
    text: string;
    included: boolean;
};

export type PricingPlan = {
    id: PlanId;
    name: string;
    price: string;
    priceDetail?: string;
    description: string;
    audience?: string;
    goal?: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    cta: string;
    ctaHref: string;
};

export const pricingPlans: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        priceDetail: '/month',
        description: 'Perfect for individuals testing the platform.',
        goal: 'Let people experience success and create organic sharing.',
        features: [
            '1 active campaign',
            '1 QR code',
            '100 captured leads/month',
            'GiveLive branding',
            'Basic analytics',
        ],
        cta: 'Start free',
        ctaHref: '/admin',
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$19',
        priceDetail: '/month',
        description: 'For local businesses, churches, creators, and realtors.',
        audience: 'Likely your most common entry plan.',
        features: [
            '10 campaigns',
            'Unlimited QR codes',
            '1,000 leads/month',
            'Custom branding',
            'Email notifications',
            'CSV export',
        ],
        cta: 'Get Starter',
        ctaHref: '/admin',
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '$49',
        priceDetail: '/month',
        description: 'For serious marketers scaling acquisition.',
        audience: 'Expected highest-volume plan.',
        features: [
            'Unlimited campaigns',
            '10,000 leads/month',
            'CRM integrations',
            'Automated email sequences',
            'Custom domains',
            'Team members (3)',
            'Advanced analytics',
        ],
        highlighted: true,
        badge: 'Most popular',
        cta: 'Get Growth',
        ctaHref: '/admin',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$99',
        priceDetail: '/month',
        description: 'For agencies and organizations.',
        features: [
            '50,000 leads/month',
            'White-labeling',
            'Team members (10)',
            'API access',
            'Webhooks',
            'Priority support',
        ],
        cta: 'Get Pro',
        ctaHref: '/admin',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$299+',
        priceDetail: '/month',
        description: 'Custom pricing for large teams and regulated industries.',
        features: [
            'Unlimited leads',
            'SSO',
            'Dedicated onboarding',
            'Custom integrations',
            'SLA',
        ],
        cta: 'Contact sales',
        ctaHref: 'mailto:hello@givelive.app?subject=Enterprise%20pricing',
    },
];

export const aiFollowUpAddon = {
    name: 'AI Follow-Up Assistant',
    price: '+$29',
    priceDetail: '/month',
    tagline: 'The upsell that could double revenue — direct value, not more QR codes.',
    description:
        'Add to any paid plan. Automatically nurtures leads after every scan.',
    features: [
        'Sends follow-up emails',
        'Drafts SMS messages',
        'Scores leads',
        'Creates CRM notes',
    ],
    cta: 'Join waitlist',
    ctaHref: 'mailto:hello@givelive.app?subject=AI%20Follow-Up%20Assistant%20waitlist',
};

/** Plan limits for future server enforcement — keep in sync with marketing copy */
export const planLimits: Record<
    PlanId,
    {
        activeCampaigns: number | null;
        qrCodes: number | null;
        leadsPerMonth: number | null;
        teamMembers: number | null;
    }
> = {
    free: { activeCampaigns: 1, qrCodes: 1, leadsPerMonth: 100, teamMembers: 1 },
    starter: { activeCampaigns: 10, qrCodes: null, leadsPerMonth: 1000, teamMembers: 1 },
    growth: { activeCampaigns: null, qrCodes: null, leadsPerMonth: 10000, teamMembers: 3 },
    pro: { activeCampaigns: null, qrCodes: null, leadsPerMonth: 50000, teamMembers: 10 },
    enterprise: { activeCampaigns: null, qrCodes: null, leadsPerMonth: null, teamMembers: null },
};
