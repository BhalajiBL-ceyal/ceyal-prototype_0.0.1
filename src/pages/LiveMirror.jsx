// src/pages/LiveMirror.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paper, Typography, Stack, IconButton, Button, Tooltip, Modal, Box } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import ReplayIcon from "@mui/icons-material/Replay";
import { db } from "../firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import PrimitiveCanvas from "../components/PrimitiveCanvas";
import { runSimulation as simulateWorkflow } from "../utils/simulation";

export default function LiveMirror() {
  // ----- States -----
  const [workflow, setWorkflow] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [eventLog, setEventLog] = useState([]);
  const [currentBottleneck, setCurrentBottleneck] = useState(null);
  const [deviations, setDeviations] = useState([]);
  const [aiExplain, setAiExplain] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [events, setEvents] = useState([]);
  const [highlight, setHighlight] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [deviatedIds, setDeviatedIds] = useState(new Set());
  const playRef = useRef(null);
  // Assume WID, LOGID, and SIMID are defined or passed as props
  const WID = "your_workflow_id";
  const LOGID = "your_eventlog_id";
  const SIMID = "your_simulation_id";

  // ----- Simulation Example -----
  const manufacturingExampleLog = [
    { id: 1, step: "Raw Material Received", time: "2025-08-13 09:00" },
    { id: 2, step: "Quality Check", time: "2025-08-13 10:00" },
    { id: 3, step: "Assembly", time: "2025-08-13 13:00" },
    { id: 4, step: "Packaging", time: "2025-08-13 15:30" },
    { id: 5, step: "Dispatch", time: "2025-08-13 17:00" },
  ];

  // ----- Helper Functions -----
  const updateLiveMirror = (newWorkflow) => setWorkflow(newWorkflow);
  const updateAnalytics = (newAnalytics) => setAnalytics(newAnalytics);
  const updateEventLog = (newEventLog) => setEventLog(newEventLog);
  const setBottleneck = (bottleneck) => setCurrentBottleneck(bottleneck);

  const handleSimulation = () => {
    // This is the simulation logic you had, now correctly placed
    const simulatedWorkflow = [
      { id: 1, name: "Raw Material Check", status: "Completed", time: 5 },
      { id: 2, name: "Cutting & Shaping", status: "In Progress", time: 12 },
      { id: 3, name: "Assembly", status: "Pending", time: 0 },
      { id: 4, name: "Quality Check", status: "Pending", time: 0 },
      { id: 5, name: "Packaging", status: "Pending", time: 0 },
    ];
    const simulatedAnalytics = {
      efficiency: 85,
      throughput: 40,
      bottleneck: "Cutting & Shaping",
    };
    const simulatedEventLog = [
      { id: 1, step: "Raw Material Check", event: "Completed", timestamp: "2025-08-13 10:00" },
      { id: 2, step: "Cutting & Shaping", event: "Delay due to machine maintenance", timestamp: "2025-08-13 10:15" },
      { id: 3, step: "Assembly", event: "Pending start", timestamp: "2025-08-13 10:20" },
    ];

    setWorkflow(simulatedWorkflow);
    setAnalytics(simulatedAnalytics);
    setEventLog(simulatedEventLog);
    setCurrentBottleneck(simulatedAnalytics.bottleneck);
    
    // Original logic for detecting deviations
    const foundDeviations = simulatedEventLog.filter(log => log.delayMinutes && log.delayMinutes > 10);
    setDeviations(foundDeviations);
    if (foundDeviations.length > 0) {
      const biggest = foundDeviations.reduce((a, b) => a.delayMinutes > b.delayMinutes ? a : b);
      setCurrentBottleneck(biggest.step);
      setAiExplain(`The bottleneck is at "${biggest.step}" with a delay of ${biggest.delayMinutes} minutes.`);
    }
  };

  // ----- Playback Functions -----
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    u.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function speakSingle(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    u.lang = "en-US";
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startPlay() {
    const lastCase = events[0]?.caseId;
    if (!lastCase) return;
    const trace = events.filter((e) => e.caseId === lastCase).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (!trace.length) return;

    const narration = `Playing trace for case ${lastCase}. This trace contains ${trace.length} steps.`;
    speak(narration);
    setPlaying(true);
    let idx = 0;
    playRef.current = setInterval(() => {
      if (idx >= trace.length) {
        clearInterval(playRef.current);
        setPlaying(false);
        setHighlight(-1);
        return;
      }
      const act = trace[idx].activity;
      const nodeIdx = nodes.findIndex((n) => n.label === act);
      if (nodeIdx >= 0) setHighlight(nodeIdx);
      speakSingle(`Step ${idx + 1}: ${act}`);
      idx += 1;
    }, 1200);
  }

  function stopPlay() {
    clearInterval(playRef.current);
    setPlaying(false);
    setHighlight(-1);
  }

  // ----- Quick explain one-liner -----
  const explainOneLine = useMemo(() => {
    if (!nodes.length || !events.length) return "No data yet to explain.";
    const avgMap = {};
    for (const e of events.filter((r) => r.lifecycle === "complete")) {
      avgMap[e.activity] = avgMap[e.activity] || { sum: 0, c: 0 };
      avgMap[e.activity].sum += e.durationSecs || 0;
      avgMap[e.activity].c += 1;
    }
    let worstAct = null;
    let worstAvg = -1;
    for (const [act, v] of Object.entries(avgMap)) {
      const avg = v.sum / v.c;
      if (avg > worstAvg) {
        worstAvg = avg;
        worstAct = act;
      }
    }
    if (!worstAct) return "No bottlenecks detected.";
    return `${worstAct} is the hottest bottleneck (avg ${Math.round(worstAvg / 60)}m).`;
  }, [nodes, events]);

  const speakOneLiner = (text) => speak(text);

  // ----- Firestore Subscriptions -----
  useEffect(() => {
    const ref = doc(db, "workflows", WID);
    const unsub = onSnapshot(ref, (snap) => setNodes(snap.exists() ? snap.data().nodes || [] : []));
    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = doc(db, "eventlogs", LOGID);
    const unsub = onSnapshot(ref, (snap) => setEvents(snap.exists() ? snap.data().rows || [] : []));
    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = doc(db, "simulations", SIMID);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setDeviatedIds(new Set());
        return;
      }
      const history = snap.data().history || [];
      if (!history.length) return;
      const latestSim = history[0];
      const simRows = latestSim.rows || [];

      const elogRef = doc(db, "eventlogs", LOGID);
      const elogSnap = await getDoc(elogRef);
      const prevRows = elogSnap.exists() ? elogSnap.data().rows || [] : [];
      const baseline = {};
      for (const r of prevRows.filter((r) => r.lifecycle === "complete")) {
        baseline[r.activity] = baseline[r.activity] || { sum: 0, c: 0 };
        baseline[r.activity].sum += r.durationSecs || 0;
        baseline[r.activity].c += 1;
      }
      for (const k of Object.keys(baseline)) {
        baseline[k] = baseline[k].sum / (baseline[k].c || 1);
      }

      const simAgg = {};
      for (const r of simRows) {
        simAgg[r.activity] = simAgg[r.activity] || { sum: 0, c: 0 };
        simAgg[r.activity].sum += r.durationSecs || 0;
        simAgg[r.activity].c += 1;
      }
      const deviated = new Set();
      for (const act of Object.keys(simAgg)) {
        const simAvg = simAgg[act].sum / simAgg[act].c;
        const baseAvg = baseline[act] || simAvg * 0.9;
        const diff = (simAvg - baseAvg) / (baseAvg || 1);
        if (diff > 0.15) {
          nodes.filter((n) => n.label === act).forEach((n) => deviated.add(n.id));
        }
      }
      setDeviatedIds(deviated);
    });
    return () => unsub();
  }, [nodes]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: "20%", background: "#f4f4f4", padding: "10px" }}>
        <h3>Controls</h3>
        <button onClick={handleSimulation} style={{ marginBottom: "10px" }}>
          Run Simulation
        </button>
        <Tooltip title="AI Explanation of bottleneck" arrow>
          <button onClick={() => setModalOpen(true)}>Explain</button>
        </Tooltip>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <Box sx={{ background: "white", padding: 3, margin: "20px auto", width: 400 }}>
            <h3>AI Explain Mode</h3>
            <p>{aiExplain || "No bottleneck detected yet."}</p>
          </Box>
        </Modal>
      </div>

      {/* Workflow Canvas & Controls */}
      <div style={{ flex: 1, background: "#fff", padding: "10px", overflow: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={800}>Live Workflow Mirror (Primitive Vertical)</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<VolumeUpIcon />} onClick={() => speakOneLiner(explainOneLine)}>
              Explain
            </Button>
            <Button variant="contained" color="primary" onClick={handleSimulation}>
              Run Manufacturing Simulation
            </Button>
            {playing ? (
              <IconButton onClick={stopPlay}><PauseIcon /></IconButton>
            ) : (
              <IconButton onClick={startPlay}><PlayArrowIcon /></IconButton>
            )}
            <IconButton onClick={() => { stopPlay(); startPlay(); }}><ReplayIcon /></IconButton>
          </Stack>
        </Stack>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <PrimitiveCanvas
            nodes={nodes}
            events={events}
            highlightedIndex={highlight}
            deviatedIds={deviatedIds}
            sparklineData={{}}
            onNodeClick={(id) => {
              const idx = nodes.findIndex((n) => n.id === id);
              if (idx >= 0) setHighlight(idx);
            }}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Quick Insights</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Explain: {explainOneLine}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Latest event: {events[0] ? `${events[0].activity} (${events[0].caseId})` : "—"}
          </Typography>
          {currentBottleneck && (
            <Tooltip title={`Bottleneck: ${currentBottleneck} — This step is slowing production`} arrow>
              <Typography variant="body1" color="error">
                {currentBottleneck}
              </Typography>
            </Tooltip>
          )}
        </Paper>
      </div>

      {/* Event Log */}
      <div style={{ width: "25%", background: "#fafafa", padding: "10px", overflow: "auto" }}>
        <h3>Event Log</h3>
        {(eventLog.length > 0 ? eventLog : manufacturingExampleLog).map((log, idx) => (
          <div key={idx} style={{ borderBottom: "1px solid #ddd", padding: "8px 0", background: deviations.some(d => d.step === log.step) ? "#fff3f3" : "transparent" }}>
            <strong>{log.step || log.name}</strong> - {log.time || log.timestamp}
            {log.delayMinutes && <span style={{ color: "red", marginLeft: "5px" }}> (+{log.delayMinutes} min delay)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}