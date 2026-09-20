import { useEffect, useState } from "react";

import { Alert, Box } from "@mui/material";

import type { User } from "firebase/auth";

import { signInGuest, subscribeToAuthState } from "./firebase/auth";

import Home from "./pages/Home";
import Room from "./pages/Room";
import Loading from "./pages/Loading";

function App() {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
        } else {
          const anonymousUser = await signInGuest();

          setUser(anonymousUser);
        }
      } catch (err) {
        console.error(err);

        setError("Unable to connect to Firebase.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setHash(window.location.hash);
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error ?? "Authentication failed."}</Alert>
      </Box>
    );
  }

  if (hash.startsWith("#/room/")) {
    return <Room />;
  }

  return <Home />;
}

export default App;
