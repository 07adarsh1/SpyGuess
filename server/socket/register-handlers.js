const {
  emitRoomUpdate,
  emitGameStart,
  emitTileRevealed,
  emitTurnChanged,
  emitGameOver,
  emitClueUpdate,
} = require("./emitters");

const {
  getDefaultPlayerName,
  normalizeClueWord,
  normalizeClueNumber,
  getSpymasterIdForTurn,
  getOppositeTurn,
  findTeamPlayerById,
  isTurnGuesser,
  reassignSpymaster,
  getCurrentTeamUnrevealedWords,
} = require("../game-helpers");

function registerSocketHandlers({
  io,
  stateStore,
  createGameState,
  generateAiClue,
  groqApiKey,
}) {
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
      await emitRoomUpdate(io, stateStore, normalizedRoomId);

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
      await emitGameStart(io, stateStore, normalizedRoomId);
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
      await emitClueUpdate(io, stateStore, normalizedRoomId);
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
        const suggestion = await generateAiClue(targetWords, groqApiKey);

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
      emitTileRevealed(io, normalizedRoomId, tile);

      if (tile.type === "assassin") {
        room.game.over = true;
        room.game.winner = getOppositeTurn(room.game.turn);
        await stateStore.saveRoom(normalizedRoomId, room);
        await emitGameOver(io, stateStore, normalizedRoomId);
        return;
      }

      if (tile.type !== room.game.turn) {
        room.game.turn = getOppositeTurn(room.game.turn);
        room.game.clue = null;
        await stateStore.saveRoom(normalizedRoomId, room);
        await emitTurnChanged(io, stateStore, normalizedRoomId);
        await emitClueUpdate(io, stateStore, normalizedRoomId);
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
            await emitClueUpdate(io, stateStore, roomId);
          }
        }

        if (room.players.length === 0) {
          await stateStore.deleteRoom(roomId);
          continue;
        }

        await stateStore.saveRoom(roomId, room);
        await emitRoomUpdate(io, stateStore, roomId);
      }
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
