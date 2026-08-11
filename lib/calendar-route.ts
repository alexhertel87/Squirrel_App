import { getChatGPTUser } from "../app/chatgpt-auth";
import { CalendarApiError } from "./google-calendar";

export async function requireCalendarUser() {
  const user = await getChatGPTUser();
  if (!user) {
    throw new CalendarApiError(
      "Sign in to Squirrel! before connecting Google Calendar.",
      401,
      "squirrel_sign_in_required",
    );
  }
  return user;
}

export function calendarJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export function calendarErrorResponse(error: unknown) {
  if (error instanceof CalendarApiError) {
    return calendarJson(
      { error: error.message, code: error.code },
      error.status,
    );
  }
  console.error("Calendar route failed", error);
  return calendarJson(
    { error: "Squirrel! could not reach Google Calendar just now.", code: "calendar_error" },
    500,
  );
}
