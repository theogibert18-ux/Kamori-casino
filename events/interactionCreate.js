const { handleBlackjack } = require('../commands/casino/blackjack');
const { handleGiveaway } = require('../commands/casino/giveaway');
const { handleTycoonButtons } = require('../commands/tycoon/tycoon');
const { getProfile, saveProfile, getRank, getXPBar } = require('../utils/profile');
const { getUser } = require('../utils/economy');
const { EmbedBuilder } = require('discord.js');

const CASINO_ROLE_ID = '1493339294008610928';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    // Bouton création profil Casino
    if (interaction.customId === 'casino_profil_create') {
      const guild = interaction.guild;
      const member = interaction.member;

      // Donne le rôle Casino
      const casinoRole = guild.roles.cache.get(CASINO_ROLE_ID);
      if (casinoRole) await member.roles.add(casinoRole).catch(() => {});

      // Crée le profil si inexistant
      const profile = getProfile(member.id);
      const economy = getUser(member.id);
      const rank = getRank(profile.level);
      const xpBar = getXPBar(profile.xp, profile.level);

      const embed = new EmbedBuilder()
        .setColor(rank.color)
        .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setTitle(`${rank.name} — Profil créé !`)
        .setDescription(
          '✅ Ton profil Casino a été créé avec succès !\n' +
          'Tu as maintenant accès à toute la catégorie Casino.\n\n' +
          '```ansi\n\u001b[1;33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n```'
        )
        .addFields(
          { name: '📊 Niveau', value: `\`${profile.level}\``, inline: true },
          { name: '🏅 Rang', value: rank.name, inline: true },
          { name: '💰 Solde', value: `\`${economy.balance.toLocaleString('fr-FR')} 🪙\``, inline: true },
          { name: '⭐ XP', value: `\`${xpBar}\``, inline: false },
        )
        .setFooter({ text: 'Kamori Casino • Profil', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.customId.startsWith('bj_')) await handleBlackjack(interaction);
    if (interaction.customId === 'giveaway_join') await handleGiveaway(interaction);
    if (interaction.customId.startsWith('tycoon_')) await handleTycoonButtons(interaction);
  },
};
