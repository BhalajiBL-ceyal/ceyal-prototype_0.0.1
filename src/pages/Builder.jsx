import React, { useEffect, useMemo, useState } from "react";
import { Grid, Paper, Typography, Stack, TextField, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import { db } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { v4 as uuid } from "uuid";

/* dnd-kit */
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import NodeCard from "../components/NodeCard";

const WORKFLOW_ID = "demo";

function SortableItem({ item, selectedId, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  return (
    <div style={style} onClick={() => onSelect(item.id)}>
      <NodeCard node={item} listeners={listeners} attributes={attributes} refFn={setNodeRef} selected={selectedId === item.id} />
    </div>
  );
}

export default function Builder() {
  const [palette] = useState([
    { id: "p1", label: "Receive Order", color: "#10b981" },
    { id: "p2", label: "Quality Check", color: "#f59e0b" },
    { id: "p3", label: "Approve", color: "#ef4444" },
    { id: "p4", label: "Pack & Ship", color: "#6366f1" },
    { id: "p5", label: "Notify Customer", color: "#06b6d4" }
  ]);

  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Sensors for drag
  const sensors = useSensors(useSensor(PointerSensor));

  // Sync from Firestore (single doc for demo)
  useEffect(() => {
    const ref = doc(db, "workflows", WORKFLOW_ID);
    const sub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setNodes(snap.data().nodes || []);
      } else {
        const seed = [
          { id: uuid(), label: "Receive Order", owner: "Employee 1", slaHrs: 2, color: "#10b981" },
          { id: uuid(), label: "Quality Check", owner: "Employee 2", slaHrs: 6, color: "#f59e0b" }
        ];
        await setDoc(ref, { nodes: seed, updatedAt: new Date().toISOString() });
        setNodes(seed);
      }
    });
    return () => sub();
  }, []);

  const ids = useMemo(() => nodes.map(n => n.id), [nodes]);
  const selected = useMemo(() => nodes.find(n => n.id === selectedId) || null, [nodes, selectedId]);

  async function persist(list) {
    const ref = doc(db, "workflows", WORKFLOW_ID);
    await setDoc(ref, { nodes: list, updatedAt: new Date().toISOString() });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = nodes.findIndex(n => n.id === active.id);
    const newIndex = nodes.findIndex(n => n.id === over.id);
    const rearranged = arrayMove(nodes, oldIndex, newIndex);
    setNodes(rearranged);
    persist(rearranged);
  }

  function addFromPalette(p) {
    const newNode = { id: uuid(), label: p.label, owner: "", slaHrs: 4, color: p.color };
    const list = [...nodes, newNode];
    setNodes(list);
    persist(list);
    setSelectedId(newNode.id);
  }

  function removeSelected() {
    if (!selected) return;
    const list = nodes.filter(n => n.id !== selected.id);
    setNodes(list);
    persist(list);
    setSelectedId(null);
  }

  function updateField(field, value) {
    if (!selected) return;
    const list = nodes.map(n => n.id === selected.id ? { ...n, [field]: value } : n);
    setNodes(list);
    persist(list);
  }

  return (
    <Grid container spacing={2}>
      {/* Sidebar (Palette) */}
      <Grid item xs={12} md={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800}>Palette</Typography>
          <Stack spacing={1.2} sx={{ mt: 1 }}>
            {palette.map(p => (
              <Paper key={p.id} variant="outlined"
                     sx={{
                       p: 1.5, cursor: "pointer",
                       borderColor: `${p.color}55`,
                       "&:hover": { bgcolor: "action.hover" }
                     }}
                     onClick={() => addFromPalette(p)}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <span style={{ width: 10, height: 10, background: p.color, borderRadius: 3 }} />
                  <Typography>{p.label}</Typography>
                  <AddIcon fontSize="small" sx={{ ml: "auto" }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Grid>

      {/* Canvas (Drag & Drop) */}
      <Grid item xs={12} md={6}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={800}>Workflow Canvas</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => { setNodes([]); persist([]); setSelectedId(null); }}>Clear</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={() => persist(nodes)}>Save</Button>
            </Stack>
          </Stack>

          <Paper variant="outlined" sx={{ mt: 2, p: 2, minHeight: 320, bgcolor: "background.paper", borderStyle: "dashed" }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ids} strategy={rectSortingStrategy}>
                <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
                  {nodes.map(item => (
                    <SortableItem key={item.id} item={item} selectedId={selectedId} onSelect={setSelectedId} />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
            {!nodes.length && (
              <Typography color="text.secondary">Canvas empty — click items on the left to add steps.</Typography>
            )}
          </Paper>
        </Paper>
      </Grid>

      {/* Properties */}
      <Grid item xs={12} md={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={800}>Properties</Typography>
          {!selected ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>Select a step to edit its properties.</Typography>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <TextField label="Label" value={selected.label} onChange={e => updateField("label", e.target.value)} size="small" />
              <TextField label="Owner" value={selected.owner || ""} onChange={e => updateField("owner", e.target.value)} size="small" />
              <TextField label="SLA (hours)" type="number" value={selected.slaHrs ?? 0} onChange={e => updateField("slaHrs", Number(e.target.value) || 0)} size="small" />
              <Stack direction="row" spacing={1} alignItems="center">
                <ColorLensIcon fontSize="small" />
                <TextField
                  label="Color"
                  value={selected.color || "#0ea5a4"}
                  onChange={e => updateField("color", e.target.value)}
                  size="small"
                  placeholder="#0ea5a4"
                />
              </Stack>
              <Divider />
              <Button color="error" variant="outlined" onClick={removeSelected} startIcon={<DeleteOutlineIcon />}>Remove Step</Button>
            </Stack>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
