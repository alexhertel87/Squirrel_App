import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const statuses = ["loose", "next", "someday", "complete", "released"];
const energies = ["low", "medium", "high"];
const brainLoads = ["none", "some", "unfortunately_yes"];

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

export async function GET() {
  try {
    const user = await requireAppUser();
    const result = await requireDatabase().prepare(
      `SELECT id, content, kind, status, energy, estimated_minutes AS estimatedMinutes,
              brain_load AS brainLoad, source, created_at AS createdAt, updated_at AS updatedAt
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
      `INSERT INTO acorns (id, user_id, content, kind, status, energy, estimated_minutes, brain_load, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'loose', ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, user.id, content, kind,
      validChoice(body.energy, energies, "medium"),
      Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      validChoice(body.brainLoad, brainLoads, "some"), source, now, now,
    ).run();
    return appJson({ acorn: {
      id,
      content,
      kind,
      status: "loose",
      energy: validChoice(body.energy, energies, "medium"),
      estimatedMinutes: Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      brainLoad: validChoice(body.brainLoad, brainLoads, "some"),
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
    if (!existing) throw new AppApiError("That acorn wandered off.", 404, "not_found");
    const content = cleanString(body.content, 500, true)!;
    await requireDatabase().prepare(
      `UPDATE acorns SET content = ?, kind = ?, status = ?, energy = ?, estimated_minutes = ?, brain_load = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).bind(
      content, classify(content), validChoice(body.status, statuses, "loose"),
      validChoice(body.energy, energies, "medium"),
      Math.max(1, Math.min(240, Number(body.estimatedMinutes) || 15)),
      validChoice(body.brainLoad, brainLoads, "some"), Date.now(), id, user.id,
    ).run();
    return appJson({ id });
  } catch (error) {
    return appErrorResponse(error);
  }
}
