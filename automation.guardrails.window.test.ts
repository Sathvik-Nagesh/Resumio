import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_ALLOWED_APPLY_DOMAINS,
  getDayWindowIso,
  isApplyUrlAllowed,
} from "./lib/server/automation-guardrails.ts";

test("getDayWindowIso returns same-day start and next-day end in order", () => {
  const { startIso, endIso } = getDayWindowIso(new Date("2026-02-14T15:30:00.000Z"));
  assert.equal(startIso, "2026-02-14T00:00:00.000Z");
  assert.equal(endIso, "2026-02-15T00:00:00.000Z");
  assert.equal(new Date(endIso).getTime() > new Date(startIso).getTime(), true);
});

test("default allowlist permits known application hosts", () => {
  const result = isApplyUrlAllowed("https://www.linkedin.com/jobs/view/123456", DEFAULT_ALLOWED_APPLY_DOMAINS);
  assert.equal(result.ok, true);
  assert.equal(result.host, "linkedin.com");
});

