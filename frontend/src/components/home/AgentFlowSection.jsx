import { Section } from "./Section";
import { PipelineFlow } from "./PipelineFlow";
import { agentFlowNodes, agentFlowEdges } from "../../data/agentFlow";

export function AgentFlowSection() {
  return (
    <Section
      id="pipeline"
      kicker="02"
      eyebrow="Live under the hood"
      title="Watch a reading move through the pipeline."
      intro="Every reading runs the same real chain — capture, risk scoring, guidance — and always surfaces to your dashboard. Only when a reading is critical does Guidance also dispatch to your emergency contact."
    >
      <div className="glass-card relative h-[360px] overflow-hidden sm:h-[420px] md:h-[460px]">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" aria-hidden="true" />
        <PipelineFlow />

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
    </Section>
  );
}
