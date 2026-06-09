/**
 * Print active monthly price IDs for the configured GiveLive Stripe products.
 * Run: cd server && npx ts-node src/scripts/resolve-stripe-billing-prices.ts
 */
import path from 'path';
import dotenv from 'dotenv';
import { requireStripe } from '../lib/stripe';
import { warmBillingPriceCache, getBillingCatalog } from '../services/billingPriceResolver';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
    const stripe = requireStripe();
    await warmBillingPriceCache(stripe);

    const catalog = getBillingCatalog();
    console.log('\nGiveLive billing catalog (live Stripe products):\n');

    for (const plan of catalog.plans) {
        console.log(`${plan.id}: product=${plan.stripeProductId} price=${plan.priceId ?? 'MISSING'}`);
    }
    console.log(
        `ai_followup: product=${catalog.aiFollowUpAddon.stripeProductId} price=${catalog.aiFollowUpAddon.priceId ?? 'MISSING'}`
    );

    console.log('\nSuggested env lines:\n');
    for (const plan of catalog.plans) {
        const envKey =
            plan.id === 'starter'
                ? 'STRIPE_PRICE_STARTER'
                : plan.id === 'growth'
                  ? 'STRIPE_PRICE_GROWTH'
                  : 'STRIPE_PRICE_PRO';
        if (plan.priceId) console.log(`${envKey}=${plan.priceId}`);
    }
    if (catalog.aiFollowUpAddon.priceId) {
        console.log(`STRIPE_PRICE_AI_FOLLOWUP=${catalog.aiFollowUpAddon.priceId}`);
    }
    console.log('');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
