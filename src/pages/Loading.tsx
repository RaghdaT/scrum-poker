import {
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

function Loading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress />

      <Typography color="text.secondary">
        Connecting to Scrum Poker...
      </Typography>
    </Box>
  );
}

export default Loading;