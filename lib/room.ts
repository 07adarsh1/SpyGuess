const ROOM_ID_LENGTH = 6;
const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomId(length = ROOM_ID_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));

  return Array.from(bytes, (value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]).join("");
}

export function normalizeRoomId(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_ID_LENGTH);
}

export function isValidRoomId(value: string): boolean {
  return normalizeRoomId(value).length === ROOM_ID_LENGTH;
}
