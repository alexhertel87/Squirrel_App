import { calendarErrorResponse, requireCalendarUser } from "../../../../lib/calendar-route";
import { createOAuthAuthorizationUrl } from "../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCalendarUser();
    const authorizationUrl = await createOAuthAuthorizationUrl(
      request,
      user.id,
      user.email,
    );
    return Response.redirect(authorizationUrl, 302);
  } catch (error) {
    return calendarErrorResponse(error);
  }
}
