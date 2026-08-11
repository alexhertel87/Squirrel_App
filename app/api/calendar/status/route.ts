import { calendarErrorResponse, calendarJson, requireCalendarUser } from "../../../../lib/calendar-route";
import {
  calendarConfigStatus,
  GOOGLE_CALENDAR_SCOPE,
  hasCalendarConnection,
} from "../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCalendarUser();
    const config = calendarConfigStatus(request);
    const connected = config.configured
      ? await hasCalendarConnection(user.id)
      : false;
    return calendarJson({
      configured: config.configured,
      connected,
      scope: GOOGLE_CALENDAR_SCOPE,
    });
  } catch (error) {
    return calendarErrorResponse(error);
  }
}
