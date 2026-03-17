async function emitRoomUpdate(io, stateStore, roomId) {
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

async function emitGameStart(io, stateStore, roomId) {
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

function emitTileRevealed(io, roomId, tile) {
  io.to(roomId).emit("tile_revealed", {
    roomId,
    tile,
  });
}

async function emitTurnChanged(io, stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("turn_changed", {
    roomId,
    turn: room.game.turn,
  });
}

async function emitGameOver(io, stateStore, roomId) {
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

async function emitClueUpdate(io, stateStore, roomId) {
  const room = await stateStore.getRoom(roomId);

  if (!room || !room.game) {
    return;
  }

  io.to(roomId).emit("clue_update", {
    roomId,
    clue: room.game.clue,
  });
}

module.exports = {
  emitRoomUpdate,
  emitGameStart,
  emitTileRevealed,
  emitTurnChanged,
  emitGameOver,
  emitClueUpdate,
};
