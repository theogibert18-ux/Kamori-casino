const { EmbedBuilder } = require('discord.js');
const { getProfile, getRank, getXPBar } = require('../../utils/profile');
const { getUser } = require('../../utils/economy');
const { load } = require('../../utils/db');

module.exports = {
  name: 'profil',
  async execute(message) {
    const target = message.mentions.members.first() || message.member;
    const profile = getProfile(target.id);
    const economy = getUser(target.id);
    const rank = getRank(profile.level);
    const xpBar = getXPBar(profile.xp, profile.level);

    // Clan info
    const clans = load('clans');
    let clanDisplay = '❌ Aucun clan';
    if (profile.clan) {
      const clan = clans[profile.clan];
      if (clan) {
        const isLeader = clan.leaderId === target.id;
        clanDisplay = `${clan.emoji || '🏰'} **${clan.name}** ${isLeader ? '👑' : ''}`;
      }
    }

    // Winrate
    const winrate = profile.gamesPlayed > 0
      ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
      : '0.0';

    // Membre depuis
    const joinedTs = Math.floor(new Date(profile.createdAt).getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(rank.color)
      .setAuthor({ name: `${target.user.username}`, iconURL: target.user.displayAvatarURL() })
      .setThumbnail(target.user.displayAvatarURL({ size: 256 }))
      .setTitle(`${rank.name}`)
      .setDescription(
        `\`\`\`ansi\n\u001b[1;33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\``
      )
      .addFields(
        {
          name: '📊 Progression',
          value:
            `**Niveau** : \`${profile.level}\`\n` +
            `**XP** : \`${xpBar}\`\n` +
            `**Rang** : ${rank.name}`,
          inline: false,
        },
        {
          name: '💰 Économie',
          value:
            `**Kamori Coins** : \`${economy.balance.toLocaleString('fr-FR')} 🪙\`\n` +
            `**Gains totaux** : \`${profile.totalGains.toLocaleString('fr-FR')} 🪙\`\n` +
            `**Pertes totales** : \`${profile.totalLosses.toLocaleString('fr-FR')} 🪙\``,
          inline: true,
        },
        {
          name: '🎰 Stats Casino',
          value:
            `**Parties** : \`${profile.gamesPlayed}\`\n` +
            `**Victoires** : \`${profile.wins}\`\n` +
            `**Winrate** : \`${winrate}%\``,
          inline: true,
        },
        {
          name: '🏰 Clan',
          value: clanDisplay,
          inline: false,
        },
        {
          name: '📅 Profil créé',
          value: `<t:${joinedTs}:R>`,
          inline: true,
        },
      )
      .setFooter({ text: 'Kamori Casino • Profil', iconURL: message.client.user.displayAvatarURL() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
