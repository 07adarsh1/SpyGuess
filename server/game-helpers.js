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

module.exports = {
  getDefaultPlayerName,
  normalizeClueWord,
  normalizeClueNumber,
  getSpymasterIdForTurn,
  getOppositeTurn,
  findTeamPlayerById,
  isTurnGuesser,
  reassignSpymaster,
  getCurrentTeamUnrevealedWords,
};
