"use client";

import { useEffect, useMemo, useState } from "react";

type Technique = "box" | "exhale" | "paced";
type Phase = { label: string; seconds: number };

const techniques: Record<Technique, { name: string; description: string; phases: Phase[] }> = {
  box: { name: "Box Breathing", description: "Equal inhale, hold, exhale, and hold periods.", phases: [{ label: "Inhale", seconds: 4 }, { label: "Hold", seconds: 4 }, { label: "Exhale", seconds: 4 }, { label: "Hold", seconds: 4 }] },
  exhale: { name: "Longer Exhale", description: "A gentle inhale followed by a longer exhale, with no breath hold.", phases: [{ label: "Inhale", seconds: 4 }, { label: "Exhale", seconds: 6 }] },
  paced: { name: "Even Paced Breathing", description: "A steady inhale and exhale at the same pace.", phases: [{ label: "Inhale", seconds: 5 }, { label: "Exhale", seconds: 5 }] },
};

export function BreathingGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [duration, setDuration] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => {
      if (value + 1 >= duration) { setRunning(false); return duration; }
      return value + 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, duration]);

  const current = technique ? techniques[technique] : null;
  const phase = useMemo(() => {
    if (!current) return null;
    const cycle = current.phases.reduce((total, item) => total + item.seconds, 0);
    let within = elapsed % cycle;
    for (const item of current.phases) {
      if (within < item.seconds) return { ...item, remaining: item.seconds - within };
      within -= item.seconds;
    }
    return { ...current.phases[0], remaining: current.phases[0].seconds };
  }, [current, elapsed]);

  if (!open) return null;
  const finished = elapsed >= duration;
  return <div className="modalBackdrop" role="presentation"><section className="breathingModal" role="dialog" aria-modal="true" aria-labelledby="breathing-heading"><div className="modalHeading"><div><p className="eyebrow">Guided Breathing</p><h2 id="breathing-heading">Choose a breathing exercise</h2></div><button className="iconButton" type="button" aria-label="Close" onClick={() => { setRunning(false); onClose(); }}>×</button></div>
    {!running && !finished && <><div className="breathingChoices">{(Object.entries(techniques) as [Technique, typeof techniques[Technique]][]).map(([id, item]) => <button type="button" className={technique === id ? "selected" : ""} aria-pressed={technique === id} key={id} onClick={() => { setTechnique(id); setElapsed(0); }}><strong>{item.name}</strong><span>{item.description}</span></button>)}</div><fieldset className="durationChoices"><legend>Exercise length</legend><label><input type="radio" name="breathing-duration" checked={duration === 60} onChange={() => setDuration(60)} />1 minute</label><label><input type="radio" name="breathing-duration" checked={duration === 120} onChange={() => setDuration(120)} />2 minutes</label></fieldset>{current && <div className="breathingSelection"><strong>Selected: {current.name}</strong><button type="button" onClick={() => { setElapsed(0); setRunning(true); }}>Start</button></div>}</>}
    {running && phase && <div className="breathingRoutine" aria-live="polite"><span>{current?.name}</span><div className="breathingCircle" data-phase={phase.label.toLowerCase()}><strong>{phase.label}</strong><em>{phase.remaining}</em></div><p>{Math.max(0, duration - elapsed)} seconds remaining</p><button className="quietButton" type="button" onClick={() => setRunning(false)}>Pause</button></div>}
    {finished && <div className="breathingFinished"><strong>Exercise complete.</strong><p>Notice how you feel before returning to the dashboard.</p><button type="button" onClick={() => { setElapsed(0); setRunning(false); onClose(); }}>Return To Dashboard</button></div>}
    <p className="breathingSafety">Breathe gently. Stop if you feel dizzy, short of breath, or uncomfortable.</p>
  </section></div>;
}
