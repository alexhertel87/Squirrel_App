"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Medication = { id: string; name: string; formulation: string | null; dose: string; instructions: string | null; scheduleLabel: string | null; refillDueAt: string | null; active: boolean };
type MedicationLog = { id: string; medicationId: string; status: string; note: string | null; loggedAt: number };

export function MedicationHub() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ name: "", formulation: "", dose: "", instructions: "", scheduleLabel: "", refillDueAt: "" });

  const load = useCallback(async () => {
    const response = await fetch("/api/medications", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Medication records could not be loaded.");
    setMedications(body.medications); setLogs(body.logs);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load().catch(() => setMessage("Medication records will appear after storage connects.")), 0); return () => window.clearTimeout(timer); }, [load]);
  const latest = useMemo(() => new Map(logs.filter((log) => new Date(log.loggedAt).toDateString() === new Date().toDateString()).map((log) => [log.medicationId, log])), [logs]);

  const add = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try {
      const response = await fetch("/api/medications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Medication could not be saved.");
      setDraft({ name: "", formulation: "", dose: "", instructions: "", scheduleLabel: "", refillDueAt: "" }); setEditing(false); setMessage("Medication saved."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Medication could not be saved."); }
  };

  const log = async (medicationId: string, status: string) => {
    setMessage("");
    try {
      const response = await fetch("/api/medications/logs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ medicationId, status }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Check-in could not be saved.");
      setMessage(status === "taken" ? "Marked taken for today." : status === "later" ? "Saved as Later. Squirrel! will not assume you took it." : "Check-in saved."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Check-in could not be saved."); }
  };

  return <article className="panel medicationHub" id="medications">
    <div className="panelHeader"><div><p className="eyebrow">Medication Log</p><h2>Record what you took and when.</h2></div><button type="button" onClick={() => setEditing((value) => !value)}>{editing ? "Close Form" : "Add Medication"}</button></div>
    <p className="safetyNote"><strong>Record keeping only.</strong> Squirrel! does not recommend doses or tell you whether to take a missed dose. Follow your prescriber’s or pharmacist’s instructions.</p>
    {editing && <form className="medicationForm" onSubmit={add}><label className="field"><span>Name</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label className="field"><span>Type <small>(optional)</small></span><input value={draft.formulation} onChange={(event) => setDraft({ ...draft, formulation: event.target.value })} placeholder="Tablet, extended release, liquid" /></label><label className="field"><span>Prescribed dose</span><input required value={draft.dose} onChange={(event) => setDraft({ ...draft, dose: event.target.value })} /></label><label className="field"><span>When you take it</span><input value={draft.scheduleLabel} onChange={(event) => setDraft({ ...draft, scheduleLabel: event.target.value })} placeholder="Morning with food" /></label><label className="field medicationWide"><span>Instructions from your prescriber or pharmacist</span><textarea value={draft.instructions} onChange={(event) => setDraft({ ...draft, instructions: event.target.value })} /></label><label className="field"><span>Refill date</span><input type="date" value={draft.refillDueAt} onChange={(event) => setDraft({ ...draft, refillDueAt: event.target.value })} /></label><button type="submit">Save Medication</button></form>}
    {message && <p className="brainMessage" role="status">{message}</p>}
    <div className="medicationList">{medications.filter((medication) => medication.active).length === 0 ? <p className="emptyResult">No medications added. This section stays quiet until you need it.</p> : medications.filter((medication) => medication.active).map((medication) => <section className="medicationRow" key={medication.id}><div><strong>{medication.name}{medication.formulation ? ` ${medication.formulation}` : ""}</strong><small>{medication.dose}{medication.scheduleLabel ? ` · ${medication.scheduleLabel}` : ""}</small>{medication.refillDueAt && <small>Refill date: {medication.refillDueAt}</small>}</div><div className="medicationStatus"><span>{latest.get(medication.id)?.status || "not checked in"}</span><button type="button" onClick={() => void log(medication.id, "taken")}>Taken</button><button className="quietButton" type="button" onClick={() => void log(medication.id, "later")}>Later</button><button className="quietButton" type="button" onClick={() => void log(medication.id, "skipped")}>Skipped</button></div></section>)}</div>
  </article>;
}
