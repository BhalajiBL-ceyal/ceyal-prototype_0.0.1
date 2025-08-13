import React from "react";
import { Paper, Typography, Chip, Stack } from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

export default function NodeCard({ node, listeners, attributes, refFn, selected }) {
  return (
    <Paper
      ref={refFn}
      {...attributes}
      {...listeners}
      elevation={selected ? 6 : 3}
      sx={{
        p: 1.5,
        width: 260,
        cursor: "grab",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        transition: "transform .12s ease, box-shadow .12s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 6 }
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <AccountTreeIcon sx={{ color: node.color || "primary.main" }} />
        <Typography fontWeight={700}>{node.label}</Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
        <Chip size="small" label={`Owner: ${node.owner || "—"}`} />
        <Chip size="small" label={`SLA: ${node.slaHrs ?? 0}h`} variant="outlined" />
      </Stack>
    </Paper>
  );
}
