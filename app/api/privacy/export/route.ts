import { appErrorResponse, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const tables = [
      "profiles", "acorns", "daily_calibrations", "acorn_events", "terms", "courses",
      "assignments", "course_files", "medications", "medication_logs", "body_double_sessions",
    ];
    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email, displayName: user.displayName },
      notice: "This export contains records you entered in Squirrel!. Google OAuth tokens are intentionally excluded.",
    };
    for (const table of tables) {
      const result = await database.prepare(`SELECT * FROM ${table} WHERE user_id = ?`).bind(user.id).all();
      data[table] = result.results;
    }
    const calendar = await database.prepare("SELECT granted_scope, created_at, updated_at FROM google_calendar_connections WHERE user_id = ?")
      .bind(user.id).first();
    data.calendarConnection = calendar ?? null;
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="squirrel-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return appErrorResponse(error);
  }
}
