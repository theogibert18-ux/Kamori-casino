const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

module.exports = {
  name: 'coinflip',
  async execute(message, args) {
    const choix = args[0]?.toLowerCase();
    const mise = parseInt(args[1]);
    if (!['pile', 'face'].includes(choix)) return message.reply('❌ Ex: `+coinflip pile 50`');
    if (isNaN(mise) || mise <= 0) return message.reply('❌ Mise invalide.');

    const user = getUser(message.author.id);
    if (user.balance < mise) return message.reply(`❌ Solde insuffisant : **${user.balance}** 🪙`);

    const resultat = Math.random() < 0.5 ? 'pile' : 'face';
    const gagne = resultat === choix;
    if (gagne) user.balance += mise; else user.balance -= mise;
    saveUser(message.author.id, user);

    message.reply({ embeds: [new EmbedBuilder().setColor(gagne ? 0x2ecc71 : 0xe74c3c).setTitle(`🪙 ${resultat === 'pile' ? '🟡 Pile' : '⚪ Face'}`).setDescription(`Tu as choisi **${choix}**, résultat : **${resultat}**\n\n${gagne ? `🎉 Gagné ! **+${mise}** 🪙` : `😔 Perdu ! **-${mise}** 🪙`}`).addFields({ name: 'Solde', value: `${user.balance.toLocaleString('fr-FR')} 🪙`, inline: true }).setFooter({ text: 'Kamori Casino' }).setTimestamp()] });
  },
};
