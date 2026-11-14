"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useState } from "react";

export function SharedCapture({ initialValue }: { initialValue: string }) {
  const [content, setContent] = useState(initialValue);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/acorns", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "This item could not be saved yet.");
      window.location.assign("/dashboard#get-squirrelly");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This item could not be saved yet.");
    } finally { setSaving(false); }
  };

  return <main className="capturePage"><form className="captureCard" onSubmit={save}><img src="/squirrel_logo.png" alt="" className="brandLogo" /><p className="eyebrow">Shared with Squirrel!</p><h1>Save this to your task inbox.</h1><textarea aria-label="Task or note to save" autoFocus value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} /><button type="submit" disabled={saving || !content.trim()}>{saving ? "Saving…" : "Save To Inbox"}</button>{message && <p role="status">{message}</p>}<a href="/dashboard">Cancel</a></form></main>;
}
