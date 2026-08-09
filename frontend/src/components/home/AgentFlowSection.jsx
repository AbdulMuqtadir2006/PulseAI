import { Section } from "./Section";
import { AgentFlow3D } from "./AgentFlow3D";
import { agentFlowNodes, agentFlowEdges } from "../../data/agentFlow";

export function AgentFlowSection() {
  return (
    <Section
      id="pipeline"
      eyebrow="Live Under The Hood"
      title="Watch a reading move through the pipeline."
      intro="Every reading runs the same real chain — capture, risk scoring, guidance — and always surfaces to your dashboard. Only when a reading is critical does Guidance also dispatch to your emergency contact."
    >
      <div className="glass-card relative h-[440px] overflow-hidden sm:h-[520px] md:h-[600px]">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" aria-hidden="true" />
        <AgentFlow3D />

        <p className="sr-only">
          Pipeline, in order: {agentFlowNodes.map((n) => n.label).join(" → ")}. Connections:{" "}
          {agentFlowEdges
            .map((e) => {
              const from = agentFlowNodes.find((n) => n.id === e.from)?.label ?? e.from;
              const to = agentFlowNodes.find((n) => n.id === e.to)?.label ?? e.to;
              return `${from} to ${to}`;
            })
            .join(", ")}
          .
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 gap-y-3" aria-hidden="true">
        {agentFlowNodes.map((node) => (
          <span
            key={node.id}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-white/70"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: node.color, boxShadow: `0 0 8px ${node.color}` }}
            />
            {node.label}
          </span>
        ))}
      </div>
    </Section>
  );
}
