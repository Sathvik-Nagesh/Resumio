import test from "node:test";
import assert from "node:assert/strict";

import { autoApplyRuleSchema } from "./lib/server/validation.ts";

test("autoApplyRuleSchema applies guardrail defaults", () => {
  const parsed = autoApplyRuleSchema.parse({
    enabled: true,
    roles: ["Cybersecurity Engineer"],
    locations: ["Remote"],
    remoteOnly: true,
    minMatchScore: 80,
  });

  assert.equal(parsed.requireApproval, true);
  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.dailyApprovalLimit, 15);
  assert.deepEqual(parsed.allowedDomains, []);
});

test("autoApplyRuleSchema normalizes and accepts allowed domains", () => {
  const parsed = autoApplyRuleSchema.parse({
    enabled: true,
    roles: [],
    locations: [],
    remoteOnly: true,
    minMatchScore: 70,
    allowedDomains: ["LinkedIn.com", "GreenHouse.io"],
  });

  assert.deepEqual(parsed.allowedDomains, ["linkedin.com", "greenhouse.io"]);
});

test("autoApplyRuleSchema rejects invalid domain characters", () => {
  const result = autoApplyRuleSchema.safeParse({
    enabled: true,
    roles: [],
    locations: [],
    remoteOnly: true,
    minMatchScore: 70,
    allowedDomains: ["linkedin.com/jobs"],
  });
  assert.equal(result.success, false);
});
