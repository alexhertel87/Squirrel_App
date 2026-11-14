import { AppApiError, appErrorResponse, appJson, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase, requireFileBucket } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    if (body.confirmation !== "DELETE MY SQUIRREL DATA") {
      throw new AppApiError("Type the full confirmation phrase before deleting your data.");
    }
    const database = requireDatabase();
    const files = await database.prepare("SELECT object_key AS objectKey FROM course_files WHERE user_id = ?").bind(user.id).all<{ objectKey: string }>();
    if (files.results.length) {
      await requireFileBucket().delete(files.results.map((file: { objectKey: string }) => file.objectKey));
    }
    const statements = [
      "DELETE FROM medication_logs WHERE user_id = ?",
      "DELETE FROM medications WHERE user_id = ?",
      "DELETE FROM body_double_sessions WHERE user_id = ?",
      "DELETE FROM acorn_events WHERE user_id = ?",
      "DELETE FROM acorns WHERE user_id = ?",
      "DELETE FROM daily_calibrations WHERE user_id = ?",
      "DELETE FROM course_files WHERE user_id = ?",
      "DELETE FROM assignments WHERE user_id = ?",
      "DELETE FROM courses WHERE user_id = ?",
      "DELETE FROM terms WHERE user_id = ?",
      "DELETE FROM google_calendar_connections WHERE user_id = ?",
      "DELETE FROM google_oauth_states WHERE user_id = ?",
      "DELETE FROM profiles WHERE user_id = ?",
    ].map((sql) => database.prepare(sql).bind(user.id));
    await database.batch(statements);
    return appJson({ deleted: true });
  } catch (error) {
    return appErrorResponse(error);
  }
}
