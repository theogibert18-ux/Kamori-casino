const { EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');

const ROUGES = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

module.exports = {
  name: 'roulette',
  async execute(message, args) {
    const choix = args[0]?.toLowerCase();
    const mise = parseInt(args[1]);

    if (!choix || isNaN(mise) || mise <= 0) {
      return message.reply('❌ Usage: `+roulette <rouge/noir/pair/impair/0-36> <mise>`');
    }

    const user = getUser(message.author.id);
    if (user.balance < mise) return message.reply(`❌ Solde insuffisant : **${user.balance}** 🪙`);

    const numero = Math.floor(Math.random() * 37);
    const estRouge = ROUGES.includes(numero);
    const estPair = numero !== 0 && numero % 2 === 0;
    const couleur = numero === 0 ? '🟢' : estRouge ? '🔴' : '⚫';

    let gagne = false;
    let multiplicateur = 1;

    if (choix === 'rouge' && estRouge) { gagne = true; multiplicateur = 2; }
    else if (choix === 'noir' && !estRouge && numero !== 0) { gagne = true; multiplicateur = 2; }
    else if (choix === 'pair' && estPair) { gagne = true; multiplicateur = 2; }
    else if (choix === 'impair' && !estPair && numero !== 0) { gagne = true; multiplicateur = 2; }
    else if (!isNaN(parseInt(choix)) && parseInt(choix) === numero) { gagne = true; multiplicateur = 36; }

    if (gagne) user.balance += mise * multiplicateur - mise;
    else user.balance -= mise;
    saveUser(message.author.id, user);

    const embed = new EmbedBuilder()
      .setColor(gagne ? 0x2ecc71 : 0xe74c3c)
      .setTitle(`🎡 Roulette — ${couleur} **${numero}**`)
      .setDescription(
        `Tu as misé sur **${choix}** — ${gagne ? `🎉 Gagné ! **+${(mise * multiplicateur - mise).toLocaleString('fr-FR')}** 🪙` : `😔 Perdu ! **-${mise}** 🪙`}\n\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`
      )
      .setFooter({ text: 'Kamori Casino' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
