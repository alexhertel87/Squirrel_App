import { appErrorResponse, appJson, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const since = Date.now() - 30 * 86400000;
    const events = await database.prepare(
      `SELECT event_type AS eventType, reason, COUNT(*) AS count
       FROM acorn_events WHERE user_id = ? AND created_at >= ?
       GROUP BY event_type, reason ORDER BY count DESC`,
    ).bind(user.id, since).all();
    const completed = await database.prepare(
      `SELECT COUNT(*) AS count, AVG(estimated_minutes) AS averageMinutes
       FROM acorns WHERE user_id = ? AND completed_at >= ?`,
    ).bind(user.id, since).first<{ count: number; averageMinutes: number | null }>();
    const commonReason = events.results.find((item: Record<string, unknown>) => item.eventType === "rejected" && item.reason);
    return appJson({
      insights: {
        completed: Number(completed?.count || 0),
        averageMinutes: Math.round(Number(completed?.averageMinutes || 0)),
        commonFriction: commonReason?.reason || null,
        events: events.results,
      },
    });
  } catch (error) {
    return appErrorResponse(error);
  }
}
