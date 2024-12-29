import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import { HashRouter, Route, Routes } from "react-router";

import ModeSelectPage from "./ModeSelectPage";
import PuzzlePage from "./PuzzlePage";

export default function App(): JSX.Element {
  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Hanging Pieces Game</Typography>
        </Toolbar>
      </AppBar>

      <HashRouter>
        <Routes>
          <Route path="/" element={<ModeSelectPage />} />
          <Route path="/puzzle/:modeIndex" element={<PuzzlePage />} />
        </Routes>
      </HashRouter>
    </Box>
  );
}
