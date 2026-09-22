export type PokerValue = 1 | 3 | 5 | 8 | 13 | 20 | "skipped" | "coffee";

export type RoomStatus = "voting" | "revealed";

export interface Task {
  id: string;
  name?: string;
}

export interface Player {
  name: string;
  hasVoted?: boolean;
}

export interface Room {
  hostId: string;
  task: Task;
  status: RoomStatus;
  createdAt: number;
  players?: Record<string, Player>;
  votes?: Record<string, PokerValue>;
}
