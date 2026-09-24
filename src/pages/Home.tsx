import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { auth } from "../firebase/auth";

import { cleanupExpiredRooms, createRoom } from "../services/roomService";

import { navigateToRoom } from "../utils/navigation";

function Home() {
  const [name, setName] = useState("");

  const [taskId, setTaskId] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const textFieldSx = {
    "& .MuiInputBase-input": {
      fontSize: "0.95rem",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.95rem",
    },
  };

  const actionButtonSx = {
    fontSize: "0.9rem",
    fontWeight: 800,
    py: 1.1,
  };

  async function handleCreateRoom() {
    setError(null);

    const trimmedName = name.trim();

    const trimmedTaskId = taskId.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedTaskId) {
      setError("Please enter the task ID.");
      return;
    }

    if (!auth.currentUser) {
      setError("You are not connected to Firebase. Please refresh the page.");
      return;
    }

    setLoading(true);

    try {
      const task = {
        id: trimmedTaskId,
      };

      await cleanupExpiredRooms(); 
      
      const roomId = await createRoom(auth.currentUser.uid, task, trimmedName);

      navigateToRoom(roomId);
      
    } catch (err) {
      console.error(err);

      setError("Unable to create the room. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          maxWidth: 480,
          mx: "auto",
          width: "100%",
          p: {
            xs: 3,
            sm: 4,
          },
        }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 800, color: "black" }}
              gutterBottom
            >
              🃏 Scrum Poker
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Estimate your stories together.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack
            spacing={2}
            sx={{
              width: "100%",
              maxWidth: 400,
              alignSelf: "center",
            }}
          >
            <TextField
              label="Your name"
              autoComplete="off"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
              autoFocus
              size="small"
              sx={textFieldSx}
            />
            <TextField
              label="Task ID"
              autoComplete="off"
              placeholder="RPRO-5733"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              fullWidth
              required
              size="small"
              sx={textFieldSx}
            />

            <Button
              variant="contained"
              onClick={handleCreateRoom}
              loading={loading}
              disabled={loading}
              sx={actionButtonSx}
            >
              Create Room
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}

export default Home;
