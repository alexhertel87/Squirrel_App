import { AppApiError, appErrorResponse, appJson, requireAppUser } from "../../../../../lib/app-route";
import { requireDatabase, requireFileBucket } from "../../../../../lib/runtime-env";

export const dynamic = "force-dynamic";

type FileRow = {
  id: string;
  file_name: string;
  object_key: string;
  content_type: string;
};

async function ownedFile(fileId: string) {
  const user = await requireAppUser();
  const database = requireDatabase();
  const file = await database.prepare(
    "SELECT id, file_name, object_key, content_type FROM course_files WHERE id = ? AND user_id = ?",
  ).bind(fileId, user.id).first<FileRow>();
  if (!file) throw new AppApiError("That file was not found.", 404, "not_found");
  return { user, database, file };
}

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await context.params;
    const { file } = await ownedFile(fileId);
    const object = await requireFileBucket().get(file.object_key);
    if (!object) throw new AppApiError("That file is no longer in storage.", 404, "not_found");
    const safeName = file.file_name.replace(/[\r\n"\\]/g, "_");
    return new Response(object.body, {
      headers: {
        "content-type": file.content_type,
        "content-length": String(object.size),
        "content-disposition": `inline; filename="${safeName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return appErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await context.params;
    const { user, database, file } = await ownedFile(fileId);
    await requireFileBucket().delete(file.object_key);
    await database.prepare("DELETE FROM course_files WHERE id = ? AND user_id = ?").bind(fileId, user.id).run();
    return appJson({ deleted: true });
  } catch (error) {
    return appErrorResponse(error);
  }
}
