import { AppApiError, appErrorResponse, appJson, cleanString, requireAppUser } from "../../../../lib/app-route";
import { requireDatabase, requireFileBucket } from "../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const PPTX_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const MAX_INDEX_CHARACTERS = 500_000;

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

async function extractSearchText(file: File, contentType: string) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (contentType === "application/pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const document = await getDocumentProxy(bytes);
    const result = await extractText(document, { mergePages: true });
    return String(result.text).replace(/\s+/g, " ").trim().slice(0, MAX_INDEX_CHARACTERS);
  }
  const { default: JSZip } = await import("jszip");
  const archive = await JSZip.loadAsync(bytes);
  const slideNames = Object.keys(archive.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  const slides = await Promise.all(slideNames.map((name) => archive.file(name)?.async("text") ?? ""));
  return slides.flatMap((xml) => Array.from(xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi), (match) => decodeXmlText(match[1])))
    .join(" ").replace(/\s+/g, " ").trim().slice(0, MAX_INDEX_CHARACTERS);
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const database = requireDatabase();
    const bucket = requireFileBucket();
    const form = await request.formData();
    const courseId = cleanString(form.get("courseId"), 64, true)!;
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppApiError("Choose a PDF or PowerPoint file.");
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      throw new AppApiError("Files must be between 1 byte and 25 MB.");
    }
    const lowered = file.name.toLowerCase();
    const contentType = lowered.endsWith(".pdf")
      ? "application/pdf"
      : lowered.endsWith(".pptx")
        ? PPTX_TYPE
        : null;
    if (!contentType) throw new AppApiError("Squirrel! currently accepts PDF and PPTX files.");
    const course = await database.prepare("SELECT id FROM courses WHERE id = ? AND user_id = ?")
      .bind(courseId, user.id).first();
    if (!course) throw new AppApiError("That course was not found.", 404, "not_found");

    const id = crypto.randomUUID();
    const objectKey = `users/${encodeURIComponent(user.id)}/courses/${courseId}/${id}`;
    let searchText = "";
    try {
      searchText = await extractSearchText(file, contentType);
    } catch (error) {
      console.warn("Lecture file text indexing failed", error);
    }
    await bucket.put(objectKey, file.stream(), {
      httpMetadata: { contentType },
      customMetadata: { ownerId: user.id, originalName: file.name.slice(0, 220) },
    });
    try {
      await database.prepare(
        "INSERT INTO course_files (id, user_id, course_id, file_name, object_key, content_type, size_bytes, search_text, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).bind(id, user.id, courseId, file.name.slice(0, 220), objectKey, contentType, file.size, searchText, Date.now()).run();
    } catch (error) {
      await bucket.delete(objectKey);
      throw error;
    }
    return appJson({ id }, 201);
  } catch (error) {
    return appErrorResponse(error);
  }
}
