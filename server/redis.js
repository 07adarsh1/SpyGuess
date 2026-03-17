const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

async function setupRedis({ io, redisUrl, allowFallback }) {
  if (!redisUrl) {
    if (!allowFallback) {
      throw new Error("REDIS_URL is required when memory fallback is disabled");
    }

    return {
      enabled: false,
      mode: "memory",
      dataClient: null,
      close: async () => {},
    };
  }

  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  const dataClient = pubClient.duplicate();

  try {
    await Promise.all([pubClient.connect(), subClient.connect(), dataClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    return {
      enabled: true,
      mode: "redis",
      dataClient,
      close: async () => {
        await Promise.all([
          pubClient.quit().catch(() => {}),
          subClient.quit().catch(() => {}),
          dataClient.quit().catch(() => {}),
        ]);
      },
    };
  } catch (error) {
    await Promise.all([
      pubClient.quit().catch(() => {}),
      subClient.quit().catch(() => {}),
      dataClient.quit().catch(() => {}),
    ]);

    if (allowFallback) {
      return {
        enabled: false,
        mode: "memory",
        dataClient: null,
        close: async () => {},
      };
    }

    throw error;
  }
}

module.exports = {
  setupRedis,
};
