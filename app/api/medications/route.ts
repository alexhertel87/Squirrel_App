import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const medications = await database.prepare(
      `SELECT id, name, formulation, dose, instructions, schedule_label AS scheduleLabel,
              refill_due_at AS refillDueAt, active, created_at AS createdAt, updated_at AS updatedAt
       FROM medications WHERE user_id = ? ORDER BY active DESC, updated_at DESC`,
    ).bind(user.id).all();
    const logs = await database.prepare(
      `SELECT l.id, l.medication_id AS medicationId, m.name, m.formulation, m.dose,
              l.status, l.note, l.logged_at AS loggedAt
       FROM medication_logs l JOIN medications m ON m.id = l.medication_id
       WHERE l.user_id = ? ORDER BY l.logged_at DESC LIMIT 100`,
    ).bind(user.id).all();
    return appJson({ medications: medications.results.map((item: Record<string, unknown>) => ({ ...item, active: Boolean(item.active) })), logs: logs.results });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const id = crypto.randomUUID();
    const now = Date.now();
    const medication = {
      id,
      name: cleanString(body.name, 120, true)!,
      formulation: cleanString(body.formulation, 80),
      dose: cleanString(body.dose, 80, true)!,
      instructions: cleanString(body.instructions, 500),
      scheduleLabel: cleanString(body.scheduleLabel, 120),
      refillDueAt: typeof body.refillDueAt === "string" && body.refillDueAt ? body.refillDueAt.slice(0, 40) : null,
      active: body.active !== false,
    };
    await requireDatabase().prepare(
      `INSERT INTO medications
        (id, user_id, name, formulation, dose, instructions, schedule_label, refill_due_at, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, user.id, medication.name, medication.formulation, medication.dose,
      medication.instructions, medication.scheduleLabel, medication.refillDueAt,
      medication.active ? 1 : 0, now, now,
    ).run();
    return appJson({ medication }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const id = cleanString(body.id, 64, true)!;
    const database = requireDatabase();
    const existing = await database.prepare("SELECT id FROM medications WHERE id = ? AND user_id = ?").bind(id, user.id).first();
    if (!existing) throw new AppApiError("That medication was not found.", 404, "not_found");
    await database.prepare(
      `UPDATE medications SET name = ?, formulation = ?, dose = ?, instructions = ?, schedule_label = ?,
       refill_due_at = ?, active = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    ).bind(
      cleanString(body.name, 120, true), cleanString(body.formulation, 80), cleanString(body.dose, 80, true),
      cleanString(body.instructions, 500), cleanString(body.scheduleLabel, 120),
      typeof body.refillDueAt === "string" && body.refillDueAt ? body.refillDueAt.slice(0, 40) : null,
      body.active === false ? 0 : 1, Date.now(), id, user.id,
    ).run();
    return appJson({ id });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAppUser();
    const id = cleanString(new URL(request.url).searchParams.get("id"), 64, true)!;
    const database = requireDatabase();
    await database.prepare("UPDATE medications SET active = 0, updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(Date.now(), id, user.id).run();
    return appJson({ id });
  } catch (error) {
    return appErrorResponse(error);
  }
}
