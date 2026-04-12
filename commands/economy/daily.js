const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

module.exports = {
  name: 'daily',
  async execute(message) {
    const user = getUser(message.author.id);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (user.lastDaily && now - user.lastDaily < cooldown) {
      const reste = cooldown - (now - user.lastDaily);
      const h = Math.floor(reste / 3600000);
      const m = Math.floor((reste % 3600000) / 60000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xe74c3c).setDescription(`⏳ Reviens dans **${h}h ${m}m** !`)] });
    }

    user.balance += 100;
    user.lastDaily = now;
    saveUser(message.author.id, user);

    message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('💰 Daily récupéré !')
        .setDescription(`Tu as reçu **100** 🪙 Kamori Coins !\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`)
        .setFooter({ text: 'Reviens demain !' })
        .setTimestamp()
      ]
    });
  },
};
