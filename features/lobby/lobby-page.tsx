"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUiSfx } from "@/hooks/use-ui-sfx";
import { generateRoomId, normalizeRoomId } from "@/lib/room";
import { useRoomStore } from "@/store/room-store";

export function LobbyPage() {
  const router = useRouter();
  const createRoomInStore = useRoomStore((state) => state.createRoom);
  const joinRoomInStore = useRoomStore((state) => state.joinRoom);
  const playUiSfx = useUiSfx();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCreateRoom = () => {
    playUiSfx("bright");
    const roomId = generateRoomId();
    createRoomInStore(roomId);
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = () => {
    const normalizedRoomId = normalizeRoomId(joinRoomId);

    if (normalizedRoomId.length !== 6) {
      setJoinError("Enter a valid 6-character room ID.");
      return;
    }

    playUiSfx("soft");
    setJoinError("");
    joinRoomInStore(normalizedRoomId);
    router.push(`/room/${normalizedRoomId}`);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(34,197,94,0.15),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(59,130,246,0.15),transparent_45%)]" />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-card/75 px-6 py-10 text-center shadow-2xl backdrop-blur-xl sm:px-10 sm:py-12"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground"
        >
          Real-time Word Game
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.35 }}
          className="text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          SpyWords
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          Create a private room in seconds or join your friends with a room code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center"
        >
          <Button
            className="h-11 rounded-xl px-6 text-sm shadow-lg shadow-cyan-950/30 sm:h-12 sm:text-base"
            onClick={handleCreateRoom}
          >
            Create Room
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="mx-auto mt-5 flex w-full max-w-sm flex-col gap-2"
        >
          <input
            value={joinRoomId}
            onChange={(event) => {
              setJoinRoomId(normalizeRoomId(event.target.value));
              if (joinError) {
                setJoinError("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleJoinRoom();
              }
            }}
            placeholder="Enter room ID"
            className="h-11 rounded-xl border border-border/60 bg-background/80 px-3 text-center text-sm tracking-[0.18em] uppercase outline-none focus:border-cyan-500/60 sm:h-12"
            maxLength={6}
            aria-label="Room ID"
          />
          <Button
            variant="outline"
            className="h-11 rounded-xl px-6 text-sm sm:h-12 sm:text-base"
            onClick={handleJoinRoom}
          >
            Join Room
          </Button>
          {joinError ? (
            <p className="text-xs text-destructive">{joinError}</p>
          ) : null}
        </motion.div>
      </motion.section>
    </main>
  );
}
