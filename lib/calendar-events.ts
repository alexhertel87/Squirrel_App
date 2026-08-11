import { CalendarApiError } from "./google-calendar";

type EventInput = {
  summary: string;
  description?: string;
  location?: string;
  allDay: boolean;
  start: string;
  end: string;
};

type GoogleEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

function boundedText(
  value: unknown,
  label: string,
  maximum: number,
  required = false,
) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) {
    throw new CalendarApiError(`${label} is required.`, 400, "invalid_event");
  }
  if (result.length > maximum) {
    throw new CalendarApiError(
      `${label} must be ${maximum} characters or fewer.`,
      400,
      "invalid_event",
    );
  }
  return result;
}

export function parseEventInput(value: unknown): EventInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CalendarApiError("Event details are required.", 400, "invalid_event");
  }
  const body = value as Record<string, unknown>;
  const allDay = body.allDay === true;
  const summary = boundedText(body.summary, "Event title", 300, true);
  const description = boundedText(body.description, "Description", 5000);
  const location = boundedText(body.location, "Location", 1000);
  const start = boundedText(body.start, "Start", 40, true);
  const end = boundedText(body.end, "End", 40, true);

  if (allDay) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(start) || !datePattern.test(end) || end <= start) {
      throw new CalendarApiError(
        "Choose a valid all-day date.",
        400,
        "invalid_event",
      );
    }
  } else {
    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
      throw new CalendarApiError(
        "The event end time must be after its start time.",
        400,
        "invalid_event",
      );
    }
  }

  return { summary, description, location, allDay, start, end };
}

export function googleEventBody(input: EventInput) {
  return {
    summary: input.summary,
    ...(input.description ? { description: input.description } : {}),
    ...(input.location ? { location: input.location } : {}),
    start: input.allDay ? { date: input.start } : { dateTime: input.start },
    end: input.allDay ? { date: input.end } : { dateTime: input.end },
  };
}

export function normalizeGoogleEvent(event: GoogleEvent) {
  if (!event.id || (!event.start?.date && !event.start?.dateTime)) return null;
  return {
    id: event.id,
    summary: event.summary || "Untitled event",
    description: event.description || "",
    location: event.location || "",
    htmlLink: event.htmlLink || "",
    allDay: Boolean(event.start.date),
    start: event.start.dateTime || event.start.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    status: event.status || "confirmed",
  };
}

export type { GoogleEvent };
