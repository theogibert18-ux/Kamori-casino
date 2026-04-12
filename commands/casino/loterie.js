const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { load, save } = require('../../utils/db');

const TICKET_PRICE = 50;

module.exports = {
  name: 'loterie',
  async execute(message, args) {
    const sub = args[0];

    if (sub === 'acheter') {
      const user = getUser(message.author.id);
      if (user.balance < TICKET_PRICE) return message.reply(`❌ Il faut **${TICKET_PRICE}** 🪙`);

      const lot = load('loterie');
      if (!lot.participants) lot.participants = {};
      if (!lot.pot) lot.pot = 0;
      lot.participants[message.author.id] = (lot.participants[message.author.id] || 0) + 1;
      lot.pot += TICKET_PRICE;
      user.balance -= TICKET_PRICE;
      saveUser(message.author.id, user);
      save('loterie', lot);

      return message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle('🎟️ Ticket acheté !').setDescription(`Tu as **${lot.participants[message.author.id]}** ticket(s).\n**Pot actuel :** ${lot.pot.toLocaleString('fr-FR')} 🪙`).setFooter({ text: 'Kamori Casino' })] });
    }

    if (sub === 'tirer') {
      if (!message.member.permissions.has('ManageGuild')) return message.reply('❌ Permission manquante.');
      const lot = load('loterie');
      const pool = [];
      for (const [id, tickets] of Object.entries(lot.participants || {})) for (let i = 0; i < tickets; i++) pool.push(id);
      if (!pool.length) return message.reply('❌ Personne n\'a acheté de ticket !');

      const gagnantId = pool[Math.floor(Math.random() * pool.length)];
      const gagnant = getUser(gagnantId);
      gagnant.balance += lot.pot;
      saveUser(gagnantId, gagnant);
      save('loterie', { pot: 0, participants: {} });

      return message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle('🎉 Résultat Loterie !').setDescription(`Le gagnant est <@${gagnantId}> 🏆\nIl remporte **${lot.pot.toLocaleString('fr-FR')}** 🪙 !`).setFooter({ text: 'Kamori Casino' })] });
    }

    const lot = load('loterie');
    const total = Object.values(lot.participants || {}).reduce((a, b) => a + b, 0);
    message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle('🎟️ Loterie Kamori').setDescription(`**Pot :** ${(lot.pot||0).toLocaleString('fr-FR')} 🪙\n**Tickets vendus :** ${total}\n**Prix d'un ticket :** ${TICKET_PRICE} 🪙\n\nUtilise \`+loterie acheter\` pour participer !`).setFooter({ text: 'Kamori Casino' })] });
  },
};
