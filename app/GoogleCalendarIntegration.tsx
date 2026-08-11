"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type CalendarDay = {
  key: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

type Deadline = { due: string; title: string; detail: string };

type CalendarEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  htmlLink: string;
  allDay: boolean;
  start: string;
  end: string;
  status: string;
};

type CalendarStatus = {
  configured: boolean;
  connected: boolean;
};

type EventForm = {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  description: string;
};

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTimeValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function initialEventForm(): EventForm {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    summary: "",
    date: localDateValue(start),
    startTime: localTimeValue(start),
    endTime: localTimeValue(end),
    allDay: false,
    location: "",
    description: "",
  };
}

function nextDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + 1));
  return value.toISOString().slice(0, 10);
}

function eventFormFrom(event: CalendarEvent): EventForm {
  if (event.allDay) {
    return {
      summary: event.summary,
      date: event.start,
      startTime: "09:00",
      endTime: "10:00",
      allDay: true,
      location: event.location,
      description: event.description,
    };
  }
  const start = new Date(event.start);
  const end = new Date(event.end);
  return {
    summary: event.summary,
    date: localDateValue(start),
    startTime: localTimeValue(start),
    endTime: localTimeValue(end),
    allDay: false,
    location: event.location,
    description: event.description,
  };
}

function eventPayload(form: EventForm) {
  return {
    summary: form.summary,
    description: form.description,
    location: form.location,
    allDay: form.allDay,
    start: form.allDay
      ? form.date
      : new Date(`${form.date}T${form.startTime}`).toISOString(),
    end: form.allDay
      ? nextDate(form.date)
      : new Date(`${form.date}T${form.endTime}`).toISOString(),
  };
}

async function responseJson<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error || "Squirrel could not update Google Calendar.");
  }
  return result;
}

function eventLabels(event: CalendarEvent) {
  if (event.allDay) {
    const date = new Date(`${event.start}T12:00:00`);
    return {
      when: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      detail: event.location ? `All day · ${event.location}` : "All day",
    };
  }
  const start = new Date(event.start);
  return {
    when: start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    detail: `${start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}${event.location ? ` · ${event.location}` : ""}`,
  };
}

export function GoogleCalendarIntegration({
  monthLabel,
  calendarDays,
  deadlines,
}: {
  monthLabel: string;
  calendarDays: CalendarDay[];
  deadlines: Deadline[];
}) {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<EventForm>(() => initialEventForm());

  const loadEvents = useCallback(async () => {
    const result = await responseJson<{ events: CalendarEvent[] }>(
      await fetch("/api/calendar/events", { cache: "no-store" }),
    );
    setEvents(result.events);
  }, []);

  const loadCalendar = useCallback(async () => {
    setBusy(true);
    try {
      const nextStatus = await responseJson<CalendarStatus>(
        await fetch("/api/calendar/status", { cache: "no-store" }),
      );
      setStatus(nextStatus);
      if (nextStatus.connected) await loadEvents();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calendar is unavailable just now.");
    } finally {
      setBusy(false);
    }
  }, [loadEvents]);

  useEffect(() => {
    const initialize = async () => {
      const query = new URLSearchParams(window.location.search);
      const result = query.get("calendar");
      const providerMessage = query.get("calendar_message");
      if (result) {
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#calendar"}`);
      }
      await loadCalendar();
      if (result === "connected") setMessage("Google Calendar is connected.");
      if (result === "error" && providerMessage) setMessage(providerMessage);
    };
    void initialize();
  }, [loadCalendar]);

  const connect = () => {
    window.location.assign("/api/calendar/connect");
  };

  const refresh = async () => {
    setBusy(true);
    setMessage("");
    try {
      await loadEvents();
      setMessage("Calendar refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calendar refresh did not finish.");
    } finally {
      setBusy(false);
    }
  };

  const openNewEvent = () => {
    setEditingId(null);
    setForm(initialEventForm());
    setShowEditor(true);
    setMessage("");
  };

  const openEditEvent = (event: CalendarEvent) => {
    setEditingId(event.id);
    setForm(eventFormFrom(event));
    setShowEditor(true);
    setMessage("");
  };

  const saveEvent = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const path = editingId
        ? `/api/calendar/events/${encodeURIComponent(editingId)}`
        : "/api/calendar/events";
      await responseJson(
        await fetch(path, {
          method: editingId ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(eventPayload(form)),
        }),
      );
      await loadEvents();
      setShowEditor(false);
      setEditingId(null);
      setForm(initialEventForm());
      setMessage(editingId ? "Event updated in Google Calendar." : "Event added to Google Calendar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The event was not saved.");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setMessage("");
    try {
      await responseJson(
        await fetch("/api/calendar/disconnect", { method: "POST" }),
      );
      setEvents([]);
      setStatus((current) => ({ configured: current?.configured ?? true, connected: false }));
      setShowEditor(false);
      setMessage("Google Calendar disconnected. Your Google events were not deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Calendar could not be disconnected.");
    } finally {
      setBusy(false);
    }
  };

  const connected = status?.connected === true;
  const configured = status?.configured !== false;

  return (
    <section className="twoColumn calendarLayout" id="calendar" aria-label="Google Calendar and deadlines">
      <article className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Google Calendar</p>
            <h2>{monthLabel}</h2>
          </div>
          {connected ? (
            <button type="button" onClick={() => void refresh()} disabled={busy}>Refresh</button>
          ) : (
            <button type="button" onClick={connect} disabled={busy || !configured}>
              Connect Google Calendar
            </button>
          )}
        </div>

        <div className="calendarConnection" data-connected={connected}>
          <span className="connectionDot" aria-hidden="true" />
          <div>
            <strong>
              {status === null
                ? "Checking calendar connection…"
                : connected
                  ? "Connected to Google Calendar"
                  : configured
                    ? "Ready when you are"
                    : "Google setup is still needed"}
            </strong>
            <p>
              {connected
                ? "Squirrel can view and coordinate events on calendars you own."
                : configured
                  ? "Connect once to see upcoming events and add or adjust plans here."
                  : "The dashboard is built, but the Google client ID and secret still need to be added."}
            </p>
          </div>
        </div>

        <div className="calendarGrid" aria-label={`${monthLabel} calendar`}>
          {[
            "S", "M", "T", "W", "T", "F", "S",
          ].map((day, index) => (
            <span className="weekday" key={`${day}-${index}`}>{day}</span>
          ))}
          {calendarDays.map((day) => (
            <span
              key={day.key}
              className={[
                "calendarDay",
                day.isCurrentMonth ? "" : "mutedMonth",
                day.isToday ? "today" : "",
              ].filter(Boolean).join(" ")}
              aria-current={day.isToday ? "date" : undefined}
            >
              {day.day}
            </span>
          ))}
        </div>

        {connected && (
          <div className="calendarActions">
            <button type="button" onClick={openNewEvent}>Add calendar event</button>
            <button className="quietButton" type="button" onClick={() => void disconnect()} disabled={busy}>
              Disconnect
            </button>
          </div>
        )}
      </article>

      <article className="panel" id="agenda">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Coming Up</p>
            <h2>Schedule & Deadlines</h2>
          </div>
          <span className="countPill">{events.length + deadlines.length}</span>
        </div>

        {message && <p className="calendarMessage" role="status">{message}</p>}

        {showEditor && connected ? (
          <form className="calendarEventForm" onSubmit={saveEvent}>
            <div className="editorHeading">
              <div>
                <p className="eyebrow">{editingId ? "Adjust Event" : "New Event"}</p>
                <h3>{editingId ? "Update this plan gently." : "Give this time a home."}</h3>
              </div>
              <button className="quietButton compactButton" type="button" onClick={() => setShowEditor(false)}>
                Cancel
              </button>
            </div>

            <label className="field fullField">
              <span>Event title</span>
              <input required maxLength={300} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </label>

            <label className="allDayField">
              <input type="checkbox" checked={form.allDay} onChange={(event) => setForm({ ...form, allDay: event.target.checked })} />
              <span>All-day event</span>
            </label>

            <div className="eventTimeGrid">
              <label className="field">
                <span>Date</span>
                <input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
              </label>
              {!form.allDay && (
                <>
                  <label className="field">
                    <span>Starts</span>
                    <input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
                  </label>
                  <label className="field">
                    <span>Ends</span>
                    <input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
                  </label>
                </>
              )}
            </div>

            <label className="field fullField">
              <span>Location <small>optional</small></span>
              <input maxLength={1000} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>

            <label className="field fullField">
              <span>Notes <small>optional</small></span>
              <textarea maxLength={5000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>

            <button className="saveEventButton" type="submit" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Update Google event" : "Add to Google Calendar"}
            </button>
          </form>
        ) : (
          <div className="agendaStack">
            <section>
              <div className="agendaSectionHeading">
                <h3>Calendar Events</h3>
                {connected && <button type="button" onClick={openNewEvent}>+ Add event</button>}
              </div>

              {!connected && (
                <div className="calendarEmptyState">
                  <strong>{configured ? "Your schedule can appear here." : "Calendar setup is almost done."}</strong>
                  <p>{configured ? "Connect Google Calendar to replace sample planning with your real upcoming events." : "Once credentials are added, the Connect button will turn on."}</p>
                  {configured && <button type="button" onClick={connect}>Connect Google Calendar</button>}
                </div>
              )}

              {connected && busy && events.length === 0 && (
                <p className="calendarLoading">Loading your upcoming events…</p>
              )}

              {connected && !busy && events.length === 0 && (
                <div className="calendarEmptyState">
                  <strong>No events in the next 30 days.</strong>
                  <p>That can be breathing room. Add one only if it helps.</p>
                  <button type="button" onClick={openNewEvent}>Add an event</button>
                </div>
              )}

              {events.map((event) => {
                const labels = eventLabels(event);
                return (
                  <div className="agendaItem calendarAgendaItem" key={event.id}>
                    <span>{labels.when}</span>
                    <div>
                      <strong>{event.summary}</strong>
                      <small>{labels.detail}</small>
                    </div>
                    <button className="editEventButton" type="button" onClick={() => openEditEvent(event)}>
                      Edit
                    </button>
                  </div>
                );
              })}
            </section>

            <section>
              <h3>Due Dates & Deadlines</h3>
              {deadlines.map((deadline) => (
                <div className="agendaItem" key={deadline.title}>
                  <span>{deadline.due}</span>
                  <div>
                    <strong>{deadline.title}</strong>
                    <small>{deadline.detail}</small>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </article>
    </section>
  );
}
