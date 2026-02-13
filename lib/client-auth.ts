"use client";

import { getFirebaseAuth } from "@/lib/firebase";

export const getAuthHeaders = async () => {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};
