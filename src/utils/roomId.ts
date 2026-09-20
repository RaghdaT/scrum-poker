const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomId(length = 6): string {
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  return Array.from(values)
    .map(value => CHARACTERS[value % CHARACTERS.length])
    .join("");
}