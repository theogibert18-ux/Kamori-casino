const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { load, save } = require('../../utils/db');

const CASINO_ROLE_ID = '1493339294008610928';

module.exports = {
  name: 'setupcasino',
  async execute(message) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Tu n\'as pas la permission.');
    }

    await message.reply('⏳ Création de la catégorie Casino...');
    const guild = message.guild;
    const casinoRole = guild.roles.cache.get(CASINO_ROLE_ID);

    // Catégorie Casino — privée sauf joue-ici
    const category = await guild.channels.create({
      name: '🎰 Casino',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        ...(casinoRole ? [{ id: casinoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
      ],
    });

    // Salon joue-ici — PUBLIC
    const joueIci = await guild.channels.create({
      name: '📜・joue-ici',
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
      ],
    });

    // Permissions salons privés — uniquement rôle Casino
    const privatePerms = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      ...(casinoRole ? [{ id: casinoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
    ];

    const tutoriel = await guild.channels.create({ name: '📚・tutoriel-casino', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: privatePerms });
    const guide = await guild.channels.create({ name: '📖・guide-gdc', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: privatePerms });
    const chat = await guild.channels.create({ name: '💬・chat-gdc', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: privatePerms });
    const casino = await guild.channels.create({ name: '🎰・casino', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: privatePerms });

    // Sauvegarde
    const config = load('casinoConfig');
    config.categoryId = category.id;
    config.joueIciId = joueIci.id;
    config.tutorielId = tutoriel.id;
    config.guideId = guide.id;
    config.chatId = chat.id;
    config.casinoId = casino.id;
    save('casinoConfig', config);

    // Embed règlement dans joue-ici
    const embed = new EmbedBuilder()
      .setColor(0xff6b35)
      .setTitle('🎰 Règlement du Casino Kamori')
      .setDescription(
        '> *Bienvenue au Casino Kamori ! Lis attentivement ce règlement avant de jouer.*\n\n' +
        '**📜 Règles générales**\n' +
        '• Respecte tous les joueurs et le staff\n' +
        '• Aucune triche ou exploitation de bugs\n' +
        '• Les décisions du staff sont définitives\n' +
        '• Toute tentative de manipulation sera sanctionnée\n\n' +
        '**🎮 Règles de jeu**\n' +
        '• Joue uniquement dans le salon <#' + casino.id + '>\n' +
        '• Les Kamori Coins ne peuvent pas être échangés contre de l\'argent réel\n' +
        '• Le casino se réserve le droit de modifier les gains à tout moment\n\n' +
        '**🏆 Système de progression**\n' +
        '• Monte en niveau en jouant pour débloquer des rangs exclusifs\n' +
        '• Crée ou rejoins un clan pour jouer en équipe\n' +
        '• Consulte ton profil avec `+profil`\n\n' +
        '**📚 Commandes utiles**\n' +
        '• `+helpall` — Liste de toutes les commandes\n' +
        '• `+profil` — Voir ton profil\n' +
        '• `+balance` — Voir tes Kamori Coins\n' +
        '• `+daily` — Récupérer tes 100 🪙 quotidiens\n' +
        '• `+tycoon` — Gérer ton empire\n' +
        '• `+clan` — Système de clans\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '*En cliquant sur le bouton ci-dessous, tu acceptes le règlement et crées ton profil Casino.*'
      )
      .setFooter({ text: 'Kamori Casino • Règlement', iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('casino_profil_create')
        .setLabel('🎰 Créer mon profil')
        .setStyle(ButtonStyle.Primary),
    );

    await joueIci.send({ embeds: [embed], components: [row] });

    // Embed tutoriel
    const tutorielEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📚 Tutoriel Casino Kamori')
      .setDescription(
        '**🎰 Les jeux disponibles**\n\n' +
        '`+slots <mise>` — Machine à sous\n' +
        '> Mise minimum : 1 🪙 | Jackpot x50 avec 💎💎💎\n\n' +
        '`+coinflip <pile/face> <mise>` — Pile ou face\n' +
        '> 50% de chance de doubler ta mise\n\n' +
        '`+blackjack <mise>` — Blackjack\n' +
        '> Atteins 21 sans dépasser pour battre le croupier\n\n' +
        '`+roulette <choix> <mise>` — Roulette\n' +
        '> Mise sur rouge/noir/pair/impair ou un numéro (x36)\n\n' +
        '**🏭 Tycoon**\n' +
        '`+tycoon` — Ouvre ton empire et produis des ressources automatiquement\n\n' +
        '**💰 Économie**\n' +
        '`+daily` — 100 🪙 par jour\n' +
        '`+balance` — Voir ton solde\n' +
        '`+transfert @user <montant>` — Envoyer des pièces\n' +
        '`+leaderboard` — Top 10 des plus riches\n\n' +
        '**👤 Profil & Clans**\n' +
        '`+profil` — Voir ton profil complet\n' +
        '`+clan créer <emoji> <nom>` — Créer un clan\n' +
        '`+clan rejoindre <nom>` — Rejoindre un clan'
      )
      .setFooter({ text: 'Kamori Casino • Tutoriel' })
      .setTimestamp();

    await tutoriel.send({ embeds: [tutorielEmbed] });

    message.channel.send(`✅ Catégorie Casino créée !\n• Règlement dans ${joueIci}\n• Tutoriel dans ${tutoriel}\n• Casino dans ${casino}`);
  },
};
