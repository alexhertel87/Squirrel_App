"use client";

/* eslint-disable @next/next/no-img-element */
import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { GoogleCalendarIntegration } from "./GoogleCalendarIntegration";
import { AccountMenu, ProfilePreferences } from "./AccountMenu";
import { SchoolWorkspace } from "./SchoolWorkspace";
import { DashboardTools } from "./DashboardTools";
import { AttentionDeck } from "./AttentionDeck";
import type { ChatGPTUser } from "./chatgpt-auth";

type DisplayMode = "now" | "search" | "affirmation" | "fact" | "tip" | "focus" | "reset" | "checklist";
type TipCategory = "daily" | "momentum" | "rsd" | "rest";

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

const adhdTips: Record<TipCategory, { title: string; body: string; nudge: string }[]> = {
  daily: [
    { title: "Put the finish line where you can see it.", body: "Define what 'done enough' looks like before starting. An open-ended task is an invitation for the brain to wander.", nudge: "Write one sentence that begins: Done means…" },
    { title: "Do the embarrassingly easy part first.", body: "One tiny finished thing can make the next thing easier to start. This is not cheating. There is no productivity police.", nudge: "Do the two-minute piece first." },
    { title: "Make the reminder impossible to admire and ignore.", body: "Put the needed object in the path of your future self—by the door, on the keyboard, or beside the coffee.", nudge: "Move one reminder into your path." },
  ],
  momentum: [
    { title: "Shrink it until your brain stops arguing.", body: "If the task still feels heavy, the first step is still too large. 'Open the document' is a legitimate task.", nudge: "Name a step that takes under two minutes." },
    { title: "Borrow another person’s ability to stay in one place.", body: "Work near someone, keep a video call open, or put on a quiet work stream. Their presence can make wandering off slightly less tempting.", nudge: "Invite someone or start a quiet work session." },
    { title: "Race the kettle, not the whole project.", body: "A short playful sprint can bypass the pressure of committing to a massive work block.", nudge: "Set a seven-minute timer and see what happens." },
  ],
  rsd: [
    { title: "A feeling can be loud without being a verdict.", body: "Rejection sensitivity can make uncertainty feel like proof. Pause before turning a delayed reply or neutral tone into a story about your worth.", nudge: "List two explanations that are not about you." },
    { title: "Regulate first; interpret later.", body: "When the emotional alarm is blaring, analysis usually gets harsher. Give your nervous system ten minutes before rereading the message.", nudge: "Step away, breathe out longer than in, then return." },
    { title: "Ask for the missing information.", body: "A clear, low-stakes question is kinder than making yourself solve ambiguity alone.", nudge: "Try: 'Could you clarify what you’d like changed?'" },
  ],
  rest: [
    { title: "Zoning out can be the treat.", body: "You are allowed to let your brain idle on purpose. Rest does not need to become optimized, educational, or secretly productive.", nudge: "Take ten guilt-free minutes with no improvement goal." },
    { title: "A raccoon break still counts as recovery.", body: "Snack, stare out the window, inspect a shiny object, or lie on the floor. The method can be silly if it helps your system settle.", nudge: "Pick the least impressive form of rest you want." },
    { title: "Stop before empty when you can.", body: "Rest is easier to use when it arrives before total depletion. You do not have to earn the break by becoming nonfunctional.", nudge: "Schedule a pause while you still have 20% left." },
  ],
};

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

export function SquirrelDashboard({ initialUser, signOutPath }: { initialUser: ChatGPTUser; signOutPath: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("now");
  const [searchQuery, setSearchQuery] = useState("");
  const [factTopics, setFactTopics] = useState(Object.keys(factText));
  const [factTopic, setFactTopic] = useState("Science");
  const [customTopic, setCustomTopic] = useState("");
  const [currentTaskId, setCurrentTaskId] = useState(tasks[0].id);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tipCategory, setTipCategory] = useState<TipCategory>("daily");

  const applyPreferences = useCallback((preferences: ProfilePreferences) => {
    setDarkMode(preferences.darkMode);
    setHighContrast(preferences.highContrast);
    setReducedMotion(preferences.reducedMotion);
  }, []);

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
        <a className="brand" href="/dashboard" aria-label="Squirrel! dashboard home">
          <img src="/squirrel_logo.png" alt="" className="brandLogo" />
          <span className="brandName">Squirrel!</span>
        </a>

        <nav className="appNav" aria-label="Main navigation">
          <a href="#dashboard" className="active">Dashboard</a>
          <a href="#calendar">Calendar</a>
          <a href="#school">School</a>
          <a href="#settings">Sensory</a>
        </nav>

        <AccountMenu user={initialUser} signOutPath={signOutPath} preferences={{ darkMode, highContrast, reducedMotion }} onPreferences={applyPreferences} />
      </header>

      <div className="dashboardShell" id="dashboard">
        <section className="dashboardContent" aria-label="Squirrel! dashboard preview">
          <section className="heroPanel">
            <div>
              <h1>Acorns first. Side quest later.</h1>
              <p className="heroSubtagline">Because “I’ll remember” is how we got here.</p>
              <p>
                Meds, classes, tasks, and the thoughts that vanish somewhere between the couch
                and the kitchen. Squirrel! keeps track so you don’t have to.
              </p>
            </div>

            <div className="heroActions">
              <button type="button">New Medication</button>
              <button type="button">Add A New Task</button>
            </div>
          </section>

          <section className="tabStatusCallout" aria-label="Squirrel! brain status">
            <span className="tabStatusChrome" aria-hidden="true"><i /><i /><i /></span>
            <p>For brains running 27 tabs, zero memory, and one song on repeat you’ll never find.</p>
            <strong>You bring the genius, Squirrel! handles the rest.</strong>
          </section>

          <DashboardTools />

          <AttentionDeck />

          <section className="summaryGrid" aria-label="Today summary">
            <article className="summaryCard">
              <span>Medication</span>
              <strong>2 of 3</strong>
              <p>checked in today</p>
            </article>
            <article className="summaryCard">
              <span>Tasks</span>
              <strong>5</strong>
              <p>currently plotting against your free time</p>
            </article>
            <article className="summaryCard">
              <span>Today</span>
              <strong>{todayLabel}</strong>
              <p>{timeLabel} local time</p>
            </article>
            <article className="summaryCard">
              <span>Calendar</span>
              <strong>Google</strong>
              <p>Make and move plans without opening another tiny browser tab.</p>
            </article>
          </section>

          <GoogleCalendarIntegration
            monthLabel={monthLabel}
            calendarDays={calendarDays}
            deadlines={deadlines}
          />

          <section className="twoColumn" aria-label="Medication and tasks">
            <article className="panel" id="meds">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Meds Check-In</p>
                  <h2>Did you take it, or merely think about taking it?</h2>
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
                  <h2>Things Future You would like handled</h2>
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

          <SchoolWorkspace />

          <section className="settingsPanel" id="settings" aria-label="Display settings">
            <div>
              <p className="eyebrow">Make it stop yelling</p>
              <h2>Adjust the dashboard until your eyeballs stop filing complaints.</h2>
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
            <p className="eyebrow">Useful little corner</p>
            <h2>Sidebox</h2>
            <p>Pin one thing here so the rest of the dashboard can mind its business.</p>
          </div>

          <label className="field">
            <span>Show</span>
            <select value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}>
              <option value="now">Now / Next</option>
              <option value="search">Search</option>
              <option value="affirmation">Daily Affirmation</option>
              <option value="fact">Daily Fact</option>
              <option value="tip">ADHD & RSD Tips</option>
              <option value="focus">Focus Prompt</option>
              <option value="reset">Quick Reset</option>
              <option value="checklist">Four-item checklist</option>
            </select>
          </label>

          {displayMode === "now" && (
            <section className="sideCard nowNextCard">
              <span>Now / Next</span>
              <strong>{currentTask.title}</strong>
              <p>{currentTask.meta}. If that feels like too much, use “Give me something easier” in the Do This Next card.</p>
              <div className="nowNextSteps"><small>Now</small><p>Make one visible move.</p><small>Then</small><p>Check the calendar before choosing another acorn.</p></div>
            </section>
          )}

          {displayMode === "search" && (
            <section className="sideboxMode">
              <label className="field">
                <span>Search Squirrel!</span>
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
                  <p className="emptyResult">Nothing. Either it wandered off or the search term needs fewer syllables.</p>
                )}
                {!searchQuery.trim() && (
                  <p className="emptyResult">Type what you remember. Squirrel! can handle the part where you forgot where you put it.</p>
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
              <p>For when your internal narrator needs to take a union-mandated break.</p>
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
                <p>A tiny fact break. Educational procrastination, but with boundaries.</p>
              </section>
            </section>
          )}

          {displayMode === "tip" && (
            <section className="sideboxMode">
              <label className="field">
                <span>What would help?</span>
                <select value={tipCategory} onChange={(event) => setTipCategory(event.target.value as TipCategory)}>
                  <option value="daily">Daily mix</option>
                  <option value="momentum">Getting unstuck</option>
                  <option value="rsd">RSD recovery</option>
                  <option value="rest">Rest & zoning out</option>
                </select>
              </label>
              {(() => {
                const tips = adhdTips[tipCategory];
                const tip = tips[(now?.getDate() ?? 0) % tips.length];
                return <section className="sideCard tipCard"><span>{tipCategory === "daily" ? "Today’s brain-friendly tip" : tipCategory}</span><strong>{tip.title}</strong><p>{tip.body}</p><div className="tipNudge"><small>Try this</small><p>{tip.nudge}</p></div></section>;
              })()}
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
              <strong>Too many tabs, but in your skull.</strong>
              <p>Pick one reset. We are not turning recovery into another project.</p>
              <div className="sideActions">
                <button type="button">Breathe</button>
                <button type="button">Pick Next Task</button>
                <button type="button">Open Calendar</button>
              </div>
            </section>
          )}

          {displayMode === "checklist" && (
            <section className="sideCard">
              <span>Four-item checklist</span>
              <strong>Four things. No heroic montage required.</strong>
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
