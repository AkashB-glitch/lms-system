const { Server } = require('socket.io');

let io;
const userSockets = {};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('register', (userId) => {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} registered to socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of Object.entries(userSockets)) {
        if (socketId === socket.id) {
          delete userSockets[userId];
          break;
        }
      }
    });
  });
};

const sendNotification = (userId, notification) => {
  if (io && userSockets[userId]) {
    io.to(userSockets[userId]).emit('notification', notification);
  }
};

module.exports = { initSocket, sendNotification };
