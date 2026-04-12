const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

module.exports = {
  name: 'transfert',
  async execute(message, args) {
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    if (target.id === message.author.id) return message.reply('❌ Tu ne peux pas te transférer des pièces à toi-même.');

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return message.reply('❌ Montant invalide.');

    const sender = getUser(message.author.id);
    if (sender.balance < amount) return message.reply(`❌ Solde insuffisant : **${sender.balance}** 🪙`);

    const receiver = getUser(target.id);
    sender.balance -= amount;
    receiver.balance += amount;
    saveUser(message.author.id, sender);
    saveUser(target.id, receiver);

    message.reply({ embeds: [new EmbedBuilder().setColor(0x2ecc71).setTitle('💸 Transfert effectué !').setDescription(`**${message.author.username}** a envoyé **${amount.toLocaleString('fr-FR')}** 🪙 à **${target.user.username}**`).setTimestamp()] });
  },
};
