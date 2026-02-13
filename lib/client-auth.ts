"use client";

import { getFirebaseAuth } from "@/lib/firebase";

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};
