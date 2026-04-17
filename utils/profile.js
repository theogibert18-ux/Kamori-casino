const { load, save } = require('./db');

const RANKS = [
  { name: '🔰 Novice', min: 1, color: 0x95a5a6 },
  { name: '🌱 Débutant', min: 5, color: 0x2ecc71 },
  { name: '⚔️ Apprenti', min: 10, color: 0x3498db },
  { name: '🗡️ Guerrier', min: 20, color: 0x9b59b6 },
  { name: '🔥 Vétéran', min: 35, color: 0xe67e22 },
  { name: '💫 Expert', min: 50, color: 0xe74c3c },
  { name: '🌟 Élite', min: 70, color: 0xf1c40f },
  { name: '👑 Maître', min: 90, color: 0xff6b35 },
  { name: '💎 Légende', min: 110, color: 0x1abc9c },
  { name: '🔮 Mythique', min: 135, color: 0x8e44ad },
  { name: '⚡ Immortel', min: 160, color: 0xf39c12 },
  { name: '🌌 Transcendant', min: 200, color: 0xffd700 },
];

const XP_PER_LEVEL = 150;

function getProfile(userId) {
  const profiles = load('profiles');
  if (!profiles[userId]) {
    profiles[userId] = {
      level: 1, xp: 0,
      totalGains: 0, totalLosses: 0,
      gamesPlayed: 0, wins: 0, losses: 0,
      clan: null,
      badge: null,
      title: null,
      createdAt: new Date().toISOString(),
    };
    save('profiles', profiles);
  }
  return profiles[userId];
}

function saveProfile(userId, data) {
  const profiles = load('profiles');
  profiles[userId] = data;
  save('profiles', profiles);
}

function getRank(level) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (level >= r.min) rank = r; }
  return rank;
}

function addXP(userId, amount) {
  const profile = getProfile(userId);
  profile.xp += amount;
  while (profile.xp >= XP_PER_LEVEL * profile.level) {
    profile.xp -= XP_PER_LEVEL * profile.level;
    profile.level++;
  }
  saveProfile(userId, profile);
  return profile;
}

function recordGame(userId, won, amount) {
  const profile = getProfile(userId);
  profile.gamesPlayed++;
  if (won) { profile.wins++; profile.totalGains += amount; addXP(userId, Math.ceil(amount / 20)); }
  else { profile.losses++; profile.totalLosses += amount; addXP(userId, 1); }
  saveProfile(userId, profile);
}

function getXPBar(xp, level) {
  const needed = XP_PER_LEVEL * level;
  const pct = Math.min(xp / needed, 1);
  const filled = Math.round(pct * 12);
  return '█'.repeat(filled) + '░'.repeat(12 - filled) + ` ${xp}/${needed}`;
}

module.exports = { getProfile, saveProfile, getRank, addXP, recordGame, getXPBar, RANKS };
