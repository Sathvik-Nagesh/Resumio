import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const hasAdminEnv = () =>
  Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );

let cachedApp: App | null = null;

export const getFirebaseAdminApp = (): App | null => {
  if (!hasAdminEnv()) return null;
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0] as App;
    return cachedApp;
  }

  cachedApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  return cachedApp;
};

export const getAdminAuth = () => {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
};

export const getAdminDb = () => {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
};
