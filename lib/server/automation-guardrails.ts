const DOMAIN_CHARS = /[^a-z0-9.-]/g;

export const DEFAULT_ALLOWED_APPLY_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "greenhouse.io",
  "lever.co",
  "workday.com",
  "ashbyhq.com",
];

export const normalizeDomain = (input: string) =>
  input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(DOMAIN_CHARS, "");

export const extractHost = (url: string): string | null => {
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return null;
  }
};

export const hostMatchesAllowlist = (host: string, allowlist: string[]) => {
  const normalized = allowlist.map(normalizeDomain).filter(Boolean);
  return normalized.some((entry) => host === entry || host.endsWith(`.${entry}`));
};

export const isApplyUrlAllowed = (url: string, allowlist: string[]) => {
  const host = extractHost(url);
  if (!host) return { ok: false, host: null };
  return {
    ok: hostMatchesAllowlist(host, allowlist),
    host,
  };
};

export const getDayWindowIso = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

export const approvalsLimitReached = (currentApprovals: number, dailyLimit: number) =>
  currentApprovals >= Math.max(1, dailyLimit);
