const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'helpall',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('🎰 Kamori Casino — Toutes les commandes')
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        {
          name: '💰 Économie',
          value: [
            '`-balance [@user]` — Voir son solde',
            '`-daily` — Récupérer 100 🪙 par jour',
            '`-transfert @user <montant>` — Envoyer des pièces',
            '`-leaderboard` — Top 10 des plus riches',
          ].join('\n'),
        },
        {
          name: '🏦 Banque',
          value: [
            '`-banque` — Voir son solde bancaire',
            '`-banque déposer <montant>` — Déposer en sécurité',
            '`-banque retirer <montant>` — Retirer ses fonds',
            '> 💹 +1% d\'intérêts par jour automatiquement',
          ].join('\n'),
        },
        {
          name: '🪙 Crypto KCoin',
          value: [
            '`-crypto` — Voir le marché avec graphique',
            '`-crypto acheter <montant>` — Acheter des KCoins',
            '`-crypto vendre <quantité>` — Vendre ses KCoins',
            '`-crypto portefeuille` — Voir son P&L en temps réel',
          ].join('\n'),
        },
        {
          name: '🎮 Casino',
          value: [
            '`-slots <mise>` — Machine à sous',
            '`-coinflip <pile/face> <mise>` — Pile ou face',
            '`-blackjack <mise>` — Blackjack (avec double)',
            '`-roulette <rouge/noir/pair/impair/0-36> <mise>` — Roulette',
          ].join('\n'),
        },
        {
          name: '🎟️ Tirages',
          value: [
            '`-loterie` — Voir le pot actuel',
            '`-loterie acheter` — Acheter un ticket (50 🪙)',
            '`-loterie tirer` — Tirer le gagnant (Admin)',
            '`-giveaway <durée> <gagnants> <prix>` — Lancer un giveaway',
          ].join('\n'),
        },
        {
          name: '🏭 Tycoon',
          value: [
            '`-tycoon` — Ouvrir ton empire industriel',
            '> ⬆️ Niveau — 💰 Vendre — 📦 Stockage — 💎 Prestige — 🔄 Actualiser',
          ].join('\n'),
        },
        {
          name: '🏢 Entreprise',
          value: [
            '`-entreprise créer <nom>` — Créer son entreprise',
            '`-entreprise voir` — Voir son entreprise',
            '`-entreprise embaucher @user` — Embaucher un employé',
            '`-entreprise renvoyer @user` — Renvoyer un employé',
            '`-entreprise liste` — Liste des entreprises',
            '`-work` — Travailler (cooldown 1h, gagne 20 🪙)',
          ].join('\n'),
        },
        {
          name: '🛒 Shop',
          value: [
            '`-shop` — Voir le catalogue complet',
            '`-shop acheter <id>` — Acheter un article',
            '`-shop inventaire` — Voir ses achats',
            '> 🎭 Badges • 📛 Titres • 🚀 Boosts • 🎟️ Tirages spéciaux',
          ].join('\n'),
        },
        {
          name: '👤 Profil & Clans',
          value: [
            '`-profil [@user]` — Voir son profil RPG complet',
            '`-clan créer <emoji> <nom>` — Créer un clan',
            '`-clan rejoindre <nom>` — Rejoindre un clan',
            '`-clan inviter @user` — Inviter un membre (chef)',
            '`-clan infos [nom]` — Infos d\'un clan',
            '`-clan liste` — Liste des clans',
            '`-clan quitter` — Quitter son clan',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'Préfixe : - • Kamori Casino' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
