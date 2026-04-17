const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUser, saveUser } = require('../../utils/economy');
const { load, save } = require('../../utils/db');

const BUILDING_COST = 5000;
const BUILDING_REVENUE = 400;
const BUILDING_FEES = 50;
const EMPLOYEE_SALARY = 200;
const EMPLOYEE_MULTIPLIER = 0.012;
const WAREHOUSE_MAX = 20000;
const WORK_REWARD = 20;

function getEntreprise(userId) {
  const data = load('entreprises');
  return data[userId] || null;
}

function saveEntreprise(userId, data) {
  const all = load('entreprises');
  all[userId] = data;
  save('entreprises', all);
}

function buildEmbed(userId, ent) {
  const revenue = ent.buildings * BUILDING_REVENUE;
  const fees = ent.buildings * BUILDING_FEES;
  const salaries = ent.employees.length * EMPLOYEE_SALARY;
  const multiplier = 1 + (ent.employees.length * EMPLOYEE_MULTIPLIER);
  const netRevenue = Math.floor((revenue - fees - salaries) * multiplier);
  const worksNeeded = Math.ceil((WAREHOUSE_MAX - ent.warehouse) / netRevenue);

  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`🏢 ${ent.name}`)
    .setDescription(
      `**Statut :** ${ent.warehouse >= WAREHOUSE_MAX ? '🔴 Entrepôt plein' : '🟢 En activité'}\n` +
      `↳ Argent dans l'entrepôt: **${ent.warehouse.toLocaleString('fr-FR')} / ${WAREHOUSE_MAX.toLocaleString('fr-FR')}**\n` +
      `↳ Revenu net: **${netRevenue.toLocaleString('fr-FR')} coins**\n\n` +
      `**Propriétaire :** <@${userId}>\n\n` +
      `• 🏗️ **Nombre de bâtiments: ${ent.buildings}**\n` +
      `  ○ Revenu: \`+ ${revenue.toLocaleString('fr-FR')} coins\`\n` +
      `  ○ Frais: \`- ${fees.toLocaleString('fr-FR')} coins\`\n\n` +
      `• 👷 **Employés: ${ent.employees.length}**\n` +
      `  ○ Salaire: \`- ${salaries.toLocaleString('fr-FR')} coins\` (${EMPLOYEE_SALARY} / employé)\n` +
      `  ○ Multiplicateur: \`x ${multiplier.toFixed(3)}\`\n\n` +
      `> L'entrepôt se remplira de \`${netRevenue.toLocaleString('fr-FR')} coins\` dans **${Math.max(0, worksNeeded)} \`-work\`**\n\n` +
      `> Chaque employé gagne **${WORK_REWARD} coins** à l'entrepôt à chaque \`-work\``
    )
    .setFooter({ text: 'Kamori Casino • Entreprise' })
    .setTimestamp();
}

function buildButtons(userId, ent) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ent_collect_${userId}`).setLabel('💰 Collecter').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`ent_building_${userId}`).setLabel('🏗️ Acheter bâtiment').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ent_info_${userId}`).setLabel('ℹ️ Infos').setStyle(ButtonStyle.Secondary),
  )];
}

module.exports = {
  name: 'entreprise',
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const ent = getEntreprise(message.author.id);

    // -entreprise créer <nom>
    if (sub === 'créer' || sub === 'creer') {
      if (ent) return message.reply('❌ Tu as déjà une entreprise ! Utilise `-entreprise` pour la voir.');
      const nom = args.slice(1).join(' ');
      if (!nom) return message.reply('❌ Ex: `-entreprise créer Apple`');
      if (nom.length > 30) return message.reply('❌ Nom trop long (max 30 caractères).');

      const user = getUser(message.author.id);
      if (user.balance < BUILDING_COST) return message.reply(`❌ Il faut **${BUILDING_COST.toLocaleString('fr-FR')}** 🪙 pour créer une entreprise !`);

      user.balance -= BUILDING_COST;
      saveUser(message.author.id, user);

      const newEnt = {
        name: nom,
        buildings: 1,
        employees: [],
        warehouse: 0,
        createdAt: new Date().toISOString(),
      };
      saveEntreprise(message.author.id, newEnt);

      return message.reply({ embeds: [buildEmbed(message.author.id, newEnt)], components: buildButtons(message.author.id, newEnt) });
    }

    // -entreprise (voir)
    if (!sub || sub === 'voir') {
      if (!ent) return message.reply('❌ Tu n\'as pas d\'entreprise. Crée-en une avec `-entreprise créer <nom>`');
      return message.reply({ embeds: [buildEmbed(message.author.id, ent)], components: buildButtons(message.author.id, ent) });
    }

    // -entreprise embaucher @user
    if (sub === 'embaucher') {
      if (!ent) return message.reply('❌ Tu n\'as pas d\'entreprise.');
      const target = message.mentions.members.first();
      if (!target) return message.reply('❌ Mentionne un membre à embaucher.');
      if (target.id === message.author.id) return message.reply('❌ Tu ne peux pas t\'embaucher toi-même.');
      if (ent.employees.includes(target.id)) return message.reply('❌ Ce membre travaille déjà chez toi.');

      ent.employees.push(target.id);
      saveEntreprise(message.author.id, ent);

      return message.reply(`✅ **${target.user.username}** a été embauché dans **${ent.name}** !`);
    }

    // -entreprise renvoyer @user
    if (sub === 'renvoyer') {
      if (!ent) return message.reply('❌ Tu n\'as pas d\'entreprise.');
      const target = message.mentions.members.first();
      if (!target) return message.reply('❌ Mentionne un membre.');
      if (!ent.employees.includes(target.id)) return message.reply('❌ Ce membre ne travaille pas chez toi.');

      ent.employees = ent.employees.filter(id => id !== target.id);
      saveEntreprise(message.author.id, ent);

      return message.reply(`✅ **${target.user.username}** a été renvoyé de **${ent.name}**.`);
    }

    // -entreprise liste
    if (sub === 'liste') {
      const all = load('entreprises');
      const list = Object.entries(all);
      if (!list.length) return message.reply('❌ Aucune entreprise pour le moment.');

      const lines = list.slice(0, 10).map(([id, e]) =>
        `• **${e.name}** — <@${id}> — ${e.buildings} bâtiment(s) — ${e.employees.length} employé(s)`
      ).join('\n');

      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('🏢 Liste des entreprises')
        .setDescription(lines)
        .setFooter({ text: `${list.length} entreprise(s)` })
        .setTimestamp()
      ]});
    }
  },
};

// ─── Commande -work ───
module.exports.work = {
  name: 'work',
  async execute(message) {
    const all = load('entreprises');

    // Trouve l'entreprise où le joueur travaille
    let employerEntry = null;
    for (const [ownerId, ent] of Object.entries(all)) {
      if (ent.employees.includes(message.author.id)) {
        employerEntry = { ownerId, ent };
        break;
      }
    }

    if (!employerEntry) return message.reply('❌ Tu ne travailles dans aucune entreprise ! Fais-toi embaucher avec `-entreprise embaucher`.');

    const { ownerId, ent } = employerEntry;

    // Cooldown 1h
    const workData = load('workCooldowns');
    const now = Date.now();
    if (workData[message.author.id] && now - workData[message.author.id] < 3600000) {
      const reste = 3600000 - (now - workData[message.author.id]);
      const m = Math.floor(reste / 60000);
      return message.reply(`⏳ Tu as déjà travaillé ! Reviens dans **${m} minutes**.`);
    }

    // Revenue pour l'entreprise
    const revenue = ent.buildings * BUILDING_REVENUE;
    const fees = ent.buildings * BUILDING_FEES;
    const salaries = ent.employees.length * EMPLOYEE_SALARY;
    const multiplier = 1 + (ent.employees.length * EMPLOYEE_MULTIPLIER);
    const netRevenue = Math.floor((revenue - fees - salaries) * multiplier);

    ent.warehouse = Math.min(ent.warehouse + Math.max(0, netRevenue), WAREHOUSE_MAX);
    all[ownerId] = ent;
    save('entreprises', all);

    // Salaire pour l'employé
    const user = getUser(message.author.id);
    user.balance += WORK_REWARD;
    saveUser(message.author.id, user);

    workData[message.author.id] = now;
    save('workCooldowns', workData);

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('💼 Travail effectué !')
      .setDescription(
        `Tu as travaillé pour **${ent.name}** !\n\n` +
        `💰 Tu as gagné **${WORK_REWARD}** 🪙\n` +
        `🏗️ L'entrepôt a reçu **+${Math.max(0, netRevenue).toLocaleString('fr-FR')}** coins\n` +
        `📦 Entrepôt : **${ent.warehouse.toLocaleString('fr-FR')} / ${WAREHOUSE_MAX.toLocaleString('fr-FR')}**\n\n` +
        `Solde : **${user.balance.toLocaleString('fr-FR')}** 🪙`
      )
      .setFooter({ text: 'Reviens dans 1h !' })
      .setTimestamp()
    ]});
  },
};

// Boutons entreprise
async function handleEntrepriseButtons(interaction) {
  const parts = interaction.customId.split('_');
  const action = parts[1];
  const userId = parts[2];

  if (interaction.user.id !== userId) return interaction.reply({ content: '❌ Ce n\'est pas ton entreprise !', ephemeral: true });

  const ent = getEntreprise(userId);
  if (!ent) return interaction.reply({ content: '❌ Entreprise introuvable.', ephemeral: true });

  if (action === 'collect') {
    if (ent.warehouse <= 0) return interaction.reply({ content: '❌ L\'entrepôt est vide !', ephemeral: true });
    const user = getUser(userId);
    user.balance += ent.warehouse;
    saveUser(userId, user);
    const collected = ent.warehouse;
    ent.warehouse = 0;
    saveEntreprise(userId, ent);
    await interaction.reply({ content: `✅ Tu as collecté **${collected.toLocaleString('fr-FR')}** coins de l'entrepôt !\nSolde : **${user.balance.toLocaleString('fr-FR')}** 🪙`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, ent)], components: buildButtons(userId, ent) }).catch(() => {});
  }

  if (action === 'building') {
    const user = getUser(userId);
    if (user.balance < BUILDING_COST) return interaction.reply({ content: `❌ Il faut **${BUILDING_COST.toLocaleString('fr-FR')}** 🪙 pour acheter un bâtiment !`, ephemeral: true });
    user.balance -= BUILDING_COST;
    ent.buildings++;
    saveUser(userId, user);
    saveEntreprise(userId, ent);
    await interaction.reply({ content: `✅ Nouveau bâtiment acheté ! Tu en as maintenant **${ent.buildings}**.`, ephemeral: true });
    return interaction.message.edit({ embeds: [buildEmbed(userId, ent)], components: buildButtons(userId, ent) }).catch(() => {});
  }

  if (action === 'info') {
    return interaction.update({ embeds: [buildEmbed(userId, ent)], components: buildButtons(userId, ent) });
  }
}

module.exports.handleEntrepriseButtons = handleEntrepriseButtons;
