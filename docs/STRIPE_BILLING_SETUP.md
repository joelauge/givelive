# Stripe Billing Setup

GiveLive uses **one Stripe account** for everything:

| Money flow | What it is | Server | Client |
|------------|------------|--------|--------|
| **Flow donations** | Scanner pays on a payment page in a journey | `STRIPE_SECRET_KEY` creates PaymentIntents | `VITE_STRIPE_PUBLISHABLE_KEY` confirms card in browser |
| **GiveLive subscription** | Organizer pays you for Starter/Growth/Pro | Same `STRIPE_SECRET_KEY` creates Checkout | N/A (redirect to Stripe Hosted Checkout) |

All funds land in the same Stripe Dashboard. Organizers do **not** connect their own Stripe accounts today — flows use the platform account.

**Do not paste secret keys into chat or commit them to git.** Use local `.env` files and Vercel environment variables.

---

## 1. API keys (you have these ready)

### Server (`server/.env` and Vercel)

| Variable | Example | Where to get it |
|----------|---------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | After creating webhook (step 3) |

### Client (`client/.env` and Vercel)

| Variable | Example |
|----------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` |

Use **test** keys until checkout is verified, then switch to **live** keys in Vercel production.

---

## 2. Create subscription prices

**Option A — Script (recommended)**

```bash
cd server
# STRIPE_SECRET_KEY must be in server/.env (not client/.env)
npm run setup-stripe-billing
```

Copy the printed `STRIPE_PRICE_*` values into env.

**Option B — Manual**

In Stripe Dashboard → Products, create monthly recurring prices:

| Env variable | Plan | Amount |
|--------------|------|--------|
| `STRIPE_PRICE_STARTER` | Starter | $19/mo |
| `STRIPE_PRICE_GROWTH` | Growth | $49/mo |
| `STRIPE_PRICE_PRO` | Pro | $99/mo |
| `STRIPE_PRICE_AI_FOLLOWUP` | AI Follow-Up add-on | $29/mo |

---

## 3. Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://givelive.app/api/donations/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - (keep existing donation events if already configured)
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

For local testing use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/donations/webhook
```

---

## 4. Customer Portal (optional but recommended)

Stripe Dashboard → **Settings → Billing → Customer portal** → Activate.

Allows “Manage subscription” in GiveLive Settings.

---

## 5. Vercel environment variables

Add all variables from steps 1–2 to the **givelive** Vercel project (Production + Preview if desired). Redeploy after saving.

---

## 6. Verify

1. Sign in at [givelive.app/admin](https://givelive.app/admin)
2. Open [givelive.app/pricing](https://givelive.app/pricing) → **Get Growth** (test card `4242 4242 4242 4242`)
3. Settings should show plan **Growth** after redirect
4. **Manage billing** opens Stripe Customer Portal

---

## How org IDs work

- Each signed-in Clerk user is billed as `org_id = Clerk userId` (`user_...`).
- Flows still use `default-org` until migrated; subscription is per user account.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Price ID not configured” | Set `STRIPE_PRICE_*` env vars and redeploy |
| Webhook 400 | Check `STRIPE_WEBHOOK_SECRET` matches endpoint |
| Plan stays Free after pay | Confirm webhook events include subscription events |
| Build warning on Stripe API version | Non-blocking; donations use shared Stripe client |

See also: `docs/PRICING_ROADMAP.md` for limit enforcement (Phase 3).
