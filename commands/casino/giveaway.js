const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { parseDuration } = require('../../utils/duration');

const giveaways = new Map();

module.exports = {
  name: 'giveaway',
  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) return message.reply('❌ Permission manquante.');
    if (args.length < 3) return message.reply('❌ Usage: `+giveaway <durée> <gagnants> <prix>`');

    const ms = parseDuration(args[0]);
    if (!ms) return message.reply('❌ Durée invalide. Ex: `1h`, `30m`');
    const nb = parseInt(args[1]);
    const prix = args.slice(2).join(' ');

    await message.delete().catch(() => {});

    const endTime = Date.now() + ms;
    const embed = new EmbedBuilder().setColor(0xff73fa).setTitle('🎉 GIVEAWAY 🎉').setDescription(`**Prix :** ${prix}\n**Gagnant(s) :** ${nb}\n**Fin :** <t:${Math.floor(endTime/1000)}:R>\n\nClique sur 🎉 pour participer !`).setFooter({ text: `Organisé par ${message.author.tag}` }).setTimestamp(endTime);
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('giveaway_join').setLabel('🎉 Participer').setStyle(ButtonStyle.Primary));
    const msg = await message.channel.send({ embeds: [embed], components: [row] });

    giveaways.set(msg.id, { participants: [], nb, prix, endTime });

    setTimeout(async () => {
      const gw = giveaways.get(msg.id);
      if (!gw) return;
      const pool = [...new Set(gw.participants)];
      let desc = pool.length === 0 ? '😔 Personne n\'a participé.' : '';
      if (pool.length > 0) {
        const gagnants = [];
        const p = [...pool];
        for (let i = 0; i < Math.min(gw.nb, p.length); i++) {
          const idx = Math.floor(Math.random() * p.length);
          gagnants.push(p.splice(idx, 1)[0]);
        }
        desc = `🏆 **Gagnant(s) :** ${gagnants.map(id=>`<@${id}>`).join(', ')}\n**Prix :** ${gw.prix}`;
        await message.channel.send(`🎉 Félicitations ${gagnants.map(id=>`<@${id}>`).join(', ')} ! Vous gagnez **${gw.prix}** !`);
      }
      await msg.edit({ embeds: [new EmbedBuilder().setColor(0x95a5a6).setTitle('🎉 GIVEAWAY TERMINÉ').setDescription(desc).setFooter({ text: `${pool.length} participant(s)` }).setTimestamp()], components: [] });
      giveaways.delete(msg.id);
    }, ms);
  },
};

async function handleGiveaway(interaction) {
  const gw = giveaways.get(interaction.message.id);
  if (!gw) return interaction.reply({ content: '❌ Giveaway terminé.', ephemeral: true });
  if (gw.participants.includes(interaction.user.id)) {
    gw.participants = gw.participants.filter(id => id !== interaction.user.id);
    return interaction.reply({ content: '✅ Tu t\'es désinscrit.', ephemeral: true });
  }
  gw.participants.push(interaction.user.id);
  interaction.reply({ content: `🎉 Tu participes ! (${gw.participants.length} participant(s))`, ephemeral: true });
}

module.exports.handleGiveaway = handleGiveaway;
