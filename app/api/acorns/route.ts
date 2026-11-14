import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const statuses = ["loose", "next", "someday", "complete", "released", "delegated"];
const energies = ["low", "medium", "high"];
const brainLoads = ["none", "some", "unfortunately_yes"];
const contexts = ["anywhere", "home", "work", "school", "out"];

function classify(content: string) {
  const lower = content.toLowerCase();
  if (/https?:\/\//.test(lower)) return "link";
  if (/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at \d|am\b|pm\b|due|appointment|exam)\b/.test(lower)) return "reminder";
  if (/^(buy|call|email|text|ask|finish|submit|upload|schedule|make|clean|pick up|look up|refill|remember to)\b/.test(lower)) return "task";
  return "note";
}

function validChoice(value: unknown, allowed: string[], fallback: string) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function optionalDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function GET() {
  try {
    const user = await requireAppUser();
    const result = await requireDatabase().prepare(
      `SELECT id, content, kind, status, energy, estimated_minutes AS estimatedMinutes,
              brain_load AS brainLoad, due_at AS dueAt, location, first_step AS firstStep,
              notes, priority, avoid_count AS avoidCount, last_suggested_at AS lastSuggestedAt,
              completed_at AS completedAt, delegated_to AS delegatedTo, context,
              source, created_at AS createdAt, updated_at AS updatedAt
       FROM acorns WHERE user_id = ? AND status != 'released'
       ORDER BY CASE status WHEN 'next' THEN 0 WHEN 'loose' THEN 1 WHEN 'someday' THEN 2 ELSE 3 END,
                updated_at DESC LIMIT 200`,
    ).bind(user.id).all();
    return appJson({ acorns: result.results });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const content = cleanString(body.content, 500, true)!;
    const id = crypto.randomUUID();
    const now = Date.now();
    const kind = classify(content);
    const source = body.source === "side_quest" ? "side_quest" : "capture";
    await requireDatabase().prepare(
      `INSERT INTO acorns (id, user_id, content, kind, status, energy, estimated_minutes, brain_load,
        due_at, location, first_step, notes, priority, context, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'loose', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, user.id, content, kind,
      validChoice(body.energy, energies, "medium"),
      Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      validChoice(body.brainLoad, brainLoads, "some"),
      optionalDate(body.dueAt), cleanString(body.location, 80), cleanString(body.firstStep, 300),
      cleanString(body.notes, 1000), Math.max(1, Math.min(3, Number(body.priority) || 2)),
      validChoice(body.context, contexts, "anywhere"), source, now, now,
    ).run();
    return appJson({ acorn: {
      id,
      content,
      kind,
      status: "loose",
      energy: validChoice(body.energy, energies, "medium"),
      estimatedMinutes: Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      brainLoad: validChoice(body.brainLoad, brainLoads, "some"),
      dueAt: optionalDate(body.dueAt),
      location: cleanString(body.location, 80),
      firstStep: cleanString(body.firstStep, 300),
      notes: cleanString(body.notes, 1000),
      priority: Math.max(1, Math.min(3, Number(body.priority) || 2)),
      context: validChoice(body.context, contexts, "anywhere"),
      source,
    } }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const id = cleanString(body.id, 64, true)!;
    const existing = await requireDatabase().prepare("SELECT id FROM acorns WHERE id = ? AND user_id = ?")
      .bind(id, user.id).first();
    if (!existing) throw new AppApiError("That task or note was not found.", 404, "not_found");
    const content = cleanString(body.content, 500, true)!;
    await requireDatabase().prepare(
      `UPDATE acorns SET content = ?, kind = ?, status = ?, energy = ?, estimated_minutes = ?, brain_load = ?,
        due_at = ?, location = ?, first_step = ?, notes = ?, priority = ?, context = ?, delegated_to = ?,
        completed_at = CASE WHEN ? = 'complete' THEN COALESCE(completed_at, ?) ELSE completed_at END,
        updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).bind(
      content, classify(content), validChoice(body.status, statuses, "loose"),
      validChoice(body.energy, energies, "medium"),
      Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      validChoice(body.brainLoad, brainLoads, "some"), optionalDate(body.dueAt),
      cleanString(body.location, 80), cleanString(body.firstStep, 300), cleanString(body.notes, 1000),
      Math.max(1, Math.min(3, Number(body.priority) || 2)), validChoice(body.context, contexts, "anywhere"),
      cleanString(body.delegatedTo, 120), validChoice(body.status, statuses, "loose"), Date.now(), Date.now(), id, user.id,
    ).run();
    return appJson({ id });
  } catch (error) {
    return appErrorResponse(error);
  }
}
