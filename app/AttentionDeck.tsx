"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Assignment = { id: string; courseId: string; title: string; dueAt: string | null; status: string };
type Course = { id: string; name: string; code: string | null };
type CalendarEvent = { id: string; summary: string; allDay: boolean; start: string; end: string };
type SyllabusSuggestion = { id: string; fileName: string; courseId: string; courseName: string; courseCode: string; title: string; dueAt: string; excerpt: string };
type AttentionItem = { id: string; kind: "late" | "today" | "tomorrow" | "soon" | "conflict"; title: string; detail: string; href: string };

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function relativeLabel(date: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} late`;
  if (days === 0) return `today at ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  if (days === 1) return `tomorrow at ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Squirrel! could not check what is coming up.");
  return body;
}

export function AttentionDeck() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SyllabusSuggestion[]>([]);
  const [scanning, setScanning] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      const academic = await readJson<{ assignments: Assignment[]; courses: Course[] }>(await fetch("/api/academic", { cache: "no-store" }));
      setAssignments(academic.assignments); setCourses(academic.courses);
      const status = await readJson<{ connected: boolean }>(await fetch("/api/calendar/status", { cache: "no-store" }));
      setCalendarConnected(status.connected);
      if (status.connected) {
        const calendar = await readJson<{ events: CalendarEvent[] }>(await fetch("/api/calendar/events", { cache: "no-store" }));
        setEvents(calendar.events);
      } else setEvents([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Squirrel! could not check what is coming up.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const attention = useMemo(() => {
    const now = new Date();
    const today = dateKey(now);
    const tomorrow = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const courseMap = new Map(courses.map((course) => [course.id, course]));
    const items: AttentionItem[] = [];

    for (const assignment of assignments) {
      if (!assignment.dueAt || assignment.status === "complete") continue;
      const due = new Date(assignment.dueAt);
      if (!Number.isFinite(due.getTime()) || (due.getTime() - now.getTime()) / 86400000 > 7) continue;
      const key = dateKey(due);
      const kind = due < now ? "late" : key === today ? "today" : key === tomorrow ? "tomorrow" : "soon";
      const course = courseMap.get(assignment.courseId);
      items.push({ id: `assignment:${assignment.id}`, kind, title: assignment.title, detail: `${course?.code || course?.name || "Course"} · ${relativeLabel(due, now)}`, href: "#school" });
    }

    for (const event of events) {
      const start = new Date(event.allDay ? `${event.start}T12:00:00` : event.start);
      if (!Number.isFinite(start.getTime()) || start.getTime() - now.getTime() > 48 * 60 * 60 * 1000) continue;
      const key = dateKey(start);
      const kind = key === today ? "today" : key === tomorrow ? "tomorrow" : "soon";
      items.push({ id: `event:${event.id}`, kind, title: event.summary, detail: event.allDay ? `${key === today ? "Today" : "Tomorrow"} · all day` : relativeLabel(start, now), href: "#calendar" });
    }

    const timed = events.filter((event) => !event.allDay).map((event) => ({ ...event, startMs: Date.parse(event.start), endMs: Date.parse(event.end) })).filter((event) => Number.isFinite(event.startMs) && Number.isFinite(event.endMs));
    for (let left = 0; left < timed.length; left += 1) {
      for (let right = left + 1; right < timed.length; right += 1) {
        const a = timed[left]; const b = timed[right];
        if (a.startMs < b.endMs && b.startMs < a.endMs) {
          const start = new Date(Math.max(a.startMs, b.startMs));
          items.push({ id: `conflict:${a.id}:${b.id}`, kind: "conflict", title: `Don’t double-book: ${a.summary} overlaps ${b.summary}`, detail: start.toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" }), href: "#calendar" });
        }
      }
    }

    const order = { conflict: 0, late: 1, today: 2, tomorrow: 3, soon: 4 };
    return items.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 10);
  }, [assignments, courses, events]);

  const scanSyllabi = async () => {
    setScanning(true); setMessage("");
    try {
      const result = await readJson<{ suggestions: SyllabusSuggestion[]; filesScanned: number }>(await fetch("/api/academic/syllabus-suggestions", { cache: "no-store" }));
      setSuggestions(result.suggestions); setSyllabusOpen(true);
      if (!result.filesScanned) setMessage("No syllabus files found yet. Upload one in School & Documents, then try again.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The syllabus scan did not finish."); }
    finally { setScanning(false); }
  };

  const addSuggestion = async (suggestion: SyllabusSuggestion) => {
    setMessage("");
    try {
      await readJson(await fetch("/api/academic", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource: "assignment", courseId: suggestion.courseId, title: suggestion.title, dueAt: suggestion.dueAt, status: "not_started", notes: `Suggested from ${suggestion.fileName}; date reviewed before saving.` }) }));
      setSuggestions((current) => current.filter((item) => item.id !== suggestion.id));
      setMessage("Added to assignments. Squirrel! is officially on the hook for remembering it.");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "That deadline could not be added."); }
  };

  const counts = {
    today: attention.filter((item) => item.kind === "today" || item.kind === "late").length,
    soon: attention.filter((item) => item.kind === "tomorrow" || item.kind === "soon").length,
    conflicts: attention.filter((item) => item.kind === "conflict").length,
  };

  return <section className="attentionDeck" aria-label="Deadlines and calendar warnings">
    <header className="attentionHeader"><div><p className="eyebrow">Don’t Forget</p><h2>Things already sneaking up on you</h2><p>Assignments and calendar plans, sorted by how loudly they should be waving.</p></div><div className="attentionActions"><button className="quietButton" type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Checking…" : "Check again"}</button><button type="button" onClick={() => void scanSyllabi()} disabled={scanning}>{scanning ? "Scanning…" : "Scan syllabus files"}</button></div></header>
    <div className="attentionCounts"><article><span>Today or late</span><strong>{counts.today}</strong></article><article><span>Next seven days</span><strong>{counts.soon}</strong></article><article data-alert={counts.conflicts > 0}><span>Calendar collisions</span><strong>{counts.conflicts}</strong></article></div>
    {!calendarConnected && <p className="attentionNote">Google Calendar is not connected, so Squirrel! is only watching your course assignments right now.</p>}
    {message && <p className="brainMessage" role="status">{message}</p>}
    {!loading && attention.length === 0 ? <div className="attentionEmpty"><strong>Nothing urgent. Suspicious. Enjoy it.</strong><p>Add assignment due dates or connect Google Calendar and Squirrel! will start watching the clock.</p></div> : <div className="attentionList">{attention.map((item) => <a href={item.href} className="attentionItem" data-kind={item.kind} key={item.id}><span>{item.kind === "late" ? "Late" : item.kind === "today" ? "Today" : item.kind === "tomorrow" ? "Tomorrow" : item.kind === "conflict" ? "Conflict" : "Soon"}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><em>Open →</em></a>)}</div>}
    {syllabusOpen && <div className="modalBackdrop" role="presentation"><section className="syllabusModal" role="dialog" aria-modal="true" aria-label="Review syllabus deadlines"><div className="modalHeading"><div><p className="eyebrow">Trust, but verify the PDF</p><h2>Possible syllabus deadlines</h2><p>Review every title and date before adding it. Syllabi enjoy creative formatting and should not be trusted unsupervised.</p></div><button className="iconButton" type="button" onClick={() => setSyllabusOpen(false)}>×</button></div>{suggestions.length === 0 ? <div className="attentionEmpty"><strong>No deadline suggestions found.</strong><p>Text-based PDF and PowerPoint syllabi work best. Scanned PDFs will need OCR later.</p></div> : <div className="syllabusSuggestions">{suggestions.map((suggestion) => <article key={suggestion.id}><div><span>{suggestion.courseCode || suggestion.courseName}</span><input aria-label="Deadline title" value={suggestion.title} onChange={(event) => setSuggestions((current) => current.map((item) => item.id === suggestion.id ? { ...item, title: event.target.value } : item))} /><input aria-label="Deadline date and time" type="datetime-local" value={suggestion.dueAt} onChange={(event) => setSuggestions((current) => current.map((item) => item.id === suggestion.id ? { ...item, dueAt: event.target.value } : item))} /><small>{suggestion.excerpt}</small></div><div><button type="button" onClick={() => void addSuggestion(suggestion)}>Add assignment</button><button className="quietButton" type="button" onClick={() => setSuggestions((current) => current.filter((item) => item.id !== suggestion.id))}>Ignore</button></div></article>)}</div>}</section></div>}
  </section>;
}
