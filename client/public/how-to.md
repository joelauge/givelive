# How to use GiveLive

Step-by-step guides for building QR-powered acquisition flows—from your first scan to automated follow-up and CRM sync.

**Website:** https://givelive.app/how-to

## Get started

GiveLive helps you turn real-world moments—real locations, signage, packaging, and on-site touchpoints—into automated lead capture and follow-up using QR-powered journeys.

1. **Create your account** — Click Start Building Free on the homepage and sign in. You land on the dashboard where all your flows live.
2. **Understand the pieces** — A flow is a journey: a Start trigger (QR / link), one or more steps (mobile pages, SMS, email, delays, payments), and optional integrations that sync leads to your stack.

## Create a new flow

Each flow is tied to a unique URL and QR code. You can start blank or from a template.

1. **Start from the dashboard** — Open the admin dashboard and click New Flow (or pick a template). Name your flow something recognizable.
2. **Use templates (optional)** — Browse categories like Fundraising, Real Locations, Lead Capture, and Real Estate at https://givelive.app/blog
3. **Open the journey builder** — Visual canvas with a Start node and tools to add and connect steps.

## Configure the QR / Link start

Every published flow begins when someone scans your QR code or opens your unique link.

1. **Select QR / Link as the trigger** — Click the Start node; confirm Trigger Source is QR / Link.
2. **Add a campaign image** — Upload a Campaign Image (recommended 1200×630px) for link previews in SMS and social posts.
3. **Copy your flow URL and download QR assets** — Test in a browser; download QR as SVG or PNG for print.
4. **Simple redirect-only flows (optional)** — Set Auto-forward URL and enable End flow here on the Start node for external redirects without extra steps.

**Tip:** Test on your phone before printing.

## Build your journey on the canvas

Connect nodes in order from Start to each next step. The builder saves drafts automatically; publishing makes the journey live.

- **Pages** — Mobile-friendly steps with headers, text, images, forms, choice buttons, links, and payment blocks.
- **Payment pages** — Stripe donations or purchases; one-time or monthly amounts.
- **Delays** — Pause the journey before the next step for spaced follow-ups.
- **SMS and email** — Message nodes with optional sequences and delays between texts.
- **Endpoints** — Toggle End Journey Here on pages or messages to finish the flow.

## Connect integrations

Push captured leads into tools you already use.

Supported connectors: Follow Up Boss, HubSpot, Salesforce, Mailchimp, Constant Contact, Brevo, Zapier, Make, n8n.

1. Add an integration node from the Start menu or downstream.
2. Enter API keys, list IDs, or webhook URLs; use Test Connection when available.
3. Place integrations after a form or payment step so contact data is already collected.

## Publish your flow

Publishing writes your canvas to the live scanner experience.

1. **Save your draft** — Drafts are safe to edit; only published flows are live.
2. **Run publish checks** — GiveLive validates connections, content, and trigger type (QR / Link required).
3. **Fix issues and publish again** — Address validation messages in the modal, then republish.

## Go live with your QR code

1. **Distribute the QR** — Print on signage or share the flow URL in SMS, email, or social.
2. **Scanner experience** — Scan → first page (or auto-forward) → forms/payment → scheduled messages → CRM sync.
3. **Update without reprinting** — Re-publishing updates the live journey behind the same URL/QR.

## Track performance

Open Analytics per flow to view sends, click-through, replies, and revenue. Optimize copy and form length based on drop-off.

## Account and channel settings

- **Payments** — Connect Stripe in Settings for Payment Page nodes.
- **Email** — Configure SMTP or provider details for message nodes.
- **SMS** — Twilio must be provisioned on the server for text steps in production.
