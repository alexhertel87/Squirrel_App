"use client";

/* eslint-disable @next/next/no-img-element */
import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, GraduationCap, Headphones, Home, Search, X } from "lucide-react";
import { GoogleCalendarIntegration } from "./GoogleCalendarIntegration";
import { AccountMenu, ProfilePreferences } from "./AccountMenu";
import { SchoolWorkspace } from "./SchoolWorkspace";
import { DashboardTools } from "./DashboardTools";
import { AttentionDeck } from "./AttentionDeck";
import { DailyCalibration } from "./DailyCalibration";
import { MedicationHub } from "./MedicationHub";
import { OutcomeInsights } from "./OutcomeInsights";
import { TimeCompass } from "./TimeCompass";
import { BreathingGuide } from "./BreathingGuide";
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

const defaultSearchSuggestions = ["task", "deadline", "medication", "dose", "lecture", "reminder"];

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
    { title: "Define what finished means before you start.", body: "A clear endpoint makes it easier to begin and know when to stop.", nudge: "Write one sentence that begins: This is finished when…" },
    { title: "Complete the easiest part first.", body: "Finishing one small step can make the next step easier to start.", nudge: "Choose a step that takes two minutes." },
    { title: "Put reminders where you will see them.", body: "Place the needed object by the door, on your keyboard, or beside something you use every day.", nudge: "Move one reminder into your normal path." },
  ],
  momentum: [
    { title: "Make the first step smaller.", body: "If the task still feels difficult to start, choose a smaller action. Opening the document counts as a step.", nudge: "Name a step that takes under two minutes." },
    { title: "Work quietly with another person.", body: "Working near someone or staying on a quiet call can make it easier to remain with a task.", nudge: "Invite someone or start a shared focus session." },
    { title: "Use a short work period.", body: "A short timer can make starting feel more manageable than committing to the whole project.", nudge: "Set a seven-minute timer." },
  ],
  rsd: [
    { title: "A strong feeling is not proof.", body: "Rejection sensitivity can make uncertainty feel certain. Pause before deciding what a delayed reply or neutral tone means.", nudge: "List two explanations that are not about you." },
    { title: "Calm down before interpreting the message.", body: "Strong emotions can make a message seem harsher. Wait ten minutes before reading it again.", nudge: "Step away, breathe out longer than in, then return." },
    { title: "Ask for the missing information.", body: "A clear, low-stakes question is kinder than making yourself solve ambiguity alone.", nudge: "Try: 'Could you clarify what you’d like changed?'" },
  ],
  rest: [
    { title: "Rest does not need to be productive.", body: "You may take a quiet break without learning, improving, or completing anything.", nudge: "Take ten minutes with no improvement goal." },
    { title: "Choose the kind of break that helps you settle.", body: "Have a snack, look out the window, lie down, or sit quietly. A simple break still counts as rest.", nudge: "Choose one comfortable way to rest." },
    { title: "Take a break before you are completely exhausted.", body: "A planned pause can help you recover before your energy is gone.", nudge: "Schedule a short break before your energy runs out." },
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

export function SquirrelDashboard({ initialUser, signOutPath }: { initialUser: ChatGPTUser; signOutPath: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("now");
  const [searchQuery, setSearchQuery] = useState("");
  const [factTopics, setFactTopics] = useState(Object.keys(factText));
  const [factTopic, setFactTopic] = useState("Science");
  const [customTopic, setCustomTopic] = useState("");
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [density, setDensity] = useState<ProfilePreferences["density"]>("comfortable");
  const [textScale, setTextScale] = useState<ProfilePreferences["textScale"]>("medium");
  const [colorIntensity, setColorIntensity] = useState<ProfilePreferences["colorIntensity"]>("soft");
  const [notificationMode, setNotificationMode] = useState<ProfilePreferences["notificationMode"]>("gentle");
  const [humorLevel, setHumorLevel] = useState<ProfilePreferences["humorLevel"]>("full");
  const [timerDirection, setTimerDirection] = useState<ProfilePreferences["timerDirection"]>("down");
  const [liveSearchResults, setLiveSearchResults] = useState<SearchRecord[]>([]);
  const [liveSearchSuggestions, setLiveSearchSuggestions] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tipCategory, setTipCategory] = useState<TipCategory>("daily");
  const [sideboxOpen, setSideboxOpen] = useState(false);

  const applyPreferences = useCallback((preferences: ProfilePreferences) => {
    setDarkMode(preferences.darkMode);
    setHighContrast(preferences.highContrast);
    setReducedMotion(preferences.reducedMotion);
    setDensity(preferences.density);
    setTextScale(preferences.textScale);
    setColorIntensity(preferences.colorIntensity);
    setNotificationMode(preferences.notificationMode);
    setHumorLevel(preferences.humorLevel);
    setTimerDirection(preferences.timerDirection);
  }, []);

  const saveQuickPreferences = (patch: Partial<ProfilePreferences>) => {
    fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) }).catch(() => undefined);
  };

  const scrollToCapture = () => {
    document.querySelector<HTMLElement>("#get-squirrelly")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    window.setTimeout(() => document.querySelector<HTMLInputElement>("#squirrelly-capture")?.focus(), reducedMotion ? 0 : 450);
  };

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
    document.body.dataset.density = density;
    document.body.dataset.textScale = textScale;
    document.body.dataset.colorIntensity = colorIntensity;
    document.body.dataset.notificationMode = notificationMode;
    document.body.dataset.humorLevel = humorLevel;
    document.body.dataset.timerDirection = timerDirection;

    return () => {
      document.body.classList.remove("theme-dark", "theme-contrast", "reduce-motion");
      delete document.body.dataset.density;
      delete document.body.dataset.textScale;
      delete document.body.dataset.colorIntensity;
      delete document.body.dataset.notificationMode;
      delete document.body.dataset.humorLevel;
      delete document.body.dataset.timerDirection;
    };
  }, [darkMode, highContrast, reducedMotion, density, textScale, colorIntensity, notificationMode, humorLevel, timerDirection]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) { setLiveSearchResults([]); setLiveSearchSuggestions([]); return; }
    setSearchLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(); return body; })
        .then((body) => {
          setLiveSearchResults((body.results || []).map((item: { id: string; type: string; title: string; detail: string; excerpt: string; href: string }) => ({ ...item, body: item.excerpt, tags: [] })));
          setLiveSearchSuggestions(body.suggestions || []);
        })
        .catch(() => undefined)
        .finally(() => setSearchLoading(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

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

  const searchResults = liveSearchResults;
  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (liveSearchSuggestions.length ? liveSearchSuggestions : defaultSearchSuggestions)
      .filter((item) => !query || item.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchQuery, liveSearchSuggestions]);

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
          <span className="brandCopy">
            <span className="brandName">Squirrel!</span>
            <span className="brandTagline">
              <span>Tasks, schedules, medications, classes, files, and reminders in one place.</span>
              <strong>See one clear next step without holding everything in your head.</strong>
            </span>
          </span>
        </a>

        <div className="headerActions">
          <button
            className="headerIconButton"
            type="button"
            aria-label="Search Squirrel!"
            title="Search Squirrel!"
            onClick={() => {
              setDisplayMode("search");
              setSideboxOpen(true);
              window.setTimeout(() => document.querySelector<HTMLInputElement>('.sidebox input[type="search"]')?.focus(), 120);
            }}
          >
            <Search aria-hidden="true" />
          </button>
          <button
            className="headerIconButton notificationButton"
            type="button"
            aria-label="View reminders and deadlines"
            title="Reminders and deadlines"
            onClick={() => document.querySelector<HTMLElement>(".attentionDeck")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })}
          >
            <Bell aria-hidden="true" />
            <span className="notificationDot" aria-hidden="true" />
          </button>
          <AccountMenu user={initialUser} signOutPath={signOutPath} preferences={{ darkMode, highContrast, reducedMotion, density, textScale, colorIntensity, notificationMode, humorLevel, timerDirection }} onPreferences={applyPreferences} />
        </div>
      </header>

      <div className="dashboardShell" id="dashboard">
        <nav className="appNav" aria-label="Main navigation">
          <a
            href="#get-squirrelly"
            className="active"
            onClick={(event) => {
              event.preventDefault();
              scrollToCapture();
            }}
          >
            <Home aria-hidden="true" />
            <span>Today</span>
          </a>
          <a href="#calendar"><CalendarDays aria-hidden="true" /><span>Calendar</span></a>
          <a href="#school"><GraduationCap aria-hidden="true" /><span>School</span></a>
          <a href="#settings"><Headphones aria-hidden="true" /><span>Sensory</span></a>
        </nav>

        <section className="dashboardContent" aria-label="Squirrel! dashboard preview">
          <section className="heroPanel">
            <div>
              <h1>Choose one clear next step.</h1>
              <p className="heroSubtagline">Save tasks and reminders before you forget them.</p>
              <p>
                Keep medications, classes, tasks, files, and reminders together so you do not
                have to remember where each item was saved.
              </p>
            </div>

            <div className="heroActions">
              <button className="heroPrimaryAction" type="button" onClick={scrollToCapture}>Add A Task Or Note</button>
              <button className="heroSecondaryAction" type="button" onClick={() => document.querySelector<HTMLElement>("#medications")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" })}>Manage Medications</button>
            </div>
          </section>

          <DailyCalibration />

          <DashboardTools />

          <TimeCompass />

          <AttentionDeck />

          <section className="summaryGrid" aria-label="Today summary">
            <article className="summaryCard">
              <span>Medication</span>
              <strong>Private log</strong>
              <p>check-ins stay attached to your account</p>
            </article>
            <article className="summaryCard">
              <span>Tasks</span>
              <strong>Task inbox</strong>
              <p>saved tasks, reminders, and notes</p>
            </article>
            <article className="summaryCard">
              <span>Today</span>
              <strong>{todayLabel}</strong>
              <p>{timeLabel} local time</p>
            </article>
            <article className="summaryCard">
              <span>Calendar</span>
              <strong>Google</strong>
              <p>View and update plans in one place.</p>
            </article>
          </section>

          <GoogleCalendarIntegration
            monthLabel={monthLabel}
            calendarDays={calendarDays}
          />

          <section aria-label="Medication records">
            <MedicationHub />
          </section>

          <OutcomeInsights />

          <SchoolWorkspace />

          <section className="settingsPanel" id="settings" aria-label="Display settings">
            <div>
              <p className="eyebrow">Display Preferences</p>
              <h2>Adjust contrast, motion, and brightness for comfortable viewing.</h2>
            </div>

            <div className="settingsGrid">
              <label>
                <input type="checkbox" checked={darkMode} onChange={(event) => { setDarkMode(event.target.checked); saveQuickPreferences({ darkMode: event.target.checked }); }} />
                <span>Dark Mode</span>
              </label>
              <label>
                <input type="checkbox" checked={highContrast} onChange={(event) => { setHighContrast(event.target.checked); saveQuickPreferences({ highContrast: event.target.checked }); }} />
                <span>Higher Contrast</span>
              </label>
              <label>
                <input type="checkbox" checked={reducedMotion} onChange={(event) => { setReducedMotion(event.target.checked); saveQuickPreferences({ reducedMotion: event.target.checked }); }} />
                <span>Reduce Motion</span>
              </label>
            </div>
          </section>
        </section>

        <aside className={`sidebox${sideboxOpen ? " sideboxOpen" : ""}`} aria-label="Quick View" aria-hidden={!sideboxOpen}>
          <div className="sideboxHeader">
            <div>
              <p className="eyebrow">Dashboard Tools</p>
              <h2>Quick View</h2>
              <p>Choose one type of information to view without leaving the dashboard.</p>
            </div>
            <button className="drawerClose" type="button" aria-label="Close Quick View" onClick={() => setSideboxOpen(false)}><X aria-hidden="true" /></button>
          </div>

          <label className="field">
            <span>Show</span>
            <select value={displayMode} onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}>
              <option value="now">Now / Next</option>
              <option value="search">Search</option>
              <option value="affirmation">Daily Affirmation</option>
              <option value="fact">Daily Fact</option>
              <option value="tip">ADHD & Rejection Sensitivity Tips</option>
              <option value="focus">Focus Prompt</option>
              <option value="reset">Quick Reset</option>
              <option value="checklist">Four-item checklist</option>
            </select>
          </label>

          {displayMode === "now" && (
            <section className="sideCard nowNextCard">
              <span>Current Recommendation</span>
              <strong>Your recommended task also appears here.</strong>
              <p>This is the same task shown in the main recommendation area, not an additional task.</p>
              <div className="nowNextSteps"><small>Now</small><p>Complete the first visible step.</p><small>Then</small><p>Check the calendar before choosing another task.</p></div>
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
                {searchLoading && <p className="emptyResult">Searching your Squirrel! records…</p>}
                {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                  <p className="emptyResult">No results found. Try a shorter word or a different term.</p>
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
              <p>A short supportive message for today.</p>
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
                <p>A short fact from your selected topic.</p>
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
                return <section className="sideCard tipCard"><span>{tipCategory === "daily" ? "Today’s planning tip" : tipCategory}</span><strong>{tip.title}</strong><p>{tip.body}</p><div className="tipNudge"><small>Try this</small><p>{tip.nudge}</p></div></section>;
              })()}
            </section>
          )}

          {displayMode === "focus" && (
            <section className="sideCard">
              <span>Focus Prompt</span>
              <strong>Return to your recommended task.</strong>
              <p>Open the recommendation to review its first step or start Focus Mode.</p>
              <button type="button" onClick={() => document.querySelector<HTMLElement>("#do-this-next")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" })}>Open Recommended Task</button>
            </section>
          )}

          {displayMode === "reset" && (
            <section className="sideCard" id="reset">
              <span>Quick Reset</span>
              <strong>Pause and choose one way to reset.</strong>
              <p>Select one short action before returning to your task.</p>
              <div className="sideActions">
                <button type="button" onClick={() => setBreathingOpen(true)}>Breathe</button>
                <button type="button" onClick={() => document.querySelector<HTMLElement>("#do-this-next")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" })}>Pick Next Task</button>
                <button type="button" onClick={() => document.querySelector<HTMLElement>("#calendar")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })}>Open Calendar</button>
              </div>
            </section>
          )}

          {displayMode === "checklist" && (
            <section className="sideCard">
              <span>Four-item checklist</span>
              <strong>Four basic items to check today.</strong>
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
      <BreathingGuide open={breathingOpen} onClose={() => setBreathingOpen(false)} />
    </main>
  );
}
