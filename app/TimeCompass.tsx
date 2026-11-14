"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarEvent = { id: string; summary: string; allDay: boolean; start: string; end: string };

export function TimeCompass() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => { Promise.all([fetch("/api/calendar/status", { cache: "no-store" }).then((r) => r.json()), fetch("/api/calendar/events", { cache: "no-store" }).then((r) => r.ok ? r.json() : { events: [] })]).then(([status, calendar]) => { setConnected(Boolean(status.connected)); setEvents(calendar.events || []); }).catch(() => undefined); }, []);
  const next = useMemo(() => events.filter((event) => !event.allDay && Date.parse(event.start) > Date.now()).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0], [events]);
  const minutes = next ? Math.max(0, Math.round((Date.parse(next.start) - Date.now()) / 60000)) : null;
  return <section className="timeCompass" aria-label="Next calendar event"><div><p className="eyebrow">Next Calendar Event</p><h2>{next ? next.summary : connected ? "No timed event is coming up." : "Connect your calendar to see your next event here."}</h2></div>{next && <div className="timeCompassDetails"><strong>{minutes! < 60 ? `${minutes} min` : `${Math.floor(minutes! / 60)} hr ${minutes! % 60} min`}</strong><span>until it starts</span><small>Start wrapping up at {new Date(Date.parse(next.start) - 10 * 60000).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small></div>}<a href="#calendar">Open Calendar</a></section>;
}
