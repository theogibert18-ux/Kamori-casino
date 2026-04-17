const { load, save } = require('./db');

function getBank(userId) {
  const banks = load('banks');
  if (!banks[userId]) {
    banks[userId] = { balance: 0, lastInterest: Date.now() };
    save('banks', banks);
  }
  return banks[userId];
}

function saveBank(userId, data) {
  const banks = load('banks');
  banks[userId] = data;
  save('banks', banks);
}

// Intérêts : 1% par jour
function applyInterest(userId) {
  const bank = getBank(userId);
  const now = Date.now();
  const days = (now - bank.lastInterest) / (24 * 60 * 60 * 1000);
  if (days >= 1 && bank.balance > 0) {
    const interest = Math.floor(bank.balance * 0.01 * Math.floor(days));
    bank.balance += interest;
    bank.lastInterest = now;
    saveBank(userId, bank);
    return interest;
  }
  return 0;
}

module.exports = { getBank, saveBank, applyInterest };
