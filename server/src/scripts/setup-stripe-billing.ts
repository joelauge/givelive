/**
 * Links GiveLive plans to live Stripe products and ensures monthly prices exist.
 * Run: cd server && npm run setup-stripe-billing
 *
 * Copy printed STRIPE_PRICE_* lines into server/.env and Vercel env vars.
 */
import path from 'path';
import dotenv from 'dotenv';
import { requireStripe } from '../lib/stripe';
import { aiFollowUpAddon, billablePlans } from '../config/billingPlans';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PLANS = [
    ...billablePlans.map((p) => ({
        key: p.priceIdEnv,
        productId: p.stripeProductId,
        name: p.name,
        amount: p.id === 'starter' ? 1900 : p.id === 'growth' ? 4900 : 9900,
    })),
    {
        key: aiFollowUpAddon.priceIdEnv,
        productId: aiFollowUpAddon.stripeProductId,
        name: aiFollowUpAddon.name,
        amount: 2900,
    },
];

async function ensureMonthlyPrice(
    stripe: ReturnType<typeof requireStripe>,
    productId: string,
    amount: number,
    key: string
): Promise<string> {
    const existing = await stripe.prices.list({ product: productId, active: true, limit: 20 });
    const monthly = existing.data.find(
        (p) => p.type === 'recurring' && p.recurring?.interval === 'month' && p.unit_amount === amount
    );
    if (monthly) return monthly.id;

    const created = await stripe.prices.create({
        product: productId,
        unit_amount: amount,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { givelive_plan: key },
    });
    return created.id;
}

async function main() {
    const stripe = requireStripe();
    console.log('\nResolving GiveLive billing prices from live Stripe products...\n');

    for (const plan of PLANS) {
        const product = await stripe.products.retrieve(plan.productId);
        const priceId = await ensureMonthlyPrice(stripe, plan.productId, plan.amount, plan.key);
        console.log(
            `${plan.key}=${priceId}  (${product.name} — $${plan.amount / 100}/mo, ${plan.productId})`
        );
    }

    console.log('\nAdd the lines above to server/.env and Vercel → Settings → Environment Variables.');
    console.log('Webhook URL: https://givelive.app/api/donations/webhook');
    console.log('Events: checkout.session.completed, customer.subscription.*\n');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
