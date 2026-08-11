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
  };
}

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
    "SELECT user_id, display_name, email, pronouns, timezone, dark_mode, high_contrast, reduced_motion FROM profiles WHERE user_id = ?",
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
    const { user, database } = await ensureProfile();
    const displayName = cleanString(body.displayName, 80, true);
    const pronouns = cleanString(body.pronouns, 40);
    const timezone = cleanString(body.timezone, 80, true);
    await database.prepare(
      `UPDATE profiles SET display_name = ?, pronouns = ?, timezone = ?, dark_mode = ?, high_contrast = ?, reduced_motion = ?, updated_at = ? WHERE user_id = ?`,
    ).bind(
      displayName,
      pronouns,
      timezone,
      body.darkMode ? 1 : 0,
      body.highContrast ? 1 : 0,
      body.reducedMotion ? 1 : 0,
      Date.now(),
      user.id,
    ).run();
    const row = await database.prepare(
      "SELECT user_id, display_name, email, pronouns, timezone, dark_mode, high_contrast, reduced_motion FROM profiles WHERE user_id = ?",
    ).bind(user.id).first<ProfileRow>();
    if (!row) throw new Error("Profile could not be loaded.");
    return appJson({ profile: responseProfile(row) });
  } catch (error) {
    return appErrorResponse(error);
  }
}
