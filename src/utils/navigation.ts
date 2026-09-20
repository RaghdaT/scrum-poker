export function navigateToRoom(
  roomId: string
): void {
  window.location.hash =
    `/room/${roomId}`;
}