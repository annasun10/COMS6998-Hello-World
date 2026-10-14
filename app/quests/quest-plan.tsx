import { splitQuestPlan } from "@/lib/quest-plan";

export default function QuestPlan({ plan }: { plan: string }) {
  const steps = splitQuestPlan(plan);
  return <details className="mini-plan">
    <summary><span>Your mini-plan</span><span className="mini-plan-toggle" aria-hidden="true">↗</span></summary>
    <ol className="mini-plan-steps">
      {steps.map((step, index) => <li key={index}>
        <span className="mini-plan-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <p>{step}</p>
      </li>)}
    </ol>
    <p className="mini-plan-note">AI inspiration. Check access and conditions before heading out.</p>
  </details>;
}
