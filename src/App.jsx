import React from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import Builder from "./pages/Builder";
import LiveMirror from "./pages/LiveMirror";
import Analytics from "./pages/Analytics";
import EventLog from "./pages/EventLog";
import { Box, Breadcrumbs, Container, Typography } from "@mui/material";

export default function App() {
  const location = useLocation();
  const crumbs = location.pathname.split("/").filter(Boolean);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr", gridTemplateRows: "64px 1fr", height: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ gridColumn: "1 / 3" }}>
        <Topbar />
      </Box>

      <Box sx={{ gridRow: "2", gridColumn: "1 / 2" }}>
        <Sidebar />
      </Box>

      <Box sx={{ gridRow: "2", gridColumn: "2 / 3", overflow: "auto" }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/">Home</Link>
            {crumbs.map((c, i) => (
              <Typography key={i} color="text.secondary" sx={{ textTransform: "capitalize" }}>{c || "home"}</Typography>
            ))}
          </Breadcrumbs>

          <Routes>
            <Route path="/" element={<Builder />} />
            <Route path="/mirror" element={<LiveMirror />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/logs" element={<EventLog />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}
