import { useEffect, useRef, useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import NewTaskDialog from "../components/NewTaskDialog";
import PlayerCard from "../components/PlayerCard";
import { auth } from "../firebase/auth";

import {
  castVote,
  joinRoom,
  markPlayerAsVoted,
  revealVotes,
  startNewTask,
  subscribeToRoom,
  subscribeToVotes,
} from "../services/roomService";

import type {
  PokerValue,
  Room as RoomData,
  Task,
} from "../models/room";

import { POKER_VALUES } from "../utils/poker";
import {
  findMostCommonVotes,
  formatPokerValue,
} from "../utils/results";

import Loading from "./Loading";

function Room() {
  const roomId = window.location.hash.replace("#/room/", "");

  const [room, setRoom] = useState<RoomData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const [copyingLink, setCopyingLink] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const [name, setName] = useState("");

  const [joining, setJoining] = useState(false);

  const [voting, setVoting] = useState(false);

  const [revealing, setRevealing] = useState(false);

  const [startingNewTask, setStartingNewTask] = useState(false);

  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);

  const [selectedVote, setSelectedVote] =
    useState<PokerValue | null>(null);

  const [revealedVotes, setRevealedVotes] =
    useState<Record<string, PokerValue>>({});

  const previousRoomStatus = useRef(room?.status);

  useEffect(() => {
    if (!roomId) {
      setError("Invalid room ID.");
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToRoom(
      roomId,
      (roomData) => {
        setRoom(roomData);
        setLoading(false);
      },
      (err) => {
        console.error("Firebase room error:", err);

        setError("Unable to load the room.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [roomId]);

  useEffect(() => {
    if (room?.status !== "revealed") {
      setRevealedVotes({});
      return;
    }

    const unsubscribe = subscribeToVotes(
      roomId,
      setRevealedVotes,
      (err) => {
        console.error("Firebase votes error:", err);

        setError("Unable to load revealed votes.");
      },
    );

    return unsubscribe;
  }, [room?.status, roomId]);

  useEffect(() => {
    const returnedToVoting =
      previousRoomStatus.current === "revealed" &&
      room?.status === "voting";

    if (returnedToVoting) {
      setSelectedVote(null);
      setNotice(null);
    }

    previousRoomStatus.current = room?.status;
  }, [room?.status]);

  async function handleCopyRoomLink() {
    setCopyingLink(true);
    setCopyFeedback(null);

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback({ severity: "success", message: "Room link copied." });
    } catch {
      setCopyFeedback({
        severity: "error",
        message: "Unable to copy the link. Copy it from your browser's address bar.",
      });
    } finally {
      setCopyingLink(false);
    }
  }

  async function handleJoinRoom() {
    setError(null);
    setNotice(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!auth.currentUser) {
      setError(
        "You are not connected to Firebase. Please refresh the page.",
      );
      return;
    }

    setJoining(true);

    try {
      await joinRoom(
        roomId,
        auth.currentUser.uid,
        trimmedName,
      );
    } catch (err) {
      console.error("Failed to join room:", err);

      setError(
        "Unable to join the room. Please try again.",
      );
    } finally {
      setJoining(false);
    }
  }

  async function handleVote(vote: PokerValue) {
    setError(null);
    setNotice(null);

    if (!auth.currentUser) {
      setError(
        "You are not connected to Firebase. Please refresh the page.",
      );
      return;
    }

    setVoting(true);

    try {
      await castVote(
        roomId,
        auth.currentUser.uid,
        vote,
      );

      setSelectedVote(vote);
    } catch (err) {
      console.error("Failed to cast vote:", err);

      setError(
        "Unable to cast your vote. Please try again.",
      );
      setVoting(false);
      return;
    }

    try {
      await markPlayerAsVoted(
        roomId,
        auth.currentUser.uid,
      );
    } catch (err) {
      console.error("Failed to update voting progress:", err);

      setNotice(
        "Your vote was saved, but voting progress could not be updated.",
      );
    } finally {
      setVoting(false);
    }
  }

  async function handleRevealVotes() {
    setError(null);
    setNotice(null);

    if (!auth.currentUser || auth.currentUser.uid !== room?.hostId) {
      setError("Only the host can reveal votes.");
      return;
    }

    setRevealing(true);

    try {
      await revealVotes(roomId);
    } catch (err) {
      console.error("Failed to reveal votes:", err);

      setError("Unable to reveal votes. Please try again.");
    } finally {
      setRevealing(false);
    }
  }

  async function handleStartNewTask(task: Task) {
    setError(null);
    setNotice(null);

    if (!auth.currentUser || auth.currentUser.uid !== room?.hostId) {
      setError("Only the host can start a new task.");
      return;
    }

    setStartingNewTask(true);

    try {
      await startNewTask(
        roomId,
        task,
        Object.keys(room.players ?? {}),
      );

      setSelectedVote(null);
      setRevealedVotes({});
      setNewTaskDialogOpen(false);
    } catch (err) {
      console.error("Failed to start new task:", err);

      setError("Unable to start the new task. Please try again.");
    } finally {
      setStartingNewTask(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (error && !room) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          Room not found.
        </Alert>
      </Container>
    );
  }

  const currentUserId = auth.currentUser?.uid;

  const currentPlayer = currentUserId
    ? room.players?.[currentUserId]
    : undefined;

  const isHost = currentUserId === room.hostId;
  const players = Object.entries(room.players ?? {});
  const votingPlayers = players.filter(([playerId]) => playerId !== room.hostId);
  const votedCount = votingPlayers.filter(
    ([, player]) => player.hasVoted,
  ).length;
  const minimumVotesToReveal = Math.ceil(votingPlayers.length / 2);
  const canReveal =
    votingPlayers.length > 0 && votedCount >= minimumVotesToReveal;
  const revealed = room.status === "revealed";
  const revealedVoteValues = votingPlayers
    .map(([playerId]) => revealedVotes[playerId])
    .filter((vote): vote is PokerValue => vote !== undefined);
  const mostCommonVotes = findMostCommonVotes(revealedVoteValues);

  if (!currentPlayer) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700 }}
              >
                Scrum Poker
              </Typography>

              <Typography color="text.secondary">
                You're joining room {roomId}
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              label="Your name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              fullWidth
              required
              autoFocus
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleJoinRoom}
              loading={joining}
              disabled={joining}
            >
              Join Room
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const topSeatCount = votingPlayers.length <= 4 ? 2 : 3;
  const topSeats = votingPlayers.slice(0, topSeatCount);
  const sideSeats = votingPlayers.slice(topSeatCount, topSeatCount + 2);
  const bottomSeats = votingPlayers.slice(topSeatCount + 2);

  const renderSeat = ([playerId, player]: (typeof votingPlayers)[number]) => (
    <PlayerCard
      key={playerId}
      name={player.name}
      hasVoted={player.hasVoted === true}
      isCurrentUser={playerId === currentUserId}
      revealed={revealed}
      vote={revealedVotes[playerId]}
      compact
    />
  );

  return (
    <Container
      maxWidth={false}
      sx={{
        bgcolor: "#f7faff",
        minHeight: "100vh",
        px: { xs: 2, md: 5 },
        py: 3,
      }}
    >
      <Stack spacing={4}>
        <Paper
          elevation={0}
          sx={{
            alignItems: "center",
            borderRadius: 3,
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
            py: 2,
          }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 800 }}>
              {room.task.id}
            </Typography>

            {room.task.name && (
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                {room.task.name}
              </Typography>
            )}

            <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Typography color="text.secondary" variant="body2">
                Room: {roomId}
              </Typography>
              {isHost && (
                <Button
                  size="small"
                  endIcon={<ContentCopyIcon />}
                  onClick={handleCopyRoomLink}
                  disabled={copyingLink}
                  sx={{
                    bgcolor: "#f0f5ff",
                    borderRadius: 999,
                    px: 1.5,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  Copy room link
                </Button>
              )}
            </Stack>
          </Stack>

          <Stack spacing={0.25} sx={{ alignItems: "flex-end", minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }}>
              {currentPlayer.name}
            </Typography>

            <Typography color="text.secondary" variant="body2">
              {isHost ? "Host" : "Participant"}
            </Typography>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: { xs: "1fr", md: "160px minmax(0, 1fr) 160px" },
            gridTemplateRows: { md: "auto auto auto" },
            mx: "auto",
            width: "min(100%, 920px)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              gridColumn: { md: "2" },
              justifyContent: "center",
            }}
          >
            {topSeats.map(renderSeat)}
          </Box>

          <Box
            sx={{
              display: "flex",
              gridColumn: { md: "1" },
              gridRow: { md: "2" },
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sideSeats[0] && renderSeat(sideSeats[0])}
          </Box>

          <Paper
            elevation={0}
            sx={{
              alignItems: "center",
              bgcolor: "#ddebff",
              borderRadius: 5,
              display: "flex",
              gridColumn: { md: "2" },
              gridRow: { md: "2" },
              justifyContent: "center",
              minHeight: 170,
              p: 3,
            }}
          >
            <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
              <Stack spacing={0.5} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 800 }}>
                  {revealed
                    ? "Results"
                    : isHost
                      ? "Voting progress"
                      : "Choose your card"}
                </Typography>

                <Typography color="text.secondary">
                  {revealed
                    ? "Revealed"
                    : `${votedCount} of ${votingPlayers.length} voted`}
                </Typography>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              {!isHost && notice && (
                <Alert severity="warning">{notice}</Alert>
              )}

              {isHost && !revealed && (
                <Button
                  variant="contained"
                  onClick={handleRevealVotes}
                  loading={revealing}
                  disabled={revealing || !canReveal}
                >
                  Reveal Votes
                </Button>
              )}

              {isHost && revealed && (
                <Button
                  variant="contained"
                  onClick={() => setNewTaskDialogOpen(true)}
                >
                  New Task
                </Button>
              )}

              {revealed && (
                <Stack spacing={1} sx={{ alignItems: "center" }}>
                  {mostCommonVotes.length > 0 && (
                    <Typography>
                      Most common:{" "}
                      {mostCommonVotes.map(formatPokerValue).join(", ")}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "flex",
              gridColumn: { md: "3" },
              gridRow: { md: "2" },
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sideSeats[1] && renderSeat(sideSeats[1])}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              gridColumn: { md: "1 / 4" },
              gridRow: { md: "3" },
              justifyContent: "center",
            }}
          >
            {[...bottomSeats, ...sideSeats.slice(2)].map(renderSeat)}
          </Box>
        </Box>

        {!isHost && !revealed && (
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              Choose your card
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "repeat(3, minmax(0, 1fr))",
                  sm: "repeat(8, 72px)",
                },
                justifyContent: "center",
                width: "100%",
              }}
            >
              {POKER_VALUES.map((value) => {
                const selected = selectedVote === value;
                const label = formatPokerValue(value);

                return (
                  <Button
                    key={value}
                    variant={selected ? "contained" : "outlined"}
                    color={selected ? "success" : "primary"}
                    disabled={voting}
                    onClick={() => handleVote(value)}
                    sx={{
                      aspectRatio: "3 / 4",
                      bgcolor: selected ? "#3b82f6" : "background.paper",
                      borderRadius: 1.5,
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      minWidth: 0,
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>
          </Stack>
        )}
      </Stack>

      <NewTaskDialog
        open={newTaskDialogOpen}
        loading={startingNewTask}
        onClose={() => setNewTaskDialogOpen(false)}
        onSubmit={handleStartNewTask}
      />
      <Snackbar
        open={copyFeedback !== null}
        autoHideDuration={4000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setCopyFeedback(null);
        }}
      >
        {copyFeedback ? (
          <Alert
            severity={copyFeedback.severity}
            onClose={() => setCopyFeedback(null)}
            sx={{ width: "100%" }}
          >
            {copyFeedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
}

export default Room;
