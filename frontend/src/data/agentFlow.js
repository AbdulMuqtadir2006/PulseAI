// Data source for the pipeline flowchart (components/home/PipelineFlow.jsx).
// Mirrors the real backend pipeline exactly (backend/app/core/pipeline.py):
// Capture -> Risk Engine -> Guidance, which always surfaces a Dashboard
// Alert and, only when the reading is critical, also notifies an Emergency
// Contact. Nothing here is aspirational — every node corresponds to a real
// function that runs on every simulated reading.

// Three functional colors, each with one meaning — never decorative:
// teal = routine/healthy flow, amber = a decision point, pulse = critical.
export const FLOW_COLORS = {
  teal: "#1FD8AA",
  amber: "#F2A93E",
  pulse: "#FF3B5C",
};

export const agentFlowNodes = [
  { id: "capture", label: "Sensor Capture", detail: "HR, HRV, SpO2, BP", color: FLOW_COLORS.teal, role: "agent" },
  { id: "analysis", label: "Risk Engine", detail: "Scores against reference ranges", color: FLOW_COLORS.teal, role: "agent" },
  { id: "guidance", label: "Guidance", detail: "Manager — narrates & decides", color: FLOW_COLORS.amber, role: "manager" },
  { id: "dashboard", label: "Dashboard Alert", detail: "Always surfaced to you", color: FLOW_COLORS.teal, role: "agent" },
  { id: "emergency", label: "Emergency Contact", detail: "Notified only if critical", color: FLOW_COLORS.pulse, role: "agent" },
];

export const agentFlowEdges = [
  { id: "capture-analysis", from: "capture", to: "analysis", color: FLOW_COLORS.teal, speed: 0.35, status: "active" },
  { id: "analysis-guidance", from: "analysis", to: "guidance", color: FLOW_COLORS.teal, speed: 0.3, status: "active" },
  { id: "guidance-dashboard", from: "guidance", to: "dashboard", color: FLOW_COLORS.teal, speed: 0.28, status: "active" },
  { id: "guidance-emergency", from: "guidance", to: "emergency", color: FLOW_COLORS.pulse, speed: 0.4, status: "idle" },
];
