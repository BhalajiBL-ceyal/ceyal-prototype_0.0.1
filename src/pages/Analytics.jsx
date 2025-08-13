// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Paper, Typography, Grid, Box, Stack, Chip } from "@mui/material";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

const WORKFLOW_ID = "demo";
const LOG_ID = "demo";

export default function Analytics() {
  const [nodes, setNodes] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubN = onSnapshot(doc(db, "workflows", WORKFLOW_ID), (s) => setNodes(s.exists() ? (s.data().nodes || []) : []));
    const unsubE = onSnapshot(doc(db, "eventlogs", LOG_ID), (s) => setEvents(s.exists() ? (s.data().rows || []) : []));
    return () => { unsubN(); unsubE(); };
  }, []);

  // aggregate KPIs
  const kpis = useMemo(() => {
    const activeCases = new Set(events.map(e => e.caseId)).size;
    const completes = events.filter(e => e.lifecycle === "complete");
    const avgSecs = completes.length ? Math.round(completes.reduce((a, b) => a + (b.durationSecs || 0), 0) / completes.length) : 0;
    return { activeCases, avgSecs, completesCount: completes.length };
  }, [events]);

  // per-stage metrics & sparklines
  const perStage = useMemo(() => {
    return nodes.map(n => {
      const rows = events.filter(e => e.activity === n.label && e.lifecycle === "complete");
      const avg = rows.length ? Math.round(rows.reduce((a, b) => a + (b.durationSecs || 0), 0) / rows.length) : 0;
      const onTime = rows.filter(r => n.slaHrs ? (r.durationSecs || 0) <= n.slaHrs * 3600 : true).length;
      const pctOnTime = rows.length ? Math.round((onTime / rows.length) * 100) : 100;
      const spark = rows.slice(0, 12).map(r => ({ v: r.durationSecs || 0, t: r.timestamp })).reverse();
      return { id: n.id, label: n.label, avg, pctOnTime, spark };
    });
  }, [nodes, events]);

  // trend (dummy but nicer)
  const trend = useMemo(() => {
    // build weekly-ish trend from last 8 completes
    const last = events.filter(e => e.lifecycle === "complete").slice(0, 40);
    // group into 4 buckets
    const buckets = [[], [], [], []];
    last.forEach((r, i) => buckets[i % 4].push(r.durationSecs || 0));
    return buckets.map((b, i) => ({ name: `P${i + 1}`, val: b.length ? Math.round(b.reduce((a, c) => a + c, 0) / b.length / 60) : 0 }));
  }, [events]);

  return (
    <div>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Analytics — Easy, actionable</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Active cases</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{kpis.activeCases}</Typography>
            <Typography variant="caption" color="text.secondary">Avg time: {fmt(kpis.avgSecs)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Efficiency trend (min)</Typography>
            <Box sx={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="val" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* per-stage cards */}
        {perStage.map(ps => (
          <Grid key={ps.id} item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>{ps.label}</Typography>
                <Chip label={`${ps.pctOnTime}% on-time`} color={ps.pctOnTime >= 80 ? "success" : (ps.pctOnTime >= 50 ? "warning" : "error")} />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Avg: {fmt(ps.avg)}</Typography>

              <Box sx={{ height: 80, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ps.spark.length ? ps.spark : [{ v: 0 }, { v: 0 }]}>
                    <Line type="monotone" dataKey="v" stroke="#22c55e" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

function fmt(s) {
  const sec = Number(s || 0);
  const m = Math.round(sec / 60);
  return `${m}m`;
}
