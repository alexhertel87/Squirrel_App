import { appErrorResponse, appJson, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type SyllabusRow = {
  id: string;
  fileName: string;
  searchText: string;
  courseId: string;
  courseName: string;
  courseCode: string | null;
  termStart: string | null;
};

const deadlineWords = /\b(due|exam|paper|quiz|assignment|presentation|project|midterm|final|discussion|clinical|checkoff|test)\b/i;
const datePattern = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/gi;

function localDateTime(text: string, termStart: string | null) {
  const cleaned = text.replace(/(st|nd|rd|th)/i, "").replace(/\./g, "").trim();
  const fallbackYear = Number(termStart?.slice(0, 4)) || new Date().getFullYear();
  const hasYear = /\b\d{4}\b/.test(cleaned) || /[/-]\d{2,4}$/.test(cleaned);
  const parsed = new Date(hasYear ? cleaned : `${cleaned} ${fallbackYear}`);
  if (!Number.isFinite(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}T23:59`;
}

function cleanTitle(context: string, dateText: string) {
  const withoutDate = context.replace(dateText, " ").replace(/\s+/g, " ").trim();
  const match = withoutDate.match(/(?:^|[.;:]\s*)([^.;]{0,90}\b(?:due|exam|paper|quiz|assignment|presentation|project|midterm|final|discussion|clinical|checkoff|test)\b[^.;]{0,90})/i);
  const title = (match?.[1] || withoutDate).replace(/^[-–—,:\s]+|[-–—,:\s]+$/g, "").trim();
  return title.slice(0, 140) || "Syllabus deadline";
}

export async function GET() {
  try {
    const user = await requireAppUser();
    const result = await requireDatabase().prepare(
      `SELECT f.id, f.file_name AS fileName, f.search_text AS searchText,
              f.course_id AS courseId, c.name AS courseName, c.code AS courseCode,
              t.start_date AS termStart
       FROM course_files f
       JOIN courses c ON c.id = f.course_id AND c.user_id = f.user_id
       JOIN terms t ON t.id = c.term_id AND t.user_id = f.user_id
       WHERE f.user_id = ? AND (LOWER(f.file_name) LIKE '%syllab%' OR LOWER(f.search_text) LIKE '%syllabus%')
       ORDER BY f.uploaded_at DESC LIMIT 20`,
    ).bind(user.id).all<SyllabusRow>();

    const suggestions: Array<Record<string, string>> = [];
    const seen = new Set<string>();
    for (const row of result.results) {
      const text = row.searchText.replace(/\s+/g, " ");
      for (const match of text.matchAll(datePattern)) {
        if (match.index === undefined) continue;
        const context = text.slice(Math.max(0, match.index - 110), Math.min(text.length, match.index + match[0].length + 130));
        if (!deadlineWords.test(context)) continue;
        const dueAt = localDateTime(match[0], row.termStart);
        if (!dueAt) continue;
        const title = cleanTitle(context, match[0]);
        const key = `${row.courseId}|${dueAt.slice(0, 10)}|${title.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        suggestions.push({ id: `${row.id}:${match.index}`, fileName: row.fileName, courseId: row.courseId, courseName: row.courseName, courseCode: row.courseCode || "", title, dueAt, excerpt: context.slice(0, 220) });
        if (suggestions.length >= 30) break;
      }
      if (suggestions.length >= 30) break;
    }
    return appJson({ suggestions, filesScanned: result.results.length });
  } catch (error) {
    return appErrorResponse(error);
  }
}
