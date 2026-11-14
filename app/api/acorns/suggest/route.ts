import { appErrorResponse, appJson, requireAppUser } from "../../../../lib/app-route";
import { rankAcorns, type AcornCandidate, type Calibration } from "../../../../lib/acorn-ranking";
import { requireDatabase } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const url = new URL(request.url);
    const localDate = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const calibrationRow = await database.prepare(
      `SELECT energy, available_minutes AS availableMinutes, location, minimum_day AS minimumDay
       FROM daily_calibrations WHERE user_id = ? AND local_date = ? LIMIT 1`,
    ).bind(user.id, localDate).first<Record<string, unknown>>();
    const calibration: Calibration = {
      energy: String(calibrationRow?.energy || "medium"),
      availableMinutes: Number(calibrationRow?.availableMinutes || 30),
      location: String(calibrationRow?.location || "anywhere"),
      minimumDay: Boolean(calibrationRow?.minimumDay),
    };
    const rows = await database.prepare(
      `SELECT id, content, kind, status, energy, estimated_minutes AS estimatedMinutes,
              brain_load AS brainLoad, due_at AS dueAt, location, first_step AS firstStep,
              notes, priority, avoid_count AS avoidCount, context, source
       FROM acorns WHERE user_id = ? AND status NOT IN ('complete', 'released', 'delegated')
       ORDER BY updated_at DESC LIMIT 200`,
    ).bind(user.id).all<AcornCandidate>();
    const ranked = rankAcorns(rows.results, calibration);
    const suggestion = ranked[0] ?? null;
    if (suggestion) {
      await database.prepare("UPDATE acorns SET last_suggested_at = ? WHERE id = ? AND user_id = ?")
        .bind(Date.now(), suggestion.id, user.id).run();
    }
    return appJson({ suggestion, alternatives: ranked.slice(1, 4), calibration });
  } catch (error) {
    return appErrorResponse(error);
  }
}
