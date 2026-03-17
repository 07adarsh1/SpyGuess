const { WORD_POOL } = require("./words");

const BOARD_SIZE = 25;
const TILE_TYPES = [
  ...Array(8).fill("red"),
  ...Array(8).fill("blue"),
  ...Array(8).fill("neutral"),
  "assassin",
];

function shuffle(items) {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function generateBoard() {
  const words = shuffle(WORD_POOL).slice(0, BOARD_SIZE);
  const types = shuffle(TILE_TYPES);

  return words.map((word, index) => ({
    id: index,
    word,
    type: types[index],
    revealed: false,
  }));
}

function assignTeams(players) {
  const shuffledPlayers = shuffle(players);
  const groupedTeams = {
    red: [],
    blue: [],
  };

  shuffledPlayers.forEach((player, index) => {
    if (index % 2 === 0) {
      groupedTeams.red.push(player);
      return;
    }

    groupedTeams.blue.push(player);
  });

  const redPlayers = groupedTeams.red.map((player, index) => ({
    ...player,
    team: "red",
    role: index === 0 ? "spymaster" : "guesser",
  }));

  const bluePlayers = groupedTeams.blue.map((player, index) => ({
    ...player,
    team: "blue",
    role: index === 0 ? "spymaster" : "guesser",
  }));

  return {
    red: {
      spymaster: redPlayers[0] || null,
      players: redPlayers,
    },
    blue: {
      spymaster: bluePlayers[0] || null,
      players: bluePlayers,
    },
  };
}

function chooseTurn() {
  return Math.random() > 0.5 ? "red" : "blue";
}

function createGameState(players) {
  return {
    board: generateBoard(),
    teams: assignTeams(players),
    turn: chooseTurn(),
    clue: null,
    over: false,
    winner: null,
  };
}

module.exports = {
  createGameState,
};
