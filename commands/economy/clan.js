const { EmbedBuilder } = require('discord.js');
const { getProfile, saveProfile } = require('../../utils/profile');
const { load, save } = require('../../utils/db');

module.exports = {
  name: 'clan',
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const clans = load('clans');
    const profile = getProfile(message.author.id);

    // ── +clan créer <emoji> <nom> ──
    if (sub === 'créer' || sub === 'creer') {
      if (profile.clan) {
        return message.reply('❌ Tu es déjà dans un clan ! Quitte-le d\'abord avec `+clan quitter`.');
      }

      const emoji = args[1];
      const nom = args.slice(2).join(' ');
      if (!emoji || !nom) return message.reply('❌ Usage: `+clan créer <emoji> <nom>`\nEx: `+clan créer 🔥 Les Flammes`');
      if (nom.length > 30) return message.reply('❌ Le nom du clan ne peut pas dépasser 30 caractères.');

      const clanId = nom.toLowerCase().replace(/\s+/g, '-');
      if (clans[clanId]) return message.reply('❌ Un clan avec ce nom existe déjà !');

      clans[clanId] = {
        name: nom,
        emoji,
        leaderId: message.author.id,
        members: [message.author.id],
        createdAt: new Date().toISOString(),
        description: 'Aucune description.',
      };
      save('clans', clans);

      profile.clan = clanId;
      saveProfile(message.author.id, profile);

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(`${emoji} Clan **${nom}** créé !`)
          .setDescription(`Tu es maintenant le chef de ce clan.\nInvite des membres avec \`+clan inviter @user\``)
          .setTimestamp()
        ]
      });
    }

    // ── +clan infos [nom] ──
    if (sub === 'infos') {
      const clanId = args.slice(1).join(' ').toLowerCase().replace(/\s+/g, '-') || profile.clan;
      if (!clanId) return message.reply('❌ Tu n\'es dans aucun clan. Précise un nom: `+clan infos <nom>`');

      const clan = clans[clanId];
      if (!clan) return message.reply('❌ Clan introuvable.');

      const membersList = await Promise.all(clan.members.slice(0, 10).map(async id => {
        const user = await message.client.users.fetch(id).catch(() => null);
        const isLeader = id === clan.leaderId;
        return `${isLeader ? '👑' : '•'} **${user?.username || 'Inconnu'}**`;
      }));

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`${clan.emoji} ${clan.name}`)
          .setDescription(clan.description)
          .addFields(
            { name: '👥 Membres', value: `${clan.members.length}`, inline: true },
            { name: '📅 Créé', value: `<t:${Math.floor(new Date(clan.createdAt).getTime() / 1000)}:R>`, inline: true },
            { name: '🏆 Membres', value: membersList.join('\n') || 'Aucun', inline: false },
          )
          .setTimestamp()
        ]
      });
    }

    // ── +clan inviter @user ──
    if (sub === 'inviter') {
      if (!profile.clan) return message.reply('❌ Tu n\'es dans aucun clan.');
      const clan = clans[profile.clan];
      if (clan.leaderId !== message.author.id) return message.reply('❌ Seul le chef peut inviter des membres.');

      const target = message.mentions.members.first();
      if (!target) return message.reply('❌ Mentionne un membre.');

      const targetProfile = getProfile(target.id);
      if (targetProfile.clan) return message.reply('❌ Ce membre est déjà dans un clan.');
      if (clan.members.includes(target.id)) return message.reply('❌ Ce membre est déjà dans ton clan.');

      clan.members.push(target.id);
      clans[profile.clan] = clan;
      save('clans', clans);

      targetProfile.clan = profile.clan;
      saveProfile(target.id, targetProfile);

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2ecc71)
          .setDescription(`✅ **${target.user.username}** a rejoint le clan **${clan.emoji} ${clan.name}** !`)
          .setTimestamp()
        ]
      });
    }

    // ── +clan rejoindre <nom> ──
    if (sub === 'rejoindre') {
      if (profile.clan) return message.reply('❌ Tu es déjà dans un clan ! Quitte-le d\'abord.');
      const clanId = args.slice(1).join(' ').toLowerCase().replace(/\s+/g, '-');
      if (!clanId) return message.reply('❌ Usage: `+clan rejoindre <nom>`');

      const clan = clans[clanId];
      if (!clan) return message.reply('❌ Clan introuvable.');

      clan.members.push(message.author.id);
      clans[clanId] = clan;
      save('clans', clans);

      profile.clan = clanId;
      saveProfile(message.author.id, profile);

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x2ecc71)
          .setDescription(`✅ Tu as rejoint le clan **${clan.emoji} ${clan.name}** !`)
          .setTimestamp()
        ]
      });
    }

    // ── +clan quitter ──
    if (sub === 'quitter') {
      if (!profile.clan) return message.reply('❌ Tu n\'es dans aucun clan.');
      const clan = clans[profile.clan];

      if (clan.leaderId === message.author.id && clan.members.length > 1) {
        return message.reply('❌ Tu es le chef ! Transfère d\'abord le leadership avec `+clan transfert @user` ou expulse tous les membres.');
      }

      clan.members = clan.members.filter(id => id !== message.author.id);
      if (clan.members.length === 0) {
        delete clans[profile.clan];
      } else {
        clans[profile.clan] = clan;
      }
      save('clans', clans);

      profile.clan = null;
      saveProfile(message.author.id, profile);

      return message.reply('✅ Tu as quitté le clan.');
    }

    // ── +clan description <texte> ──
    if (sub === 'description') {
      if (!profile.clan) return message.reply('❌ Tu n\'es dans aucun clan.');
      const clan = clans[profile.clan];
      if (clan.leaderId !== message.author.id) return message.reply('❌ Seul le chef peut modifier la description.');

      const desc = args.slice(1).join(' ');
      if (!desc) return message.reply('❌ Usage: `+clan description <texte>`');

      clan.description = desc.slice(0, 200);
      clans[profile.clan] = clan;
      save('clans', clans);

      return message.reply('✅ Description mise à jour !');
    }

    // ── +clan liste ──
    if (sub === 'liste') {
      const list = Object.entries(clans);
      if (!list.length) return message.reply('❌ Aucun clan pour le moment.');

      const lines = list.slice(0, 15).map(([, c]) => `${c.emoji} **${c.name}** — ${c.members.length} membre(s)`).join('\n');

      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('🏰 Liste des clans')
          .setDescription(lines)
          .setFooter({ text: `${list.length} clan(s)` })
          .setTimestamp()
        ]
      });
    }

    // ── Aide ──
    message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🏰 Système de Clans')
        .setDescription(
          '`+clan créer <emoji> <nom>` — Créer un clan\n' +
          '`+clan rejoindre <nom>` — Rejoindre un clan\n' +
          '`+clan inviter @user` — Inviter un membre (chef)\n' +
          '`+clan infos [nom]` — Infos d\'un clan\n' +
          '`+clan liste` — Liste des clans\n' +
          '`+clan description <texte>` — Modifier la description (chef)\n' +
          '`+clan quitter` — Quitter le clan'
        )
        .setTimestamp()
      ]
    });
  },
};
