import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  type Unsubscribe,
} from "firebase/database";

import { firebaseApp } from "./config";

export const database = getDatabase(firebaseApp);

export function getRoomReference(roomId: string) {
  return ref(database, `rooms/${roomId}`);
}

export async function getRoom(roomId: string) {
  const snapshot = await get(getRoomReference(roomId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
}

export async function setRoom(
  roomId: string,
  room: unknown
) {
  await set(
    getRoomReference(roomId),
    room
  );
}

export async function updateRoom(
  roomId: string,
  updates: Record<string, unknown>
) {
  await update(
    getRoomReference(roomId),
    updates
  );
}

export function subscribeToRoom(
  roomId: string,
  callback: (room: unknown | null) => void
): Unsubscribe {
  return onValue(
    getRoomReference(roomId),
    snapshot => {
      callback(
        snapshot.exists()
          ? snapshot.val()
          : null
      );
    }
  );
}