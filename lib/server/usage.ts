import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebase-admin";

const inMemoryUsage = new Map<string, { count: number; resetAt: number }>();

const getDayKey = () => new Date().toISOString().slice(0, 10);

export const consumeUserUsage = async (params: {
  uid: string;
  key: string;
  limit: number;
}) => {
  const { uid, key, limit } = params;
  const db = getAdminDb();

  if (!db) {
    return { allowed: true, used: 0, limit };
  }

  const day = getDayKey();
  const ref = db.doc(`users/${uid}/usage/${day}`);
  const field = `counts.${key}`;

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.get(field) as number | undefined) || 0;
    if (current >= limit) {
      return { allowed: false, used: current, limit };
    }
    tx.set(
      ref,
      {
        day,
        counts: {
          [key]: FieldValue.increment(1),
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { allowed: true, used: current + 1, limit };
  });

  return result;
};

export const consumeIpUsage = (params: { ip: string; key: string; limit: number; windowMs: number }) => {
  return consumeMemoryUsage({
    subject: `ip:${params.ip}`,
    key: params.key,
    limit: params.limit,
    windowMs: params.windowMs,
  });
};

export const consumeMemoryUsage = (params: {
  subject: string;
  key: string;
  limit: number;
  windowMs: number;
}) => {
  const now = Date.now();
  const token = `${params.subject}:${params.key}`;
  const existing = inMemoryUsage.get(token);

  if (!existing || existing.resetAt <= now) {
    inMemoryUsage.set(token, { count: 1, resetAt: now + params.windowMs });
    return { allowed: true, used: 1, limit: params.limit, resetAt: now + params.windowMs };
  }

  if (existing.count >= params.limit) {
    return { allowed: false, used: existing.count, limit: params.limit, resetAt: existing.resetAt };
  }

  existing.count += 1;
  inMemoryUsage.set(token, existing);
  return { allowed: true, used: existing.count, limit: params.limit, resetAt: existing.resetAt };
};
