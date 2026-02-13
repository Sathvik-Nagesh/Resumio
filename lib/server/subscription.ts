import { getAdminDb } from "@/lib/server/firebase-admin";

export type PlanTier = "free" | "pro";

export interface UserSubscription {
  plan: PlanTier;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unknown";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
}

const defaultSub: UserSubscription = {
  plan: "free",
  status: "unknown",
};

export const getUserSubscription = async (uid: string): Promise<UserSubscription> => {
  const db = getAdminDb();
  if (!db) return defaultSub;

  const billingRef = db.doc(`users/${uid}/billing/subscription`);
  const billingSnap = await billingRef.get();

  if (billingSnap.exists) {
    const data = billingSnap.data() || {};
    const plan = data.plan === "pro" ? "pro" : "free";
    return {
      plan,
      status: data.status || "unknown",
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      currentPeriodEnd: data.currentPeriodEnd,
    };
  }

  const resumeRef = db.doc(`users/${uid}/resumes/default`);
  const resumeSnap = await resumeRef.get();
  if (!resumeSnap.exists) return defaultSub;

  const resumeData = resumeSnap.data() || {};
  return {
    plan: resumeData.subscriptionPlan === "pro" ? "pro" : "free",
    status: "unknown",
  };
};

export const isProPlan = async (uid: string) => {
  const subscription = await getUserSubscription(uid);
  return subscription.plan === "pro";
};
