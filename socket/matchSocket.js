let ioInstance;

export function initSocket(server) {
  import('socket.io').then(({ Server }) => {
    const io = new Server(server);
    ioInstance = io;

    io.on('connection', (socket) => {
      console.log('User connected');

      socket.on('updateScore', (data) => {
        io.emit('scoreUpdate', data); //broadcast to all
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  });
}

export function getIO() {
  return ioInstance;
}
