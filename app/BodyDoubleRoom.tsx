"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

type Session = { status: string; taskLabel: string | null; startedAt: number };

export function BodyDoubleRoom({ code }: { code: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("Joining the quiet room…");
  const [minutes, setMinutes] = useState(25);

  useEffect(() => {
    fetch(`/api/body-double?code=${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "This focus room is unavailable.");
        return body.session as Session;
      })
      .then((value) => { setSession(value); setMessage(""); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "This focus room is unavailable."));
  }, [code]);

  useEffect(() => {
    if (!session || session.status !== "active" || minutes <= 0) return;
    const timer = window.setInterval(() => setMinutes((value) => Math.max(0, value - 1)), 60_000);
    return () => window.clearInterval(timer);
  }, [session, minutes]);

  return (
    <main className="bodyDoublePage">
      <section className="bodyDoubleRoom">
        <img src="/squirrel_logo.png" alt="" className="brandLogo" />
        <p className="eyebrow">Shared Focus Session</p>
        <h1>{session?.status === "complete" ? "This focus session is complete." : "Someone is focusing. You can focus beside them."}</h1>
        {session?.taskLabel && <p className="bodyDoubleTask">They chose to share: <strong>{session.taskLabel}</strong></p>}
        <div className="bodyDoubleTimer" aria-label={`${minutes} minutes remaining`}>{minutes}:00</div>
        <p>No camera, microphone, account, or task details are required. Leave whenever you need to.</p>
        {message && <p className="formMessage" role="status">{message}</p>}
      </section>
    </main>
  );
}
