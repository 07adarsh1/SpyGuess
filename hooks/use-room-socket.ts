"use client";

import { useEffect } from "react";
import { normalizeRoomId } from "@/lib/room";
import { getSocket } from "@/lib/socket-client";
import type { GameStartPayload } from "@/store/game-store";
import { useGameStore } from "@/store/game-store";
import { useRoomStore } from "@/store/room-store";

type RoomUpdatePayload = {
  roomId: string;
  players: Array<{ id: string; name: string }>;
  hostId: string | null;
};

type ClueUpdatePayload = {
  roomId: string;
  clue: {
    word: string;
    number: number;
    team: "red" | "blue";
    by: string;
  } | null;
};

type TileRevealedPayload = {
  roomId: string;
  tile: {
    id: number;
    word: string;
    type: "red" | "blue" | "neutral" | "assassin";
    revealed: boolean;
  };
};

type TurnChangedPayload = {
  roomId: string;
  turn: "red" | "blue";
};

type GameOverPayload = {
  roomId: string;
  winner: "red" | "blue" | null;
  reason: string;
};

type AiClueSuggestionPayload = {
  roomId: string;
  suggestion: {
    word: string;
    number: number;
  } | null;
};

export function useRoomSocket(roomId: string) {
  const applyRoomUpdate = useRoomStore((state) => state.applyRoomUpdate);
  const applyGameStart = useGameStore((state) => state.applyGameStart);
  const applyClueUpdate = useGameStore((state) => state.applyClueUpdate);
  const applyAiSuggestion = useGameStore((state) => state.applyAiSuggestion);
  const applyTileRevealed = useGameStore((state) => state.applyTileRevealed);
  const applyTurnChanged = useGameStore((state) => state.applyTurnChanged);
  const applyGameOver = useGameStore((state) => state.applyGameOver);

  useEffect(() => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    const socket = getSocket();

    const join = () => {
      socket.emit("join_room", { roomId: normalizedRoomId });
    };

    const onRoomUpdate = (payload: RoomUpdatePayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyRoomUpdate(payload.roomId, payload.players, payload.hostId, socket.id ?? "");
    };

    const onGameStart = (payload: GameStartPayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyGameStart(payload);
    };

    const onClueUpdate = (payload: ClueUpdatePayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyClueUpdate(payload);
    };

    const onTileRevealed = (payload: TileRevealedPayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyTileRevealed(payload);
    };

    const onTurnChanged = (payload: TurnChangedPayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyTurnChanged(payload);
    };

    const onGameOver = (payload: GameOverPayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyGameOver(payload);
    };

    const onAiClueSuggestion = (payload: AiClueSuggestionPayload) => {
      if (!payload || payload.roomId !== normalizedRoomId) {
        return;
      }

      applyAiSuggestion(payload);
    };

    socket.on("connect", join);
    socket.on("room_update", onRoomUpdate);
    socket.on("game_start", onGameStart);
    socket.on("clue_update", onClueUpdate);
    socket.on("tile_revealed", onTileRevealed);
    socket.on("turn_changed", onTurnChanged);
    socket.on("game_over", onGameOver);
    socket.on("ai_clue_suggestion", onAiClueSuggestion);

    if (socket.connected) {
      join();
    }

    return () => {
      socket.off("connect", join);
      socket.off("room_update", onRoomUpdate);
      socket.off("game_start", onGameStart);
      socket.off("clue_update", onClueUpdate);
      socket.off("tile_revealed", onTileRevealed);
      socket.off("turn_changed", onTurnChanged);
      socket.off("game_over", onGameOver);
      socket.off("ai_clue_suggestion", onAiClueSuggestion);
    };
  }, [
    applyAiSuggestion,
    applyClueUpdate,
    applyGameOver,
    applyGameStart,
    applyRoomUpdate,
    applyTileRevealed,
    applyTurnChanged,
    roomId,
  ]);

  const startGame = () => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    getSocket().emit("start_game", { roomId: normalizedRoomId });
  };

  const sendClue = (word: string, number: number) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    getSocket().emit("send_clue", {
      roomId: normalizedRoomId,
      word,
      number,
    });
  };

  const makeGuess = (tileId: number) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    getSocket().emit("make_guess", {
      roomId: normalizedRoomId,
      tileId,
    });
  };

  const generateAiClue = () => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      return;
    }

    getSocket().emit("generate_ai_clue", {
      roomId: normalizedRoomId,
    });
  };

  return {
    startGame,
    sendClue,
    makeGuess,
    generateAiClue,
  };
}
