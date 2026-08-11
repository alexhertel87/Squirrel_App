import { calendarErrorResponse, calendarJson, requireCalendarUser } from "../../../../lib/calendar-route";
import { disconnectCalendar } from "../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireCalendarUser();
    await disconnectCalendar(user.id);
    return calendarJson({ disconnected: true });
  } catch (error) {
    return calendarErrorResponse(error);
  }
}
