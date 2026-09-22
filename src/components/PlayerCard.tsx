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
  compact?: boolean;
}

function PlayerCard({
  name,
  hasVoted,
  isCurrentUser = false,
  revealed = false,
  vote,
  compact = false,
}: PlayerCardProps) {
  const hasRevealedVote = revealed && vote !== undefined;
  const displayValue = hasRevealedVote
    ? formatPokerValue(vote)
    : revealed
      ? "?"
      : hasVoted
        ? "\u2713"
        : "\u23F3";
  const showStatus = revealed && !hasRevealedVote;
  const active = revealed ? hasRevealedVote : hasVoted;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: active ? "success.main" : "divider",
        bgcolor: active
          ? "rgba(46, 125, 50, 0.06)"
          : "background.paper",
        height: compact ? 112 : "100%",
        boxShadow: compact ? "none" : undefined,
        width: compact ? 116 : undefined,
      }}
    >
      <CardContent sx={{ p: compact ? 1 : 2, "&:last-child": { pb: compact ? 1 : 2 } }}>
        <Stack spacing={compact ? 0.75 : 1.25} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              alignItems: "center",
              aspectRatio: "3 / 4",
              border: "2px solid",
              borderColor: active ? "success.main" : "divider",
              borderRadius: 1,
              color: active ? "success.main" : "text.secondary",
              display: "flex",
              fontSize: compact ? "1.5rem" : "2rem",
              fontWeight: 800,
              justifyContent: "center",
              width: compact ? 50 : "clamp(56px, 42%, 86px)",
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
                fontSize: compact ? "0.9rem" : undefined,
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
                sx={{ fontSize: compact ? "0.78rem" : undefined, fontWeight: 700 }}
              >
                No vote
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PlayerCard;
