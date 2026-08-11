"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Acorn = {
  id: string;
  content: string;
  kind: string;
  status: string;
  energy: string;
  estimatedMinutes: number;
  brainLoad: string;
  source: string;
};

const fallbackAcorns: Acorn[] = [
  { id: "starter-upload", content: "Upload lecture notes", kind: "task", status: "next", energy: "low", estimatedMinutes: 10, brainLoad: "some", source: "starter" },
  { id: "starter-email", content: "Email advisor", kind: "task", status: "loose", energy: "medium", estimatedMinutes: 10, brainLoad: "some", source: "starter" },
  { id: "starter-refill", content: "Refill medication", kind: "reminder", status: "loose", energy: "low", estimatedMinutes: 5, brainLoad: "none", source: "starter" },
];

const stuckHelp = {
  start: { title: "Make the first move microscopic.", body: "You do not need to do the task. You only need to open the thing, find the page, or put the object in front of you.", action: "Name the two-minute first move" },
  big: { title: "The task is wearing three tasks in a trench coat.", body: "Pick one visible outcome. Everything after that can remain Future You's suspicious problem.", action: "Choose the smallest useful piece" },
  exhausted: { title: "Brain oatmeal protocol activated.", body: "A low-energy task is still a real task. Choose something short with almost no decisions—or switch to a keep-the-ship-afloat day.", action: "Give me something easier" },
  avoiding: { title: "Let’s lower the emotional cover charge.", body: "Try five deliberately imperfect minutes. You are allowed to stop when the timer ends.", action: "Start an intentionally bad draft" },
  distracted: { title: "Anyway, welcome back.", body: "Capture the side quest, reopen the current task, and restart from the last visible action. No punishment lap required.", action: "Squirrel it away and restart" },
};

async function result(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Squirrel hit a snag.");
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
  const [minimumDay, setMinimumDay] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const load = useCallback(async () => {
    const response = await fetch("/api/acorns", { cache: "no-store" });
    setAcorns((await result(response)).acorns);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load().catch(() => setMessage("Your Acorn Pile will connect after storage finishes waking up.")), 0);
    return () => window.clearTimeout(timer);
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
  const suggestion = candidates[suggestionIndex % candidates.length] ?? fallbackAcorns[0];

  const captureAcorn = async (content: string, source = "capture") => {
    const saved = await result(await fetch("/api/acorns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, source }),
    }));
    await load();
    return saved;
  };

  const submitCapture = async (event: FormEvent) => {
    event.preventDefault();
    const content = capture.trim();
    if (!content) return;
    setMessage("");
    try {
      const saved = await captureAcorn(content);
      setCapture("");
      setMessage(`Squirreled away as a ${saved.acorn.kind}. Organize it later—or don't.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "That acorn escaped."); }
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
  };

  const easier = () => {
    const easyIndex = candidates.findIndex((item) => item.energy === "low" || item.estimatedMinutes <= 10);
    setSuggestionIndex(easyIndex >= 0 ? easyIndex : (suggestionIndex + 1) % candidates.length);
  };

  return (
    <section className="externalBrain" aria-label="Do this next and quick capture">
      <form className="squirrelCapture" onSubmit={submitCapture}>
        <label><span className="eyebrow">Squirrel this</span><input value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="Buy toothpaste, exam Friday, ask Lee about dinner…" /></label>
        <button type="submit">Squirrel it away</button>
        <small>Drop it here. Future You can fight with the filing system.</small>
      </form>
      {message && <p className="brainMessage" role="status">{message}</p>}

      <article className="doNextCard">
        <div className="doNextCopy">
          <div className="doNextLabel"><span className="liveDot" />Do this next</div>
          <h2>{suggestion.content}</h2>
          <div className="activationPills"><span>{suggestion.energy} energy</span><span>{suggestion.estimatedMinutes} min</span><span>Brain: {suggestion.brainLoad === "unfortunately_yes" ? "unfortunately yes" : suggestion.brainLoad}</span></div>
          <p>{minimumDay ? "Keep-the-ship-afloat mode: this is enough to count as forward motion." : "One acorn. The rest can wait outside."}</p>
        </div>
        <div className="doNextActions"><button type="button" onClick={() => startFocus()}>Start Squirrel Mode</button><button className="stuckButton" type="button" onClick={() => setStuck("start")}>I’m stuck</button><button className="quietButton" type="button" onClick={() => setSuggestionIndex((value) => (value + 1) % candidates.length)}>Not now</button><button className="quietButton" type="button" onClick={easier}>Give me something easier</button></div>
        <label className="minimumDayToggle"><input type="checkbox" checked={minimumDay} onChange={(event) => setMinimumDay(event.target.checked)} /><span>Minimum Viable Day</span><small>The rest can be tomorrow’s nonsense.</small></label>
      </article>

      <div className="acornPileHeader"><button type="button" onClick={() => setPileOpen((value) => !value)} aria-expanded={pileOpen}><span>Acorn Pile</span><strong>{acorns.filter((item) => !["complete", "released"].includes(item.status)).length} loose acorns</strong><small>{pileOpen ? "Hide the pile" : "No organizing required right now"}</small></button></div>
      {pileOpen && <div className="acornPile">
        {acorns.length === 0 ? <p className="emptyResult">Suspiciously quiet in here. Use “Squirrel this” when a thought tries to escape.</p> : acorns.filter((item) => item.status !== "released").map((acorn) => <AcornRow key={acorn.id} acorn={acorn} onSave={saveAcorn} onFocus={startFocus} />)}
      </div>}

      {stuck && <div className="modalBackdrop" role="presentation"><section className="stuckModal" role="dialog" aria-modal="true" aria-label="I'm stuck support"><div className="modalHeading"><div><p className="eyebrow">No shame. Just information.</p><h2>What kind of stuck?</h2></div><button className="iconButton" type="button" onClick={() => setStuck(null)}>×</button></div><div className="stuckChoices"><button type="button" onClick={() => setStuck("start")}>I don’t know where to start</button><button type="button" onClick={() => setStuck("big")}>This feels too big</button><button type="button" onClick={() => setStuck("exhausted")}>I’m exhausted</button><button type="button" onClick={() => setStuck("avoiding")}>I’m avoiding it</button><button type="button" onClick={() => setStuck("distracted")}>I got distracted</button></div><div className="stuckResponse"><span>Try this</span><h3>{stuckHelp[stuck].title}</h3><p>{stuckHelp[stuck].body}</p><strong>{stuckHelp[stuck].action}</strong></div><div className="modalActions"><button className="quietButton" type="button" onClick={() => setStuck(null)}>Close</button>{stuck === "exhausted" && <button type="button" onClick={() => { easier(); setStuck(null); }}>Find an easier acorn</button>}<button type="button" onClick={() => { setStuck(null); void startFocus(); }}>Try Squirrel Mode</button></div></section></div>}

      {focusAcorn && <FocusMode acorn={focusAcorn} secondsLeft={secondsLeft} setSecondsLeft={setSecondsLeft} onClose={() => setFocusAcorn(null)} onSideQuest={async (content) => { await captureAcorn(content, "side_quest"); setMessage("Side quest captured. Welcome back."); }} onComplete={async () => { try { await saveAcorn(focusAcorn, { status: "complete" }, "Look at you, doing the terrible little thing."); } finally { setFocusAcorn(null); } }} />}
    </section>
  );
}

function AcornRow({ acorn, onSave, onFocus }: { acorn: Acorn; onSave: (acorn: Acorn, patch: Partial<Acorn>, success?: string) => Promise<unknown>; onFocus: (acorn: Acorn) => Promise<void> }) {
  const [draft, setDraft] = useState(acorn);
  const [editing, setEditing] = useState(false);
  return <article className="acornRow"><div className="acornMain"><span>{acorn.kind}</span><strong>{acorn.content}</strong><small>{acorn.energy} energy · {acorn.estimatedMinutes} min · brain: {acorn.brainLoad.replace("_", " ")}</small></div><div className="acornRowActions"><button type="button" onClick={() => onFocus(acorn)}>Focus</button><button className="quietButton" type="button" onClick={() => setEditing((value) => !value)}>Edit</button><button className="releaseButton" type="button" onClick={() => onSave(acorn, { status: "released" }, "Released back into the wild. Task deletion is productivity too.")}>Nope</button></div>{editing && <form className="acornEditor" onSubmit={async (event) => { event.preventDefault(); await onSave(acorn, draft, "Acorn updated."); setEditing(false); }}><label className="field"><span>What is it?</span><input value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} /></label><label className="field"><span>Energy</span><select value={draft.energy} onChange={(event) => setDraft({ ...draft, energy: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label className="field"><span>Time</span><select value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })}><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60+ min</option></select></label><label className="field"><span>Brain needed</span><select value={draft.brainLoad} onChange={(event) => setDraft({ ...draft, brainLoad: event.target.value })}><option value="none">None</option><option value="some">Some</option><option value="unfortunately_yes">Unfortunately yes</option></select></label><button type="submit">Save</button></form>}</article>;
}

function FocusMode({ acorn, secondsLeft, setSecondsLeft, onClose, onSideQuest, onComplete }: { acorn: Acorn; secondsLeft: number; setSecondsLeft: (seconds: number) => void; onClose: () => void; onSideQuest: (content: string) => Promise<void>; onComplete: () => Promise<void> }) {
  const [quest, setQuest] = useState("");
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return <div className="focusBackdrop"><main className="focusMode" aria-label="Squirrel focus mode"><header><div className="brand"><span className="focusMascot">🐿️</span><span>Squirrel Mode</span></div><button type="button" onClick={onClose}>Exit focus</button></header><section className="focusTask"><p className="eyebrow">Only this acorn exists right now</p><h1>{acorn.content}</h1><p>Smallest next step: open the thing and make one visible move.</p><div className="focusTimer" aria-label={`${minutes} minutes and ${seconds} seconds remaining`}>{minutes}:{seconds}</div><div className="focusTimerActions"><button type="button" onClick={() => setSecondsLeft(5 * 60)}>5 min</button><button type="button" onClick={() => setSecondsLeft(15 * 60)}>15 min</button><button type="button" onClick={() => setSecondsLeft(25 * 60)}>25 min</button></div><button className="focusComplete" type="button" onClick={() => void onComplete()}>Done enough ✓</button></section><form className="sideQuestCapture" onSubmit={async (event) => { event.preventDefault(); if (!quest.trim()) return; await onSideQuest(quest.trim()); setQuest(""); }}><label><span>Oops, side quest</span><input value={quest} onChange={(event) => setQuest(event.target.value)} placeholder="Capture the distracting thought without leaving" /></label><button type="submit">Squirrel it</button></form></main></div>;
}
