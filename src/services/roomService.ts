import {
  get,
  onValue,
  ref,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";

import { database } from "../firebase/database";
import type { PokerValue, Room, Task } from "../models/room";
import { generateRoomId } from "../utils/roomId";

function createInitialRoom(hostId: string, task: Task, hostName: string): Room {
  return {
    hostId,
    task,
    status: "voting",
    createdAt: Date.now(),
    players: {
      [hostId]: {
        name: hostName,
        hasVoted: false,
      },
    },
  };
}

export async function createRoom(
  hostId: string,
  task: Task,
  hostName: string,
): Promise<string> {
  const roomId = generateRoomId();

  const roomReference = ref(database, `rooms/${roomId}`);

  const room = createInitialRoom(hostId, task, hostName);

  try {
    await set(roomReference, room);

    return roomId;
  } catch (error) {
    console.error("Failed to create room:", error);
    throw error;
  }
}

export async function joinRoom(
  roomId: string,
  userId: string,
  playerName: string,
): Promise<void> {
  const roomReference = ref(database, `rooms/${roomId}`);

  const roomSnapshot = await get(roomReference);

  if (!roomSnapshot.exists()) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const playerReference = ref(database, `rooms/${roomId}/players/${userId}`);

  await set(playerReference, {
    name: playerName,
    hasVoted: false,
  });
}

export async function castVote(
  roomId: string,
  userId: string,
  vote: PokerValue,
): Promise<void> {
  const voteReference = ref(database, `rooms/${roomId}/votes/${userId}`);

  await set(voteReference, vote);
}

export async function markPlayerAsVoted(
  roomId: string,
  userId: string,
): Promise<void> {
  const hasVotedReference = ref(
    database,
    `rooms/${roomId}/players/${userId}/hasVoted`,
  );

  await set(hasVotedReference, true);
}

export async function revealVotes(roomId: string): Promise<void> {
  const statusReference = ref(database, `rooms/${roomId}/status`);

  await set(statusReference, "revealed");
}

export async function startNewTask(
  roomId: string,
  task: Task,
  playerIds: string[],
): Promise<void> {
  const roomReference = ref(database, `rooms/${roomId}`);
  const updates: Record<string, unknown> = {
    task,
    status: "voting",
    votes: null,
  };

  for (const playerId of playerIds) {
    updates[`players/${playerId}/hasVoted`] = false;
  }

  await update(roomReference, updates);
}

export function subscribeToVotes(
  roomId: string,
  onVotesChanged: (votes: Record<string, PokerValue>) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const votesReference = ref(database, `rooms/${roomId}/votes`);

  return onValue(
    votesReference,
    (snapshot) => {
      onVotesChanged(
        snapshot.exists()
          ? (snapshot.val() as Record<string, PokerValue>)
          : {},
      );
    },
    onError,
  );
}

export function subscribeToRoom(
  roomId: string,
  onRoomChanged: (room: Room | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const roomRef = ref(database, `rooms/${roomId}`);

  return onValue(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoomChanged(null);
        return;
      }

      onRoomChanged(snapshot.val() as Room);
    },
    onError,
  );
}
