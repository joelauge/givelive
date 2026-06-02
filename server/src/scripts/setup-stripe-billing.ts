/**
 * One-time helper: creates GiveLive subscription products & prices in Stripe.
 * Run: cd server && npx ts-node src/scripts/setup-stripe-billing.ts
 *
 * Copy the printed price IDs into server/.env and Vercel env vars.
 */
import path from 'path';
import dotenv from 'dotenv';
import { requireStripe } from '../lib/stripe';

// Load server/.env — use cwd (npm run is from server/)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PLANS = [
    { key: 'STRIPE_PRICE_STARTER', name: 'GiveLive Starter', amount: 1900 },
    { key: 'STRIPE_PRICE_GROWTH', name: 'GiveLive Growth', amount: 4900 },
    { key: 'STRIPE_PRICE_PRO', name: 'GiveLive Pro', amount: 9900 },
    { key: 'STRIPE_PRICE_AI_FOLLOWUP', name: 'GiveLive AI Follow-Up Assistant', amount: 2900 },
];

async function main() {
    const stripe = requireStripe();
    console.log('\nCreating GiveLive billing products in Stripe...\n');

    for (const plan of PLANS) {
        const product = await stripe.products.create({
            name: plan.name,
            metadata: { givelive_plan: plan.key },
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.amount,
            currency: 'usd',
            recurring: { interval: 'month' },
            metadata: { givelive_plan: plan.key },
        });

        console.log(`${plan.key}=${price.id}  (${plan.name} — $${plan.amount / 100}/mo)`);
    }

    console.log('\nAdd the lines above to server/.env and Vercel → Settings → Environment Variables.');
    console.log('Webhook URL: https://givelive.app/api/donations/webhook');
    console.log('Events: checkout.session.completed, customer.subscription.*\n');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
