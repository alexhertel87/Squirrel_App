import { appErrorResponse, appJson, cleanString, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type ProfileRow = {
  user_id: string;
  display_name: string;
  email: string;
  pronouns: string | null;
  timezone: string;
  dark_mode: number;
  high_contrast: number;
  reduced_motion: number;
  density: string;
  text_scale: string;
  color_intensity: string;
  notification_mode: string;
  humor_level: string;
  timer_direction: string;
};

function responseProfile(row: ProfileRow) {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    pronouns: row.pronouns ?? "",
    timezone: row.timezone,
    darkMode: Boolean(row.dark_mode),
    highContrast: Boolean(row.high_contrast),
    reducedMotion: Boolean(row.reduced_motion),
    density: row.density,
    textScale: row.text_scale,
    colorIntensity: row.color_intensity,
    notificationMode: row.notification_mode,
    humorLevel: row.humor_level,
    timerDirection: row.timer_direction,
  };
}

function choice(value: unknown, allowed: string[], fallback: string) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

const profileColumns = `user_id, display_name, email, pronouns, timezone, dark_mode, high_contrast,
  reduced_motion, density, text_scale, color_intensity, notification_mode, humor_level, timer_direction`;

async function ensureProfile() {
  const user = await requireAppUser();
  const database = requireDatabase();
  const now = Date.now();
  await database.prepare(
    `INSERT INTO profiles (user_id, display_name, email, timezone, created_at, updated_at)
     VALUES (?, ?, ?, 'America/Chicago', ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET email = excluded.email`,
  ).bind(user.id, user.displayName, user.email, now, now).run();
  const row = await database.prepare(
    `SELECT ${profileColumns} FROM profiles WHERE user_id = ?`,
  ).bind(user.id).first<ProfileRow>();
  if (!row) throw new Error("Profile could not be loaded.");
  return { user, database, row };
}

export async function GET() {
  try {
    const { row } = await ensureProfile();
    return appJson({ profile: responseProfile(row) });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { user, database, row: existing } = await ensureProfile();
    const displayName = body.displayName === undefined ? existing.display_name : cleanString(body.displayName, 80, true);
    const pronouns = body.pronouns === undefined ? existing.pronouns : cleanString(body.pronouns, 40);
    const timezone = body.timezone === undefined ? existing.timezone : cleanString(body.timezone, 80, true);
    await database.prepare(
      `UPDATE profiles SET display_name = ?, pronouns = ?, timezone = ?, dark_mode = ?, high_contrast = ?,
       reduced_motion = ?, density = ?, text_scale = ?, color_intensity = ?, notification_mode = ?,
       humor_level = ?, timer_direction = ?, updated_at = ? WHERE user_id = ?`,
    ).bind(
      displayName,
      pronouns,
      timezone,
      body.darkMode === undefined ? existing.dark_mode : body.darkMode ? 1 : 0,
      body.highContrast === undefined ? existing.high_contrast : body.highContrast ? 1 : 0,
      body.reducedMotion === undefined ? existing.reduced_motion : body.reducedMotion ? 1 : 0,
      choice(body.density, ["compact", "comfortable", "spacious"], existing.density),
      choice(body.textScale, ["small", "medium", "large"], existing.text_scale),
      choice(body.colorIntensity, ["muted", "soft", "bright"], existing.color_intensity),
      choice(body.notificationMode, ["quiet", "gentle", "persistent"], existing.notification_mode),
      choice(body.humorLevel, ["low", "some", "full"], existing.humor_level),
      choice(body.timerDirection, ["down", "up"], existing.timer_direction),
      Date.now(),
      user.id,
    ).run();
    const row = await database.prepare(
      `SELECT ${profileColumns} FROM profiles WHERE user_id = ?`,
    ).bind(user.id).first<ProfileRow>();
    if (!row) throw new Error("Profile could not be loaded.");
    return appJson({ profile: responseProfile(row) });
  } catch (error) {
    return appErrorResponse(error);
  }
}
