# Firebase Setup (Google Login + Cloud Resume Sync)

## 1) Create Firebase Project

- Open Firebase Console.
- Create/select a project.
- Add a Web App and copy the config values.

## 2) Enable Google Sign-In

- Go to `Authentication` -> `Sign-in method`.
- Enable `Google`.

## 3) Create Firestore Database

- Go to `Firestore Database`.
- Create database in production mode.

## 4) Environment Variables

Set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 5) Firestore Rules

Use rules that isolate each user to their own namespace:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6) Data Shape

Resumes are stored at:

- `users/{uid}/resumes/default`

Document fields:

- `resume`
- `template`
- `jobDescription`
- `subscriptionPlan`
- `updatedAt`

Billing subscription sync (from Stripe webhook) is stored at:

- `users/{uid}/billing/subscription`
