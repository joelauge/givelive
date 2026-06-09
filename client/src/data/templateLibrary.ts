import { Heart, MessageSquare, Ticket, Quote, UserPlus, Droplets, Users, Music, Video, Gift, TrendingUp, Building2, Calendar, Award, Trophy, Zap, Star } from 'lucide-react';

export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: any;
    iconColor: string;
    iconBg: string;
}

export const categories = [
    'All',
    'Fundraising',
    'Real Locations',
    'Churches',
    'Lead Capture',
    'Online Webinar',
    'Concerts',
    'Surveys',
    'Tickets',
    'Raffles',
    'Quiz Games',
    'Real Estate'
];

export const templates: TemplateMetadata[] = [
    // Fundraising (3 templates)
    {
        id: 'simple-donation',
        name: 'Simple Donation',
        description: 'Quick donation flow with thank you',
        category: 'Fundraising',
        icon: Heart,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100'
    },
    {
        id: 'monthly-giving',
        name: 'Monthly Giving',
        description: 'Recurring donation signup',
        category: 'Fundraising',
        icon: Heart,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100'
    },
    {
        id: 'matching-campaign',
        name: 'Matching Campaign',
        description: 'Donation with matching incentive',
        category: 'Fundraising',
        icon: TrendingUp,
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100'
    },

    // Real Locations (3 templates)
    {
        id: 'event-checkin',
        name: 'Event Check-in',
        description: 'Simple check-in with follow-up',
        category: 'Real Locations',
        icon: Users,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },
    {
        id: 'networking-event',
        name: 'Networking Event',
        description: 'Connect scanners and collect contacts',
        category: 'Real Locations',
        icon: Users,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },
    {
        id: 'conference-agenda',
        name: 'Conference Agenda',
        description: 'Event schedule with session selection',
        category: 'Real Locations',
        icon: Calendar,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },

    // Churches (3 templates)
    {
        id: 'new-member',
        name: 'New Member',
        description: 'Welcome new visitors and connect',
        category: 'Churches',
        icon: UserPlus,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100'
    },
    {
        id: 'get-baptised',
        name: 'Get Baptised',
        description: 'Baptism signup and information',
        category: 'Churches',
        icon: Droplets,
        iconColor: 'text-cyan-600',
        iconBg: 'bg-cyan-100'
    },
    {
        id: 'small-groups',
        name: 'Small Groups',
        description: 'Connect people to small groups',
        category: 'Churches',
        icon: Users,
        iconColor: 'text-indigo-600',
        iconBg: 'bg-indigo-100'
    },

    // Lead Capture (3 templates)
    {
        id: 'lead-magnet',
        name: 'Lead Magnet',
        description: 'Free resource in exchange for email',
        category: 'Lead Capture',
        icon: Gift,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },
    {
        id: 'demo-request',
        name: 'Demo Request',
        description: 'Schedule product demo',
        category: 'Lead Capture',
        icon: Video,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },
    {
        id: 'waitlist-signup',
        name: 'Waitlist Signup',
        description: 'Join waitlist for launch',
        category: 'Lead Capture',
        icon: TrendingUp,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },

    // Online Webinar (3 templates)
    {
        id: 'webinar-registration',
        name: 'Webinar Registration',
        description: 'Register for online webinar',
        category: 'Online Webinar',
        icon: Video,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100'
    },
    {
        id: 'workshop-series',
        name: 'Workshop Series',
        description: 'Multi-part workshop signup',
        category: 'Online Webinar',
        icon: Building2,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100'
    },
    {
        id: 'masterclass',
        name: 'Masterclass',
        description: 'Premium training session',
        category: 'Online Webinar',
        icon: Award,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100'
    },

    // Concerts (3 templates)
    {
        id: 'concert-tickets',
        name: 'Concert Tickets',
        description: 'Ticket sales with seat selection',
        category: 'Concerts',
        icon: Music,
        iconColor: 'text-pink-600',
        iconBg: 'bg-pink-100'
    },
    {
        id: 'backstage-pass',
        name: 'Backstage Pass',
        description: 'VIP experience upgrade',
        category: 'Concerts',
        icon: Music,
        iconColor: 'text-pink-600',
        iconBg: 'bg-pink-100'
    },
    {
        id: 'fan-meetup',
        name: 'Fan Meetup',
        description: 'Meet and greet registration',
        category: 'Concerts',
        icon: Users,
        iconColor: 'text-pink-600',
        iconBg: 'bg-pink-100'
    },

    // Surveys (3 templates)
    {
        id: 'feedback-survey',
        name: 'Feedback Survey',
        description: 'Collect feedback with follow-up',
        category: 'Surveys',
        icon: MessageSquare,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },
    {
        id: 'nps-survey',
        name: 'NPS Survey',
        description: 'Net Promoter Score measurement',
        category: 'Surveys',
        icon: TrendingUp,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },
    {
        id: 'market-research',
        name: 'Market Research',
        description: 'Product feedback survey',
        category: 'Surveys',
        icon: MessageSquare,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },

    // Tickets (3 templates)
    {
        id: 'event-ticket',
        name: 'Event Ticket',
        description: 'Standard ticket sales',
        category: 'Tickets',
        icon: Ticket,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100'
    },
    {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Discount ticket with countdown',
        category: 'Tickets',
        icon: Zap,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100'
    },
    {
        id: 'group-tickets',
        name: 'Group Tickets',
        description: 'Group discount booking',
        category: 'Tickets',
        icon: Users,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100'
    },

    // Raffles (3 templates)
    {
        id: 'raffle-entry',
        name: 'Raffle Entry',
        description: 'Simple raffle entry form',
        category: 'Raffles',
        icon: Ticket,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },
    {
        id: 'grand-prize',
        name: 'Grand Prize',
        description: 'Multi-prize raffle',
        category: 'Raffles',
        icon: Trophy,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },
    {
        id: 'charity-raffle',
        name: 'Charity Raffle',
        description: 'Fundraising raffle with donation',
        category: 'Raffles',
        icon: Heart,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100'
    },

    // Quiz Games (3 templates)
    {
        id: 'trivia-quiz',
        name: 'Trivia Quiz',
        description: 'Interactive trivia game',
        category: 'Quiz Games',
        icon: Award,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100'
    },
    {
        id: 'personality-quiz',
        name: 'Personality Quiz',
        description: 'Fun personality assessment',
        category: 'Quiz Games',
        icon: Users,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100'
    },
    {
        id: 'leaderboard-challenge',
        name: 'Leaderboard Challenge',
        description: 'Competitive quiz with prizes',
        category: 'Quiz Games',
        icon: Trophy,
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100'
    },

    // Additional templates
    {
        id: 'share-testimonial',
        name: 'Share Testimonial',
        description: 'Video testimonial collection',
        category: 'Surveys',
        icon: Quote,
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100'
    },
    {
        id: 'google-review',
        name: 'Google Review',
        description: 'Ask happy customers for a review',
        category: 'Surveys',
        icon: Star,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-100'
    },
    // Real Estate (2 templates)
    {
        id: 'open-house',
        name: 'Open House Sign-in',
        description: 'Digital register for open house visitors',
        category: 'Real Estate',
        icon: Building2,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    },
    {
        id: 'real-estate-lead',
        name: 'New Lead Speed-to-Lead',
        description: 'Immediate response for new inquiries',
        category: 'Real Estate',
        icon: Building2,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-100'
    }
];

export const getTemplatesByCategory = (category: string): TemplateMetadata[] => {
    if (category === 'All') return templates;
    return templates.filter(t => t.category === category);
};

export const getCategoryCount = (category: string): number => {
    if (category === 'All') return templates.length;
    return templates.filter(t => t.category === category).length;
};
