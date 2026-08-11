import { calendarErrorResponse, calendarJson, requireCalendarUser } from "../../../../../lib/calendar-route";
import {
  googleEventBody,
  normalizeGoogleEvent,
  parseEventInput,
} from "../../../../../lib/calendar-events";
import type { GoogleEvent } from "../../../../../lib/calendar-events";
import { CalendarApiError, googleCalendarRequest } from "../../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const user = await requireCalendarUser();
    const { eventId } = await context.params;
    if (!eventId || eventId.length > 1024) {
      throw new CalendarApiError("That calendar event is not valid.", 400, "invalid_event");
    }
    const input = parseEventInput(await request.json());
    const updated = await googleCalendarRequest<GoogleEvent>(
      user.id,
      `/calendars/primary/events/${encodeURIComponent(eventId)}`,
      { method: "PATCH", body: JSON.stringify(googleEventBody(input)) },
    );
    return calendarJson({ event: normalizeGoogleEvent(updated) });
  } catch (error) {
    return calendarErrorResponse(error);
  }
}
