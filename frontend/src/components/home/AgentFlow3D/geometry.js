import * as THREE from "three";

function hashUnit(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 500 - 1;
}

// Lays out an arbitrary directed graph as a left-to-right flowchart: each
// node's column ("depth") is one more than the deepest parent pointing to
// it, roots start at depth 0. Nodes sharing a depth stack vertically,
// centered. Fully data-driven — add/remove nodes or edges and the layout
// just adapts.
export function layeredFlowLayout(nodes, edges, { xSpacing = 2.2, ySpacing = 1.3, zJitter = 0.55 } = {}) {
  const depth = new Map(nodes.map((n) => [n.id, 0]));
  const ids = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => ids.has(e.from) && ids.has(e.to));

  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of validEdges) {
      const next = depth.get(e.from) + 1;
      if (next > depth.get(e.to)) {
        depth.set(e.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const layers = new Map();
  for (const n of nodes) {
    const d = depth.get(n.id);
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d).push(n.id);
  }

  const maxDepth = Math.max(0, ...Array.from(layers.keys()));
  const positions = {};
  for (const [d, idsInLayer] of layers) {
    const count = idsInLayer.length;
    idsInLayer.forEach((id, i) => {
      const x = (d - maxDepth / 2) * xSpacing;
      const y = (i - (count - 1) / 2) * ySpacing;
      const z = hashUnit(id) * zJitter;
      positions[id] = new THREE.Vector3(x, y, z);
    });
  }
  return positions;
}

// A gentle 3D bow between two nodes — bows upward and slightly toward the
// camera so edges read as cables floating in space.
export function buildArcCurve(start, end, { lift = 0.55 } = {}) {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const dist = start.distanceTo(end);
  const bow = lift + dist * 0.16;
  const control = mid.clone().add(new THREE.Vector3(0, bow, bow * 0.5));
  return new THREE.QuadraticBezierCurve3(start.clone(), control, end.clone());
}
