import { create } from "zustand";

export type TileType = "red" | "blue" | "neutral" | "assassin";

export type BoardTile = {
  id: number;
  word: string;
  type: TileType;
  revealed: boolean;
};

export type TeamPlayer = {
  id: string;
  name: string;
  role: "spymaster" | "guesser";
  team: "red" | "blue";
};

export type TeamInfo = {
  spymaster: TeamPlayer | null;
  players: TeamPlayer[];
};

type TeamAssignments = {
  red: TeamInfo;
  blue: TeamInfo;
};

export type ClueState = {
  word: string;
  number: number;
  team: "red" | "blue";
  by: string;
} | null;

export type AiClueSuggestion = {
  word: string;
  number: number;
} | null;

export type GameStartPayload = {
  roomId: string;
  board: BoardTile[];
  teams: TeamAssignments;
  turn: "red" | "blue";
  clue: ClueState;
};

type GameState = {
  roomId: string;
  board: BoardTile[];
  teams: TeamAssignments;
  turn: "red" | "blue" | null;
  clue: ClueState;
  aiSuggestion: AiClueSuggestion;
  started: boolean;
  over: boolean;
  winner: "red" | "blue" | null;
  applyGameStart: (payload: GameStartPayload) => void;
  applyClueUpdate: (payload: { roomId: string; clue: ClueState }) => void;
  applyAiSuggestion: (payload: { roomId: string; suggestion: AiClueSuggestion }) => void;
  applyTileRevealed: (payload: { roomId: string; tile: BoardTile }) => void;
  applyTurnChanged: (payload: { roomId: string; turn: "red" | "blue" }) => void;
  applyGameOver: (payload: {
    roomId: string;
    winner: "red" | "blue" | null;
    reason: string;
  }) => void;
  resetBoard: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  roomId: "",
  board: [],
  teams: {
    red: { spymaster: null, players: [] },
    blue: { spymaster: null, players: [] },
  },
  turn: null,
  clue: null,
  aiSuggestion: null,
  started: false,
  over: false,
  winner: null,
  applyGameStart: ({ roomId, board, teams, turn, clue }) => {
    set({
      roomId,
      board,
      teams,
      turn,
      clue,
      aiSuggestion: null,
      started: true,
      over: false,
      winner: null,
    });
  },
  applyClueUpdate: ({ roomId, clue }) => {
    set((state) => {
      if (!state.started || state.roomId !== roomId) {
        return state;
      }

      return {
        clue,
      };
    });
  },
  applyAiSuggestion: ({ roomId, suggestion }) => {
    set((state) => {
      if (!state.started || state.roomId !== roomId) {
        return state;
      }

      return {
        aiSuggestion: suggestion,
      };
    });
  },
  applyTileRevealed: ({ roomId, tile }) => {
    set((state) => {
      if (!state.started || state.roomId !== roomId) {
        return state;
      }

      return {
        board: state.board.map((existingTile) =>
          existingTile.id === tile.id ? tile : existingTile
        ),
      };
    });
  },
  applyTurnChanged: ({ roomId, turn }) => {
    set((state) => {
      if (!state.started || state.roomId !== roomId) {
        return state;
      }

      return {
        turn,
        aiSuggestion: null,
      };
    });
  },
  applyGameOver: ({ roomId, winner }) => {
    set((state) => {
      if (!state.started || state.roomId !== roomId) {
        return state;
      }

      return {
        over: true,
        winner,
        aiSuggestion: null,
      };
    });
  },
  resetBoard: () => {
    set({
      roomId: "",
      board: [],
      teams: {
        red: { spymaster: null, players: [] },
        blue: { spymaster: null, players: [] },
      },
      turn: null,
      clue: null,
      aiSuggestion: null,
      started: false,
      over: false,
      winner: null,
    });
  },
}));
