import { getChatGPTUser } from "../app/chatgpt-auth";

export class AppApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "invalid_request",
  ) {
    super(message);
  }
}

export async function requireAppUser() {
  const user = await getChatGPTUser();
  if (!user) {
    throw new AppApiError("Sign in to continue.", 401, "squirrel_sign_in_required");
  }
  return user;
}

export function appJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export function appErrorResponse(error: unknown) {
  if (error instanceof AppApiError) {
    return appJson({ error: error.message, code: error.code }, error.status);
  }
  console.error("Squirrel! API route failed", error);
  return appJson(
    { error: "Squirrel! hit a snag. Nothing was lost—please try again.", code: "app_error" },
    500,
  );
}

export function cleanString(value: unknown, maxLength: number, required = false) {
  const cleaned = typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  if (required && !cleaned) throw new AppApiError("Please complete the required fields.");
  return cleaned || null;
}
