"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUiSfx } from "@/hooks/use-ui-sfx";
import { generateRoomId, normalizeRoomId } from "@/lib/room";
import { useRoomStore } from "@/store/room-store";

export default function PlayPage() {
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
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-[400px] w-[400px] rounded-full bg-primary/20 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute h-[500px] w-[500px] -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]"
        />
      </div>

      <motion.section
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg text-center glass-panel z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-md"
        >
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Matchmaking
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl"
        >
          Mission Control
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-muted-foreground drop-shadow-sm"
        >
          Create a secured private channel or infiltrate an existing operation with a room code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-6"
        >
          <Button
            className="group relative flex h-14 w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl bg-white text-base font-bold text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.03] hover:bg-white flex-shrink-0"
            onClick={handleCreateRoom}
          >
            <span className="relative z-10 transition-transform group-hover:scale-105">Start New Operation</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </Button>

          <div className="flex w-full max-w-[320px] items-center gap-4">
            <div className="h-[1px] flex-1 bg-border/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">Or</span>
            <div className="h-[1px] flex-1 bg-border/50" />
          </div>

          <div className="flex w-full max-w-[320px] flex-col gap-4">
            <div className="relative">
              <input
                value={joinRoomId}
                onChange={(event) => {
                  setJoinRoomId(normalizeRoomId(event.target.value));
                  if (joinError) setJoinError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleJoinRoom();
                }}
                placeholder="ENTER CODE"
                className="h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-6 text-center text-lg font-bold tracking-[0.35em] uppercase text-white outline-none transition-all placeholder:text-white/20 placeholder:tracking-[0.2em] focus:border-primary/60 focus:bg-black/80 focus:ring-2 focus:ring-primary/40 focus:outline-none"
                maxLength={6}
                aria-label="Room ID"
              />
              <AnimatePresence>
                {joinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-6 left-0 right-0 text-center text-xs font-semibold text-destructive drop-shadow-md"
                  >
                    {joinError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            <Button
              variant="outline"
              className="mt-2 h-14 w-full rounded-2xl border-white/10 bg-white/5 text-base font-semibold backdrop-blur-md transition-all hover:bg-primary/90 hover:text-white hover:border-primary/50 shadow-none hover:shadow-[0_0_20px_var(--primary)]"
              onClick={handleJoinRoom}
            >
              Infiltrate Room
            </Button>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
