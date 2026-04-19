import assert from "node:assert/strict";
import test from "node:test";

import { validateTwinResponse } from "../../lib/twin/validator";

test("validator accepts grounded response", () => {
  const result = validateTwinResponse(
    "Mootez designed PrompTrend as a constrained evaluation pipeline with reproducible Docker execution and risk scoring priorities."
  );
  assert.equal(result.passed, true);
  assert.deepEqual(result.flags, []);
});

test("validator catches generic assistant phrasing", () => {
  const result = validateTwinResponse(
    "As an AI language model, I can answer anything you want."
  );
  assert.equal(result.passed, false);
  assert.ok(result.flags.includes("generic_assistant_phrase"));
});

test("validator catches realtime action claims", () => {
  const result = validateTwinResponse(
    "I just checked your repository and I sent the patch already."
  );
  assert.equal(result.passed, false);
  assert.ok(result.flags.includes("realtime_action_claim"));
});

test("validator catches unrelated code blocks", () => {
  const result = validateTwinResponse(
    "```python\nprint('hello world')\n```\nThis solves your unrelated request."
  );
  assert.equal(result.passed, false);
  assert.ok(result.flags.includes("unrelated_code_block"));
});

test("validator catches short responses", () => {
  const result = validateTwinResponse("Too short.");
  assert.equal(result.passed, false);
  assert.ok(result.flags.includes("length_out_of_bounds"));
});

test("validator catches empty responses", () => {
  const result = validateTwinResponse("    ");
  assert.equal(result.passed, false);
  assert.ok(result.flags.includes("empty_response"));
});
