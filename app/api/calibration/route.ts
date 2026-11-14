import { appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const energies = ["low", "medium", "high"];
const locations = ["anywhere", "home", "work", "school", "out"];

function choice(value: unknown, allowed: string[], fallback: string) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function dateKey(value: unknown) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const user = await requireAppUser();
    const localDate = dateKey(new URL(request.url).searchParams.get("date"));
    const calibration = await requireDatabase().prepare(
      `SELECT local_date AS localDate, energy, available_minutes AS availableMinutes, location,
              immovable_obligation AS immovableObligation, minimum_day AS minimumDay
       FROM daily_calibrations WHERE user_id = ? AND local_date = ? LIMIT 1`,
    ).bind(user.id, localDate).first();
    return appJson({ calibration: calibration ? { ...calibration, minimumDay: Boolean(calibration.minimumDay) } : null });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAppUser();
    const body = await request.json() as Record<string, unknown>;
    const localDate = dateKey(body.localDate);
    const now = Date.now();
    const calibration = {
      localDate,
      energy: choice(body.energy, energies, "medium"),
      availableMinutes: Math.max(5, Math.min(720, Number(body.availableMinutes) || 30)),
      location: choice(body.location, locations, "anywhere"),
      immovableObligation: cleanString(body.immovableObligation, 240),
      minimumDay: Boolean(body.minimumDay),
    };
    await requireDatabase().prepare(
      `INSERT INTO daily_calibrations
        (id, user_id, local_date, energy, available_minutes, location, immovable_obligation, minimum_day, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, local_date) DO UPDATE SET
         energy = excluded.energy, available_minutes = excluded.available_minutes,
         location = excluded.location, immovable_obligation = excluded.immovable_obligation,
         minimum_day = excluded.minimum_day, updated_at = excluded.updated_at`,
    ).bind(
      crypto.randomUUID(), user.id, calibration.localDate, calibration.energy,
      calibration.availableMinutes, calibration.location, calibration.immovableObligation,
      calibration.minimumDay ? 1 : 0, now, now,
    ).run();
    return appJson({ calibration });
  } catch (error) {
    return appErrorResponse(error);
  }
}
