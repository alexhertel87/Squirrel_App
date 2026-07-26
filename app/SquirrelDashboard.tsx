"use client";

/* eslint-disable @next/next/no-img-element */
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";

type DisplayMode = "search" | "affirmation" | "fact" | "focus" | "reset" | "checklist";

type SearchRecord = {
  id: string;
  type: string;
  title: string;
  detail: string;
  body: string;
  href: string;
  tags: string[];
  sensitive?: boolean;
};

type CalendarDay = {
  key: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const logoStops = [
  "#ef515e",
  "#e35b84",
  "#d664a7",
  "#c770d4",
  "#a582e6",
  "#7d95e6",
  "#4dade5",
  "#2fbbe4",
];

const tasks = [
  {
    id: "task-1",
    title: "Upload Lecture Notes",
    meta: "Low energy - due today",
    progress: "1/3",
  },
  {
    id: "task-2",
    title: "Email Advisor",
    meta: "Medium energy - due tomorrow",
    progress: "0/2",
  },
  {
    id: "task-3",
    title: "Refill Medication",
    meta: "Low energy - due Friday",
    progress: "2/4",
  },
];

const meds = [
  { name: "Morning Focus Med", dose: "10mg", status: "Taken" },
  { name: "Vitamin D", dose: "2000 IU", status: "Later" },
  { name: "Sleep Support", dose: "5mg", status: "Tonight" },
];

const events = [
  { time: "10:30 AM", title: "Therapy Check-In", detail: "Calendar event" },
  { time: "2:00 PM", title: "Chemistry Study Block", detail: "Focus reminder" },
];

const deadlines = [
  { due: "Today", title: "Upload Lecture Notes", detail: "Course documents" },
  { due: "Thu", title: "Statistics Problem Set", detail: "Homework planner" },
  { due: "Fri", title: "Medication Refill", detail: "Reminder" },
];

const searchRecords: SearchRecord[] = [
  {
    id: "dose-2025",
    type: "Medication",
    title: "Dosage: 10mg",
    detail: "Morning Focus Med - logged last spring",
    body: "Dose was adjusted to 10mg with notes about appetite, sleep, and afternoon focus.",
    href: "#meds",
    tags: ["dosage", "dose", "medication", "10mg", "focus"],
  },
  {
    id: "deadline-statistics",
    type: "Deadline",
    title: "Statistics Problem Set",
    detail: "Due Thursday in Course Planner",
    body: "Break into reading, problem draft, formula check, and submit.",
    href: "#agenda",
    tags: ["deadline", "homework", "statistics", "planner"],
  },
  {
    id: "lecture-files",
    type: "Document",
    title: "Chemistry Lecture Slides",
    detail: "Spring 2026 - Chemistry",
    body: "Uploaded lecture materials sorted by course, semester, and year.",
    href: "#school",
    tags: ["lecture", "slides", "school", "chemistry", "documents"],
  },
  {
    id: "task-reset",
    type: "Routine",
    title: "Reset Routine",
    detail: "Water, breathe, pick next task",
    body: "Use this routine when there are too many choices on the dashboard.",
    href: "#reset",
    tags: ["breathe", "reset", "task", "routine"],
  },
  {
    id: "sensitive-demo",
    type: "Hidden",
    title: "Private Financial Identifier",
    detail: "This item is intentionally excluded from search.",
    body: "Routing and account numbers should not appear in the indexed results.",
    href: "#",
    tags: ["private"],
    sensitive: true,
  },
];

const factText: Record<string, string> = {
  Science:
    "Sleep helps the brain consolidate new memories, which is one reason a review session works better after rest.",
  Politics:
    "Ranked-choice voting lets voters rank candidates by preference instead of choosing only one.",
  "World History":
    "The Silk Road was not one road, but a network of trade routes linking many regions.",
  "Ancient History":
    "Ancient libraries often worked as knowledge hubs for mathematics, astronomy, law, and literature.",
  Technology:
    "Search works best when it stores structured fields plus plain-language notes.",
  Psychology:
    "External reminders reduce working-memory load, which can make follow-through feel less effortful.",
};

const affirmations = [
  "You do not have to hold the whole day in your head.",
  "Visible beats perfect. Pick the next clear step.",
  "A tiny start is still a real start.",
];

const checklist = ["Drink Water", "Check Calendar", "Pick Next Task", "Open Notes"];

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildCalendarDays(anchor: Date): CalendarDay[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const todayKey = formatDateKey(anchor);
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      key: formatDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: formatDateKey(date) === todayKey,
    };
  });
}

function matchesRecord(record: SearchRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return false;

  const haystack = [
    record.type,
    record.title,
    record.detail,
    record.body,
    ...record.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(normalizedQuery)) return true;

  return normalizedQuery
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2)
    .some((token) => haystack.includes(token));
}

export function SquirrelDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [factTopics, setFactTopics] = useState(Object.keys(factText));
  const [factTopic, setFactTopic] = useState("Science");
  const [customTopic, setCustomTopic] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState(tasks[0].id);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const updateNow = () => setNow(new Date());

    updateNow();
    const timer = window.setInterval(updateNow, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    document.body.classList.toggle("theme-contrast", highContrast);
    document.body.classList.toggle("reduce-motion", reducedMotion);

    return () => {
      document.body.classList.remove("theme-dark", "theme-contrast", "reduce-motion");
    };
  }, [darkMode, highContrast, reducedMotion]);

  const currentTask = tasks.find((task) => task.id === currentTaskId) ?? tasks[0];
  const calendarDays = useMemo(() => (now ? buildCalendarDays(now) : []), [now]);
  const monthLabel = now
    ? now.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "This Month";
  const todayLabel = now
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Loading Local Date";
  const timeLabel = now
    ? now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "Loading Local Time";

  const searchableRecords = useMemo(
    () => searchRecords.filter((record) => !record.sensitive),
    [],
  );
  const searchResults = searchableRecords.filter((record) => matchesRecord(record, searchQuery));
  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const seeds = new Set<string>();

    searchableRecords.forEach((record) => {
      record.tags.forEach((tag) => seeds.add(tag));
      seeds.add(record.title);
    });

    return Array.from(seeds)
      .filter((item) => !query || item.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchQuery, searchableRecords]);

  const addTopic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTopic = customTopic.trim();
    if (!nextTopic) return;

    setFactTopics((topics) => (topics.includes(nextTopic) ? topics : [...topics, nextTopic]));
    setFactTopic(nextTopic);
    setCustomTopic("");
  };

  const fact =
    factText[factTopic] ??
    `${factTopic} is now saved as a preferred topic. A live version can pull fresh facts from approved sources.`;

  return (
    <main
      className="appFrame"
      style={{ "--logo-gradient": `linear-gradient(90deg, ${logoStops.join(", ")})` } as CSSProperties}
    >
      <header className="topBar">
        <a className="brand" href="#dashboard" aria-label="Squirrel dashboard home">
          <img src="/squirrel_logo.png" alt="" className="brandLogo" />
          <span className="brandName">Squirrel!</span>
        </a>

        <nav className="appNav" aria-label="Main navigation">
          <a href="#dashboard" className="active">Dashboard</a>
          <a href="#calendar">Calendar</a>
          <a href="#school">School</a>
          <a href="#settings">Sensory</a>
        </nav>

        <button className="loginButton" type="button">Demo Mode</button>
      </header>

      <div className="dashboardShell" id="dashboard">
        <section className="dashboardContent" aria-label="Squirrel dashboard preview">
          <section className="heroPanel">
            <div>
              <p className="eyebrow">Gentle daily support</p>
              <h1>Start with the next kind thing.</h1>
              <p>
                Meds, routines, school, tasks, and reminders in one calmer place,
                with search and sensory controls close at hand.
              </p>
            </div>

            <div className="heroActions">
              <button type="button">New Medication</button>
              <button type="button">Add A New Task</button>
            </div>
          </section>

          <section className="summaryGrid" aria-label="Today summary">
            <article className="summaryCard">
              <span>Medication</span>
              <strong>2 of 3</strong>
              <p>checked in today</p>
            </article>
            <article className="summaryCard">
              <span>Tasks</span>
              <strong>5</strong>
              <p>waiting without judgment</p>
            </article>
            <article className="summaryCard">
              <span>Today</span>
              <strong>{todayLabel}</strong>
              <p>{timeLabel} local time</p>
            </article>
            <article className="summaryCard">
              <span>Calendar</span>
              <strong>Sync</strong>
              <p>Google, Outlook, and Apple calendar exports.</p>
            </article>
          </section>

          <section className="currentTaskBanner" aria-label="Current task">
            <div>
              <p className="eyebrow">Current Task</p>
              <strong>{currentTask.title}</strong>
              <span>{currentTask.meta}</span>
            </div>
            <label>
              <span className="visuallyHidden">Choose current task</span>
              <select value={currentTaskId} onChange={(event) => setCurrentTaskId(event.target.value)}>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </label>
          </section>

          <section className="twoColumn calendarLayout" id="calendar" aria-label="Calendar and deadlines">
            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Calendar</p>
                  <h2>{monthLabel}</h2>
                </div>
                <button type="button">Sync</button>
              </div>

              <div className="calendarGrid" aria-label={`${monthLabel} calendar`}>
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
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
            </article>

            <article className="panel" id="agenda">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Today</p>
                  <h2>Schedule & Deadlines</h2>
                </div>
                <span className="countPill">{events.length + deadlines.length}</span>
              </div>

              <div className="agendaStack">
                <section>
                  <h3>Calendar Events</h3>
                  {events.map((event) => (
                    <div className="agendaItem" key={event.title}>
                      <span>{event.time}</span>
                      <div>
                        <strong>{event.title}</strong>
                        <small>{event.detail}</small>
                      </div>
                    </div>
                  ))}
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
            </article>
          </section>

          <section className="twoColumn" aria-label="Medication and tasks">
            <article className="panel" id="meds">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Meds Check-In</p>
                  <h2>Memory support, not pressure</h2>
                </div>
                <button type="button">Manage</button>
              </div>

              <div className="listStack">
                {meds.map((med) => (
                  <div className="listItem" key={med.name}>
                    <div>
                      <strong>{med.name}</strong>
                      <small>{med.dose}</small>
                    </div>
                    <span>{med.status}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Start Here</p>
                  <h2>Low-friction next tasks</h2>
                </div>
                <button type="button">Details</button>
              </div>

              <div className="listStack">
                {tasks.map((task) => (
                  <button
                    className={`taskButton ${task.id === currentTaskId ? "selected" : ""}`}
                    key={task.id}
                    onClick={() => setCurrentTaskId(task.id)}
                    type="button"
                  >
                    <span>
                      <strong>{task.title}</strong>
                      <small>{task.meta}</small>
                    </span>
                    <em>{task.progress}</em>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section className="panel schoolPanel" id="school" aria-label="School and documents">
            <div>
              <p className="eyebrow">School & Documents</p>
              <h2>One calm home for classes, documents, and deadlines.</h2>
              <p>
                Keep courses, lecture files, syllabi, assignments, and deadlines in one
                organized place without turning school into a scavenger hunt.
              </p>
            </div>

            <div className="schoolGrid">
              <div>
                <span>Course</span>
                <strong>Chemistry 201</strong>
                <small>Spring 2026</small>
              </div>
              <div>
                <span>Repository</span>
                <strong>Lecture Slides</strong>
                <small>Sorted by course, semester, and year</small>
              </div>
              <div>
                <span>Planner</span>
                <strong>3 Assignments</strong>
                <small>Upcoming homework and exam prep</small>
              </div>
            </div>

            <div className="schoolActions">
              <button type="button">Upload Document</button>
              <button type="button">Add Class</button>
              <button type="button">Add Assignment</button>
            </div>
          </section>

          <section className="settingsPanel" id="settings" aria-label="Sensory-friendly settings">
            <div>
              <p className="eyebrow">Sensory-Friendly Settings</p>
              <h2>Adjust the display without leaving the dashboard.</h2>
            </div>

            <div className="settingsGrid">
              <label>
                <input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} />
                <span>Dark Mode</span>
              </label>
              <label>
                <input type="checkbox" checked={highContrast} onChange={(event) => setHighContrast(event.target.checked)} />
                <span>Higher Contrast</span>
              </label>
              <label>
                <input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
                <span>Reduce Motion</span>
              </label>
            </div>
          </section>
        </section>

        <aside className="sidebox" aria-label="Pinned side display">
          <div className="sideboxHeader">
            <p className="eyebrow">Display</p>
            <h2>Sidebox</h2>
            <p>Keep one helpful tool pinned here while the rest of the dashboard scrolls.</p>
          </div>

          <label className="field">
            <span>Show</span>
            <select value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}>
              <option value="search">Search</option>
              <option value="affirmation">Daily Affirmation</option>
              <option value="fact">Daily Fact</option>
              <option value="focus">Focus Prompt</option>
              <option value="reset">Quick Reset</option>
              <option value="checklist">Gentle Checklist</option>
            </select>
          </label>

          {displayMode === "search" && (
            <section className="sideboxMode">
              <label className="field">
                <span>Search Squirrel</span>
                <input
                  list="search-suggestions"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Ask "What dosage was I on last year?"'
                  type="search"
                  value={searchQuery}
                />
              </label>
              <datalist id="search-suggestions">
                {searchSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>

              <div className="suggestions" aria-label="Search suggestions">
                {searchSuggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => setSearchQuery(suggestion)} type="button">
                    {suggestion}
                  </button>
                ))}
              </div>

              <p className="privacyNote">
                Sensitive financial identifiers, account numbers, routing numbers, tokens,
                and internal IDs are excluded from the search index.
              </p>

              <div className="searchResults">
                {searchQuery.trim() && searchResults.length === 0 && (
                  <p className="emptyResult">No matches yet. Try dosage, deadline, lecture, or routine.</p>
                )}
                {!searchQuery.trim() && (
                  <p className="emptyResult">Start typing to search across notes, reminders, tasks, and documents.</p>
                )}
                {searchResults.map((result) => (
                  <a className="searchResult" href={result.href} key={result.id}>
                    <span>{result.type}</span>
                    <strong>{result.title}</strong>
                    <small>{result.detail}</small>
                    <p>{result.body}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {displayMode === "affirmation" && (
            <section className="sideCard">
              <span>Today</span>
              <strong>{affirmations[(now?.getDate() ?? 0) % affirmations.length]}</strong>
              <p>Short, steady language for the moment before action.</p>
            </section>
          )}

          {displayMode === "fact" && (
            <section className="sideboxMode">
              <label className="field">
                <span>Fact Topic</span>
                <select value={factTopic} onChange={(event) => setFactTopic(event.target.value)}>
                  {factTopics.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </label>

              <form className="topicForm" onSubmit={addTopic}>
                <input
                  aria-label="Add preferred fact topic"
                  onChange={(event) => setCustomTopic(event.target.value)}
                  placeholder="Add topic"
                  value={customTopic}
                />
                <button type="submit">Add Topic</button>
              </form>

              <section className="sideCard">
                <span>{factTopic}</span>
                <strong>{fact}</strong>
                <p>Topic preferences are saved in this preview session.</p>
              </section>
            </section>
          )}

          {displayMode === "focus" && (
            <section className="sideCard">
              <span>Focus Prompt</span>
              <strong>{currentTask.title}</strong>
              <p>What is the smallest visible action you can take on this in the next two minutes?</p>
              <button type="button">Start Timer</button>
            </section>
          )}

          {displayMode === "reset" && (
            <section className="sideCard" id="reset">
              <span>Quick Reset</span>
              <strong>Pick one gentle reset.</strong>
              <p>Use this when the dashboard starts feeling like too many choices at once.</p>
              <div className="sideActions">
                <button type="button">Breathe</button>
                <button type="button">Pick Next Task</button>
                <button type="button">Open Calendar</button>
              </div>
            </section>
          )}

          {displayMode === "checklist" && (
            <section className="sideCard">
              <span>Gentle Checklist</span>
              <strong>A short visible anchor.</strong>
              <div className="checklist">
                {checklist.map((item) => (
                  <label key={item}>
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
