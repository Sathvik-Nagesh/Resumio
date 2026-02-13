import { NextRequest } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";

import { getAdminAuth } from "@/lib/server/firebase-admin";

const getBearerToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
};

export const getDecodedToken = async (
  request: NextRequest
): Promise<DecodedIdToken | null> => {
  const token = getBearerToken(request);
  if (!token) return null;
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
};
