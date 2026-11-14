import { appErrorResponse, appJson, cleanString, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const eventTypes = ["suggested", "started", "completed", "rejected", "rescheduled", "shrunk", "delegated", "dropped", "kept", "body_double"];
const rejectionReasons = ["too_hard", "not_enough_time", "wrong_place", "missing_something", "emotionally_blocked", "not_important", "other"];

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const eventType = typeof body.eventType === "string" && eventTypes.includes(body.eventType) ? body.eventType : "suggested";
    const reason = typeof body.reason === "string" && rejectionReasons.includes(body.reason) ? body.reason : cleanString(body.reason, 80);
    const acornId = cleanString(body.acornId, 64);
    const database = requireDatabase();
    if (acornId) {
      const acorn = await database.prepare("SELECT id FROM acorns WHERE id = ? AND user_id = ?").bind(acornId, user.id).first();
      if (!acorn) return appJson({ error: "That task or note was not found.", code: "not_found" }, 404);
    }
    await database.prepare(
      "INSERT INTO acorn_events (id, user_id, acorn_id, event_type, reason, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).bind(
      crypto.randomUUID(), user.id, acornId, eventType, reason,
      body.metadata ? JSON.stringify(body.metadata).slice(0, 2000) : null, Date.now(),
    ).run();
    if (acornId && eventType === "rejected") {
      await database.prepare("UPDATE acorns SET avoid_count = avoid_count + 1, updated_at = ? WHERE id = ? AND user_id = ?")
        .bind(Date.now(), acornId, user.id).run();
    }
    return appJson({ saved: true }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}
