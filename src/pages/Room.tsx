import { useEffect, useRef, useState } from "react";

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
  countVotes,
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
  const voteCounts = countVotes(revealedVoteValues);

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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {room.task.id}
          </Typography>

          {room.task.name && (
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {room.task.name}
            </Typography>
          )}

          <Typography color="text.secondary">
            Room: {roomId} - Joining as: {currentPlayer.name}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">
                {revealed
                  ? "Results"
                  : isHost
                    ? "Voting progress"
                    : "Cast your vote"}
              </Typography>

              <Typography color="text.secondary">
                {revealed
                  ? "Revealed"
                  : `${votedCount} of ${votingPlayers.length} voted`}
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {!isHost && notice && (
              <Alert severity="warning">
                {notice}
              </Alert>
            )}

            {!isHost && !revealed && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(3, minmax(0, 1fr))",
                    sm: "repeat(6, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {POKER_VALUES.map((value) => {
                  const selected =
                    selectedVote === value;

                  const label =
                    value === "coffee"
                      ? "\u2615"
                      : value;

                  return (
                    <Button
                      key={value}
                      variant={
                        selected
                          ? "contained"
                          : "outlined"
                      }
                      color={
                        selected
                          ? "success"
                          : "primary"
                      }
                      disabled={voting}
                      onClick={() =>
                        handleVote(value)
                      }
                      sx={{
                        aspectRatio: "3 / 4",
                        minWidth: 0,
                        fontSize: "1.75rem",
                        fontWeight: 800,
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Box>
            )}

            {isHost && !revealed && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleRevealVotes}
                  loading={revealing}
                  disabled={revealing || !canReveal}
                >
                  Reveal Votes
                </Button>
              </Box>
            )}

            {isHost && revealed && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  onClick={() => setNewTaskDialogOpen(true)}
                >
                  New Task
                </Button>
              </Box>
            )}

            {revealed && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  justifyContent: "center",
                }}
              >
                <Typography>
                  Most common:{" "}
                  {mostCommonVotes.length === 0
                    ? "-"
                    : mostCommonVotes.map(formatPokerValue).join(", ")}
                </Typography>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{
                    alignItems: { xs: "center", sm: "baseline" },
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <Typography>Counts:</Typography>

                  {voteCounts.length === 0 ? (
                    <Typography>-</Typography>
                  ) : (
                    voteCounts.map(([vote, count]) => (
                      <Typography
                        key={vote}
                        component="span"
                        sx={{ fontWeight: 700 }}
                      >
                        {formatPokerValue(vote)} {"\u2192"} {count}
                      </Typography>
                    ))
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">
              Participants
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              {votingPlayers.map(([playerId, player]) => (
                <PlayerCard
                  key={playerId}
                  name={player.name}
                  hasVoted={player.hasVoted === true}
                  isCurrentUser={playerId === currentUserId}
                  revealed={revealed}
                  vote={revealedVotes[playerId]}
                />
              ))}
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <NewTaskDialog
        open={newTaskDialogOpen}
        loading={startingNewTask}
        onClose={() => setNewTaskDialogOpen(false)}
        onSubmit={handleStartNewTask}
      />
    </Container>
  );
}

export default Room;
