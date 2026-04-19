import assert from "node:assert/strict";
import test from "node:test";

import { localFallbackProvider } from "../../lib/twin/providers/local";

test("local fallback formats a concise question-aware response", async () => {
  const prompt = [
    "SYSTEM CONTRACT",
    "You are a constrained digital twin of Mootez Aloui.",
    "",
    "RETRIEVED EVIDENCE",
    "- [0.911] (opinions.md) I evaluate it by how well teams prioritize risk, how quickly they detect and recover, and how clearly they document tradeoffs.",
    "- [0.822] (approach.md) Collaboration model: direct and pragmatic, with explicit tradeoffs and quick feedback loops.",
    "",
    "USER QUESTION: How does he make tradeoffs under delivery pressure?",
  ].join("\n");

  const output = await localFallbackProvider.generate({ prompt });

  assert.equal(output.providerId, "local-fallback");
  assert.equal(output.model, "deterministic-template-v1");
  assert.match(output.text, /temporarily unavailable/i);
  assert.match(output.text, /ranking risk first/i);
  assert.match(output.text, /Relevant corpus evidence:/);

  assert.doesNotMatch(output.text, /^SYSTEM CONTRACT/m);
  assert.doesNotMatch(output.text, /^RETRIEVED EVIDENCE/m);
  assert.doesNotMatch(output.text, /^USER QUESTION:/m);
});

test("local fallback still returns a grounded generic response without evidence", async () => {
  const output = await localFallbackProvider.generate({
    prompt: "SYSTEM CONTRACT\nUSER QUESTION: Tell me about his engineering mindset.",
  });

  assert.equal(output.providerId, "local-fallback");
  assert.match(output.text, /local portfolio corpus fallback/i);
  assert.match(output.text, /documented corpus/i);
});

test("local guide fallback is trigger-aware for section interactions", async () => {
  const basePrompt = [
    "SYSTEM CONTRACT",
    "ACTIVE LENS: General Engineering",
    "GUIDE MODE: reactive",
    "RETRIEVED EVIDENCE",
    "- [0.901] (projects.md) Ordinay includes explicit tradeoff records and delivery outcomes.",
    "",
    "GUIDE QUERY: Mootez guide event for section",
    "FINAL GUIDE BUBBLE",
  ];

  const aboutOutput = await localFallbackProvider.generate({
    prompt: [
      ...basePrompt,
      "TRIGGER: section_enter -> about on /",
    ].join("\n"),
  });

  const projectsOutput = await localFallbackProvider.generate({
    prompt: [
      ...basePrompt,
      "TRIGGER: section_enter -> projects on /",
    ].join("\n"),
  });

  assert.match(aboutOutput.text, /why me/i);
  assert.match(projectsOutput.text, /projects/i);
  assert.notEqual(aboutOutput.text, projectsOutput.text);
  assert.doesNotMatch(projectsOutput.text, /guide query:/i);
});

test("local guide fallback adapts tour step wording", async () => {
  const output = await localFallbackProvider.generate({
    prompt: [
      "SYSTEM CONTRACT",
      "ACTIVE LENS: AI Engineering",
      "GUIDE MODE: tour",
      "TRIGGER: route_change -> / to /",
      "GUIDE QUERY: Mootez guided tour step: projects. Rewrite the explanation clearly in AI framing while keeping it concise.",
      "FINAL GUIDE BUBBLE",
    ].join("\n"),
  });

  assert.match(output.text, /projects/i);
  assert.match(output.text, /AI Engineering/i);
  assert.doesNotMatch(output.text, /rewrite the explanation clearly/i);
});

test("local guide fallback parses tab_change and rail_focus triggers", async () => {
  const basePrompt = [
    "SYSTEM CONTRACT",
    "ACTIVE LENS: General Engineering",
    "GUIDE MODE: reactive",
    "RETRIEVED EVIDENCE",
    "- [0.911] (experience.md) Covers delivery scope, leadership, and education context.",
    "",
    "GUIDE QUERY: Mootez guide event for navigation",
    "FINAL GUIDE BUBBLE",
  ];

  const tabOutput = await localFallbackProvider.generate({
    prompt: [
      ...basePrompt,
      "TRIGGER: tab_change -> projects to experience on /",
    ].join("\n"),
  });

  const railOutput = await localFallbackProvider.generate({
    prompt: [
      ...basePrompt,
      "TRIGGER: rail_focus -> beta-programs (scroll) on tab experience",
    ].join("\n"),
  });

  assert.match(tabOutput.text, /switched to Experience/i);
  assert.match(tabOutput.text, /General Engineering/i);
  assert.doesNotMatch(tabOutput.text, /reactive guide mode/i);

  assert.match(railOutput.text, /reached Beta Programs/i);
  assert.match(railOutput.text, /inside Experience/i);
  assert.doesNotMatch(railOutput.text, /reactive guide mode/i);
});
