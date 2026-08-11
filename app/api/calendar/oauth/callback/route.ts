import { requireCalendarUser } from "../../../../../lib/calendar-route";
import { completeOAuthConnection } from "../../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

function dashboardRedirect(request: Request, result: "connected" | "error", message?: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("calendar", result);
  if (message) url.searchParams.set("calendar_message", message.slice(0, 180));
  url.hash = "calendar";
  return Response.redirect(url, 302);
}

export async function GET(request: Request) {
  try {
    const user = await requireCalendarUser();
    const url = new URL(request.url);
    const providerError = url.searchParams.get("error");
    if (providerError) {
      return dashboardRedirect(
        request,
        "error",
        providerError === "access_denied"
          ? "Google Calendar connection was canceled. Nothing changed."
          : "Google did not complete the connection.",
      );
    }

    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    if (!state || !code) {
      return dashboardRedirect(
        request,
        "error",
        "Google returned an incomplete connection response. Please try again.",
      );
    }

    await completeOAuthConnection(request, user.id, state, code);
    return dashboardRedirect(request, "connected");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Squirrel! could not complete the calendar connection.";
    return dashboardRedirect(request, "error", message);
  }
}
