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
const { registerSocketHandlers } = require("./server/socket/register-handlers");

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

async function startServer() {
  const redisSetup = await setupRedis({
    io,
    redisUrl: REDIS_URL,
    allowFallback: process.env.NODE_ENV !== "production",
  });

  const stateStore = redisSetup.enabled
    ? new RedisStateStore(redisSetup.dataClient)
    : new MemoryStateStore();

  registerSocketHandlers({
    io,
    stateStore,
    createGameState,
    generateAiClue,
    groqApiKey: GROQ_API_KEY,
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
