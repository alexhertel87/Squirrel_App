"use client";

import { FormEvent, useEffect, useState } from "react";

type Calibration = {
  localDate: string;
  energy: string;
  availableMinutes: number;
  location: string;
  immovableObligation: string;
  minimumDay: boolean;
};

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function DailyCalibration({ onSaved }: { onSaved?: () => void }) {
  const [calibration, setCalibration] = useState<Calibration>({ localDate: localDate(), energy: "medium", availableMinutes: 30, location: "anywhere", immovableObligation: "", minimumDay: false });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/calibration?date=${localDate()}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ calibration: saved }) => { if (saved) setCalibration({ ...calibration, ...saved }); })
      .catch(() => undefined);
  // The initial object is intentionally read once for today's local date.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/calibration", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(calibration) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Today's settings could not be saved.");
      setCalibration(body.calibration); setMessage("Today’s plan is saved. Your recommended task has been updated."); window.dispatchEvent(new Event("squirrel:calibration")); onSaved?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Today's settings could not be saved."); }
    finally { setSaving(false); }
  };

  return <section className="calibrationBar" aria-labelledby="calibration-heading">
    <div className="calibrationIntro"><p className="eyebrow">Daily Setup</p><h2 id="calibration-heading">How much time and energy do you have?</h2><p>Squirrel! uses these answers to recommend a task that fits your day.</p></div>
    <form onSubmit={save}>
      <label><span>Energy</span><select value={calibration.energy} onChange={(event) => setCalibration({ ...calibration, energy: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label><span>Time</span><select value={calibration.availableMinutes} onChange={(event) => setCalibration({ ...calibration, availableMinutes: Number(event.target.value) })}><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option><option value="120">2+ hours</option></select></label>
      <label><span>Where</span><select value={calibration.location} onChange={(event) => setCalibration({ ...calibration, location: event.target.value })}><option value="anywhere">Anywhere</option><option value="home">Home</option><option value="work">Work</option><option value="school">School</option><option value="out">Out</option></select></label>
      <label className="calibrationObligation"><span>Cannot miss today</span><input value={calibration.immovableObligation} onChange={(event) => setCalibration({ ...calibration, immovableObligation: event.target.value })} placeholder="Appointment at 3:00" /></label>
      <label className="minimumCheck" title="Recommend only shorter, easier tasks today"><input type="checkbox" checked={calibration.minimumDay} onChange={(event) => setCalibration({ ...calibration, minimumDay: event.target.checked })} /><span>Low-Energy Day</span></label>
      <button type="submit" disabled={saving}>{saving ? "Saving…" : "Update Today"}</button>
    </form>
    {message && <p className="brainMessage" role="status">{message}</p>}
  </section>;
}
