import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";

import { firebaseApp } from "./config";

export const auth = getAuth(firebaseApp);

export async function signInGuest(): Promise<User> {
  const result = await signInAnonymously(auth);

  return result.user;
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}