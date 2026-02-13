# Stripe Setup (Pro Billing)

## 1) Create products/prices

Create a single `Resumio Pro` product with 4 recurring prices:

- Monthly USD
- Yearly USD
- Monthly INR
- Yearly INR

Copy all price IDs into `.env.local`.

## 2) Configure webhook

Point Stripe webhook to:

- `/api/stripe/webhook`

Recommended events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Set webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

## 3) Billing portal

Enable customer portal in Stripe dashboard so users can manage/cancel subscriptions.

## 4) Plan sync model

Webhook writes to:

- `users/{uid}/billing/subscription`

And mirrors plan to:

- `users/{uid}/resumes/default.subscriptionPlan`

Webhook idempotency is enforced via:

- `stripeWebhookEvents/{eventId}`

Webhook observability logs are written to:

- `stripeWebhookLogs/{eventId}`

## 5) Security

- Never expose `STRIPE_SECRET_KEY` client-side.
- Keep webhook secret server-only.
- Keep Firebase Admin credentials server-only.
- Restrict accepted coupons with `STRIPE_ALLOWED_COUPONS`.

## 6) Trial and coupons

- Configure free trial length with `STRIPE_DEFAULT_TRIAL_DAYS`.
- Optional coupon entry is accepted in pricing/upgrade UI.
- If `STRIPE_ALLOWED_COUPONS` is set, only listed coupons are accepted.

## 7) A/B pricing variant

You can run a variant test via:

- `/pricing?variant=a` (default)
- `/pricing?variant=b` (includes sticky conversion CTA)
