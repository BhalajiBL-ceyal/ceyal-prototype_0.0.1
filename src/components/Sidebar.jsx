import React from "react";
import { NavLink } from "react-router-dom";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Paper } from "@mui/material";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import SyncIcon from "@mui/icons-material/Sync";
import InsightsIcon from "@mui/icons-material/Insights";
import ArticleIcon from "@mui/icons-material/Article";

const links = [
  { to: "/", label: "Builder", icon: <BuildCircleIcon /> },
  { to: "/mirror", label: "Live Mirror", icon: <SyncIcon /> },
  { to: "/analytics", label: "Analytics", icon: <InsightsIcon /> },
  { to: "/logs", label: "Event Log", icon: <ArticleIcon /> },
];

export default function Sidebar() {
  return (
    <Paper square sx={{ height: "100%", borderRight: 1, borderColor: "divider" }}>
      <Box sx={{ p: 1 }}>
        <List component="nav" dense>
          {links.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} style={{ color: "inherit" }}>
              {({ isActive }) => (
                <ListItemButton selected={isActive} sx={{ borderRadius: 1, mb: .5, "&:hover": { bgcolor: "action.hover" } }}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              )}
            </NavLink>
          ))}
        </List>
      </Box>
    </Paper>
  );
}
