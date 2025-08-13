// src/components/PrimitiveCanvas.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Typography, Chip, Popover, Stack } from "@mui/material";
import { ResponsiveContainer, LineChart, Line } from "recharts";

/*
Props:
 - nodes: array [{id,label,owner,color,slaHrs}]
 - events: array [{caseId,activity,timestamp,durationSecs,lifecycle}]
 - highlightedIndex: integer
 - deviatedIds: Set<string> (ids to highlight as deviation)
 - sparklineData: { [label]: [{v,t}, ...] }
 - onNodeClick(id)
*/

export default function PrimitiveCanvas({
  nodes = [],
  events = [],
  highlightedIndex = -1,
  deviatedIds = new Set(),
  sparklineData = {},
  onNodeClick = () => {}
}) {
  const [anchor, setAnchor] = useState(null);
  const [popoverNode, setPopoverNode] = useState(null);
  const containerRef = useRef(null);
  const nodeRefs = useRef({}); // id -> ref

  // metrics per node (count, avgSecs, onTime%)
  const metrics = useMemo(() => {
    const map = {};
    for (const n of nodes) map[n.label] = { count: 0, avgSecs: 0, onTimeCount: 0, durations: [] };
    for (const e of events) {
      if (!map[e.activity]) continue;
      map[e.activity].count += 1;
      map[e.activity].durations.push(e.durationSecs || 0);
      map[e.activity].avgSecs = Math.round(
        map[e.activity].durations.reduce((a, b) => a + b, 0) / map[e.activity].durations.length
      );
      // on-time relative to node.slaHrs if exists
      const node = nodes.find(n => n.label === e.activity);
      if (node && node.slaHrs) {
        if ((e.durationSecs || 0) <= node.slaHrs * 3600) map[e.activity].onTimeCount += 1;
      }
    }
    return map;
  }, [nodes, events]);

  function openPopover(e, node) {
    setPopoverNode(node);
    setAnchor(e.currentTarget);
  }
  function closePopover() {
    setPopoverNode(null);
    setAnchor(null);
  }

  // helper for formatting
  const fmt = (s) => {
    if (!s) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m`;
    return `${s}s`;
  };

  // compute explain text (hottest bottleneck)
  const explain = useMemo(() => {
    if (!nodes.length || !events.length) return "No data yet to explain.";
    // choose node with highest avgSecs or highest delayed ratio
    let worst = null;
    let maxScore = -Infinity;
    for (const n of nodes) {
      const m = metrics[n.label] || { avgSecs: 0, count: 0 };
      // score: avgSecs * sqrt(count)
      const score = (m.avgSecs || 0) * Math.sqrt(m.count || 1);
      if (score > maxScore) { maxScore = score; worst = { node: n, m }; }
    }
    if (!worst) return "No bottlenecks detected.";
    const pctOnTime = worst.m.count ? Math.round(((worst.m.onTimeCount || 0) / worst.m.count) * 100) : 100;
    const oneLine = `${worst.node.label} is the current hotspot — avg ${fmt(worst.m.avgSecs)}; on-time ${pctOnTime}%.`;
    return oneLine;
  }, [nodes, events, metrics]);

  // expose scroll to highlighted node
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < nodes.length) {
      const id = nodes[highlightedIndex].id;
      const el = nodeRefs.current[id];
      if (el && el.scrollIntoView) {
        // center it in container
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // also flash subtle animation via class (handled in CSS)
        el.classList.add("flash-highlight");
        setTimeout(() => el.classList.remove("flash-highlight"), 1200);
      }
    }
  }, [highlightedIndex, nodes]);

  return (
    <Box ref={containerRef} sx={{ display: "flex", gap: 2, flexDirection: "column", maxHeight: "70vh", overflow: "auto", p: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Primitive Process (Top → Bottom)</Typography>
        <Chip label="Explain: click for one-line" onClick={() => alert(explain)} clickable />
      </Box>

      {/* vertical nodes with connectors between them */}
      {nodes.map((n, idx) => {
        const m = metrics[n.label] || {};
        const pctOnTime = m.count ? Math.round(((m.onTimeCount || 0) / m.count) * 100) : 100;
        const isHighlighted = idx === highlightedIndex;
        const isDeviated = deviatedIds.has(n.id);
        return (
          <Box key={n.id} sx={{ display: "flex", gap: 2, alignItems: "center", position: "relative" }}>
            {/* left small marker / icon */}
            <Box sx={{ width: 16, display: "flex", justifyContent: "center" }}>
              <Box sx={{
                width: 10, height: 10, borderRadius: 2, bgcolor: n.color || "primary.main",
                boxShadow: isHighlighted ? `0 0 10px ${n.color || "#22c55e"}` : "none",
                transition: "box-shadow .2s"
              }} />
            </Box>

            {/* node card */}
            <Paper
              ref={el => { nodeRefs.current[n.id] = el; }}
              onMouseEnter={(e) => openPopover(e, n)}
              onMouseLeave={closePopover}
              onClick={() => onNodeClick(n.id)}
              elevation={isHighlighted ? 8 : 3}
              className={isDeviated ? "deviated-node" : ""}
              sx={{
                p: 1.25, width: "100%", borderRadius: 2, cursor: "pointer",
                border: isHighlighted ? "2px solid" : "1px solid",
                borderColor: isHighlighted ? "primary.main" : "divider",
                transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
                "&:hover": { transform: "translateY(-4px)" },
                display: "flex", flexDirection: "column", gap: 1
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{n.label}</Typography>
                  <Chip label={`${m.count || 0} cases`} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary">{n.owner || "—"}</Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Avg: {m.avgSecs ? fmt(m.avgSecs) : "—"}</Typography>
                <Typography variant="body2" color="text.secondary">{pctOnTime}% on-time</Typography>
              </Stack>

              {/* sparkline */}
              {sparklineData[n.label] && (
                <Box sx={{ height: 48, mt: 0.5 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData[n.label]}>
                      <Line type="monotone" dataKey="v" stroke={n.color || "#8884d8"} dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            {/* connector (if not last) */}
            {idx < nodes.length - 1 && (
              <Box sx={{ position: "absolute", right: 12, top: "100%", transform: "translateY(8px)" }}>
                <div className={`connector ${isHighlighted ? "connector-glow" : ""} ${deviatedIds.has(n.id) ? "connector-deviated" : ""}`} />
              </Box>
            )}
          </Box>
        );
      })}

      {/* popover with details */}
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={closePopover} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Box sx={{ p: 2, minWidth: 260 }}>
          {popoverNode && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{popoverNode.label}</Typography>
              <Typography variant="body2" color="text.secondary">Owner: {popoverNode.owner || "—"}</Typography>
              <Typography variant="body2" color="text.secondary">SLA: {popoverNode.slaHrs ?? "—"}h</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">Recent executions</Typography>
                <Box sx={{ maxHeight: 160, overflow: "auto", mt: 1 }}>
                  {events.filter(e => e.activity === popoverNode.label).slice(0, 8).map((ev, idx) => (
                    <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", py: .5 }}>
                      <Typography variant="body2">{ev.caseId}</Typography>
                      <Typography variant="body2" color="text.secondary">{new Date(ev.timestamp).toLocaleString()}</Typography>
                    </Box>
                  ))}
                  {!events.filter(e => e.activity === popoverNode.label).length && <Typography variant="body2" color="text.secondary">No executions yet</Typography>}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </Box>
  );
}
