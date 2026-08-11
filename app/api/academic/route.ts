import {
  AppApiError,
  appErrorResponse,
  appJson,
  cleanString,
  requireAppUser,
} from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type Resource = "term" | "course" | "assignment";
type Input = Record<string, unknown>;

function resource(value: unknown): Resource {
  if (value === "term" || value === "course" || value === "assignment") return value;
  throw new AppApiError("That item type is not supported.");
}

async function owned(database: D1Database, table: string, id: string, userId: string) {
  const result = await database.prepare(`SELECT id FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId).first();
  if (!result) throw new AppApiError("That item was not found.", 404, "not_found");
}

async function termExists(database: D1Database, id: string, userId: string) {
  await owned(database, "terms", id, userId);
}

async function courseExists(database: D1Database, id: string, userId: string) {
  await owned(database, "courses", id, userId);
}

export async function GET() {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const [terms, courses, assignments, files] = await Promise.all([
      database.prepare("SELECT id, name, start_date AS startDate, end_date AS endDate, sort_order AS sortOrder FROM terms WHERE user_id = ? ORDER BY sort_order, start_date, name").bind(user.id).all(),
      database.prepare("SELECT id, term_id AS termId, name, code, instructor, color FROM courses WHERE user_id = ? ORDER BY name").bind(user.id).all(),
      database.prepare("SELECT id, course_id AS courseId, title, due_at AS dueAt, status, notes FROM assignments WHERE user_id = ? ORDER BY due_at IS NULL, due_at, title").bind(user.id).all(),
      database.prepare("SELECT id, course_id AS courseId, file_name AS fileName, content_type AS contentType, size_bytes AS sizeBytes, uploaded_at AS uploadedAt FROM course_files WHERE user_id = ? ORDER BY uploaded_at DESC").bind(user.id).all(),
    ]);
    return appJson({
      terms: terms.results,
      courses: courses.results,
      assignments: assignments.results,
      files: files.results,
    });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const body = await request.json() as Input;
    const kind = resource(body.resource);
    const id = crypto.randomUUID();
    const now = Date.now();

    if (kind === "term") {
      await database.prepare(
        "INSERT INTO terms (id, user_id, name, start_date, end_date, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        id, user.id, cleanString(body.name, 80, true), cleanString(body.startDate, 10),
        cleanString(body.endDate, 10), Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0, now, now,
      ).run();
    } else if (kind === "course") {
      const termId = cleanString(body.termId, 64, true)!;
      await termExists(database, termId, user.id);
      await database.prepare(
        "INSERT INTO courses (id, user_id, term_id, name, code, instructor, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        id, user.id, termId, cleanString(body.name, 120, true), cleanString(body.code, 40),
        cleanString(body.instructor, 120), cleanString(body.color, 20) ?? "#36bde8", now, now,
      ).run();
    } else {
      const courseId = cleanString(body.courseId, 64, true)!;
      await courseExists(database, courseId, user.id);
      const status = cleanString(body.status, 24) ?? "not_started";
      if (!["not_started", "in_progress", "complete"].includes(status)) {
        throw new AppApiError("Choose a valid assignment status.");
      }
      await database.prepare(
        "INSERT INTO assignments (id, user_id, course_id, title, due_at, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(
        id, user.id, courseId, cleanString(body.title, 160, true), cleanString(body.dueAt, 30),
        status, cleanString(body.notes, 2000), now, now,
      ).run();
    }
    return appJson({ id }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const body = await request.json() as Input;
    const kind = resource(body.resource);
    const id = cleanString(body.id, 64, true)!;
    const now = Date.now();

    if (kind === "term") {
      await owned(database, "terms", id, user.id);
      await database.prepare(
        "UPDATE terms SET name = ?, start_date = ?, end_date = ?, sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      ).bind(
        cleanString(body.name, 80, true), cleanString(body.startDate, 10), cleanString(body.endDate, 10),
        Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0, now, id, user.id,
      ).run();
    } else if (kind === "course") {
      await owned(database, "courses", id, user.id);
      const termId = cleanString(body.termId, 64, true)!;
      await termExists(database, termId, user.id);
      await database.prepare(
        "UPDATE courses SET term_id = ?, name = ?, code = ?, instructor = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      ).bind(
        termId, cleanString(body.name, 120, true), cleanString(body.code, 40), cleanString(body.instructor, 120),
        cleanString(body.color, 20) ?? "#36bde8", now, id, user.id,
      ).run();
    } else {
      await owned(database, "assignments", id, user.id);
      const courseId = cleanString(body.courseId, 64, true)!;
      await courseExists(database, courseId, user.id);
      const status = cleanString(body.status, 24) ?? "not_started";
      if (!["not_started", "in_progress", "complete"].includes(status)) {
        throw new AppApiError("Choose a valid assignment status.");
      }
      await database.prepare(
        "UPDATE assignments SET course_id = ?, title = ?, due_at = ?, status = ?, notes = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      ).bind(
        courseId, cleanString(body.title, 160, true), cleanString(body.dueAt, 30), status,
        cleanString(body.notes, 2000), now, id, user.id,
      ).run();
    }
    return appJson({ id });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const url = new URL(request.url);
    const kind = resource(url.searchParams.get("resource"));
    const id = cleanString(url.searchParams.get("id"), 64, true)!;
    const table = kind === "term" ? "terms" : kind === "course" ? "courses" : "assignments";
    await owned(database, table, id, user.id);

    if (kind === "term") {
      const child = await database.prepare("SELECT id FROM courses WHERE term_id = ? AND user_id = ? LIMIT 1").bind(id, user.id).first();
      if (child) throw new AppApiError("Move or remove this term's courses first.", 409, "term_not_empty");
    }
    if (kind === "course") {
      const child = await database.prepare(
        "SELECT id FROM assignments WHERE course_id = ? AND user_id = ? UNION ALL SELECT id FROM course_files WHERE course_id = ? AND user_id = ? LIMIT 1",
      ).bind(id, user.id, id, user.id).first();
      if (child) throw new AppApiError("Remove this course's assignments and files first.", 409, "course_not_empty");
    }
    await database.prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
    return appJson({ deleted: true });
  } catch (error) {
    return appErrorResponse(error);
  }
}
