import { test } from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/lib/fitness/exercises.ts";
import { TRAINERS, demoPrompt, mistakesPrompt, characterPrompt } from "../src/lib/media/prompts.ts";
import { resolveMedia } from "../src/lib/media/provider.ts";
import { GUIDES } from "../src/lib/anatomy/guides.ts";

test("every exercise gets a demo and mistakes prompt for every trainer", () => {
  for (const t of TRAINERS) {
    assert.match(characterPrompt(t), /fictional adult/);
    for (const e of EXERCISES) {
      const d = demoPrompt(e, t), m = mistakesPrompt(e, t);
      assert.ok(d.includes(e.name) && d.includes("starting position") && d.includes("full range of motion"), e.slug);
      assert.ok(m.includes("mistake") && m.includes("correct form"), e.slug);
    }
  }
});

test("every exercise has a beginner explanation", () => {
  for (const e of EXERCISES) assert.ok(GUIDES[e.slug]?.what && GUIDES[e.slug]?.why, e.slug);
});

test("media resolution prefers the runtime library and falls back to the motion guide", () => {
  assert.equal(resolveMedia("push-up", {}).kind, "motion");
  const lib = { "push-up": { kind: "video" as const, sources: [{ src: "/media/videos/push-up.mp4", type: "video/mp4" }] } };
  const m = resolveMedia("push-up", lib);
  assert.equal(m.kind, "video");
});
