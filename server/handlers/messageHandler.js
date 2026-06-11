export default {
  handleSendMessage: (socket, io, data, userSockets, blockedWords) => {
    const user = userSockets.get(socket.id);
    if (!user) return;

    const { message, roomId } = data;
    let filteredMessage = message;

    blockedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
    });

    io.to(roomId).emit('new-message', {
      userId: user.userId,
      userName: user.userName,
      profileImage: user.profileImage,
      message: filteredMessage,
      timestamp: new Date().toISOString(),
      messageId: `${Date.now()}_${Math.random()}`
    });
  }
};
