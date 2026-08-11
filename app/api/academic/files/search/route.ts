import { appErrorResponse, appJson, requireAppUser } from "../../../../../lib/app-route";
import { requireDatabase } from "../../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type MatchRow = {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: number;
  searchText: string;
};

export async function GET(request: Request) {
  try {
    const user = await requireAppUser();
    const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
    if (query.length < 2) return appJson({ matches: [] });
    const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    const result = await requireDatabase().prepare(
      `SELECT f.id, f.course_id AS courseId, c.name AS courseName, c.code AS courseCode,
              f.file_name AS fileName, f.content_type AS contentType, f.size_bytes AS sizeBytes,
              f.uploaded_at AS uploadedAt, f.search_text AS searchText
       FROM course_files f JOIN courses c ON c.id = f.course_id AND c.user_id = f.user_id
       WHERE f.user_id = ? AND (f.file_name LIKE ? ESCAPE '\\' OR f.search_text LIKE ? ESCAPE '\\')
       ORDER BY f.uploaded_at DESC LIMIT 50`,
    ).bind(user.id, like, like).all<MatchRow>();
    const needle = query.toLowerCase();
    const matches = result.results.map((row) => {
      const index = row.searchText.toLowerCase().indexOf(needle);
      const excerpt = index < 0 ? "Matched the filename" : row.searchText.slice(Math.max(0, index - 70), Math.min(row.searchText.length, index + query.length + 120));
      return {
        id: row.id,
        courseId: row.courseId,
        courseName: row.courseName,
        courseCode: row.courseCode,
        fileName: row.fileName,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        uploadedAt: row.uploadedAt,
        excerpt: index > 70 ? `…${excerpt}` : excerpt,
      };
    });
    return appJson({ matches });
  } catch (error) {
    return appErrorResponse(error);
  }
}
