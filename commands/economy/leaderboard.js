const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/economy');

module.exports = {
  name: 'leaderboard',
  async execute(message) {
    const top = getLeaderboard();
    if (!top.length) return message.reply('Aucun joueur pour le moment.');

    const medals = ['🥇', '🥈', '🥉'];
    const lines = await Promise.all(top.map(async (e, i) => {
      const user = await message.client.users.fetch(e.id).catch(() => null);
      return `${medals[i] || `**${i+1}.**`} **${user?.username || 'Inconnu'}** — ${e.balance.toLocaleString('fr-FR')} 🪙`;
    }));

    message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle('🏆 Classement Kamori Coins').setDescription(lines.join('\n')).setFooter({ text: 'Kamori Casino' }).setTimestamp()] });
  },
};
