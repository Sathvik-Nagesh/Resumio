import test from "node:test";
import assert from "node:assert/strict";

import {
  approvalsLimitReached,
  extractHost,
  hostMatchesAllowlist,
  isApplyUrlAllowed,
  normalizeDomain,
} from "./lib/server/automation-guardrails.ts";

test("normalizeDomain strips protocol, path, and www", () => {
  assert.equal(normalizeDomain("https://www.LinkedIn.com/jobs/view/123"), "linkedin.com");
});

test("extractHost returns null for invalid URLs", () => {
  assert.equal(extractHost("not-a-url"), null);
});

test("allowlist supports subdomain matching", () => {
  assert.equal(hostMatchesAllowlist("boards.greenhouse.io", ["greenhouse.io"]), true);
  assert.equal(hostMatchesAllowlist("example.com", ["greenhouse.io"]), false);
});

test("isApplyUrlAllowed validates allowlist", () => {
  const allowed = isApplyUrlAllowed("https://jobs.lever.co/company/123", ["lever.co"]);
  assert.equal(allowed.ok, true);
  assert.equal(allowed.host, "jobs.lever.co");

  const blocked = isApplyUrlAllowed("https://example.com/apply", ["lever.co"]);
  assert.equal(blocked.ok, false);
});

test("daily limit check blocks when threshold is reached", () => {
  assert.equal(approvalsLimitReached(10, 10), true);
  assert.equal(approvalsLimitReached(9, 10), false);
});
