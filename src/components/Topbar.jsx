import React from "react";
import { AppBar, Toolbar, Typography, Box, Chip } from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

export default function Topbar() {
  return (
    <AppBar position="static" elevation={0} color="inherit" sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar>
        <AutoGraphIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 800, mr: 2 }}>Ceyel</Typography>
        <Chip size="small" label="Prototype" sx={{ mr: 1 }} />
        <Chip size="small" label="Firebase" variant="outlined" />

        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">Investor Demo</Typography>
      </Toolbar>
    </AppBar>
  );
}
