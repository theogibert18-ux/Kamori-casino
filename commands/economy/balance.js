const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../../utils/economy');

module.exports = {
  name: 'balance',
  async execute(message) {
    const target = message.mentions.members.first() || message.member;
    const user = getUser(target.id);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`💰 Balance — ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL())
      .setDescription(`**${user.balance.toLocaleString('fr-FR')}** 🪙 Kamori Coins`)
      .setFooter({ text: 'Kamori Casino' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
