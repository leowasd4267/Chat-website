export default {
  handleUserJoined: (socket, io, data, userSockets, roomUsers, bannedUsers) => {
    const { userId, roomId, userName, profileImage } = data;
    
    if (bannedUsers.has(userId)) {
      socket.emit('error', { message: '차단된 사용자입니다.' });
      return;
    }

    socket.join(roomId);
    userSockets.set(socket.id, { userId, roomId, userName, profileImage });

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, []);
    }
    roomUsers.get(roomId).push({ socketId: socket.id, userId, userName, profileImage });

    io.to(roomId).emit('user-joined', {
      userId,
      userName,
      profileImage,
      timestamp: new Date().toISOString(),
      userCount: roomUsers.get(roomId).length
    });
  },

  handleUserLeft: (socket, io, userSockets, roomUsers) => {
    const user = userSockets.get(socket.id);
    if (user) {
      const roomUsers_ = roomUsers.get(user.roomId);
      if (roomUsers_) {
        const index = roomUsers_.findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
          roomUsers_.splice(index, 1);
        }
      }

      io.to(user.roomId).emit('user-left', {
        userId: user.userId,
        userName: user.userName,
        timestamp: new Date().toISOString(),
        userCount: roomUsers_ ? roomUsers_.length : 0
      });
      
      userSockets.delete(socket.id);
    }
  }
};
