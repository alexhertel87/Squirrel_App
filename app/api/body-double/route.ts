import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const code = cleanString(new URL(request.url).searchParams.get("code"), 32, true)!;
    const session = await requireDatabase().prepare(
      `SELECT share_code AS shareCode, task_label AS taskLabel, share_task_details AS shareTaskDetails,
              status, started_at AS startedAt, ended_at AS endedAt
       FROM body_double_sessions WHERE share_code = ? LIMIT 1`,
    ).bind(code).first<Record<string, unknown>>();
    if (!session) throw new AppApiError("This quiet focus room is no longer available.", 404, "not_found");
    return appJson({ session: { ...session, taskLabel: session.shareTaskDetails ? session.taskLabel : null, shareTaskDetails: Boolean(session.shareTaskDetails) } });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const id = crypto.randomUUID();
    const shareCode = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const now = Date.now();
    const shareTaskDetails = Boolean(body.shareTaskDetails);
    await requireDatabase().prepare(
      `INSERT INTO body_double_sessions
       (id, user_id, share_code, task_label, share_task_details, status, started_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
    ).bind(id, user.id, shareCode, cleanString(body.taskLabel, 300), shareTaskDetails ? 1 : 0, now, now).run();
    return appJson({ session: { id, shareCode, status: "active", shareTaskDetails } }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const id = cleanString(body.id, 64, true)!;
    const status = body.status === "complete" ? "complete" : "active";
    await requireDatabase().prepare(
      "UPDATE body_double_sessions SET status = ?, ended_at = ? WHERE id = ? AND user_id = ?",
    ).bind(status, status === "complete" ? Date.now() : null, id, user.id).run();
    return appJson({ id, status });
  } catch (error) {
    return appErrorResponse(error);
  }
}
