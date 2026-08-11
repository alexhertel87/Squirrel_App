import { calendarErrorResponse, calendarJson, requireCalendarUser } from "../../../../lib/calendar-route";
import {
  googleEventBody,
  normalizeGoogleEvent,
  parseEventInput,
} from "../../../../lib/calendar-events";
import type { GoogleEvent } from "../../../../lib/calendar-events";
import { googleCalendarRequest } from "../../../../lib/google-calendar";

export const dynamic = "force-dynamic";

type EventListResponse = { items?: GoogleEvent[]; timeZone?: string };

export async function GET() {
  try {
    const user = await requireCalendarUser();
    const query = new URLSearchParams({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: "12",
      singleEvents: "true",
      orderBy: "startTime",
      showDeleted: "false",
    });
    const result = await googleCalendarRequest<EventListResponse>(
      user.id,
      `/calendars/primary/events?${query}`,
    );
    const events = (result.items || [])
      .map(normalizeGoogleEvent)
      .filter((event) => event !== null);
    return calendarJson({ events, timeZone: result.timeZone || null });
  } catch (error) {
    return calendarErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCalendarUser();
    const input = parseEventInput(await request.json());
    const created = await googleCalendarRequest<GoogleEvent>(
      user.id,
      "/calendars/primary/events",
      { method: "POST", body: JSON.stringify(googleEventBody(input)) },
    );
    return calendarJson({ event: normalizeGoogleEvent(created) }, 201);
  } catch (error) {
    return calendarErrorResponse(error);
  }
}
