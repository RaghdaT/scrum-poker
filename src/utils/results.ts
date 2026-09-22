import type { PokerValue } from "../models/room";

export function formatPokerValue(value: PokerValue): string {
  if (value === "coffee") {
    return "\u2615";
  }

  if (value === "skipped") {
    return "?";
  }

  return value.toString();
}

export function findMostCommonVotes(votes: PokerValue[]): PokerValue[] {
  const counts = new Map<PokerValue, number>();

  for (const vote of votes) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }

  const highestCount = Math.max(0, ...counts.values());

  if (highestCount <= 1) {
    return [];
  }

  return [...counts.entries()]
    .filter(([, count]) => count === highestCount)
    .map(([vote]) => vote);
}

export function countVotes(
  votes: PokerValue[],
): Array<[PokerValue, number]> {
  const counts = new Map<PokerValue, number>();

  for (const vote of votes) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }

  return [...counts.entries()].sort(([left], [right]) => {
    if (left === "coffee" || left === "skipped") {
      return 1;
    }

    if (right === "coffee" || right === "skipped") {
      return -1;
    }

    return left - right;
  });
}
