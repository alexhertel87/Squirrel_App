"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Mic } from "lucide-react";

type Acorn = {
  id: string;
  content: string;
  kind: string;
  status: string;
  energy: string;
  estimatedMinutes: number;
  brainLoad: string;
  source: string;
  dueAt?: string | null;
  location?: string | null;
  firstStep?: string | null;
  notes?: string | null;
  priority?: number;
  context?: string;
  explanation?: string;
  smallestStep?: string;
};

const fallbackAcorns: Acorn[] = [
  { id: "starter-upload", content: "Upload lecture notes", kind: "task", status: "next", energy: "medium", estimatedMinutes: 30, brainLoad: "some", source: "starter", firstStep: "Open the latest lecture folder." },
  { id: "starter-read", content: "Read for class", kind: "task", status: "loose", energy: "medium", estimatedMinutes: 30, brainLoad: "some", source: "starter", firstStep: "Open the assigned reading." },
  { id: "starter-prep", content: "Prep tomorrow", kind: "task", status: "loose", energy: "low", estimatedMinutes: 10, brainLoad: "none", source: "starter", firstStep: "Check tomorrow's calendar." },
];

const stuckHelp = {
  start: { title: "Choose a two-minute first step.", body: "You do not need to finish the task now. Open the file, find the page, or place the needed item in front of you.", action: "Write the first step" },
  big: { title: "Choose one part of the task.", body: "Pick one result you can see when it is finished. Leave the remaining parts for later.", action: "Choose the smallest useful part" },
  exhausted: { title: "Choose a shorter, easier task.", body: "Low energy changes what is realistic. Choose something brief that requires few decisions, or turn on Low-Energy Day.", action: "Show an easier task" },
  avoiding: { title: "Try five minutes without aiming for perfect.", body: "Work for five minutes. You may stop when the timer ends, even if the result is unfinished.", action: "Start a five-minute draft" },
  distracted: { title: "Save the distracting thought, then return.", body: "Add the thought to your inbox, reopen the current task, and continue from the last step you completed.", action: "Save the thought and return" },
};

async function result(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Squirrel! hit a snag.");
  return body;
}

export function DashboardTools() {
  const [acorns, setAcorns] = useState<Acorn[]>([]);
  const [capture, setCapture] = useState("");
  const [message, setMessage] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [stuck, setStuck] = useState<keyof typeof stuckHelp | null>(null);
  const [focusAcorn, setFocusAcorn] = useState<Acorn | null>(null);
  const [pileOpen, setPileOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [smartSuggestions, setSmartSuggestions] = useState<Acorn[]>([]);
  const [listening, setListening] = useState(false);
  const [bodyDouble, setBodyDouble] = useState<{ id: string; shareCode: string } | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/acorns", { cache: "no-store" });
    setAcorns((await result(response)).acorns);
    const suggested = await fetch(`/api/acorns/suggest?date=${new Date().toLocaleDateString("en-CA")}`, { cache: "no-store" });
    if (suggested.ok) {
      const body = await suggested.json();
      setSmartSuggestions([body.suggestion, ...(body.alternatives || [])].filter(Boolean));
      setSuggestionIndex(0);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch(() => setMessage("Your task inbox will appear when storage reconnects.")), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const refresh = () => void load().catch(() => undefined);
    window.addEventListener("squirrel:calibration", refresh);
    window.addEventListener("online", refresh);
    return () => { window.removeEventListener("squirrel:calibration", refresh); window.removeEventListener("online", refresh); };
  }, [load]);

  useEffect(() => {
    if (!focusAcorn || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [focusAcorn, secondsLeft]);

  const candidates = useMemo(() => {
    const saved = acorns.filter((item) => !["complete", "released"].includes(item.status));
    return saved.length ? saved : fallbackAcorns;
  }, [acorns]);
  const rankedCandidates = smartSuggestions.length ? smartSuggestions : candidates;
  const suggestion = rankedCandidates[suggestionIndex % rankedCandidates.length] ?? fallbackAcorns[0];
  const planItems = useMemo(() => {
    const unique = new Map<string, Acorn>();
    [...rankedCandidates, ...fallbackAcorns].forEach((item) => {
      if (!unique.has(item.content.toLowerCase())) unique.set(item.content.toLowerCase(), item);
    });
    return Array.from(unique.values()).slice(0, 3);
  }, [rankedCandidates]);

  const captureAcorn = async (content: string, source = "capture") => {
    try {
      const saved = await result(await fetch("/api/acorns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, source }),
      }));
      await load();
      return saved;
    } catch (error) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const queued = JSON.parse(localStorage.getItem("squirrel:offline-acorns") || "[]") as { content: string; source: string }[];
        queued.push({ content, source });
        localStorage.setItem("squirrel:offline-acorns", JSON.stringify(queued));
        return { acorn: { ...fallbackAcorns[0], id: `offline-${Date.now()}`, content, source } };
      }
      throw error;
    }
  };

  useEffect(() => {
    if (!navigator.onLine) return;
    const queued = JSON.parse(localStorage.getItem("squirrel:offline-acorns") || "[]") as { content: string; source: string }[];
    if (!queued.length) return;
    Promise.all(queued.map((item) => fetch("/api/acorns", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(item) })))
      .then(() => { localStorage.removeItem("squirrel:offline-acorns"); setMessage(`${queued.length} offline capture${queued.length === 1 ? "" : "s"} synced.`); void load(); })
      .catch(() => undefined);
  }, [load]);

  const voiceCapture = () => {
    const SpeechRecognition = (window as typeof window & { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void; start: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setMessage("Voice capture is not available in this browser. Typing still works."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = navigator.language || "en-US"; recognition.interimResults = false; setListening(true);
    recognition.onresult = (event) => setCapture((current) => `${current}${current ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onend = () => setListening(false); recognition.onerror = () => { setListening(false); setMessage("Voice capture did not finish. Nothing was saved without your review."); }; recognition.start();
  };

  const recordEvent = async (eventType: string, reason?: string) => {
    if (suggestion.source === "starter") return;
    await fetch("/api/acorns/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acornId: suggestion.id, eventType, reason }) }).catch(() => undefined);
  };

  const submitCapture = async (event: FormEvent) => {
    event.preventDefault();
    const content = capture.trim();
    if (!content) return;
    setMessage("");
    try {
      const saved = await captureAcorn(content);
      setCapture("");
      setMessage(`Saved to your task inbox as a ${saved.acorn.kind}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "This item could not be saved."); }
  };

  const saveAcorn = async (acorn: Acorn, patch: Partial<Acorn>, success?: string) => {
    if (acorn.source === "starter") {
      const saved = await captureAcorn(acorn.content);
      if (success) setMessage(success);
      return saved.acorn as Acorn;
    }
    await result(await fetch("/api/acorns", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...acorn, ...patch }),
    }));
    await load();
    if (success) setMessage(success);
    return { ...acorn, ...patch } as Acorn;
  };

  const startFocus = async (acorn = suggestion) => {
    let focusTarget = acorn;
    try { focusTarget = await saveAcorn(acorn, { status: "next" }) as Acorn; } catch { /* focus still works offline */ }
    setFocusAcorn(focusTarget);
    setSecondsLeft(25 * 60);
    await recordEvent("started");
  };

  const easier = () => {
    const easyIndex = candidates.findIndex((item) => item.energy === "low" || item.estimatedMinutes <= 10);
    setSuggestionIndex(easyIndex >= 0 ? easyIndex : (suggestionIndex + 1) % candidates.length);
  };

  return (
    <section className="externalBrain" id="get-squirrelly" aria-label="Do this next and quick capture">
      <form className="squirrelCapture" onSubmit={submitCapture}>
        <label><span className="eyebrow">Quick Capture</span><input id="squirrelly-capture" value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Buy toothpaste, exam Friday, ask Lee about dinner…" /></label>
        <div className="captureActions"><button type="submit">Save To Inbox</button><button className="quietButton voiceButton" type="button" aria-label={listening ? "Listening for a voice capture" : "Use voice capture"} aria-pressed={listening} title="Use voice capture" onClick={voiceCapture}><Mic aria-hidden="true" /><span>{listening ? "Listening…" : "Use Voice"}</span></button></div>
        <small><strong>Save first and organize later.</strong> Tasks, reminders, notes, and distracting thoughts all go into the same private inbox.</small>
      </form>
      {message && <p className="brainMessage" role="status">{message}</p>}

      <article className="doNextCard" id="do-this-next">
        <div className="doNextCopy">
          <div className="doNextLabel"><span className="liveDot" />Recommended Next Task</div>
          <h2>{suggestion.content}</h2>
          <div className="activationPills"><span>{suggestion.energy} energy</span><span>{suggestion.estimatedMinutes} min</span></div>
          <p className="recommendationReason">{suggestion.explanation || "Focus on this task before choosing another one."}</p>
          <div className="smallestStep"><span>First Step</span><strong>{suggestion.smallestStep || suggestion.firstStep || "Open what you need and complete one visible step."}</strong></div>
        </div>
        <div className="doNextActions">
          <div className="doNextPrimaryActions">
            <button type="button" aria-describedby="squirrel-mode-help" onClick={() => startFocus()}>Start Focus Mode</button>
            <small id="squirrel-mode-help">Starts a 25-minute timer and hides other dashboard items.</small>
            <button className="stuckButton" type="button" onClick={() => setStuck("start")}>I’m Stuck</button>
          </div>
          <div className="doNextSecondaryActions">
            <button className="quietButton" type="button" onClick={() => { void recordEvent("rejected", "not_now"); setSuggestionIndex((value) => (value + 1) % rankedCandidates.length); }}>Not Now</button>
            <button className="quietButton" type="button" onClick={easier}>Something Easier</button>
          </div>
        </div>
      </article>

      <section className="planForToday" aria-labelledby="plan-for-today-heading">
        <h2 id="plan-for-today-heading">Plan For Today</h2>
        <div className="planTaskGrid">
          {planItems.map((item) => (
            <label className="planTask" key={item.id}>
              <input
                checked={false}
                name="plan-for-today"
                onChange={() => {
                  setSmartSuggestions([item, ...rankedCandidates.filter((candidate) => candidate.id !== item.id)]);
                  setSuggestionIndex(0);
                }}
                type="radio"
              />
              <span>{item.content}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="acornPileHeader"><button type="button" onClick={() => setPileOpen((value) => !value)} aria-expanded={pileOpen}><span>Task Inbox</span><strong>{acorns.filter((item) => !["complete", "released"].includes(item.status)).length} open items</strong><small>{pileOpen ? "Hide Inbox" : "View and organize saved items"}</small></button></div>
      {pileOpen && <div className="acornPile">
        {acorns.length === 0 ? <p className="emptyResult">Your task inbox is empty. Use Quick Capture to add a task, reminder, or note.</p> : acorns.filter((item) => item.status !== "released").map((acorn) => <AcornRow key={acorn.id} acorn={acorn} onSave={saveAcorn} onFocus={startFocus} />)}
      </div>}

      {stuck && <div className="modalBackdrop" role="presentation"><section className="stuckModal" role="dialog" aria-modal="true" aria-label="Help starting a task"><div className="modalHeading"><div><p className="eyebrow">Get Help Starting</p><h2>What is making this task difficult?</h2></div><button className="iconButton" type="button" aria-label="Close" onClick={() => setStuck(null)}>×</button></div><div className="stuckChoices"><button type="button" onClick={() => setStuck("start")}>I Don’t Know Where to Start</button><button type="button" onClick={() => setStuck("big")}>This Feels Too Big</button><button type="button" onClick={() => setStuck("exhausted")}>I Don’t Have Enough Energy</button><button type="button" onClick={() => setStuck("avoiding")}>I’m Avoiding It</button><button type="button" onClick={() => setStuck("distracted")}>I Got Distracted</button></div><div className="stuckResponse"><span>Try This</span><h3>{stuckHelp[stuck].title}</h3><p>{stuckHelp[stuck].body}</p><strong>{stuckHelp[stuck].action}</strong></div><div className="modalActions"><button className="quietButton" type="button" onClick={() => setStuck(null)}>Close</button>{stuck === "exhausted" && <button type="button" onClick={() => { easier(); setStuck(null); }}>Find an Easier Task</button>}<button type="button" onClick={() => { setStuck(null); void startFocus(); }}>Start Focus Mode</button></div></section></div>}

      {focusAcorn && <FocusMode acorn={focusAcorn} secondsLeft={secondsLeft} setSecondsLeft={setSecondsLeft} bodyDouble={bodyDouble} onStartBodyDouble={async (shareTaskDetails) => { const saved = await result(await fetch("/api/body-double", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ taskLabel: focusAcorn.content, shareTaskDetails }) })); setBodyDouble(saved.session); }} onClose={() => setFocusAcorn(null)} onSideQuest={async (content) => { await captureAcorn(content, "side_quest"); setMessage("Distracting thought saved. Continue your current task when you are ready."); }} onComplete={async () => { try { await saveAcorn(focusAcorn, { status: "complete" }, "Task marked complete."); await recordEvent("completed"); } finally { setFocusAcorn(null); } }} />}
    </section>
  );
}

function AcornRow({ acorn, onSave, onFocus }: { acorn: Acorn; onSave: (acorn: Acorn, patch: Partial<Acorn>, success?: string) => Promise<unknown>; onFocus: (acorn: Acorn) => Promise<void> }) {
  const [draft, setDraft] = useState(acorn);
  const [editing, setEditing] = useState(false);
  return <article className="acornRow"><div className="acornMain"><span>{acorn.kind}</span><strong>{acorn.content}</strong><small>{acorn.energy} energy · {acorn.estimatedMinutes} min · mental effort: {acorn.brainLoad === "unfortunately_yes" ? "high" : acorn.brainLoad}</small></div><div className="acornRowActions"><button type="button" onClick={() => onFocus(acorn)}>Focus</button><button className="quietButton" type="button" onClick={() => setEditing((value) => !value)}>Edit</button><button className="releaseButton" type="button" onClick={() => onSave(acorn, { status: "released" }, "Item removed from your task inbox.")}>Remove</button></div>{editing && <form className="acornEditor" onSubmit={async (event) => { event.preventDefault(); await onSave(acorn, draft, "Item updated."); setEditing(false); }}><label className="field"><span>Task or note</span><input value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label><label className="field"><span>Energy</span><select value={draft.energy} onChange={(event) => setDraft({ ...draft, energy: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="field"><span>Estimated time</span><select value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })}><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60+ min</option></select></label><label className="field"><span>Mental effort</span><select value={draft.brainLoad} onChange={(event) => setDraft({ ...draft, brainLoad: event.target.value })}><option value="none">Low</option><option value="some">Medium</option><option value="unfortunately_yes">High</option></select></label><button type="submit">Save Changes</button></form>}</article>;
}

function FocusMode({ acorn, secondsLeft, setSecondsLeft, bodyDouble, onStartBodyDouble, onClose, onSideQuest, onComplete }: { acorn: Acorn; secondsLeft: number; setSecondsLeft: (seconds: number) => void; bodyDouble: { id: string; shareCode: string } | null; onStartBodyDouble: (shareTaskDetails: boolean) => Promise<void>; onClose: () => void; onSideQuest: (content: string) => Promise<void>; onComplete: () => Promise<void> }) {
  const [quest, setQuest] = useState("");
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const shareUrl = bodyDouble ? `${window.location.origin}/body-double/${bodyDouble.shareCode}` : "";
  return <div className="focusBackdrop"><main className="focusMode" aria-label="Focus mode"><header><div className="brand"><span className="focusMascot">S!</span><span>Focus Mode</span></div><button type="button" onClick={onClose}>Exit Focus</button></header><section className="focusTask"><p className="eyebrow">Current Task</p><h1>{acorn.content}</h1><p>First step: {acorn.smallestStep || acorn.firstStep || "open what you need and complete one visible step."}</p><div className="focusTimer" aria-label={`${minutes} minutes and ${seconds} seconds remaining`}>{minutes}:{seconds}</div><div className="focusTimerActions"><button type="button" onClick={() => setSecondsLeft(5 * 60)}>5 Min</button><button type="button" onClick={() => setSecondsLeft(15 * 60)}>15 Min</button><button type="button" onClick={() => setSecondsLeft(25 * 60)}>25 Min</button></div><button className="focusComplete" type="button" onClick={() => void onComplete()}>Mark Complete</button></section><section className="bodyDoubleShare"><strong>Focus With Someone</strong><p>Create a private link for someone who can work quietly at the same time. Your task name stays hidden unless you choose to share it.</p>{bodyDouble ? <div><input aria-label="Shared focus link" readOnly value={shareUrl} /><button type="button" onClick={() => navigator.clipboard.writeText(shareUrl)}>Copy Link</button></div> : <div><button type="button" onClick={() => void onStartBodyDouble(false)}>Create Private Link</button><button className="quietButton" type="button" onClick={() => void onStartBodyDouble(true)}>Include Task Name</button></div>}</section><form className="sideQuestCapture" onSubmit={async (event) => { event.preventDefault(); if (!quest.trim()) return; await onSideQuest(quest.trim()); setQuest(""); }}><label><span>Save a distracting thought</span><input value={quest} onChange={(event) => setQuest(event.target.value)} placeholder="Save the thought without leaving focus mode" /></label><button type="submit">Save To Inbox</button></form></main></div>;
}
