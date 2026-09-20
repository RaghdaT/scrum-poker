import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import type { PokerValue } from "../models/room";
import { formatPokerValue } from "../utils/results";

interface PlayerCardProps {
  name: string;
  hasVoted: boolean;
  isCurrentUser?: boolean;
  revealed?: boolean;
  vote?: PokerValue;
}

function PlayerCard({
  name,
  hasVoted,
  isCurrentUser = false,
  revealed = false,
  vote,
}: PlayerCardProps) {
  const hasRevealedVote = revealed && vote !== undefined;
  const displayValue = hasRevealedVote ? formatPokerValue(vote) : "?";
  const showStatus = !revealed || !hasRevealedVote;
  const statusText = revealed
    ? "No vote"
    : hasVoted
      ? "Voted"
      : "Waiting";
  const active = revealed ? hasRevealedVote : hasVoted;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: "100%",
        borderColor: active ? "success.main" : "divider",
        bgcolor: active
          ? "rgba(46, 125, 50, 0.06)"
          : "background.paper",
      }}
    >
      <CardContent>
        <Stack spacing={1.25} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              alignItems: "center",
              aspectRatio: "3 / 4",
              border: "2px solid",
              borderColor: active ? "success.main" : "divider",
              borderRadius: 1,
              color: active ? "success.main" : "text.secondary",
              display: "flex",
              fontSize: "2rem",
              fontWeight: 800,
              justifyContent: "center",
              width: "clamp(56px, 42%, 86px)",
            }}
          >
            {displayValue}
          </Box>

          <Stack
            spacing={0.25}
            sx={{ alignItems: "center", minWidth: 0 }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                textAlign: "center",
              }}
            >
              {name}
              {isCurrentUser ? " (You)" : ""}
            </Typography>

            {showStatus && (
              <Typography
                color={active ? "success.main" : "text.secondary"}
                variant="body2"
                sx={{ fontWeight: 700 }}
              >
                {statusText}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PlayerCard;
