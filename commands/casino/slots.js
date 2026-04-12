const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const PAYOUTS = { '💎💎💎': 50, '7️⃣7️⃣7️⃣': 30, '⭐⭐⭐': 20, '🍇🍇🍇': 10, '🍊🍊🍊': 8, '🍋🍋🍋': 6, '🍒🍒🍒': 5 };

module.exports = {
  name: 'slots',
  async execute(message, args) {
    const mise = parseInt(args[0]);
    if (isNaN(mise) || mise <= 0) return message.reply('❌ Ex: `+slots 50`');

    const user = getUser(message.author.id);
    if (user.balance < mise) return message.reply(`❌ Solde insuffisant : **${user.balance}** 🪙`);

    const rouleaux = Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    const combo = rouleaux.join('');
    const mult = PAYOUTS[combo] || 0;

    let resultat;
    if (mult > 0) {
      user.balance += mise * mult - mise;
      resultat = `🎉 **JACKPOT !** Tu gagnes **${(mise * mult).toLocaleString('fr-FR')}** 🪙 (x${mult})`;
    } else if (rouleaux[0] === rouleaux[1] || rouleaux[1] === rouleaux[2]) {
      const gain = Math.floor(mise * 0.5);
      user.balance += gain - mise;
      resultat = `😊 Deux identiques ! Tu récupères **${gain}** 🪙`;
    } else {
      user.balance -= mise;
      resultat = `😔 Perdu ! Tu perds **${mise}** 🪙`;
    }

    saveUser(message.author.id, user);

    message.reply({ embeds: [new EmbedBuilder().setColor(mult > 0 ? 0xffd700 : 0xe74c3c).setTitle('🎰 Machine à sous').setDescription(`┌──────────────┐\n│  ${rouleaux[0]} │ ${rouleaux[1]} │ ${rouleaux[2]}  │\n└──────────────┘\n\n${resultat}`).addFields({ name: 'Solde', value: `${user.balance.toLocaleString('fr-FR')} 🪙`, inline: true }).setFooter({ text: 'Kamori Casino' }).setTimestamp()] });
  },
};
