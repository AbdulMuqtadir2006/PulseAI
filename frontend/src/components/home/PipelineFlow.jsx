import { agentFlowNodes, agentFlowEdges } from "../../data/agentFlow";

// Percentage-based layout (of the container's width/height) for each node.
// Capture -> Analysis -> Guidance runs left-to-right along the midline;
// Guidance (the manager) then branches up to the Dashboard Alert (always
// happens) and down to the Emergency Contact (only on a critical reading) —
// the branch itself is the point: it's the one decision in the pipeline.
const LAYOUT = {
  capture: { x: 9, y: 50 },
  analysis: { x: 31, y: 50 },
  guidance: { x: 54, y: 50 },
  dashboard: { x: 84, y: 22 },
  emergency: { x: 84, y: 78 },
};

function edgePath(from, to) {
  const a = LAYOUT[from];
  const b = LAYOUT[to];
  const midX = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
}

function NodeCard({ node }) {
  const pos = LAYOUT[node.id];
  const isManager = node.role === "manager";
  return (
    <div
      className="absolute w-[140px] -translate-x-1/2 -translate-y-1/2 sm:w-[176px]"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      <div
        className="rounded-xl border bg-ink/70 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3"
        style={{
          borderColor: `${node.color}40`,
          boxShadow: isManager ? `0 0 24px -6px ${node.color}55` : undefined,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: node.color, boxShadow: `0 0 6px ${node.color}` }}
          />
          <span className="text-xs font-semibold leading-tight text-white sm:text-sm">{node.label}</span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-white/45 sm:text-xs">{node.detail}</p>
      </div>
    </div>
  );
}

// A reliable, data-driven 2D replacement for the old Three.js pipeline
// scene: the same node/edge graph from data/agentFlow.js (which mirrors
// backend/app/core/pipeline.py exactly), drawn as an SVG flowchart instead
// of a WebGL scene. Percentage-space viewBox so nodes (positioned with %
// left/top) and edges (drawn in the same 0-100 coordinate space) always
// line up regardless of container size.
export function PipelineFlow() {
  return (
    <div className="relative h-full w-full">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {agentFlowEdges.map((edge) => {
          const idle = edge.status === "idle";
          return (
            <path
              key={edge.id}
              d={edgePath(edge.from, edge.to)}
              fill="none"
              stroke={edge.color}
              strokeWidth={idle ? 0.35 : 0.5}
              strokeDasharray={idle ? "1.6 1.6" : "3 2"}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={idle ? 0.35 : 0.55}
              className={idle ? undefined : "pipeline-flow-dash"}
            />
          );
        })}
      </svg>

      <span
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-ink/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35 sm:text-[10px]"
        style={{ left: "69%", top: "63%" }}
      >
        if critical
      </span>

      {agentFlowNodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}
