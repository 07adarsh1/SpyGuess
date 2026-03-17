require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createGameState } = require("./server/game");
const { generateAiClue } = require("./server/ai-clue");
const { setupRedis } = require("./server/redis");
const { MemoryStateStore, RedisStateStore } = require("./server/state-store");

const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const REDIS_URL = process.env.REDIS_URL;

const app = express();
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

function getDefaultPlayerName(room) {
  return `Player ${room.players.length + 1}`;
}

function normalizeClueWord(word) {
  if (typeof word !== "string") {
    return "";
  }

  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeClueNumber(number) {
  const parsedNumber = Number(number);

  if (!Number.isInteger(parsedNumber) || parsedNumber < 1) {
    return null;
  }

  return parsedNumber;
}

function getSpymasterIdForTurn(game) {
  if (!game || !game.turn) {
    return null;
  }

  return game.teams[game.turn]?.spymaster?.id || null;
}

function getOppositeTurn(turn) {
  return turn === "red" ? "blue" : "red";
}

function findTeamPlayerById(game, playerId) {
  if (!game) {
    return null;
  }

  return (
    game.teams.red.players.find((player) => player.id === playerId) ||
    game.teams.blue.players.find((player) => player.id === playerId) ||
    null
  );
}

function isTurnGuesser(game, playerId) {
  if (!game || !game.turn) {
    return false;
  }

  const player = game.teams[game.turn].players.find((teamPlayer) => teamPlayer.id === playerId);

  return Boolean(player && player.role === "guesser");
}

function reassignSpymaster(team) {
  if (!team) {
    return;
  }

  if (team.players.length === 0) {
    team.spymaster = null;
    return;
  }

  team.players = team.players.map((player, index) => ({
    ...player,
    role: index === 0 ? "spymaster" : "guesser",
  }));
  team.spymaster = team.players[0];
}

function getCurrentTeamUnrevealedWords(game) {
  if (!game || !game.turn) {
    return [];
  }

  return game.board
    .filter((tile) => tile.type === game.turn && !tile.revealed)
    .map((tile) => tile.word);
}

async function emitRoomUpdate(stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room) {
    return;
  }

  io.to(roomId).emit("room_update", {
    roomId,
    players: room.players,
    hostId: room.hostId,
  });
}

async function emitGameStart(stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("game_start", {
    roomId,
    board: room.game.board,
    teams: room.game.teams,
    turn: room.game.turn,
    clue: room.game.clue,
  });
}

function emitTileRevealed(roomId, tile) {
  io.to(roomId).emit("tile_revealed", {
    roomId,
    tile,
  });
}

async function emitTurnChanged(stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("turn_changed", {
    roomId,
    turn: room.game.turn,
  });
}

async function emitGameOver(stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("game_over", {
    roomId,
    winner: room.game.winner,
    reason: room.game.winner ? "assassin" : "game_finished",
  });
}

async function emitClueUpdate(stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("clue_update", {
    roomId,
    clue: room.game.clue,
  });
}
async function startServer() {
  const redisSetup = await setupRedis({
    io,
    redisUrl: REDIS_URL,
    allowFallback: process.env.NODE_ENV !== "production",
  });

  const stateStore = redisSetup.enabled
    ? new RedisStateStore(redisSetup.dataClient)
    : new MemoryStateStore();

  io.on("connection", (socket) => {
    socket.on("join_room", async ({ roomId, playerName } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
      const room = await stateStore.ensureRoom(normalizedRoomId);

    socket.join(normalizedRoomId);

    const existingPlayer = room.players.find((player) => player.id === socket.id);

    if (!existingPlayer) {
      const player = {
        id: socket.id,
        name:
          typeof playerName === "string" && playerName.trim()
            ? playerName.trim()
            : getDefaultPlayerName(room),
      };

      room.players.push(player);

      if (!room.hostId) {
        room.hostId = socket.id;
      }

      io.to(normalizedRoomId).emit("player_joined", player);
    }

      await stateStore.saveRoom(normalizedRoomId, room);
      await emitRoomUpdate(stateStore, normalizedRoomId);

    if (room.game) {
      socket.emit("game_start", {
        roomId: normalizedRoomId,
        board: room.game.board,
        teams: room.game.teams,
        turn: room.game.turn,
        clue: room.game.clue,
      });
    }
    });

    socket.on("start_game", async ({ roomId } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
      const room = await stateStore.getRoom(normalizedRoomId);

    if (!room || room.hostId !== socket.id || room.players.length === 0) {
      return;
    }

    room.game = createGameState(room.players);
      await stateStore.saveRoom(normalizedRoomId, room);
      await emitGameStart(stateStore, normalizedRoomId);
    });

    socket.on("send_clue", async ({ roomId, word, number } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
      const room = await stateStore.getRoom(normalizedRoomId);

    if (!room || !room.game) {
      return;
    }

    const spymasterId = getSpymasterIdForTurn(room.game);
    const sender = findTeamPlayerById(room.game, socket.id);

    if (!spymasterId || spymasterId !== socket.id || !sender || sender.role !== "spymaster") {
      return;
    }

    const clueWord = normalizeClueWord(word);
    const clueNumber = normalizeClueNumber(number);

    if (!clueWord || clueNumber === null) {
      return;
    }

    room.game.clue = {
      word: clueWord,
      number: clueNumber,
      team: room.game.turn,
      by: socket.id,
    };

      await stateStore.saveRoom(normalizedRoomId, room);
      await emitClueUpdate(stateStore, normalizedRoomId);
    });

    socket.on("generate_ai_clue", async ({ roomId } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
      const room = await stateStore.getRoom(normalizedRoomId);

    if (!room || !room.game || room.game.over) {
      return;
    }

    const spymasterId = getSpymasterIdForTurn(room.game);

    if (!spymasterId || spymasterId !== socket.id) {
      return;
    }

    try {
      const targetWords = getCurrentTeamUnrevealedWords(room.game);
      const suggestion = await generateAiClue(targetWords, GROQ_API_KEY);

      socket.emit("ai_clue_suggestion", {
        roomId: normalizedRoomId,
        suggestion,
      });
    } catch {
      socket.emit("ai_clue_suggestion", {
        roomId: normalizedRoomId,
        suggestion: null,
      });
    }
  });

    socket.on("make_guess", async ({ roomId, tileId } = {}) => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    const normalizedRoomId = roomId.toUpperCase().trim();
      const room = await stateStore.getRoom(normalizedRoomId);

    if (!room || !room.game || room.game.over) {
      return;
    }

    if (!isTurnGuesser(room.game, socket.id)) {
      return;
    }

    const numericTileId = Number(tileId);

    if (!Number.isInteger(numericTileId)) {
      return;
    }

    const tile = room.game.board.find((boardTile) => boardTile.id === numericTileId);

    if (!tile || tile.revealed) {
      return;
    }

    tile.revealed = true;
    emitTileRevealed(normalizedRoomId, tile);

    if (tile.type === "assassin") {
      room.game.over = true;
      room.game.winner = getOppositeTurn(room.game.turn);
        await stateStore.saveRoom(normalizedRoomId, room);
        await emitGameOver(stateStore, normalizedRoomId);
      return;
    }

    if (tile.type !== room.game.turn) {
      room.game.turn = getOppositeTurn(room.game.turn);
      room.game.clue = null;
        await stateStore.saveRoom(normalizedRoomId, room);
        await emitTurnChanged(stateStore, normalizedRoomId);
        await emitClueUpdate(stateStore, normalizedRoomId);
        return;
    }

      await stateStore.saveRoom(normalizedRoomId, room);
    });

    socket.on("disconnecting", async () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) {
        continue;
      }

        const room = await stateStore.getRoom(roomId);

      if (!room) {
        continue;
      }

      room.players = room.players.filter((player) => player.id !== socket.id);

      if (room.hostId === socket.id) {
        room.hostId = room.players[0]?.id || null;
      }

      if (room.game) {
        room.game.teams.red.players = room.game.teams.red.players.filter(
          (player) => player.id !== socket.id
        );
        room.game.teams.blue.players = room.game.teams.blue.players.filter(
          (player) => player.id !== socket.id
        );

        reassignSpymaster(room.game.teams.red);
        reassignSpymaster(room.game.teams.blue);

        if (room.game.clue?.by === socket.id) {
          room.game.clue = null;
            await emitClueUpdate(stateStore, roomId);
        }
      }

      if (room.players.length === 0) {
          await stateStore.deleteRoom(roomId);
        continue;
      }

        await stateStore.saveRoom(roomId, room);
        await emitRoomUpdate(stateStore, roomId);
    }
    });
  });

  httpServer.listen(PORT, () => {
    console.log(
      `Socket server listening on http://localhost:${PORT} (state store: ${stateStore.mode})`
    );
  });

  const shutdown = async () => {
    await redisSetup.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
