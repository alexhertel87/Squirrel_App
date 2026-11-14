"use client";

import { useEffect, useState } from "react";

type Insight = { completed: number; averageMinutes: number; commonFriction: string | null };

export function OutcomeInsights() {
  const [insight, setInsight] = useState<Insight | null>(null);
  useEffect(() => { fetch("/api/insights", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((body) => setInsight(body.insights)).catch(() => undefined); }, []);
  if (!insight) return null;
  return <section className="insightStrip" aria-label="Your last 30 days"><div><p className="eyebrow">Last 30 Days</p><h2>Your recent task patterns</h2></div><article><strong>{insight.completed}</strong><span>tasks completed</span></article><article><strong>{insight.averageMinutes || "—"}</strong><span>{insight.averageMinutes ? "average estimated minutes" : "more history needed"}</span></article><article><strong>{insight.commonFriction ? insight.commonFriction.replaceAll("_", " ") : "Still learning"}</strong><span>{insight.commonFriction ? "most common reason a task was skipped" : "More history is needed"}</span></article></section>;
}
