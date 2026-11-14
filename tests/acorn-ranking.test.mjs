import assert from "node:assert/strict";
import test from "node:test";
import { rankAcorns } from "../lib/acorn-ranking.ts";

const base = {
  kind: "task",
  status: "loose",
  brainLoad: "some",
  priority: 2,
  context: "anywhere",
  source: "capture",
};

test("recommends a task that fits the available time and energy", () => {
  const ranked = rankAcorns([
    { ...base, id: "large", content: "Write the report", energy: "high", estimatedMinutes: 90 },
    { ...base, id: "small", content: "Email the instructor", energy: "low", estimatedMinutes: 5 },
  ], { energy: "low", availableMinutes: 10, location: "home", minimumDay: false });

  assert.equal(ranked[0].id, "small");
  assert.match(ranked[0].explanation, /fits your 10-minute window/);
  assert.match(ranked[0].smallestStep, /Open the contact or message/);
});

test("raises an overdue task above a similar undated task", () => {
  const now = new Date("2026-11-13T18:00:00-06:00");
  const ranked = rankAcorns([
    { ...base, id: "undated", content: "Organize notes", energy: "medium", estimatedMinutes: 15 },
    { ...base, id: "overdue", content: "Submit assignment", energy: "medium", estimatedMinutes: 15, dueAt: "2026-11-12T18:00:00-06:00" },
  ], { energy: "medium", availableMinutes: 30, location: "anywhere", minimumDay: false }, now);

  assert.equal(ranked[0].id, "overdue");
  assert.match(ranked[0].explanation, /overdue/);
});

test("uses a user-written first step without rewriting it", () => {
  const [ranked] = rankAcorns([
    { ...base, id: "custom", content: "Prepare presentation", energy: "medium", estimatedMinutes: 20, firstStep: "Open the latest slide deck." },
  ], { energy: "medium", availableMinutes: 30, location: "anywhere", minimumDay: false });

  assert.equal(ranked.smallestStep, "Open the latest slide deck.");
});
