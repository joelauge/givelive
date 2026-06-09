/**
 * Programmatic SEO data: audience x template use-case landing pages.
 *
 * Each entry below renders at /use-cases/{slug} and is included in the
 * generated sitemap.xml, llms.txt, and use-cases/*.md (see
 * scripts/generate-llms.mjs). Keep copy unique per combo — search engines
 * penalize thin, duplicated programmatic pages.
 */
import { templates } from './templateLibrary';

export interface UseCaseAudience {
    slug: string;
    name: string;
    /** Lowercase, reads naturally mid-sentence: "...built for {shortName}" */
    shortName: string;
    blurb: string;
    painPoints: string[];
}

export interface UseCaseCopy {
    templateId: string;
    title: string;
    metaDescription: string;
    headline: string;
    intro: string;
    benefits: { title: string; description: string }[];
}

export interface UseCase extends UseCaseCopy {
    slug: string;
    audience: UseCaseAudience;
    templateName: string;
    templateCategory: string;
    steps: string[];
    faqs: { question: string; answer: string }[];
}

export const audiences: UseCaseAudience[] = [
    {
        slug: 'real-estate-agents',
        name: 'Real Estate Agents & Teams',
        shortName: 'real estate agents and teams',
        blurb: 'Turn open houses, yard signs, and listing flyers into automated lead pipelines that follow up before your competitors call back.',
        painPoints: [
            'Paper sign-in sheets with illegible phone numbers and fake emails',
            'Leads going cold because follow-up happens days after the showing',
            'No way to know which listing, sign, or flyer actually generated a lead',
        ],
    },
    {
        slug: 'churches',
        name: 'Churches & Ministries',
        shortName: 'churches and ministries',
        blurb: 'Connect with visitors, grow generosity, and move people into community — from a single QR code on a seat-back card or screen.',
        painPoints: [
            'First-time visitors leave without anyone capturing their contact info',
            'Connection cards pile up and never make it into a follow-up system',
            'Giving drops when people stop carrying cash or checks',
        ],
    },
    {
        slug: 'nonprofits',
        name: 'Nonprofits & Charities',
        shortName: 'nonprofits and charities',
        blurb: 'Convert in-person moments — galas, drives, street campaigns — into donations and donor relationships with zero friction.',
        painPoints: [
            'Donation forms that lose supporters before they finish checkout',
            'One-time givers who never hear from you again',
            'No attribution for which campaign or event drove each donation',
        ],
    },
    {
        slug: 'restaurants-retail',
        name: 'Restaurants & Retail',
        shortName: 'restaurants and retail stores',
        blurb: 'Every table tent, receipt, and window decal becomes a review engine, loyalty list, and repeat-visit driver.',
        painPoints: [
            'Happy customers leave without reviewing; unhappy ones review first',
            'No customer list to bring people back on slow nights',
            'Foot traffic you paid for walks out the door anonymously',
        ],
    },
    {
        slug: 'event-organizers',
        name: 'Event Organizers & Conferences',
        shortName: 'event organizers and conference teams',
        blurb: 'Run check-in, ticketing, agendas, and post-event feedback from QR codes — and keep every attendee in your funnel afterward.',
        painPoints: [
            'Check-in lines and clipboard chaos at the registration desk',
            'Attendee data trapped in a ticketing platform you can\'t market to',
            'Feedback surveys sent days later that nobody answers',
        ],
    },
    {
        slug: 'creators-coaches',
        name: 'Creators, Coaches & Educators',
        shortName: 'creators, coaches, and educators',
        blurb: 'Fill webinars, sell programs, and grow superfan lists from QR codes on merch, slides, business cards, and live appearances.',
        painPoints: [
            'Followers who never make it onto an email list you own',
            'Manual DM follow-up that doesn\'t scale past a handful of leads',
            'Launches that start from zero because past audiences weren\'t captured',
        ],
    },
];

/** Per-audience template copy. Each becomes one landing page. */
const useCaseCopy: Record<string, UseCaseCopy[]> = {
    'real-estate-agents': [
        {
            templateId: 'open-house',
            title: 'QR Code Open House Sign-In for Real Estate Agents',
            metaDescription:
                'Replace the paper sign-in sheet with a QR open house flow: capture verified visitor contacts, trigger instant follow-up, and sync every lead to your CRM.',
            headline: 'The open house sign-in sheet that follows up for you',
            intro:
                'Put one QR code on the entry table and every visitor signs in on their own phone — name, email, and mobile number, verified and legible. The moment they submit, GiveLive sends your follow-up text, drops them into your nurture sequence, and pushes the lead to Follow Up Boss, HubSpot, or any CRM you run.',
            benefits: [
                { title: 'Verified contact info', description: 'Visitors type their own details on their own phone — no more guessing at handwriting or chasing fake emails.' },
                { title: 'Follow-up in seconds, not days', description: 'An automated text or email goes out while the buyer is still standing in the kitchen.' },
                { title: 'Per-listing attribution', description: 'Each property gets its own QR flow, so you know exactly which listing produced every lead.' },
            ],
        },
        {
            templateId: 'real-estate-lead',
            title: 'Speed-to-Lead QR Flows for Real Estate Teams',
            metaDescription:
                'Respond to every new real estate inquiry in under a minute with automated QR-triggered follow-up — texts, emails, and CRM entries with zero manual work.',
            headline: 'Win the listing by answering first',
            intro:
                'Real estate leads convert 5x better when contacted within five minutes — and almost never after a day. This flow captures inquiries from yard signs, flyers, and postcards, then fires an instant SMS response and books the conversation before another agent even sees the lead.',
            benefits: [
                { title: 'Instant SMS response', description: 'Every inquiry gets an immediate, personal-feeling text — even when you\'re in a showing.' },
                { title: 'Yard signs that work 24/7', description: 'A QR rider on every sign turns drive-by interest into captured, qualified leads.' },
                { title: 'CRM-ready from scan one', description: 'Leads flow straight into Follow Up Boss, Salesforce, or HubSpot with source attribution.' },
            ],
        },
        {
            templateId: 'lead-magnet',
            title: 'QR Lead Magnet Funnels for Real Estate Marketing',
            metaDescription:
                'Offer home valuation guides, buyer checklists, and neighborhood reports through a QR code — capture emails and nurture prospects automatically.',
            headline: 'Trade a buyer\'s guide for a future client',
            intro:
                'A "Free Home Seller\'s Guide" QR code on your farming postcards or open house handouts captures prospects months before they list. GiveLive delivers the download instantly and starts an email nurture sequence that keeps you top-of-mind until they\'re ready.',
            benefits: [
                { title: 'Capture before the listing', description: 'Reach homeowners while they\'re still researching — long before they pick an agent.' },
                { title: 'Automatic delivery + nurture', description: 'The guide arrives instantly and the drip sequence runs itself.' },
                { title: 'Works on any print asset', description: 'Postcards, door hangers, flyers, and signs all feed the same pipeline.' },
            ],
        },
        {
            templateId: 'google-review',
            title: 'QR Google Review Flows for Real Estate Agents',
            metaDescription:
                'Ask happy buyers and sellers for Google reviews at the closing table with a QR code — route satisfied clients to Google and concerns to you.',
            headline: 'Turn closing-day joy into 5-star reviews',
            intro:
                'The best moment to ask for a review is at the closing table — not in an email three weeks later. Hand clients a card with your review QR code and they\'re on your Google profile in one scan, while less-happy feedback routes privately to you first.',
            benefits: [
                { title: 'Catch peak happiness', description: 'Ask in person at closing, when clients are most enthusiastic.' },
                { title: 'One scan to Google', description: 'No searching for your profile — the QR opens your review form directly.' },
                { title: 'Protect your rating', description: 'Unhappy feedback is routed to you privately before it becomes public.' },
            ],
        },
        {
            templateId: 'feedback-survey',
            title: 'QR Buyer Feedback Surveys for Open Houses & Showings',
            metaDescription:
                'Collect honest buyer feedback after every showing with a QR survey — and capture the contact info of every interested visitor automatically.',
            headline: 'Know what buyers really think after every showing',
            intro:
                'Sellers always ask "what did they think?" — now you have a real answer. A QR feedback survey at the door collects honest impressions on price, condition, and interest level, while quietly building your buyer database for the next listing.',
            benefits: [
                { title: 'Seller-ready feedback reports', description: 'Walk into your listing update with real buyer data, not vibes.' },
                { title: 'Spot serious buyers', description: 'Interest-level questions surface who\'s worth a same-day call.' },
                { title: 'Build your buyer list', description: 'Every respondent becomes a contact for future matching listings.' },
            ],
        },
    ],
    churches: [
        {
            templateId: 'new-member',
            title: 'QR New Visitor Welcome Flows for Churches',
            metaDescription:
                'Replace paper connection cards with a QR welcome flow: capture visitor info, send an instant welcome text, and route people to next steps automatically.',
            headline: 'Never lose track of a first-time visitor again',
            intro:
                'A QR code on the seat back, bulletin, or screen lets visitors connect in 30 seconds — no pen, no card, no awkward drop-box. They get an instant welcome message with service times and next steps, and your follow-up team gets their info before they reach the parking lot.',
            benefits: [
                { title: 'Connect during the service', description: 'Visitors respond in the moment, when the decision to connect is easiest.' },
                { title: 'Instant, warm follow-up', description: 'An automated welcome text or email lands the same day — every time.' },
                { title: 'Route to real next steps', description: 'Push new contacts to your ChMS, email list, or volunteer team automatically.' },
            ],
        },
        {
            templateId: 'simple-donation',
            title: 'QR Code Giving for Churches: Scan-to-Give Donations',
            metaDescription:
                'Let your congregation give in seconds with a QR donation flow — mobile-optimized checkout, instant thank-you messages, and automatic records.',
            headline: 'Generosity that fits in one scan',
            intro:
                'Most of your congregation stopped carrying cash years ago. A scan-to-give QR code on the screen, bulletin, or offering table opens a mobile-optimized giving page in seconds — with an automatic thank-you message and clean records for your finance team.',
            benefits: [
                { title: 'Frictionless mobile giving', description: 'From scan to completed gift in under a minute, on any phone.' },
                { title: 'Automatic thank-yous', description: 'Every giver receives an immediate, personal acknowledgment.' },
                { title: 'Clean giving records', description: 'Every gift is tracked with campaign attribution for your finance team.' },
            ],
        },
        {
            templateId: 'monthly-giving',
            title: 'Recurring Giving Signup Flows for Churches',
            metaDescription:
                'Grow predictable giving with a QR recurring-donation flow — members set up monthly gifts once, on their phone, in under two minutes.',
            headline: 'Turn one-time givers into faithful monthly partners',
            intro:
                'Recurring givers donate significantly more over a year than occasional givers — but only if signing up is effortless. This flow lets members set up a monthly gift from their seat during a single service, with automated confirmations that make them feel appreciated from day one.',
            benefits: [
                { title: 'Predictable monthly budget', description: 'Recurring commitments smooth out seasonal giving dips.' },
                { title: 'Two-minute signup', description: 'Members complete the entire setup during announcements.' },
                { title: 'Retention messaging built in', description: 'Automated updates keep monthly partners engaged and giving.' },
            ],
        },
        {
            templateId: 'small-groups',
            title: 'QR Small Group Signup Flows for Churches',
            metaDescription:
                'Fill your small groups with a QR signup flow — members browse groups, register on their phone, and leaders get rosters automatically.',
            headline: 'From "interested" to "in a group" in one scan',
            intro:
                'Small group signups die in the lobby line. A QR code on the screen or group fair table lets people browse groups and register on the spot — and group leaders receive their rosters automatically, with each member already welcomed by text or email.',
            benefits: [
                { title: 'Sign up in the moment', description: 'Capture commitment during the sermon push, not "sometime this week".' },
                { title: 'Automatic leader rosters', description: 'Leaders get member contact info without anyone retyping a spreadsheet.' },
                { title: 'Welcome messages on autopilot', description: 'Every signup receives group details and meeting info instantly.' },
            ],
        },
        {
            templateId: 'get-baptised',
            title: 'QR Baptism Signup Flows for Churches',
            metaDescription:
                'Make responding to a baptism call effortless: a QR signup flow that captures decisions in the moment and routes them to your pastoral team.',
            headline: 'Capture the decision while hearts are stirred',
            intro:
                'When someone decides to get baptized, the window to act is now — not after they find a staff member in the lobby. A QR code on screen during the invitation lets people respond from their seat, and your pastoral team gets notified immediately to follow up personally.',
            benefits: [
                { title: 'Respond from the seat', description: 'No lobby lines or lost connection cards between decision and signup.' },
                { title: 'Pastoral team notified instantly', description: 'Staff can celebrate and follow up the same day.' },
                { title: 'Prep info delivered automatically', description: 'Candidates receive dates, expectations, and class info by text or email.' },
            ],
        },
    ],
    nonprofits: [
        {
            templateId: 'simple-donation',
            title: 'QR Code Donation Flows for Nonprofits',
            metaDescription:
                'Capture donations anywhere your supporters are — events, mailers, posters — with a mobile-first QR donation flow and automated thank-you receipts.',
            headline: 'Make giving as easy as scanning',
            intro:
                'Every flyer, poster, table tent, and direct-mail piece can take donations when it carries a QR code. Supporters scan, give on a mobile-optimized page, and receive an instant thank-you — while you see exactly which placement drove every dollar.',
            benefits: [
                { title: 'Donations from any surface', description: 'Print materials, event signage, and screens all become giving channels.' },
                { title: 'Mobile-first checkout', description: 'A fast, focused giving page that doesn\'t lose donors mid-form.' },
                { title: 'Campaign-level attribution', description: 'Separate QR flows per campaign show what\'s actually working.' },
            ],
        },
        {
            templateId: 'matching-campaign',
            title: 'Matching Gift Campaign Flows for Nonprofits',
            metaDescription:
                'Run urgency-driven matching campaigns with QR flows that show match progress, double donor impact, and automate every receipt and update.',
            headline: 'Double every gift while the match is live',
            intro:
                'Matching campaigns work because of urgency and multiplied impact — your flow should sell both. This template leads with the match ("your $50 becomes $100"), captures the gift in seconds, and follows up automatically as the campaign progresses toward its goal.',
            benefits: [
                { title: 'Lead with doubled impact', description: 'Messaging built around the match drives meaningfully higher conversion.' },
                { title: 'Urgency that converts', description: 'Deadline-driven framing moves donors from "later" to "now".' },
                { title: 'Automated progress updates', description: 'Donors hear when the goal is hit — priming them for the next campaign.' },
            ],
        },
        {
            templateId: 'charity-raffle',
            title: 'QR Charity Raffle Flows for Nonprofit Fundraising',
            metaDescription:
                'Run a compliant, friction-free charity raffle with QR entry, integrated donations, and automatic winner notification — no paper tickets.',
            headline: 'A raffle that raises money and builds your donor list',
            intro:
                'Paper raffle tickets capture nothing but a torn stub. A QR raffle entry captures the supporter — name, email, phone — alongside the donation, then handles confirmations and winner notification automatically. Every entrant becomes a contact for your next campaign.',
            benefits: [
                { title: 'Every entry is a donor record', description: 'Build a marketable supporter list with every ticket sold.' },
                { title: 'No paper, no cash box', description: 'Entries and payments are digital, tracked, and reconcilable.' },
                { title: 'Automatic winner workflow', description: 'Drawing announcements and notifications run themselves.' },
            ],
        },
        {
            templateId: 'event-ticket',
            title: 'QR Gala & Fundraising Event Ticket Flows for Nonprofits',
            metaDescription:
                'Sell gala and fundraiser tickets through a QR flow — mobile checkout, instant confirmations, and every attendee captured for post-event stewardship.',
            headline: 'Sell out the gala and keep every guest in your funnel',
            intro:
                'Your fundraising event is also your best donor-acquisition moment. A QR ticket flow on invitations and social posts sells seats with mobile checkout, then keeps every attendee\'s contact info for post-event thank-yous, impact reports, and next year\'s campaign.',
            benefits: [
                { title: 'Checkout that converts', description: 'Mobile-first ticketing without clunky third-party platform friction.' },
                { title: 'Own your attendee data', description: 'Guest contacts live in your system, not a ticketing vendor\'s.' },
                { title: 'Stewardship on autopilot', description: 'Post-event thank-you and impact messages send automatically.' },
            ],
        },
        {
            templateId: 'share-testimonial',
            title: 'QR Story Collection Flows for Nonprofits',
            metaDescription:
                'Collect beneficiary and volunteer stories with a QR video testimonial flow — authentic content for your appeals, grants, and social channels.',
            headline: 'Capture the stories that fund your mission',
            intro:
                'Nothing raises money like a real story told by a real person. Put a QR code at your events and program sites, and beneficiaries, volunteers, and donors can record a short video testimonial on their own phone — giving you a steady stream of authentic content for appeals and grant reports.',
            benefits: [
                { title: 'Stories straight from the source', description: 'First-person video beats any copywriting you could commission.' },
                { title: 'Collected where impact happens', description: 'Program sites and events become content pipelines.' },
                { title: 'Reusable everywhere', description: 'Fuel appeals, social proof, grant reports, and your website.' },
            ],
        },
    ],
    'restaurants-retail': [
        {
            templateId: 'google-review',
            title: 'QR Google Review Flows for Restaurants & Retail',
            metaDescription:
                'Get more Google reviews from happy customers with a QR review flow on receipts and table tents — and intercept complaints before they go public.',
            headline: 'More 5-star reviews, fewer public complaints',
            intro:
                'Your happiest customers rarely think to leave a review — your unhappiest always do. A QR code on the receipt, table tent, or counter catches satisfied guests in the moment, sends them straight to your Google profile, and routes complaints to you privately first.',
            benefits: [
                { title: 'Ask at peak satisfaction', description: 'Catch guests right after a great meal or purchase, not days later.' },
                { title: 'One scan to your profile', description: 'Zero searching — the review form opens directly.' },
                { title: 'Complaint interception', description: 'Negative feedback reaches your manager before it reaches Google.' },
            ],
        },
        {
            templateId: 'feedback-survey',
            title: 'QR Customer Feedback Surveys for Restaurants & Stores',
            metaDescription:
                'Collect real-time customer feedback with QR surveys at the table or register — spot problems same-day and build a contact list while you\'re at it.',
            headline: 'Hear about problems before they become 1-star reviews',
            intro:
                'By the time bad feedback shows up online, it\'s too late to fix. A table or register QR survey surfaces service issues the same shift they happen — and every response captures a customer contact you can win back with a direct follow-up.',
            benefits: [
                { title: 'Same-shift issue alerts', description: 'Know about a bad experience while the customer is still reachable.' },
                { title: 'Feedback plus contact capture', description: 'Every survey response grows your marketing list.' },
                { title: 'Trends across locations', description: 'Compare scores by location, shift, or season in one dashboard.' },
            ],
        },
        {
            templateId: 'raffle-entry',
            title: 'QR Giveaway & Raffle Flows for Restaurants & Retail',
            metaDescription:
                'Turn foot traffic into a marketing list with QR giveaway entries — customers enter to win on their phone and you keep every contact.',
            headline: 'The giveaway that builds your customer list',
            intro:
                'A "Win a free dinner" QR code at the register converts anonymous foot traffic into a marketable list. Customers enter in 20 seconds on their phone; you collect names, emails, and numbers — then bring winners and non-winners alike back through automated offers.',
            benefits: [
                { title: 'Every entry is a contact', description: 'One giveaway can build months of remarketing audience.' },
                { title: '20-second entry', description: 'Low friction means staff don\'t have to pitch it — the prize does.' },
                { title: 'Win-back offers built in', description: 'Non-winners automatically get a consolation offer that drives a return visit.' },
            ],
        },
        {
            templateId: 'trivia-quiz',
            title: 'QR Trivia & Engagement Games for Restaurants & Bars',
            metaDescription:
                'Run table-side trivia through a QR code — entertain guests, extend dwell time, and capture contacts for your next promotion.',
            headline: 'Trivia night, minus the host — plus a mailing list',
            intro:
                'A QR trivia game on every table keeps guests engaged, ordering, and coming back for the next round. Players register to compete, which means every participant joins your list — and your next trivia-night promo has a built-in audience.',
            benefits: [
                { title: 'Longer visits, bigger tabs', description: 'Engaged tables stay for one more round.' },
                { title: 'Self-running entertainment', description: 'No host or AV setup — guests play on their own phones.' },
                { title: 'Players become subscribers', description: 'Registration grows your promo list every game night.' },
            ],
        },
        {
            templateId: 'waitlist-signup',
            title: 'QR Waitlist & Launch Signup Flows for Retail & Hospitality',
            metaDescription:
                'Build hype for openings, seasonal menus, and product drops with QR waitlist flows — capture demand in person and notify everyone at launch.',
            headline: 'Open with a line out the door',
            intro:
                'Construction wrap, pop-up signage, or a "coming soon" window decal can all build your launch list. Passers-by scan, join the waitlist in seconds, and get notified automatically the moment you open — so day one starts with a crowd, not crickets.',
            benefits: [
                { title: 'Capture demand before launch', description: 'The buildout itself becomes a marketing channel.' },
                { title: 'Launch-day blast included', description: 'One message brings the whole waitlist through your door.' },
                { title: 'Works for drops and seasons', description: 'Reuse for new menus, collections, and limited releases.' },
            ],
        },
    ],
    'event-organizers': [
        {
            templateId: 'event-checkin',
            title: 'QR Event Check-In Flows for Organizers',
            metaDescription:
                'Replace registration lines with QR self check-in — attendees check in on their phone and your post-event follow-up runs automatically.',
            headline: 'Check-in lines are a choice. Choose not to have them.',
            intro:
                'Posters at the entrance with a QR code let attendees check themselves in as they walk through the door — no clipboards, no badge-desk bottleneck. You get a live attendance count, verified contact data, and automated post-event follow-up that starts the moment the event ends.',
            benefits: [
                { title: 'No registration desk chaos', description: 'Attendees self check-in from their phones in seconds.' },
                { title: 'Live attendance visibility', description: 'Watch arrivals in real time instead of counting badge stubs.' },
                { title: 'Post-event follow-up on autopilot', description: 'Thank-yous, recordings, and offers send automatically to everyone who actually showed up.' },
            ],
        },
        {
            templateId: 'networking-event',
            title: 'QR Networking & Contact Exchange Flows for Events',
            metaDescription:
                'Help attendees connect and capture every participant\'s contact info with a QR networking flow — no badge scanners or business cards needed.',
            headline: 'Networking events where connections actually persist',
            intro:
                'Business cards end up in the wash, and badge-scanner exports end up nowhere. A QR networking flow lets attendees share their info once and connect with everyone they meet — while you, the organizer, keep a clean record of every engaged participant for your next event.',
            benefits: [
                { title: 'Connections without hardware', description: 'No badge scanners to rent — everyone\'s phone is the scanner.' },
                { title: 'Organizer keeps the graph', description: 'You see who attended and engaged, not just who registered.' },
                { title: 'Next-event remarketing', description: 'Engaged attendees become your launch list for the next edition.' },
            ],
        },
        {
            templateId: 'conference-agenda',
            title: 'QR Conference Agenda & Session Flows',
            metaDescription:
                'Give attendees a live mobile agenda via QR code — session selection, room changes, and speaker info without printing a single program.',
            headline: 'The conference program that updates itself',
            intro:
                'Printed agendas are outdated by lunchtime. A QR code on badges and signage opens a live mobile agenda — sessions, rooms, and speakers always current — and session sign-ups tell you exactly which content your audience wants more of next year.',
            benefits: [
                { title: 'Always-current schedule', description: 'Room changes and cancellations update instantly for everyone.' },
                { title: 'Session-level analytics', description: 'See which talks drew interest to plan next year\'s program.' },
                { title: 'Zero printing costs', description: 'Skip the program printing line item entirely.' },
            ],
        },
        {
            templateId: 'early-bird',
            title: 'Early-Bird Ticket Flows with QR Codes for Events',
            metaDescription:
                'Drive early ticket sales with countdown-powered QR flows — urgency pricing, instant mobile checkout, and automated price-change announcements.',
            headline: 'Sell the room before the price goes up',
            intro:
                'Early-bird pricing only works when the deadline feels real. This flow pairs a live countdown with mobile checkout, so the QR on your posters and posts converts urgency into sales — and automatically messages your list before each price tier closes.',
            benefits: [
                { title: 'Countdown-driven conversion', description: 'A visible deadline turns "maybe later" into "buy now".' },
                { title: 'Tiered pricing automation', description: 'Prices step up on schedule without manual updates.' },
                { title: 'Deadline reminder blasts', description: 'Your waitlist hears before every tier change — automatically.' },
            ],
        },
        {
            templateId: 'nps-survey',
            title: 'QR NPS & Post-Event Survey Flows for Organizers',
            metaDescription:
                'Measure event satisfaction with QR NPS surveys completed before attendees leave — higher response rates and testimonials while the energy is high.',
            headline: 'Get your NPS before the parking lot empties',
            intro:
                'Surveys emailed three days later get single-digit response rates. A QR survey on exit signage and closing slides captures scores while the experience is fresh — and automatically asks your promoters for a public testimonial while they\'re still glowing.',
            benefits: [
                { title: 'In-the-moment response rates', description: 'Capture feedback at the venue, not in tomorrow\'s inbox.' },
                { title: 'Promoters become testimonials', description: 'High scorers are automatically asked for a quote or review.' },
                { title: 'Sponsor-ready reporting', description: 'Hard satisfaction numbers strengthen next year\'s sponsorship deck.' },
            ],
        },
    ],
    'creators-coaches': [
        {
            templateId: 'webinar-registration',
            title: 'QR Webinar Registration Flows for Coaches & Creators',
            metaDescription:
                'Fill webinars from podcasts, social bios, and live appearances with QR registration flows — automated confirmations and show-up reminders included.',
            headline: 'Fill your webinar from anywhere your audience sees you',
            intro:
                'Mention your webinar on a podcast, conference slide, or video and the QR code does the rest — registration in seconds, confirmation immediately, and automated reminders that fight the no-show problem. Every registrant lands on your email list, attend or not.',
            benefits: [
                { title: 'Register at the moment of interest', description: 'No "link in bio" hunting — scan and you\'re in.' },
                { title: 'No-show defense built in', description: 'Automated reminder sequences lift attendance rates.' },
                { title: 'List growth either way', description: 'Even no-shows become subscribers you can re-invite.' },
            ],
        },
        {
            templateId: 'masterclass',
            title: 'QR Masterclass Funnels for Coaches & Course Creators',
            metaDescription:
                'Sell premium masterclasses through QR flows on slides, merch, and cards — positioning, mobile checkout, and automated onboarding in one funnel.',
            headline: 'A premium funnel for your premium offer',
            intro:
                'High-ticket training deserves better than a bio link. This flow presents your masterclass with premium positioning, handles payment on the spot, and onboards buyers automatically — so a QR code on your conference slide or business card becomes a complete sales funnel.',
            benefits: [
                { title: 'Premium positioning', description: 'A focused, polished page that justifies high-ticket pricing.' },
                { title: 'Scan-to-paid in one flow', description: 'No email back-and-forth between interest and purchase.' },
                { title: 'Automated onboarding', description: 'Buyers get access details and prep materials instantly.' },
            ],
        },
        {
            templateId: 'workshop-series',
            title: 'QR Workshop Series Signup Flows for Educators',
            metaDescription:
                'Enroll students in multi-session workshops with one QR signup — series scheduling, session reminders, and completion follow-ups automated.',
            headline: 'One signup, a whole series of engagement',
            intro:
                'Multi-session programs live or die on attendance between sessions. This flow enrolls students once, then handles every reminder, materials drop, and between-session nudge automatically — so session four is as full as session one.',
            benefits: [
                { title: 'Single enrollment, full series', description: 'One scan registers students for every session.' },
                { title: 'Between-session retention', description: 'Automated reminders and materials keep cohorts engaged.' },
                { title: 'Completion-based upsell', description: 'Finishers automatically hear about your next program.' },
            ],
        },
        {
            templateId: 'fan-meetup',
            title: 'QR Fan Meetup & Community Flows for Creators',
            metaDescription:
                'Turn followers into a community you own with QR meetup registration — capture superfans at live events and keep them engaged afterward.',
            headline: 'Your superfans, on a list you actually own',
            intro:
                'Platform followers can vanish with an algorithm change — an email and phone list can\'t. QR codes at shows, pop-ups, and meetups convert your most committed fans into owned contacts, with automated event details and post-meetup engagement keeping the relationship warm.',
            benefits: [
                { title: 'Own the relationship', description: 'Move fans from rented platforms onto your own list.' },
                { title: 'Capture at peak fandom', description: 'Live events are where casual followers become superfans.' },
                { title: 'Community on autopilot', description: 'Event info, follow-ups, and next-event invites send themselves.' },
            ],
        },
        {
            templateId: 'personality-quiz',
            title: 'QR Personality Quiz Funnels for Creators & Coaches',
            metaDescription:
                'Grow your list with a shareable QR personality quiz — fun for your audience, segmentation data for you, and automated results delivery.',
            headline: 'The lead magnet people actually want to share',
            intro:
                'Nobody shares a PDF download — everybody shares their quiz result. A personality quiz behind a QR code entertains your audience while segmenting your list by their answers, so your follow-up speaks to exactly who each subscriber is.',
            benefits: [
                { title: 'Built-in shareability', description: 'Results get screenshotted and shared, multiplying reach for free.' },
                { title: 'Segmentation from day one', description: 'Quiz answers tell you which offer fits each subscriber.' },
                { title: 'Results delivered automatically', description: 'Instant result emails open the nurture conversation naturally.' },
            ],
        },
    ],
};

function buildSteps(templateName: string, audience: UseCaseAudience): string[] {
    return [
        `Start from the free ${templateName} template — the flow structure, pages, and follow-up steps are pre-built.`,
        `Customize the copy, branding, and questions for ${audience.shortName} in the drag-and-drop journey builder.`,
        'Publish and download your QR code, then place it wherever your audience already is — print, screens, signage, or packaging.',
        'Watch leads, responses, and conversions arrive in real time, with automated follow-up and CRM sync running in the background.',
    ];
}

function buildFaqs(templateName: string, audience: UseCaseAudience): { question: string; answer: string }[] {
    return [
        {
            question: `Is the ${templateName} template really free?`,
            answer: `Yes. The GiveLive free plan includes one active campaign with up to 100 captured leads per month — enough to launch this flow and prove it works for ${audience.shortName} before paying anything. Paid plans start at $19/month when you need more campaigns or volume.`,
        },
        {
            question: 'Do I need any technical skills to set this up?',
            answer: 'No. The journey builder is fully visual — you customize pages, messages, and logic by dragging and editing blocks. Most flows go from template to published QR code in under 15 minutes.',
        },
        {
            question: 'Can it connect to the tools I already use?',
            answer: 'Yes. GiveLive integrates with CRMs like HubSpot, Salesforce, and Follow Up Boss, email tools like Mailchimp and Brevo, plus Zapier, Make, and n8n for everything else. Leads can also be exported as CSV on any paid plan.',
        },
        {
            question: 'What happens after someone scans the QR code?',
            answer: `They land on a mobile-optimized flow built from the ${templateName} template — no app download required. As they complete each step, GiveLive can trigger SMS or email follow-ups, record analytics, and sync data to your other tools automatically.`,
        },
    ];
}

function buildUseCases(): UseCase[] {
    const result: UseCase[] = [];

    for (const audience of audiences) {
        const copies = useCaseCopy[audience.slug] ?? [];
        for (const copy of copies) {
            const template = templates.find((t) => t.id === copy.templateId);
            if (!template) continue;

            result.push({
                ...copy,
                slug: `${copy.templateId}-for-${audience.slug}`,
                audience,
                templateName: template.name,
                templateCategory: template.category,
                steps: buildSteps(template.name, audience),
                faqs: buildFaqs(template.name, audience),
            });
        }
    }

    return result;
}

export const useCases: UseCase[] = buildUseCases();

export const getUseCase = (slug: string): UseCase | undefined =>
    useCases.find((u) => u.slug === slug);

export const getUseCasesByAudience = (audienceSlug: string): UseCase[] =>
    useCases.filter((u) => u.audience.slug === audienceSlug);

export const getRelatedUseCases = (useCase: UseCase, limit = 3): UseCase[] => {
    const sameAudience = useCases.filter(
        (u) => u.audience.slug === useCase.audience.slug && u.slug !== useCase.slug
    );
    const sameTemplate = useCases.filter(
        (u) => u.templateId === useCase.templateId && u.slug !== useCase.slug
    );
    const combined = [...sameAudience, ...sameTemplate];
    const unique = combined.filter(
        (u, i) => combined.findIndex((x) => x.slug === u.slug) === i
    );
    return unique.slice(0, limit);
};
