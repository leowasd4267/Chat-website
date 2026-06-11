export default {
  handleBanUser: (io, userId, roomId, bannedUsers) => {
    bannedUsers.add(userId);
    io.to(roomId).emit('user-banned', {
      userId,
      timestamp: new Date().toISOString()
    });
  },

  handleAddBlockedWord: (blockedWords, word) => {
    blockedWords.add(word);
  },

  handleRemoveBlockedWord: (blockedWords, word) => {
    blockedWords.delete(word);
  }
};
