import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { MODES } from "./constants";

export default function ModeSelectPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Paper sx={{ p: 4, width: 300 }} elevation={3}>
        <Typography variant="h6" gutterBottom>
          Find Hanging Pieces of:
        </Typography>
        <Stack spacing={2}>
          {MODES.map((mode, index) => (
            <Button
              key={mode.description}
              variant="outlined"
              onClick={() => navigate(`/puzzle/${index}`)}
            >
              {mode.description}
            </Button>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
