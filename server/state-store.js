const ROOM_KEY_PREFIX = "spywords:room:";

class MemoryStateStore {
  constructor() {
    this.rooms = {};
    this.mode = "memory";
  }

  async ensureRoom(roomId) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        players: [],
        hostId: null,
        game: null,
      };
    }

    return this.rooms[roomId];
  }

  async getRoom(roomId) {
    return this.rooms[roomId] || null;
  }

  async saveRoom(roomId, room) {
    this.rooms[roomId] = room;
  }

  async deleteRoom(roomId) {
    delete this.rooms[roomId];
  }
}

class RedisStateStore {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.mode = "redis";
  }

  getRoomKey(roomId) {
    return `${ROOM_KEY_PREFIX}${roomId}`;
  }

  async ensureRoom(roomId) {
    const existingRoom = await this.getRoom(roomId);

    if (existingRoom) {
      return existingRoom;
    }

    const room = {
      players: [],
      hostId: null,
      game: null,
    };

    await this.saveRoom(roomId, room);
    return room;
  }

  async getRoom(roomId) {
    const value = await this.redisClient.get(this.getRoomKey(roomId));

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async saveRoom(roomId, room) {
    await this.redisClient.set(this.getRoomKey(roomId), JSON.stringify(room));
  }

  async deleteRoom(roomId) {
    await this.redisClient.del(this.getRoomKey(roomId));
  }
}

module.exports = {
  MemoryStateStore,
  RedisStateStore,
};
