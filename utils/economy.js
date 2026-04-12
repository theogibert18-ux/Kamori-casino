const { load, save } = require('./db');

function getUser(userId) {
  const economy = load('economy');
  if (!economy[userId]) {
    economy[userId] = { balance: 100, lastDaily: null };
    save('economy', economy);
  }
  return economy[userId];
}

function saveUser(userId, data) {
  const economy = load('economy');
  economy[userId] = data;
  save('economy', economy);
}

function addCoins(userId, amount) {
  const user = getUser(userId);
  user.balance += amount;
  saveUser(userId, user);
  return user.balance;
}

function removeCoins(userId, amount) {
  const user = getUser(userId);
  user.balance = Math.max(0, user.balance - amount);
  saveUser(userId, user);
  return user.balance;
}

function getLeaderboard() {
  const economy = load('economy');
  return Object.entries(economy)
    .map(([id, data]) => ({ id, balance: data.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);
}

module.exports = { getUser, saveUser, addCoins, removeCoins, getLeaderboard };
