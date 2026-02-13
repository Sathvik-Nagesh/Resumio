# Resumio

Resumio is an AI-powered resume studio built with Next.js. It supports upload parsing, guided template editing, full-resume generation with Gemini, ATS scoring, and export to PDF/DOCX/TXT.

## Features

- Three resume creation modes: Upload, Template, AI
- Gemini-powered summary and full resume generation
- ATS scoring with keyword and impact feedback
- Export as PDF, DOCX, and TXT
- Google sign-in (Firebase Auth)
- Cloud resume persistence (Firestore autosave/load per user)
- Premium plan framework (free/pro), upgrade modal, and feature gates
- Native text-based PDF export (no screenshot rendering)

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS, Zustand
- Gemini API (`GEMINI_API_KEY`)
- Firebase Auth + Firestore (Google login and cloud storage)

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill values:
```bash
cp .env.example .env.local
```

3. Start dev server:
```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Required Environment Variables

### Gemini
- `GEMINI_API_KEY`

### Firebase (client)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Stripe + server auth
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY_USD`
- `STRIPE_PRICE_PRO_YEARLY_USD`
- `STRIPE_PRICE_PRO_MONTHLY_INR`
- `STRIPE_PRICE_PRO_YEARLY_INR`
- `STRIPE_DEFAULT_TRIAL_DAYS` (optional)
- `STRIPE_ALLOWED_COUPONS` (optional)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_EMAILS` (comma-separated, for `/admin/metrics`)

## Firebase Setup Notes

- Enable **Authentication > Google** in Firebase Console.
- Create Firestore database.
- Recommended Firestore structure:
  - `users/{uid}/resumes/default`
- Set Firestore rules to allow authenticated users to read/write only their own documents.
- Full setup guide: `FIREBASE_SETUP.md`
- Billing setup guide: `STRIPE_SETUP.md`

## Validation

```bash
npm run lint
npm run build
```

## Premium Model (Current Implementation)

- Plan states: `free` and `pro`
- Upgrade flow: Stripe Checkout + Stripe Billing Portal
- Optional free trial + coupon support in checkout
- Pricing analytics events (`/api/analytics/event`) with rate limiting
- Gated features now:
  - Premium templates
  - DOCX export on free plan
  - AI section regeneration on free plan
- Free plan remains usable:
  - Upload/template editing
  - Native PDF and TXT export
  - Basic AI generation/improvements with daily limits

### Current price points
- USD: `$9/month` or `$79/year`
- INR: `₹599/month` or `₹4,999/year`

Plan state is synced via Stripe webhooks to Firestore and enforced server-side for premium AI actions.

## Security and Input Hygiene

- AI and billing endpoints validate inputs with strict `zod` schemas.
- Text payloads are normalized and length-limited server-side.
- Stripe webhook processing is idempotent (`stripeWebhookEvents/{eventId}`).
- Premium enforcement is server-side, not only UI-based.
- Abuse protection uses layered rate limits (burst + hourly/daily) on AI, billing, parse, analytics, admin, and logging APIs.
- Rate-limited responses return HTTP `429` with `Retry-After`.

## Admin Analytics

- Dashboard: `/admin/metrics`
- Protected by Firebase auth + `ADMIN_EMAILS` allowlist.
- Uses aggregated events from:
  - `analyticsEvents`
  - `stripeWebhookLogs`
