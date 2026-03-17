import { create } from "zustand";

export type Player = {
  id: string;
  name: string;
};

type RoomState = {
  roomId: string;
  players: Player[];
  isHost: boolean;
  socketId: string;
  setRoom: (roomId: string, isHost: boolean) => void;
  setPlayers: (players: Player[]) => void;
  applyRoomUpdate: (
    roomId: string,
    players: Player[],
    hostId: string | null,
    currentSocketId: string
  ) => void;
  createRoom: (roomId: string) => void;
  joinRoom: (roomId: string) => void;
};

export const useRoomStore = create<RoomState>((set) => ({
  roomId: "",
  players: [],
  isHost: false,
  socketId: "",
  setRoom: (roomId, isHost) => set({ roomId, isHost }),
  setPlayers: (players) => set({ players }),
  applyRoomUpdate: (roomId, players, hostId, currentSocketId) =>
    set({
      roomId,
      players,
      isHost: Boolean(hostId && hostId === currentSocketId),
      socketId: currentSocketId,
    }),
  createRoom: (roomId) => set({ roomId, isHost: true, players: [], socketId: "" }),
  joinRoom: (roomId) => set({ roomId, isHost: false, players: [], socketId: "" }),
}));
