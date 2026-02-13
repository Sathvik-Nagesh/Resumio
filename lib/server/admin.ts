import { DecodedIdToken } from "firebase-admin/auth";

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (decoded: DecodedIdToken | null) => {
  if (!decoded?.email) return false;
  const admins = parseAdminEmails();
  if (!admins.length) return false;
  return admins.includes(decoded.email.toLowerCase());
};
