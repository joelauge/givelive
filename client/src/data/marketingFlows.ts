/**
 * Live GiveLive flows we run for our own marketing (dogfooding).
 * These are real published journeys — leads land in our production
 * dashboard and trigger the flows' own automated follow-up.
 */
export const marketingFlows = {
    /** Lead magnet: "Free QR Marketing Guide" delivery flow */
    qrMarketingGuideUrl: 'https://www.givelive.app/event/1a51afc5-d25e-4e35-a166-9ba66af2f969',
    /** "GiveLive Newsletter" signup flow */
    newsletterUrl: 'https://www.givelive.app/event/e9aed3b1-fa88-487f-8713-395544b3f78b',
} as const;
