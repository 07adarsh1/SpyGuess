"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GameBoard } from "@/components/game-board";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { useUiSfx } from "@/hooks/use-ui-sfx";
import { normalizeRoomId } from "@/lib/room";
import { useGameStore } from "@/store/game-store";
import { useRoomStore } from "@/store/room-store";

type RoomPageProps = {
  roomId: string;
};

export function RoomPage({ roomId }: RoomPageProps) {
  const currentRoomId = normalizeRoomId(roomId);
  const players = useRoomStore((state) => state.players);
  const isHost = useRoomStore((state) => state.isHost);
  const socketId = useRoomStore((state) => state.socketId);
  const board = useGameStore((state) => state.board);
  const started = useGameStore((state) => state.started);
  const turn = useGameStore((state) => state.turn);
  const teams = useGameStore((state) => state.teams);
  const clue = useGameStore((state) => state.clue);
  const aiSuggestion = useGameStore((state) => state.aiSuggestion);
  const over = useGameStore((state) => state.over);
  const winner = useGameStore((state) => state.winner);
  const [clueWord, setClueWord] = useState("");
  const [clueNumber, setClueNumber] = useState("1");
  const playUiSfx = useUiSfx();

  const { startGame, sendClue, makeGuess, generateAiClue } = useRoomSocket(currentRoomId);

  const currentPlayer = useMemo(() => {
    if (!socketId) {
      return null;
    }

    return (
      teams.red.players.find((player) => player.id === socketId) ||
      teams.blue.players.find((player) => player.id === socketId) ||
      null
    );
  }, [socketId, teams.blue.players, teams.red.players]);

  const playerRole = currentPlayer?.role ?? null;
  const playerTeam = currentPlayer?.team ?? null;

  const isCurrentTurnSpymaster = useMemo(() => {
    if (!started || !turn || !socketId) {
      return false;
    }

    return teams[turn].spymaster?.id === socketId;
  }, [socketId, started, teams, turn]);

  const canGuess = useMemo(() => {
    if (!started || !turn || over || !currentPlayer) {
      return false;
    }

    return currentPlayer.role === "guesser" && currentPlayer.team === turn;
  }, [currentPlayer, over, started, turn]);

  const handleSendClue = () => {
    const normalizedWord = clueWord.trim();
    const parsedNumber = Number(clueNumber);

    if (
      !isCurrentTurnSpymaster ||
      !normalizedWord ||
      !Number.isInteger(parsedNumber) ||
      parsedNumber < 1
    ) {
      return;
    }

    sendClue(normalizedWord, parsedNumber);
    playUiSfx("bright");
    setClueWord("");
    setClueNumber("1");
  };

  const handleGuess = (tileId: number) => {
    if (!canGuess) {
      return;
    }

    playUiSfx("soft");
    makeGuess(tileId);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col p-4 sm:p-8 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-3xl border border-white/10 bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-7"
      >
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Room ID
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[0.16em] sm:text-4xl">
          {currentRoomId}
        </h1>

        <div className="mt-5 rounded-xl border border-white/10 bg-background/70 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Current Turn
          </p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em]">
            {turn ? `${turn} team` : "Waiting to start"}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Your Role
          </p>
          <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em]">
            {playerTeam && playerRole
              ? `${playerTeam} ${playerRole}`
              : "Will be assigned on game start"}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Clue
          </p>
          <p className="mt-1 text-sm">{clue ? `${clue.word} ${clue.number}` : "No clue yet"}</p>
          {over ? (
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-600">
              Game Over {winner ? `- ${winner} team wins` : ""}
            </p>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-muted-foreground sm:text-base">Waiting for players...</p>

        {isHost ? (
          <Button
            className="mt-6 h-11 rounded-xl px-6 text-sm shadow-lg shadow-cyan-950/30 sm:h-12 sm:text-base"
            onClick={() => {
              playUiSfx("bright");
              startGame();
            }}
          >
            Start Game
          </Button>
        ) : null}

        {playerRole === "spymaster" ? (
          <section className="mt-6 rounded-xl border bg-background p-4">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Spymaster Clue
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_auto]">
              <input
                type="text"
                value={clueWord}
                onChange={(event) => setClueWord(event.target.value)}
                placeholder="Clue word"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-ring disabled:opacity-50"
                disabled={!isCurrentTurnSpymaster}
              />
              <input
                type="number"
                min={1}
                value={clueNumber}
                onChange={(event) => setClueNumber(event.target.value)}
                placeholder="Number"
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-ring disabled:opacity-50"
                disabled={!isCurrentTurnSpymaster}
              />
              <Button className="h-10" onClick={handleSendClue} disabled={!isCurrentTurnSpymaster}>
                Send Clue
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="h-10"
                onClick={generateAiClue}
                disabled={!isCurrentTurnSpymaster}
              >
                Generate AI Clue
              </Button>
              {aiSuggestion ? (
                <>
                  <span className="rounded-md border bg-card px-3 py-2 text-xs uppercase tracking-[0.12em]">
                    Suggested: {aiSuggestion.word} {aiSuggestion.number}
                  </span>
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => {
                      playUiSfx("soft");
                      setClueWord(aiSuggestion.word);
                      setClueNumber(String(aiSuggestion.number));
                    }}
                  >
                    Use Suggestion
                  </Button>
                </>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isCurrentTurnSpymaster
                ? "You are the active spymaster."
                : "Wait for your team's turn to send the clue."}
            </p>
          </section>
        ) : (
          <section className="mt-6 rounded-xl border bg-background p-4">
            <p className="text-xs text-muted-foreground">
              Guessers can only see revealed tiles and should wait for the spymaster clue.
            </p>
          </section>
        )}

        <section className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Players
            </h2>
            <ul className="mt-3 space-y-2">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex h-10 items-center rounded-lg border bg-background px-3 text-sm"
                >
                  {player.name}
                </li>
              ))}
              {players.length === 0 ? (
                <li className="flex h-10 items-center rounded-lg border bg-background px-3 text-sm text-muted-foreground">
                  No players connected yet
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Game Board
              </h2>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="rounded-full border px-2 py-1">Red Team {teams.red.players.length}</span>
                <span className="rounded-full border px-2 py-1">Blue Team {teams.blue.players.length}</span>
              </div>
            </div>

            <div className="mt-3">
              {started ? (
                <>
                  <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {over ? "Game finished" : `Turn: ${turn} team`}
                  </p>
                  <GameBoard
                    tiles={board}
                    onTileClick={handleGuess}
                    disabled={!canGuess}
                    revealAllColors={playerRole === "spymaster"}
                  />
                </>
              ) : (
                <div className="flex min-h-24 items-center justify-center rounded-xl border border-white/10 bg-background/70 px-4 text-sm text-muted-foreground">
                  Waiting for host to start the game...
                </div>
              )}
            </div>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
