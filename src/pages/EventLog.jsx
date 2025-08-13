// src/pages/EventLog.jsx
import React, { useEffect, useState } from "react";
import { Paper, Typography, Stack, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";

const LOG_ID = "demo";
const headers = ["caseId","activity","timestamp","resource","lifecycle","durationSecs"];

const seedEventLog = [
  { id: uuid(), caseId: "M-1001", activity: "Receive Raw Materials", timestamp: "2025-08-10T08:05:00Z", resource: "Inbound Team", lifecycle: "complete", durationSecs: 600 },
  { id: uuid(), caseId: "M-1001", activity: "CNC Milling", timestamp: "2025-08-10T08:30:00Z", resource: "Operator Raj", lifecycle: "complete", durationSecs: 5400 },
  { id: uuid(), caseId: "M-1001", activity: "Quality Check", timestamp: "2025-08-10T10:30:00Z", resource: "Inspector Meena", lifecycle: "complete", durationSecs: 900 },
  { id: uuid(), caseId: "M-1002", activity: "Receive Raw Materials", timestamp: "2025-08-11T09:10:00Z", resource: "Inbound Team", lifecycle: "complete", durationSecs: 480 },
  { id: uuid(), caseId: "M-1002", activity: "Laser Cutting", timestamp: "2025-08-11T09:40:00Z", resource: "Operator Arun", lifecycle: "complete", durationSecs: 3600 },
  { id: uuid(), caseId: "M-1002", activity: "CNC Milling", timestamp: "2025-08-11T10:50:00Z", resource: "Operator Raj", lifecycle: "complete", durationSecs: 7200 },
  { id: uuid(), caseId: "M-1002", activity: "Quality Check", timestamp: "2025-08-11T12:40:00Z", resource: "Inspector Meena", lifecycle: "complete", durationSecs: 1200 },
  { id: uuid(), caseId: "M-1003", activity: "Assembly Line", timestamp: "2025-08-12T07:50:00Z", resource: "Team A", lifecycle: "complete", durationSecs: 3600 },
  { id: uuid(), caseId: "M-1003", activity: "Final Inspection", timestamp: "2025-08-12T09:00:00Z", resource: "Inspector Ravi", lifecycle: "complete", durationSecs: 900 },
  { id: uuid(), caseId: "M-1004", activity: "CNC Milling", timestamp: "2025-08-12T11:10:00Z", resource: "Operator Raj", lifecycle: "complete", durationSecs: 14400 } // long to represent deviation
];

export default function EventLog() {
  const [rows, setRows] = useState([]);
  const [caseId, setCaseId] = useState("");
  const [activity, setActivity] = useState("");

  useEffect(() => {
    const ref = doc(db, "eventlogs", LOG_ID);
    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        // seed realistic manufacturing log on first run
        await setDoc(ref, { rows: seedEventLog, updatedAt: new Date().toISOString() });
        setRows(seedEventLog);
      } else {
        setRows(snap.data().rows || []);
      }
    });
    return () => unsub();
  }, []);

  async function addRow() {
    if (!caseId || !activity) return;
    const ref = doc(db, "eventlogs", LOG_ID);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? (snap.data().rows || []) : [];
    const newRow = {
      id: uuid(),
      caseId,
      activity,
      timestamp: new Date().toISOString(),
      resource: "Manual",
      lifecycle: "complete",
      durationSecs: 600
    };
    prev.unshift(newRow);
    await setDoc(ref, { rows: prev, updatedAt: new Date().toISOString() });
    setCaseId(""); setActivity("");
  }

  function downloadCSV() {
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "eventlog.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800}>Event Log — Manufacturing Sample</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1, mb: 1 }}>
        <TextField size="small" label="Case ID" value={caseId} onChange={e => setCaseId(e.target.value)} />
        <TextField size="small" label="Activity" value={activity} onChange={e => setActivity(e.target.value)} />
        <Button variant="outlined" onClick={addRow}>Add</Button>
        <Button variant="contained" onClick={downloadCSV}>Export CSV</Button>
      </Stack>

      <Table size="small" sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Case</TableCell><TableCell>Activity</TableCell><TableCell>Time</TableCell><TableCell>Resource</TableCell><TableCell>Duration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            const isDeviation = r.durationSecs && r.durationSecs > 3 * 3600; // >3 hours as example
            return (
              <TableRow key={r.id || i} sx={isDeviation ? { backgroundColor: "rgba(239,68,68,0.06)" } : {}}>
                <TableCell>{r.caseId}</TableCell>
                <TableCell>{r.activity}</TableCell>
                <TableCell>{new Date(r.timestamp).toLocaleString()}</TableCell>
                <TableCell>{r.resource}</TableCell>
                <TableCell>{Math.round((r.durationSecs || 0) / 60)}m{isDeviation ? " ⚠️" : ""}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
