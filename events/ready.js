const { load, save } = require('../utils/db');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Kamori Casino connecté en tant que ${client.user.tag}`);
    client.user.setActivity('🎰 Kamori Casino', { type: 3 });

    // Production automatique du Tycoon toutes les 10 secondes
    setInterval(() => {
      try {
        const tycoon = load('tycoon');
        const now = Date.now();

        for (const [userId, data] of Object.entries(tycoon)) {
          const elapsed = (now - (data.lastTick || now)) / 1000;
          const production = data.productionPerSec * elapsed;

          data.stock = Math.min(data.stock + production, data.maxStock);
          data.lastTick = now;
          tycoon[userId] = data;
        }

        save('tycoon', tycoon);
      } catch (err) {
        console.error('Erreur tycoon tick:', err);
      }
    }, 10000);
  },
};
