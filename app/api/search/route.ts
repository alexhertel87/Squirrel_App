import { appErrorResponse, appJson, requireAppUser } from "../../../lib/app-route";
import { requireDatabase } from "../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const sensitivePattern = /\b(?:\d[ -]*?){9,17}\b|\b(?:routing|account|card|ssn|social security|password|token|secret)\b/i;

function safe(value: unknown) {
  const text = String(value || "").trim();
  return sensitivePattern.test(text) ? "Sensitive content hidden" : text;
}

function excerpt(value: unknown, query: string) {
  const text = safe(value);
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return text.slice(0, 220);
  return text.slice(Math.max(0, at - 70), Math.min(text.length, at + query.length + 140));
}

export async function GET(request: Request) {
  try {
    const user = await requireAppUser();
    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) || "";
    if (query.length < 2 || sensitivePattern.test(query)) return appJson({ results: [], suggestions: [] });
    const database = requireDatabase();
    const like = `%${query.replace(/[%_]/g, "")}%`;
    const [acorns, assignments, files, medications, logs] = await Promise.all([
      database.prepare(`SELECT id, content, notes, due_at AS dueAt, updated_at AS occurredAt FROM acorns WHERE user_id = ? AND status != 'released' AND (content LIKE ? OR notes LIKE ?) LIMIT 20`).bind(user.id, like, like).all(),
      database.prepare(`SELECT a.id, a.title, a.notes, a.due_at AS dueAt, a.updated_at AS occurredAt, c.name AS courseName FROM assignments a JOIN courses c ON c.id = a.course_id WHERE a.user_id = ? AND (a.title LIKE ? OR a.notes LIKE ?) LIMIT 20`).bind(user.id, like, like).all(),
      database.prepare(`SELECT f.id, f.file_name AS title, f.search_text AS body, f.uploaded_at AS occurredAt, c.name AS courseName FROM course_files f JOIN courses c ON c.id = f.course_id WHERE f.user_id = ? AND (f.file_name LIKE ? OR f.search_text LIKE ?) LIMIT 20`).bind(user.id, like, like).all(),
      database.prepare(`SELECT id, name, formulation, dose, instructions, updated_at AS occurredAt FROM medications WHERE user_id = ? AND (name LIKE ? OR formulation LIKE ? OR dose LIKE ? OR instructions LIKE ?) LIMIT 20`).bind(user.id, like, like, like, like).all(),
      database.prepare(`SELECT l.id, m.name, m.formulation, m.dose, l.status, l.note, l.logged_at AS occurredAt FROM medication_logs l JOIN medications m ON m.id = l.medication_id WHERE l.user_id = ? AND (m.name LIKE ? OR m.formulation LIKE ? OR m.dose LIKE ? OR l.note LIKE ?) LIMIT 20`).bind(user.id, like, like, like, like).all(),
    ]);
    const results = [
      ...acorns.results.map((row: Record<string, unknown>) => ({ id: `acorn:${row.id}`, type: "Task or note", title: safe(row.content), detail: row.dueAt ? `Due ${row.dueAt}` : "Saved task or note", excerpt: excerpt(row.notes || row.content, query), occurredAt: row.occurredAt, href: "#get-squirrelly" })),
      ...assignments.results.map((row: Record<string, unknown>) => ({ id: `assignment:${row.id}`, type: "Assignment", title: safe(row.title), detail: `${safe(row.courseName)}${row.dueAt ? ` · due ${row.dueAt}` : ""}`, excerpt: excerpt(row.notes || row.title, query), occurredAt: row.occurredAt, href: "#school" })),
      ...files.results.map((row: Record<string, unknown>) => ({ id: `file:${row.id}`, type: "Document", title: safe(row.title), detail: safe(row.courseName), excerpt: excerpt(row.body, query), occurredAt: row.occurredAt, href: "#school" })),
      ...medications.results.map((row: Record<string, unknown>) => ({ id: `medication:${row.id}`, type: "Medication", title: safe(`${row.name}${row.formulation ? ` ${row.formulation}` : ""}`), detail: `Logged dose: ${safe(row.dose)}`, excerpt: excerpt(row.instructions || row.dose, query), occurredAt: row.occurredAt, href: "#medications" })),
      ...logs.results.map((row: Record<string, unknown>) => ({ id: `medication-log:${row.id}`, type: "Medication Log", title: safe(`${row.name} ${row.formulation || ""} ${row.dose}`), detail: `${row.status} · ${new Date(Number(row.occurredAt)).toLocaleDateString()}`, excerpt: excerpt(row.note || `${row.status} ${row.dose}`, query), occurredAt: row.occurredAt, href: "#medications" })),
    ].sort((left, right) => Number(right.occurredAt || 0) - Number(left.occurredAt || 0)).slice(0, 40);
    const suggestions = Array.from(new Set(results.flatMap((item) => [item.title, item.type]))).slice(0, 8);
    return appJson({ results, suggestions });
  } catch (error) {
    return appErrorResponse(error);
  }
}
