import Stripe from 'stripe';
import {
    findOrganizationByStripeCustomer,
    getOrganization,
    resolvePlanFromSubscriptionItems,
    updateOrganizationPlan,
} from './organizationBilling';

export async function handleBillingStripeEvent(
    event: Stripe.Event,
    log: { info: (msg: string) => void; error: (msg: string) => void }
): Promise<boolean> {
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.mode !== 'subscription') return false;

            const orgId = session.metadata?.org_id;
            const customerId =
                typeof session.customer === 'string'
                    ? session.customer
                    : session.customer?.id;

            if (!orgId || !customerId) {
                log.error('[Billing] checkout.session.completed missing org_id or customer');
                return true;
            }

            await updateOrganizationPlan(orgId, {
                stripe_customer_id: customerId,
                stripe_subscription_id:
                    typeof session.subscription === 'string'
                        ? session.subscription
                        : session.subscription?.id || null,
            });

            log.info(`[Billing] Checkout completed for org ${orgId}`);
            return true;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
            const sub = event.data.object as Stripe.Subscription;
            const orgId = sub.metadata?.org_id;
            const customerId =
                typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

            let targetOrgId: string | undefined = orgId;
            if (!targetOrgId && customerId) {
                const org = await findOrganizationByStripeCustomer(customerId);
                targetOrgId = org?.id;
            }

            if (!targetOrgId) {
                log.error('[Billing] subscription event: org not found');
                return true;
            }

            const status = sub.status;
            if (status === 'active' || status === 'trialing') {
                const { plan_id, ai_followup_addon } = resolvePlanFromSubscriptionItems(
                    sub.items.data
                );
                const metaPlan = sub.metadata?.plan_id;
                const resolvedPlan =
                    plan_id !== 'free'
                        ? plan_id
                        : ['starter', 'growth', 'pro'].includes(metaPlan || '')
                          ? metaPlan!
                          : 'starter';
                await updateOrganizationPlan(targetOrgId, {
                    plan_id: resolvedPlan,
                    stripe_customer_id: customerId || undefined,
                    stripe_subscription_id: sub.id,
                    ai_followup_addon,
                });
                log.info(`[Billing] Subscription ${sub.id} active → plan ${plan_id}`);
            } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
                if (status === 'canceled') {
                    await updateOrganizationPlan(targetOrgId, {
                        plan_id: 'free',
                        stripe_subscription_id: null,
                    });
                }
                log.info(`[Billing] Subscription ${sub.id} status ${status}`);
            }
            return true;
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription;
            const orgId = sub.metadata?.org_id;
            const customerId =
                typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

            let targetOrgId: string | undefined = orgId;
            if (!targetOrgId && customerId) {
                const org = await findOrganizationByStripeCustomer(customerId);
                targetOrgId = org?.id;
            }

            if (targetOrgId) {
                await updateOrganizationPlan(targetOrgId, {
                    plan_id: 'free',
                    stripe_subscription_id: null,
                    ai_followup_addon: false,
                });
                log.info(`[Billing] Subscription deleted → org ${targetOrgId} on free`);
            }
            return true;
        }

        default:
            return false;
    }
}
