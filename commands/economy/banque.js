const { EmbedBuilder } = require('discord.js');
const { getBank, saveBank, applyInterest } = require('../../utils/bank');
const { getUser, saveUser } = require('../../utils/economy');

module.exports = {
  name: 'banque',
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const user = getUser(message.author.id);
    const interest = applyInterest(message.author.id);
    const bank = getBank(message.author.id);

    // -banque (voir solde)
    if (!sub || sub === 'solde') {
      const embed = new EmbedBuilder()
        .setColor(0x27ae60)
        .setTitle('🏦 Banque Kamori')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: '💳 Portefeuille', value: `**${user.balance.toLocaleString('fr-FR')}** 🪙`, inline: true },
          { name: '🏦 En banque', value: `**${bank.balance.toLocaleString('fr-FR')}** 🪙`, inline: true },
          { name: '💹 Intérêts', value: `**+1%** par jour`, inline: true },
        )
        .setFooter({ text: interest > 0 ? `+${interest} 🪙 d'intérêts appliqués !` : 'Kamori Casino • Banque' })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const amount = parseInt(args[1]);

    // -banque déposer <montant>
    if (sub === 'déposer' || sub === 'deposer') {
      if (isNaN(amount) || amount <= 0) return message.reply('❌ Ex: `-banque déposer 500`');
      if (user.balance < amount) return message.reply(`❌ Solde insuffisant : **${user.balance.toLocaleString('fr-FR')}** 🪙`);

      user.balance -= amount;
      bank.balance += amount;
      saveUser(message.author.id, user);
      saveBank(message.author.id, bank);

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x27ae60)
        .setTitle('🏦 Dépôt effectué')
        .setDescription(`**${amount.toLocaleString('fr-FR')}** 🪙 déposés en banque.\n\n💳 Portefeuille : **${user.balance.toLocaleString('fr-FR')}** 🪙\n🏦 Banque : **${bank.balance.toLocaleString('fr-FR')}** 🪙`)
        .setTimestamp()
      ]});
    }

    // -banque retirer <montant>
    if (sub === 'retirer') {
      if (isNaN(amount) || amount <= 0) return message.reply('❌ Ex: `-banque retirer 500`');
      if (bank.balance < amount) return message.reply(`❌ Solde banque insuffisant : **${bank.balance.toLocaleString('fr-FR')}** 🪙`);

      bank.balance -= amount;
      user.balance += amount;
      saveUser(message.author.id, user);
      saveBank(message.author.id, bank);

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x27ae60)
        .setTitle('🏦 Retrait effectué')
        .setDescription(`**${amount.toLocaleString('fr-FR')}** 🪙 retirés de la banque.\n\n💳 Portefeuille : **${user.balance.toLocaleString('fr-FR')}** 🪙\n🏦 Banque : **${bank.balance.toLocaleString('fr-FR')}** 🪙`)
        .setTimestamp()
      ]});
    }

    message.reply('❌ Usage: `-banque [solde/déposer/retirer] [montant]`');
  },
};
