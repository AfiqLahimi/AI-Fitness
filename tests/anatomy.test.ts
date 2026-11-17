import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MUSCLES, EXERCISE_TARGETS, highlightMap } from "../src/lib/anatomy/muscles.ts";
import { EXERCISES } from "../src/lib/fitness/exercises.ts";

function meshNames(): Set<string> {
  const b = readFileSync("public/models/anatomy.glb");
  const len = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + len).toString("utf8")) as { nodes: { name?: string }[] };
  return new Set(json.nodes.map((n) => (n.name ?? "").replace(/\.(l|r)$/, "")));
}

test("every muscle group points at meshes that exist in the 3D model", () => {
  const names = meshNames();
  for (const m of Object.values(MUSCLES)) for (const mesh of m.meshes) assert.ok(names.has(mesh), `${m.id}: missing mesh "${mesh}"`);
});

test("every exercise has primary target muscles", () => {
  for (const e of EXERCISES) {
    const t = EXERCISE_TARGETS[e.slug];
    assert.ok(t && t.primary.length > 0, `${e.slug} has no anatomy targets`);
  }
});

test("bicep curl highlights biceps as primary and brachialis/brachioradialis as secondary", () => {
  const h = highlightMap(EXERCISE_TARGETS["dumbbell-bicep-curl"]);
  assert.equal(h.get("Long head of biceps brachii"), 2);
  assert.equal(h.get("Brachialis muscle"), 1);
  assert.equal(h.get("Brachioradialis muscle"), 1);
  assert.equal(h.get("Gluteus maximus muscle"), undefined);
});
