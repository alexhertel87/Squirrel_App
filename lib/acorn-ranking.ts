export type AcornCandidate = {
  id: string;
  content: string;
  kind: string;
  status: string;
  energy: string;
  estimatedMinutes: number;
  brainLoad: string;
  dueAt?: string | null;
  location?: string | null;
  firstStep?: string | null;
  notes?: string | null;
  priority?: number | null;
  avoidCount?: number | null;
  context?: string | null;
  source: string;
};

export type Calibration = {
  energy: string;
  availableMinutes: number;
  location: string;
  minimumDay: boolean;
};

export type RankedAcorn = AcornCandidate & {
  score: number;
  explanation: string;
  factors: string[];
  smallestStep: string;
};

const energyLevel: Record<string, number> = { low: 1, medium: 2, high: 3 };

function dueScore(dueAt: string | null | undefined, now: Date) {
  if (!dueAt) return { score: 0, label: "" };
  const due = new Date(dueAt);
  if (!Number.isFinite(due.getTime())) return { score: 0, label: "" };
  const hours = (due.getTime() - now.getTime()) / 3_600_000;
  if (hours < 0) return { score: 65, label: "it is overdue" };
  if (hours <= 24) return { score: 55, label: "it is due within 24 hours" };
  if (hours <= 48) return { score: 38, label: "it is due tomorrow" };
  if (hours <= 168) return { score: 22, label: "it is due this week" };
  return { score: 4, label: "it has a future due date" };
}

function smallestStep(acorn: AcornCandidate) {
  if (acorn.firstStep?.trim()) return acorn.firstStep.trim();
  const firstWord = acorn.content.trim().split(/\s+/)[0]?.toLowerCase();
  if (["email", "message", "text", "call"].includes(firstWord)) return `Open the contact or message for “${acorn.content}.”`;
  if (["upload", "submit", "finish", "write", "read"].includes(firstWord)) return `Open the file, page, or app needed for “${acorn.content}.”`;
  if (["buy", "refill", "pick"].includes(firstWord)) return `Open the store, list, or ordering page for “${acorn.content}.”`;
  return `Put the first needed item or screen for “${acorn.content}” in front of you.`;
}

export function rankAcorns(candidates: AcornCandidate[], calibration: Calibration, now = new Date()): RankedAcorn[] {
  const currentEnergy = energyLevel[calibration.energy] ?? 2;
  return candidates
    .filter((candidate) => !["complete", "released", "delegated"].includes(candidate.status))
    .map((candidate) => {
      let score = candidate.status === "next" ? 28 : 0;
      const factors: string[] = [];
      const candidateEnergy = energyLevel[candidate.energy] ?? 2;

      if (candidate.estimatedMinutes <= calibration.availableMinutes) {
        score += 26;
        factors.push(`fits your ${calibration.availableMinutes}-minute window`);
      } else {
        score -= Math.min(42, candidate.estimatedMinutes - calibration.availableMinutes + 20);
      }

      if (candidateEnergy <= currentEnergy) {
        score += 24;
        factors.push(`matches ${calibration.energy} energy`);
      } else {
        score -= (candidateEnergy - currentEnergy) * 20;
      }

      const due = dueScore(candidate.dueAt, now);
      score += due.score;
      if (due.label) factors.push(due.label);

      const priority = Math.max(1, Math.min(3, candidate.priority ?? 2));
      score += (4 - priority) * 8;
      if (priority === 1) factors.push("you marked it important");

      const desiredLocation = calibration.location || "anywhere";
      const taskLocation = candidate.location || candidate.context || "anywhere";
      if (taskLocation === "anywhere" || desiredLocation === "anywhere" || taskLocation === desiredLocation) {
        score += 12;
        if (taskLocation !== "anywhere") factors.push(`works at ${taskLocation}`);
      } else {
        score -= 35;
      }

      if (calibration.minimumDay) {
        if (candidate.estimatedMinutes <= 15 && candidateEnergy <= 1) score += 30;
        if (candidate.kind === "reminder") score += 12;
      }

      score -= Math.min(18, Math.max(0, candidate.avoidCount ?? 0) * 4);
      const visibleFactors = factors.slice(0, 3);
      const explanation = visibleFactors.length
        ? `I chose this because it ${visibleFactors.join(", ")}.`
        : "I chose this as the clearest available next move.";

      return {
        ...candidate,
        score,
        explanation,
        factors: visibleFactors,
        smallestStep: smallestStep(candidate),
      };
    })
    .sort((left, right) => right.score - left.score || left.estimatedMinutes - right.estimatedMinutes);
}
