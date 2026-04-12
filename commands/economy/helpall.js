const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'helpall',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('🎰 Kamori Casino — Commandes')
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        {
          name: '💰 Économie',
          value: [
            '`+balance [@user]` — Voir son solde',
            '`+daily` — Récupérer 100 🪙 par jour',
            '`+transfert @user <montant>` — Envoyer des pièces',
            '`+leaderboard` — Top 10 des plus riches',
          ].join('\n'),
        },
        {
          name: '🎮 Casino',
          value: [
            '`+slots <mise>` — Machine à sous',
            '`+coinflip <pile/face> <mise>` — Pile ou face',
            '`+blackjack <mise>` — Blackjack contre le bot',
            '`+roulette <rouge/noir/pair/impair/0-36> <mise>` — Roulette',
          ].join('\n'),
        },
        {
          name: '🎟️ Tirages',
          value: [
            '`+loterie` — Voir le pot',
            '`+loterie acheter` — Acheter un ticket (50 🪙)',
            '`+loterie tirer` — Tirer le gagnant (Admin)',
            '`+giveaway <durée> <gagnants> <prix>` — Lancer un giveaway',
          ].join('\n'),
        },
        {
          name: '🏭 Tycoon',
          value: [
            '`+tycoon` — Ouvrir ton empire',
            '**Boutons disponibles :**',
            '💰 Vendre — Vendre ton stock au prix du marché',
            '⬆️ Niveau — Augmenter ta production (+0.10/s)',
            '📦 Stockage — Augmenter ta capacité (+500)',
            '💎 Prestige — Bonus permanent (+0.16/s)',
            '🔄 Actualiser — Mettre à jour les stats',
          ].join('\n'),
        },
      )
      .setFooter({ text: `Préfixe : + • Kamori Casino` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
