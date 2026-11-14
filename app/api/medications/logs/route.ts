import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const statuses = ["taken", "skipped", "later", "unsure"];

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const medicationId = cleanString(body.medicationId, 64, true)!;
    const status = typeof body.status === "string" && statuses.includes(body.status) ? body.status : "unsure";
    const database = requireDatabase();
    const medication = await database.prepare("SELECT id FROM medications WHERE id = ? AND user_id = ?")
      .bind(medicationId, user.id).first();
    if (!medication) throw new AppApiError("That medication was not found.", 404, "not_found");
    const loggedAt = typeof body.loggedAt === "number" && Number.isFinite(body.loggedAt) ? body.loggedAt : Date.now();
    await database.prepare(
      "INSERT INTO medication_logs (id, user_id, medication_id, status, note, logged_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), user.id, medicationId, status, cleanString(body.note, 500), loggedAt).run();
    return appJson({ saved: true }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}
